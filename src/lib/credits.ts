export const CREDIT_PACKAGES = [
  { id: 'credits_5', credits: 5, price: 10, label: '5 credits', popular: false, savings: null },
  { id: 'credits_10', credits: 10, price: 18, label: '10 credits', popular: true, savings: '10% off' },
  { id: 'credits_20', credits: 20, price: 30, label: '20 credits', popular: false, savings: '25% off' },
] as const;

export type CreditPackage = (typeof CREDIT_PACKAGES)[number];

export const CREDIT_COST = {
  standard: 1.5,
  premium: 2.5,
} as const;
