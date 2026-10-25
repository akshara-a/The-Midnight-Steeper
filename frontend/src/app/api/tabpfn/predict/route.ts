import { NextRequest, NextResponse } from 'next/server';
import { evaluateTabPFN } from '@/lib/tabpfn';
import { DURATION_TIERS } from '@/lib/customers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ingredients = [], duration_key = 'demo', streak = 1, care_xp = 0 } = body;

    const tier = DURATION_TIERS.find((t) => t.key === duration_key) ?? DURATION_TIERS[0];
    const durationSeconds = tier.seconds;

    const result = evaluateTabPFN({
      ingredients,
      durationSeconds,
      streak,
      careXP: care_xp,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Prediction failed' }, { status: 400 });
  }
}
