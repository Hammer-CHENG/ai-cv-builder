import MemoryHint from './MemoryHint'

interface ChangeSidebarProps {
  annotations: { why_changed: Record<string, string> }
  coverLetter: string
  interviewQuestions: Array<{ type: string; question: string; tip: string }>
  onScrollTo: (sectionId: string) => void
}

export default function ChangeSidebar({ annotations, coverLetter, interviewQuestions, onScrollTo }: ChangeSidebarProps) {
  const whyChanged = annotations?.why_changed || {}

  return (
    <div className="review-sidebar">
      <h3 className="sidebar-section-title" style={{ marginTop: '0' }}>Changes</h3>

      {Object.entries(whyChanged).map(([section, reason]) => (
        <div
          key={section}
          className="sidebar-item"
          onClick={() => onScrollTo(`section-${section}`)}
        >
          <div className="sidebar-item-title">{section}</div>
          <div className="sidebar-item-reason">{reason}</div>
          <MemoryHint reason={reason} />
        </div>
      ))}

      {interviewQuestions?.length > 0 && (
        <div>
          <h3 className="sidebar-section-title">Interview Prep</h3>
          {interviewQuestions.map((q, i) => (
            <div key={i} className="question-card">
              <span className={`question-type ${q.type}`}>{q.type.toUpperCase()}</span>
              <div className="question-text">{q.question}</div>
              {q.tip && <div className="question-tip">Tip: {q.tip}</div>}
            </div>
          ))}
        </div>
      )}

      {coverLetter && (
        <div>
          <h3 className="sidebar-section-title">Cover Letter</h3>
          <div style={{
            fontSize: '12px',
            lineHeight: '1.7',
            color: 'var(--text-secondary)',
            padding: '12px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
          }}>
            {coverLetter}
          </div>
        </div>
      )}
    </div>
  )
}
