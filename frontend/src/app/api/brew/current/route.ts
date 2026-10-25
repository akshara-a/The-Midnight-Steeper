import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/serverDb';
import { adjustRarity, bonusXp } from '@/lib/customers';
import { classifyRarity, generateTravelerReview } from '@/lib/serverAi';
import { evaluateTabPFN } from '@/lib/tabpfn';

export async function GET(req: NextRequest) {
  const playerId = req.headers.get('x-player-id')?.trim();
  if (!playerId) {
    return NextResponse.json({ detail: 'Missing required header: X-Player-ID' }, { status: 401 });
  }

  const { memUsers, memBrews } = await getDatabase();

  let brew: any = null;
  for (const b of Array.from(memBrews.values())) {
    if (b.player_id === playerId && b.status !== 'claimed') {
      brew = b;
      break;
    }
  }

  if (brew && brew.status === 'brewing') {
    const readyTime = new Date(brew.ready_time).getTime();
    const now = Date.now();

    // Check if 24-hr timer has elapsed
    if (now >= readyTime) {
      const u = memUsers.get(playerId);
      const consistency = u?.consistency_score || 1;

      const served: number = brew.customer_arrivals?.length ?? 0;
      const target: number = brew.customers_target ?? 0;
      const baseRarity = classifyRarity(consistency, brew.ingredients ?? [], brew.duration_seconds, brew.brew_id);
      const rarity = adjustRarity(baseRarity, served, target);
      const review = await generateTravelerReview(rarity, brew.ingredients, brew.brew_id);
      const teaName = `${rarity} ${brew.ingredients?.join(' & ')} Infusion`;

      // Multi-task TabPFN evaluation (Sensory Vector, Sleepiness, Feature Attributions)
      const tabpfnResult = evaluateTabPFN({
        ingredients: brew.ingredients ?? [],
        durationSeconds: brew.duration_seconds,
        streak: consistency,
        careXP: 25,
      });

      const loot = {
        rarity,
        item_name: teaName,
        review,
        ingredients: brew.ingredients,
        base_rarity: baseRarity,
        customers_served: served,
        customers_target: target,
        quota_met: served >= target,
        bonus_xp: bonusXp(served, target),
        sensory: tabpfnResult.sensory,
        sleepiness_score: tabpfnResult.sleepiness_score,
        attributions: tabpfnResult.attributions,
        probabilities: tabpfnResult.probabilities,
        mystery_index: tabpfnResult.mystery_index,
      };

      brew.status = 'ready';
      brew.loot = loot;
      memBrews.set(brew.brew_id, { ...brew });

      if (u) {
        u.consistency_score += 1;
      }
    }
  }

  return NextResponse.json({ brew: brew || null });
}
