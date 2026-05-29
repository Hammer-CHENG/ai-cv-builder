import { useState } from 'react'

interface CVPreviewProps {
  cvJson: object
  annotations: { why_changed: Record<string, string> }
  onChange: (cvJson: object) => void
}

export default function CVPreview({ cvJson, annotations, onChange }: CVPreviewProps) {
  const contact = (cvJson as any).contact || {}
  const sections = (cvJson as any).sections || {}
  const whyChanged = annotations?.why_changed || {}

  const handleFieldEdit = (sectionName: string, entryIdx: number, field: string, value: string) => {
    const updated = JSON.parse(JSON.stringify(cvJson))
    const entry = updated.sections[sectionName]?.[entryIdx]
    if (!entry) return
    if (field === 'bullets') {
      entry.fields[field] = value.split('\n').filter((b: string) => b.trim())
    } else {
      entry.fields[field] = value
    }
    onChange(updated)
  }

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
              {entry.fields?.title && (
                <h3 style={{ fontSize: '13px', fontWeight: 'bold' }}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleFieldEdit(sectionName, idx, 'title', e.currentTarget.textContent || '')}
                >{entry.fields.title}</h3>
              )}
              {entry.fields?.subtitle && (
                <p style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-secondary)' }}
                   contentEditable
                   suppressContentEditableWarning
                   onBlur={(e) => handleFieldEdit(sectionName, idx, 'subtitle', e.currentTarget.textContent || '')}
                >{entry.fields.subtitle}</p>
              )}
              {entry.fields?.date_range && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}
                   contentEditable
                   suppressContentEditableWarning
                   onBlur={(e) => handleFieldEdit(sectionName, idx, 'date_range', e.currentTarget.textContent || '')}
                >{entry.fields.date_range}</p>
              )}
              {entry.fields?.bullets && Array.isArray(entry.fields.bullets) && (
                <ul style={{ paddingLeft: '18px', margin: '4px 0' }}>
                  {entry.fields.bullets.map((b: string, bi: number) => (
                    <li key={bi} style={{ fontSize: '12px', marginBottom: '2px' }}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updated = JSON.parse(JSON.stringify(cvJson))
                          updated.sections[sectionName][idx].fields.bullets[bi] = e.currentTarget.textContent || ''
                          onChange(updated)
                        }}
                    >{b}</li>
                  ))}
                </ul>
              )}
              {entry.fields?.description && (
                <p style={{ fontSize: '12px' }}
                   contentEditable
                   suppressContentEditableWarning
                   onBlur={(e) => handleFieldEdit(sectionName, idx, 'description', e.currentTarget.textContent || '')}
                >{entry.fields.description}</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
