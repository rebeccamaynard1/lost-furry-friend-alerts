// Single source of truth for alert-boost tiers. Mirrored (not imported — different
// runtimes) in supabase/functions/_shared/boost-tiers.ts for the edge functions.
export type BoostTierKey = 'basic' | 'wide' | 'max'

export interface BoostTier {
  key: BoostTierKey
  name: string
  amountCents: number
  priceLabel: string
  radiusMiles: number
  durationDays: number
  priorityPlacement: boolean
  notifyAllNearby: boolean
  features: string[]
}

export const BOOST_TIERS: BoostTier[] = [
  {
    key: 'basic',
    name: 'Basic Boost',
    amountCents: 499,
    priceLabel: '$4.99',
    radiusMiles: 15,
    durationDays: 3,
    priorityPlacement: false,
    notifyAllNearby: false,
    features: ['15-mile alert radius', 'Active for 3 days'],
  },
  {
    key: 'wide',
    name: 'Wide Boost',
    amountCents: 999,
    priceLabel: '$9.99',
    radiusMiles: 40,
    durationDays: 7,
    priorityPlacement: true,
    notifyAllNearby: false,
    features: ['40-mile alert radius', 'Active for 7 days', 'Top-of-list placement'],
  },
  {
    key: 'max',
    name: 'Max Boost',
    amountCents: 1999,
    priceLabel: '$19.99',
    radiusMiles: 100,
    durationDays: 14,
    priorityPlacement: true,
    notifyAllNearby: true,
    features: [
      '100-mile alert radius',
      'Active for 14 days',
      'Top-of-list placement',
      'Notifies everyone nearby, not just close matches',
    ],
  },
]

export function getBoostTier(key: string): BoostTier | undefined {
  return BOOST_TIERS.find((t) => t.key === key)
}
