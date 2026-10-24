import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/serverDb';

export async function POST(req: NextRequest) {
  const playerId = req.headers.get('x-player-id')?.trim();
  if (!playerId) {
    return NextResponse.json({ detail: 'Missing required header: X-Player-ID' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const brewId = body.brew_id;

  const { memBrews, memUsers } = await getDatabase();

  let targetBrew: any = null;
  for (const b of Array.from(memBrews.values())) {
    if (b.player_id === playerId && b.status === 'ready') {
      if (!brewId || b.brew_id === brewId) {
        targetBrew = b;
        break;
      }
    }
  }

  if (!targetBrew) {
    for (const b of Array.from(memBrews.values())) {
      if (b.player_id === playerId && b.status === 'brewing') {
        return NextResponse.json({ detail: 'Brew is still steeping! Patience, traveler.' }, { status: 400 });
      }
    }
    return NextResponse.json({ detail: 'No ready brew found to claim.' }, { status: 404 });
  }

  const loot = targetBrew.loot || {
    rarity: 'Common',
    item_name: 'Mystic Cosmic Blend',
    review: 'A stellar traveler drank your tea in silence and nodded approvingly.',
  };

  targetBrew.status = 'claimed';
  memBrews.set(targetBrew.brew_id, targetBrew);

  let user = memUsers.get(playerId);
  if (!user) {
    user = {
      player_id: playerId,
      consistency_score: 1,
      inventory: [],
      created_at: new Date().toISOString(),
    };
  }
  user.inventory.push(loot);
  memUsers.set(playerId, user);

  return NextResponse.json({ message: 'Loot claimed successfully', loot });
}
