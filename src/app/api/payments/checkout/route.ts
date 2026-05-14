import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { dodo } from '@/lib/dodo';
import { CREDIT_PACKAGES } from '@/lib/credits';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { packageId?: string };
  const pkg = CREDIT_PACKAGES.find(p => p.id === body.packageId);
  if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

  try {
    const payment = await dodo.payments.create({
      billing: {
        city: 'NA',
        country: 'IN',
        state: 'NA',
        street: 'NA',
        zipcode: '000000',
      },
      customer: {
        email: user.email!,
        name: user.email!,
      },
      product_cart: [{ product_id: pkg.id, quantity: 1 }],
      payment_link: true,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app?payment=success`,
      metadata: {
        userId: user.id,
        credits: pkg.credits.toString(),
        packageId: pkg.id,
      },
    });

    return NextResponse.json({ url: payment.payment_link });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create payment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
