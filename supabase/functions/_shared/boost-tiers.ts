// Mirrors src/lib/boostTiers.ts on the frontend (different runtimes, so duplicated
// rather than shared). Keep both in sync when tiers/prices change.
export type BoostTierKey = 'basic' | 'wide' | 'max'

export interface BoostTierMeta {
  amountCents: number
  radiusMiles: number
  durationDays: number
}

export const BOOST_TIERS: Record<BoostTierKey, BoostTierMeta> = {
  basic: { amountCents: 499, radiusMiles: 15, durationDays: 3 },
  wide: { amountCents: 999, radiusMiles: 40, durationDays: 7 },
  max: { amountCents: 1999, radiusMiles: 100, durationDays: 14 },
}

export function isBoostTierKey(value: string): value is BoostTierKey {
  return value === 'basic' || value === 'wide' || value === 'max'
}
