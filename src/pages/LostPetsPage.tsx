import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface LostPet {
  id: string
  pet_name: string
  species: string
  breed: string | null
  color: string
  last_seen_address: string | null
  date_lost: string
  description: string | null
  status: string
  photos: string[]
}

export default function LostPetsPage() {
  const [pets, setPets] = useState<LostPet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('lost_pets')
        .select('id, pet_name, species, breed, color, last_seen_address, date_lost, description, status, photos')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) setError(error.message)
      else setPets((data ?? []) as LostPet[])
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
        <h1 className="text-2xl font-semibold">Lost Pets</h1>
        <p className="mt-1 text-neutral-500">{pets.length} active reports</p>
      </header>

      {loading && <p className="text-center text-neutral-500">Loading…</p>}
      {error && <p className="text-center text-red-600">Couldn't load lost pets: {error}</p>}
      {!loading && !error && pets.length === 0 && (
        <p className="text-center text-neutral-500">No lost pet reports yet.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {pets.map((pet) => (
          <div
            key={pet.id}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">{pet.pet_name}</h2>
              <span className="text-xs uppercase text-neutral-500">{pet.status}</span>
            </div>
            <p className="text-sm text-neutral-500">
              {pet.species}
              {pet.breed ? ` · ${pet.breed}` : ''} · {pet.color}
            </p>
            <p className="mt-2 text-sm">
              Last seen {new Date(pet.date_lost).toLocaleDateString()}
              {pet.last_seen_address ? ` near ${pet.last_seen_address}` : ''}
            </p>
            {pet.description && <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{pet.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
