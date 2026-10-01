// Single source of truth for alert-boost tiers. Mirrored (not imported — different
// runtimes) in supabase/functions/_shared/boost-tiers.ts for the edge functions.
// All tiers are monthly subscriptions — the boost stays active for as long as the
// subscription is active, and switches off automatically if it's canceled.
export type BoostTierKey = 'basic' | 'wide' | 'max'

export interface BoostTier {
  key: BoostTierKey
  name: string
  amountCents: number
  priceLabel: string
  radiusMiles: number
  priorityPlacement: boolean
  notifyAllNearby: boolean
  features: string[]
}

export const BOOST_TIERS: BoostTier[] = [
  {
    key: 'basic',
    name: 'Basic Boost',
    amountCents: 499,
    priceLabel: '$4.99/mo',
    radiusMiles: 15,
    priorityPlacement: false,
    notifyAllNearby: false,
    features: ['15-mile alert radius', 'Active while subscribed'],
  },
  {
    key: 'wide',
    name: 'Wide Boost',
    amountCents: 999,
    priceLabel: '$9.99/mo',
    radiusMiles: 40,
    priorityPlacement: true,
    notifyAllNearby: false,
    features: ['40-mile alert radius', 'Top-of-list placement', 'Active while subscribed'],
  },
  {
    key: 'max',
    name: 'Max Boost',
    amountCents: 1599,
    priceLabel: '$15.99/mo',
    radiusMiles: 100,
    priorityPlacement: true,
    notifyAllNearby: true,
    features: [
      '100-mile alert radius',
      'Top-of-list placement',
      'Notifies everyone nearby, not just close matches',
      'Active while subscribed',
    ],
  },
]

export function getBoostTier(key: string): BoostTier | undefined {
  return BOOST_TIERS.find((t) => t.key === key)
}
