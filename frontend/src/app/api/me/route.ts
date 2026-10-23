import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/serverDb';

export async function GET(req: NextRequest) {
  const playerId = req.headers.get('x-player-id')?.trim();
  if (!playerId) {
    return NextResponse.json({ detail: 'Missing required authentication header: X-Player-ID' }, { status: 401 });
  }

  const { memUsers } = await getDatabase();
  let user = memUsers.get(playerId);
  if (!user) {
    user = {
      player_id: playerId,
      consistency_score: 1,
      inventory: [],
      created_at: new Date().toISOString(),
    };
    memUsers.set(playerId, user);
  }
  return NextResponse.json(user);
}
