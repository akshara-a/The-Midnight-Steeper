import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/serverDb';

export async function POST(req: NextRequest) {
  const playerId = req.headers.get('x-player-id')?.trim();
  if (!playerId) {
    return NextResponse.json({ detail: 'Missing required header: X-Player-ID' }, { status: 401 });
  }

  const { memBrews } = await getDatabase();
  for (const b of Array.from(memBrews.values())) {
    if (b.player_id === playerId && b.status === 'brewing') {
      // Set ready_time to 1 second ago so it wakes up immediately
      b.ready_time = new Date(Date.now() - 1000).toISOString();
      memBrews.set(b.brew_id, { ...b });
      return NextResponse.json({ message: 'Fast-forwarded successfully', brew: b });
    }
  }

  return NextResponse.json({ message: 'No active brewing session found' });
}
