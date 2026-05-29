interface CVPreviewProps {
  cvJson: object
  annotations: { why_changed: Record<string, string> }
  onChange: (cvJson: object) => void
}

export default function CVPreview({ cvJson, annotations, onChange }: CVPreviewProps) {
  const contact = (cvJson as any).contact || {}
  const sections = (cvJson as any).sections || {}
  const whyChanged = annotations?.why_changed || {}

  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '32px',
      maxWidth: '700px',
      fontFamily: 'var(--font-body)',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        color: 'var(--gold-dark)',
        fontSize: '22px',
        marginBottom: '4px',
      }}>
        {contact.name || 'Your Name'}
      </h1>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        {[contact.email, contact.phone, contact.location].filter(Boolean).join(' | ')}
      </div>

      {Object.entries(sections).map(([sectionName, entries]: [string, any]) => (
        <div key={sectionName} id={`section-${sectionName}`} style={{ marginBottom: '16px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            color: 'var(--gold-dark)',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '4px',
            marginBottom: '8px',
          }}>
            {sectionName}
            {whyChanged[sectionName] && (
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                background: 'var(--amber)',
                borderRadius: '50%',
                marginLeft: '6px',
              }} title={whyChanged[sectionName]} />
            )}
          </h2>
          {(entries as any[]).map((entry, idx) => (
            <div key={idx} style={{ marginBottom: '8px', paddingLeft: whyChanged[sectionName] ? '8px' : '0', borderLeft: whyChanged[sectionName] ? '2px solid var(--amber)' : 'none' }}>
              {entry.fields?.title && <h3 style={{ fontSize: '13px', fontWeight: 'bold' }}>{entry.fields.title}</h3>}
              {entry.fields?.subtitle && <p style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>{entry.fields.subtitle}</p>}
              {entry.fields?.date_range && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{entry.fields.date_range}</p>}
              {entry.fields?.bullets && (
                <ul style={{ paddingLeft: '18px', margin: '4px 0' }}>
                  {entry.fields.bullets.map((b: string, bi: number) => (
                    <li key={bi} style={{ fontSize: '12px', marginBottom: '2px' }}>{b}</li>
                  ))}
                </ul>
              )}
              {entry.fields?.description && <p style={{ fontSize: '12px' }}>{entry.fields.description}</p>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
