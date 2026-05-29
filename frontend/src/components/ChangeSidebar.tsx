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
    <div style={{
      width: '280px',
      borderLeft: '1px solid var(--border)',
      padding: '16px',
      overflowY: 'auto',
      maxHeight: '80vh',
    }}>
      <h3 style={{ marginBottom: '12px', fontSize: '14px' }}>Changes</h3>

      {Object.entries(whyChanged).map(([section, reason]) => (
        <div
          key={section}
          onClick={() => onScrollTo(`section-${section}`)}
          style={{
            padding: '8px',
            marginBottom: '8px',
            borderRadius: '4px',
            background: 'var(--bg-warm)',
            cursor: 'pointer',
            borderLeft: '3px solid var(--amber)',
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '2px' }}>{section}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{reason}</div>
          <MemoryHint reason={reason} />
        </div>
      ))}

      {coverLetter && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Cover Letter</h3>
          <div style={{
            fontSize: '11px',
            whiteSpace: 'pre-wrap',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            {coverLetter}
          </div>
        </div>
      )}

      {interviewQuestions?.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Interview Questions</h3>
          {interviewQuestions.map((q, i) => (
            <div key={i} style={{
              padding: '6px 8px',
              marginBottom: '4px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              fontSize: '11px',
            }}>
              <span style={{
                display: 'inline-block',
                padding: '1px 6px',
                borderRadius: '8px',
                background: q.type === 'jd' ? 'var(--sage)' : 'var(--gold)',
                color: 'white',
                fontSize: '9px',
                marginRight: '4px',
              }}>
                {q.type.toUpperCase()}
              </span>
              {q.question}
              {q.tip && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Tip: {q.tip}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
