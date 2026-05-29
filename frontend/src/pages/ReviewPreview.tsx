import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import CVPreview from '../components/CVPreview'
import ChangeSidebar from '../components/ChangeSidebar'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ReviewPreview() {
  const { sessionId } = useParams<{ sessionId: string }>()!
  const navigate = useNavigate()
  const [session, setSession] = useState<any>(null)
  const [cvJson, setCvJson] = useState<object>({})
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [rating, setRating] = useState<number | null>(null)

  useEffect(() => {
    api.jdSessions.get(sessionId).then(
      (data) => {
        setSession(data)
        setCvJson(data.tailored_cv_json)
        setRating(data.user_rating)
        setLoading(false)
      },
      () => setLoading(false)
    )
  }, [sessionId])

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await api.export.pdf(cvJson)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resume.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(`Export failed: ${e.message}`)
    } finally {
      setExporting(false)
    }
  }

  const handleRate = async (score: number) => {
    setRating(score)
    try {
      await api.jdSessions.rate(sessionId, score)
    } catch {}
  }

  if (loading) return <LoadingSpinner />
  if (!session) return <p>Session not found.</p>

  const annotations = session.llm_annotations || {}
  const interviewQuestions = annotations.interview_questions || []
  const coverLetter = annotations.cover_letter || ''

  return (
    <div style={{ display: 'flex', gap: '0', minHeight: 'calc(100vh - 60px)' }}>
      {/* Center: CV Preview */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <CVPreview cvJson={cvJson} annotations={annotations} onChange={setCvJson} />

        {/* Bottom action bar */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: 'var(--bg-warm)',
          borderRadius: '4px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              padding: '8px 20px',
              background: 'var(--gold-dark)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--font-display)',
            }}
          >
            {exporting ? 'Generating...' : 'Export PDF'}
          </button>
          <button
            onClick={() => navigate('/jd')}
            style={{
              padding: '8px 20px',
              background: 'transparent',
              border: '1px solid var(--gold)',
              borderRadius: '4px',
              color: 'var(--gold-dark)',
              fontFamily: 'var(--font-display)',
            }}
          >
            New JD Session
          </button>
        </div>

        {/* Cover Letter (if available) */}
        {coverLetter && (
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ marginBottom: '8px' }}>Cover Letter</h3>
            <div style={{
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '16px',
              lineHeight: '1.6',
            }}>
              {coverLetter}
            </div>
          </div>
        )}

        {/* Interview Questions (if available) */}
        {interviewQuestions.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ marginBottom: '8px' }}>Interview Questions</h3>
            {interviewQuestions.map((q: any, i: number) => (
              <div key={i} style={{
                padding: '10px 12px',
                marginBottom: '6px',
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  background: q.type === 'jd' ? 'var(--sage)' : 'var(--gold)',
                  color: 'white',
                  fontSize: '10px',
                  marginRight: '6px',
                  fontWeight: 'bold',
                }}>
                  {q.type.toUpperCase()}
                </span>
                <strong>{q.question}</strong>
                {q.tip && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Tip: {q.tip}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Rating */}
        <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Was this helpful?{' '}
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              onClick={() => handleRate(n)}
              style={{
                cursor: 'pointer',
                color: n <= (rating || 0) ? 'var(--gold)' : 'var(--border)',
                fontSize: '18px',
              }}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Right: Change Sidebar */}
      <ChangeSidebar
        annotations={annotations}
        coverLetter={coverLetter}
        interviewQuestions={interviewQuestions}
        onScrollTo={(id) => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        }}
      />
    </div>
  )
}
