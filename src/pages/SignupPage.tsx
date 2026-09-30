import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function SignupPage() {
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signUp(email, password, name)
    setSubmitting(false)
    if (error) setError(error)
    else setDone(true)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-semibold">Check your email</h1>
        <p className="text-neutral-500">
          We sent a confirmation link to {email}. Confirm your address to finish signing up.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-semibold">Create an account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-neutral-300 px-4 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-neutral-300 px-4 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-neutral-300 px-4 py-2 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:underline dark:text-blue-400">
          Sign in
        </Link>
      </p>
    </div>
  )
}
