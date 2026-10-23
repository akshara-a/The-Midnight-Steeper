import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', game: 'The Midnight Steeper' });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
