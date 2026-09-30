import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'lost' | 'found'

export default function ReportPetPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('lost')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [petName, setPetName] = useState('')
  const [species, setSpecies] = useState('dog')
  const [breed, setBreed] = useState('')
  const [color, setColor] = useState('')
  const [address, setAddress] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')

  if (!user) {
    return (
      <p className="text-center text-neutral-500">
        Sign in to report a lost or found pet.
      </p>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error } =
      mode === 'lost'
        ? await supabase.from('lost_pets').insert({
            user_id: user!.id,
            pet_name: petName,
            species,
            breed: breed || null,
            color,
            last_seen_address: address || null,
            date_lost: date,
            description: description || null,
          })
        : await supabase.from('found_pets').insert({
            user_id: user!.id,
            species,
            breed: breed || null,
            color,
            found_address: address || null,
            date_found: date,
            description: description || null,
          })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate(mode === 'lost' ? '/lost' : '/found')
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-center text-2xl font-semibold">Report a Pet</h1>

      <div className="mb-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setMode('lost')}
          className={`rounded-lg px-4 py-2 text-sm ${
            mode === 'lost'
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
              : 'border border-neutral-300 dark:border-neutral-700'
          }`}
        >
          I lost a pet
        </button>
        <button
          type="button"
          onClick={() => setMode('found')}
          className={`rounded-lg px-4 py-2 text-sm ${
            mode === 'found'
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
              : 'border border-neutral-300 dark:border-neutral-700'
          }`}
        >
          I found a pet
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'lost' && (
          <input
            type="text"
            required
            placeholder="Pet's name"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            className="rounded-lg border border-neutral-300 px-4 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        )}
        <select
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          className="rounded-lg border border-neutral-300 px-4 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
          <option value="other">Other</option>
        </select>
        <input
          type="text"
          placeholder="Breed (optional)"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          className="rounded-lg border border-neutral-300 px-4 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          type="text"
          required
          placeholder="Color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="rounded-lg border border-neutral-300 px-4 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          type="text"
          placeholder={mode === 'lost' ? 'Last seen near…' : 'Found near…'}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="rounded-lg border border-neutral-300 px-4 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-neutral-300 px-4 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-lg border border-neutral-300 px-4 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {submitting ? 'Submitting…' : 'Submit report'}
        </button>
      </form>
    </div>
  )
}
