import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/serverDb';
import crypto from 'crypto';
import { DURATION_TIERS, customerTarget, simulateArrivals } from '@/lib/customers';

export async function POST(req: NextRequest) {
  const playerId = req.headers.get('x-player-id')?.trim();
  if (!playerId) {
    return NextResponse.json({ detail: 'Missing required header: X-Player-ID' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const ingredients: string[] = body.ingredients || ['Nebula Dust', 'Void Water'];

  const durationKey: string | undefined = body.duration_key;
  const tier = durationKey ? DURATION_TIERS.find((t) => t.key === durationKey) : undefined;
  if (durationKey && !tier) {
    return NextResponse.json({ detail: 'Unknown steep duration.' }, { status: 400 });
  }

  const { memBrews, memUsers } = await getDatabase();

  // Check if an active brew is already brewing/ready
  for (const b of Array.from(memBrews.values())) {
    if (b.player_id === playerId && (b.status === 'brewing' || b.status === 'ready')) {
      return NextResponse.json({ message: 'A brew is already in progress.', brew: b });
    }
  }

  const brewDuration = tier ? tier.seconds : parseInt(process.env.BREW_DURATION_SECONDS || '15', 10);
  const brewId = crypto.randomUUID();
  const streak = memUsers.get(playerId)?.consistency_score ?? 1;
  const target = customerTarget(durationKey, ingredients);
  const arrivals = simulateArrivals(brewId, brewDuration, target, ingredients, streak);
  const now = new Date();
  const readyTime = new Date(now.getTime() + brewDuration * 1000).toISOString();

  const brewDoc = {
    brew_id: brewId,
    player_id: playerId,
    ingredients,
    status: 'brewing' as const,
    created_at: now.toISOString(),
    ready_time: readyTime,
    duration_seconds: brewDuration,
    duration_key: durationKey,
    customers_target: target,
    customer_arrivals: arrivals,
    loot: null,
  };

  memBrews.set(brewId, { ...brewDoc });

  return NextResponse.json({
    message: 'Brew started successfully',
    brew: brewDoc,
  });
}
