import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dodo } from '@/lib/dodo';
import type { UnwrapWebhookEvent } from 'dodopayments/resources/webhooks/webhooks';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => { headers[key] = value; });

  let event: UnwrapWebhookEvent;
  try {
    event = dodo.webhooks.unwrap(rawBody, {
      headers,
      key: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (event.type === 'payment.succeeded') {
    const payment = event.data;
    const meta = payment.metadata as { userId?: string; credits?: string };
    const userId = meta.userId;
    const creditsToAdd = parseFloat(meta.credits ?? '0');

    if (!userId || isNaN(creditsToAdd) || creditsToAdd <= 0) {
      return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: profile } = await admin
      .from('profiles')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    const currentBalance = (profile as { credits_balance?: number } | null)?.credits_balance ?? 0;

    await admin
      .from('profiles')
      .update({ credits_balance: Number(currentBalance) + creditsToAdd })
      .eq('id', userId);

    await admin.from('token_transactions').insert({
      user_id: userId,
      type: 'purchase',
      credits: creditsToAdd,
      amount_paid: payment.total_amount,
      payment_id: payment.payment_id,
    });
  }

  return NextResponse.json({ ok: true });
}
