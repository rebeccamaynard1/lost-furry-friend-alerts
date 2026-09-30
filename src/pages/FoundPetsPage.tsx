import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface FoundPet {
  id: string
  species: string
  breed: string | null
  color: string
  found_address: string | null
  date_found: string
  description: string | null
  status: string
  holding_location: string | null
}

export default function FoundPetsPage() {
  const [pets, setPets] = useState<FoundPet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('found_pets')
        .select('id, species, breed, color, found_address, date_found, description, status, holding_location')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) setError(error.message)
      else setPets((data ?? []) as FoundPet[])
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold">Found Pets</h1>
        <p className="mt-1 text-neutral-500">{pets.length} active reports</p>
      </header>

      {loading && <p className="text-center text-neutral-500">Loading…</p>}
      {error && <p className="text-center text-red-600">Couldn't load found pets: {error}</p>}
      {!loading && !error && pets.length === 0 && (
        <p className="text-center text-neutral-500">No found pet reports yet.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {pets.map((pet) => (
          <div
            key={pet.id}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">
                {pet.species}
                {pet.breed ? ` · ${pet.breed}` : ''}
              </h2>
              <span className="text-xs uppercase text-neutral-500">{pet.status}</span>
            </div>
            <p className="text-sm text-neutral-500">{pet.color}</p>
            <p className="mt-2 text-sm">
              Found {new Date(pet.date_found).toLocaleDateString()}
              {pet.found_address ? ` near ${pet.found_address}` : ''}
            </p>
            {pet.holding_location && (
              <p className="mt-1 text-sm text-neutral-500">Currently at: {pet.holding_location}</p>
            )}
            {pet.description && <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{pet.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
