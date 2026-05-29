import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

export default function JDSession() {
  const [jdText, setJdText] = useState('')
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.resume.get(),
      api.jdSessions.list(),
    ]).then(
      ([resume, sessions]) => {
        setResumeId(resume.id)
        setSessions(sessions)
        setLoading(false)
      },
      () => setLoading(false)
    )
  }, [])

  const handleSubmit = async () => {
    if (!resumeId) {
      alert('Please create your profile first.')
      return
    }
    if (!jdText.trim()) {
      alert('Please paste a job description.')
      return
    }
    setSubmitting(true)
    try {
      const session = await api.jdSessions.create(resumeId, jdText)
      navigate(`/review/${session.id}`)
    } catch (e: any) {
      alert(`Tailoring failed: ${e.message}`)
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ marginBottom: '16px' }}>Tailor Your CV</h2>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
          Paste Job Description
        </label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={10}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          padding: '10px 24px',
          background: submitting ? 'var(--text-muted)' : 'var(--gold-dark)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '15px',
          fontFamily: 'var(--font-display)',
        }}
      >
        {submitting ? 'AI is tailoring your CV...' : 'Tailor My CV'}
      </button>

      {/* Session History */}
      {sessions.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '8px' }}>Recent Sessions</h3>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(`/review/${s.id}`)}
              style={{
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                marginBottom: '8px',
                cursor: 'pointer',
                background: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>
                  {s.jd_text.substring(0, 60)}...
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </div>
              </div>
              {s.match_score && (
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  background: s.match_score >= 70 ? 'var(--sage)' : 'var(--amber)',
                  color: s.match_score >= 70 ? 'white' : 'var(--gold-dark)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                }}>
                  {s.match_score}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
