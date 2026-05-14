import { NextResponse } from 'next/server';
import { dodo } from '@/lib/dodo';
import { CREDIT_PACKAGES } from '@/lib/credits';

// One-time setup: GET /api/payments/products/create
// Creates credit packages as Dodo products. Copy the returned product IDs
// into CREDIT_PACKAGES ids in src/lib/credits.ts.
export async function GET() {
  const results = [];

  for (const pkg of CREDIT_PACKAGES) {
    const product = await dodo.products.create({
      name: `Qrew — ${pkg.label}`,
      description: `${pkg.credits} credits for Qrew AI builds`,
      tax_category: 'saas',
      price: {
        currency: 'USD',
        discount: 0,
        price: pkg.price * 100,
        purchasing_power_parity: false,
        type: 'one_time_price',
      },
    });
    results.push({ packageId: pkg.id, productId: product.product_id, name: product.name });
  }

  return NextResponse.json({
    message: 'Products created. Update CREDIT_PACKAGES ids in src/lib/credits.ts with these product IDs.',
    products: results,
  });
}
