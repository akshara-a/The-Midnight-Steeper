import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/serverDb';
import { adjustRarity, bonusXp } from '@/lib/customers';
import { classifyRarity, generateTravelerReview, generateSpeechAudio } from '@/lib/serverAi';

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
      const baseRarity = classifyRarity(consistency);
      const rarity = adjustRarity(baseRarity, served, target);
      const review = await generateTravelerReview(rarity, brew.ingredients);
      const audio = await generateSpeechAudio(review);
      const teaName = `${rarity} ${brew.ingredients?.join(' & ')} Infusion`;

      const loot = {
        rarity,
        item_name: teaName,
        review,
        audio,
        ingredients: brew.ingredients,
        base_rarity: baseRarity,
        customers_served: served,
        customers_target: target,
        quota_met: served >= target,
        bonus_xp: bonusXp(served, target),
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
