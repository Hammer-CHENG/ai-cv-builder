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
      navigate('/profile')
      return
    }
    if (!jdText.trim()) {
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
    <div className="page-enter">
      <h1 className="page-title">Tailor Your CV</h1>
      <p className="page-subtitle">Paste a job description and let AI optimize your CV to match. We'll highlight the changes and explain why.</p>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body">
          <div className="form-group">
            <label>Job Description</label>
            <textarea
              className="form-textarea"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here — including requirements, responsibilities, and qualifications..."
              rows={12}
              style={{ minHeight: '180px' }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary btn-lg"
          >
            {submitting ? 'AI is tailoring your CV...' : 'Tailor My CV'}
          </button>
        </div>
      </div>

      {/* Session History */}
      {sessions.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '12px', fontSize: '16px', color: 'var(--text-secondary)', fontWeight: '400', fontStyle: 'italic' }}>
            Recent Sessions
          </h3>
          {sessions.map((s) => (
            <div
              key={s.id}
              className="session-card"
              onClick={() => navigate(`/review/${s.id}`)}
            >
              <div>
                <div className="session-card-text">
                  {s.jd_text.substring(0, 80)}...
                </div>
                <div className="session-card-date">
                  {new Date(s.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              {s.match_score != null && (
                <div className={`match-badge ${s.match_score >= 70 ? 'high' : 'medium'}`}>
                  {s.match_score}% match
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
