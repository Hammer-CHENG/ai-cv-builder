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
    <div className="review-layout page-enter">
      <div className="review-main">
        <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Your Tailored CV</h2>
        <CVPreview cvJson={cvJson} annotations={annotations} onChange={setCvJson} />

        {/* Actions */}
        <div className="review-actions">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-primary"
          >
            {exporting ? 'Generating PDF...' : 'Export PDF'}
          </button>
          <button
            onClick={() => navigate('/jd')}
            className="btn btn-secondary"
          >
            New JD Session
          </button>
        </div>

        {/* Rating */}
        <div className="rating-bar">
          <span>Was this helpful?</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`star ${n <= (rating || 0) ? 'active' : 'inactive'}`}
              onClick={() => handleRate(n)}
            >
              ★
            </span>
          ))}
        </div>

        {/* Cover Letter */}
        {coverLetter && (
          <div>
            <h3 className="sidebar-section-title">Cover Letter</h3>
            <div className="cover-letter-display">{coverLetter}</div>
          </div>
        )}

        {/* Interview Questions */}
        {interviewQuestions.length > 0 && (
          <div>
            <h3 className="sidebar-section-title">Interview Questions</h3>
            {interviewQuestions.map((q: any, i: number) => (
              <div key={i} className="question-card">
                <span className={`question-type ${q.type}`}>{q.type.toUpperCase()}</span>
                <div className="question-text">{q.question}</div>
                {q.tip && <div className="question-tip">Tip: {q.tip}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

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
