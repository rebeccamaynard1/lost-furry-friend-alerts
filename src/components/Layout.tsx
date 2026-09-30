import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-svh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <nav className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold">
            🐾 Lost Furry Friend Alerts
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/lost" className="hover:underline">
              Lost Pets
            </Link>
            <Link to="/found" className="hover:underline">
              Found Pets
            </Link>
            <Link to="/directory" className="hover:underline">
              Org Directory
            </Link>
            {user ? (
              <>
                <Link to="/report" className="hover:underline">
                  Report a Pet
                </Link>
                <button onClick={handleSignOut} className="text-neutral-500 hover:underline">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
