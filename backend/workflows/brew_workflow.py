import asyncio
from datetime import timedelta
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities.tabpfn_ai import determine_rarity_activity
    from activities.gemma_ai import generate_review_activity
    from activities.db_activities import update_brew_ready_activity
    from customers import adjust_rarity, bonus_xp

@workflow.defn
class BrewWorkflow:
    @workflow.run
    async def run(
        self,
        brew_id: str,
        player_id: str,
        ingredients: list[str] = None,
        duration_seconds: int = 15,
        customers_served: int = 0,
        customers_target: int = 0
    ) -> dict:
        ingredients = ingredients or ["Astral Lavender", "Starlight Chamomile"]
        workflow.logger.info(
            f"🌙 BrewWorkflow started for brew_id: {brew_id}, player: {player_id}. "
            f"Timer duration: {duration_seconds}s."
        )

        # 1. Durable Sloth Engine Timer (durable sleep across restarts)
        await asyncio.sleep(duration_seconds)
        workflow.logger.info(f"Steeping complete for {brew_id}. Commencing loot generation...")

        # 2. Execute TabPFN Activity (Rarity & Multi-Task Sensory)
        tabpfn_res = await workflow.execute_activity(
            determine_rarity_activity,
            args=[player_id, ingredients, duration_seconds, brew_id],
            start_to_close_timeout=timedelta(seconds=120)
        )
        base_rarity = tabpfn_res.get("rarity") if isinstance(tabpfn_res, dict) else str(tabpfn_res)
        rarity = adjust_rarity(base_rarity, customers_served, customers_target)
        workflow.logger.info(f"Rarity classified: {rarity} (base: {base_rarity})")

        # 3. Execute Gemma Activity (Review)
        review = await workflow.execute_activity(
            generate_review_activity,
            args=[rarity, ingredients, brew_id],
            start_to_close_timeout=timedelta(seconds=120)
        )
        workflow.logger.info(f"Review generated (Gemma via Ollama, or built-in lore fallback): {review}")

        # Formulate final loot
        tea_name = f"{rarity} {' & '.join(ingredients)} Infusion"
        loot = {
            "rarity": rarity,
            "item_name": tea_name,
            "review": review,
            "ingredients": ingredients,
            "base_rarity": base_rarity,
            "customers_served": customers_served,
            "customers_target": customers_target,
            "quota_met": customers_served >= customers_target,
            "bonus_xp": bonus_xp(customers_served, customers_target),
            "sensory": tabpfn_res.get("sensory") if isinstance(tabpfn_res, dict) else None,
            "sleepiness_score": tabpfn_res.get("sleepiness_score") if isinstance(tabpfn_res, dict) else None,
            "attributions": tabpfn_res.get("attributions") if isinstance(tabpfn_res, dict) else None,
            "probabilities": tabpfn_res.get("probabilities") if isinstance(tabpfn_res, dict) else None,
            "mystery_index": tabpfn_res.get("mystery_index") if isinstance(tabpfn_res, dict) else None,
        }

        # 4. Execute database Update Activity (Set brew to ready, attach loot)
        await workflow.execute_activity(
            update_brew_ready_activity,
            args=[{
                "brew_id": brew_id,
                "player_id": player_id,
                "loot": loot
            }],
            start_to_close_timeout=timedelta(seconds=60)
        )
        workflow.logger.info(f"Brew {brew_id} marked as ready in MongoDB.")

        return loot
