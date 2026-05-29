import { useEffect, useState } from 'react'
import { supabase } from '../api/client'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(!!data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <p>Loading...</p>

  if (!authenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '80px auto', padding: '24px', textAlign: 'center' }}>
        <h2>Sign in to CV Builder</h2>
        <button
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
          style={{
            marginTop: '16px',
            padding: '10px 24px',
            background: 'var(--gold-dark)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          Sign in with Google
        </button>
        <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Or sign in with email/password via Supabase
        </p>
      </div>
    )
  }

  return <>{children}</>
}
