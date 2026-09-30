import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'

interface PartnerRow {
  id: string
  name: string
  type: string
  county: string | null
  website: string | null
  created_at: string
}

function App() {
  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase.rpc('get_public_alabama_partners')
      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setPartners((data ?? []) as PartnerRow[])
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return partners
    return partners.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.county ?? '').toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q),
    )
  }, [partners, query])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          Lost Furry Friend Alerts
        </h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          Alabama animal-welfare directory — {partners.length} organizations
        </p>
      </header>

      <input
        type="text"
        placeholder="Search by name, county, or type…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-6 w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />

      {loading && <p className="text-center text-neutral-500">Loading…</p>}
      {error && (
        <p className="text-center text-red-600">
          Couldn't load the directory: {error}
        </p>
      )}

      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {filtered.map((p) => (
          <li key={p.id} className="py-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {p.name}
              </span>
              <span className="shrink-0 text-sm text-neutral-500">
                {p.county ?? '—'}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-neutral-500">
              <span className="capitalize">{p.type}</span>
              {p.website && (
                <>
                  <span>·</span>
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    website
                  </a>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {!loading && !error && filtered.length === 0 && (
        <p className="py-6 text-center text-neutral-500">No matches.</p>
      )}
    </div>
  )
}

export default App
