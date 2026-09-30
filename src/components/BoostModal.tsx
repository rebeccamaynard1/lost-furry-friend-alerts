import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { BOOST_TIERS, type BoostTierKey } from '../lib/boostTiers'

interface BoostModalProps {
  petId: string
  onClose: () => void
}

export default function BoostModal({ petId, onClose }: BoostModalProps) {
  const [loadingTier, setLoadingTier] = useState<BoostTierKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleBoost(tier: BoostTierKey) {
    setLoadingTier(tier)
    setError(null)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      setError('Please sign in first.')
      setLoadingTier(null)
      return
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { tier, petId },
    })
    setLoadingTier(null)
    if (error || !data?.url) {
      setError(error?.message ?? 'Could not start checkout.')
      return
    }
    window.location.href = data.url
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Boost this alert</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
            ✕
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-3">
          {BOOST_TIERS.map((tier) => (
            <div
              key={tier.key}
              className="flex flex-col rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <h3 className="font-medium">{tier.name}</h3>
              <p className="mt-1 text-2xl font-semibold">{tier.priceLabel}</p>
              <ul className="mt-3 flex-1 space-y-1 text-sm text-neutral-500">
                {tier.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <button
                onClick={() => handleBoost(tier.key)}
                disabled={loadingTier !== null}
                className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
              >
                {loadingTier === tier.key ? 'Redirecting…' : 'Choose'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
