import { useEffect, useState } from 'react'
import { supabase } from '../api/client'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setIsSuccess(false)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Account created! Check your email to confirm, then sign in.')
        setIsSuccess(true)
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: any) {
      setMessage(err.message)
      setIsSuccess(false)
    }
  }

  if (loading) return <p style={{ textAlign: 'center', padding: '60px' }}>Loading...</p>

  if (!authenticated) {
    return (
      <div className="auth-container page-enter">
        <h2>{mode === 'signin' ? 'Welcome back' : 'Create account'}</h2>
        <p className="auth-subtitle">
          {mode === 'signin'
            ? 'Sign in to your CV Builder account'
            : 'Start building your AI-optimized CV'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            className="form-input"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-input"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {message && (
            <div className={`auth-error ${isSuccess ? 'is-success' : 'is-error'}`}>
              {message}
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    )
  }

  return <>{children}</>
}
