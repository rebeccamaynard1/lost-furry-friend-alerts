// Mirrors src/lib/boostTiers.ts on the frontend (different runtimes, so duplicated
// rather than shared). Keep both in sync when tiers/prices change. These are
// monthly recurring subscriptions — radiusMiles is used while the subscription is
// active; there is no fixed duration.
export type BoostTierKey = 'basic' | 'wide' | 'max'

export interface BoostTierMeta {
  amountCents: number
  radiusMiles: number
}

export const BOOST_TIERS: Record<BoostTierKey, BoostTierMeta> = {
  basic: { amountCents: 499, radiusMiles: 15 },
  wide: { amountCents: 999, radiusMiles: 40 },
  max: { amountCents: 1599, radiusMiles: 100 },
}

export function isBoostTierKey(value: string): value is BoostTierKey {
  return value === 'basic' || value === 'wide' || value === 'max'
}
