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
    <div className="cv-preview">
      <h1 className="cv-name">
        {contact.name || 'Your Name'}
        <span className="cv-edit-icon">✎</span>
      </h1>
      <div className="cv-contact">
        {[contact.email, contact.phone, contact.location].filter(Boolean).join(' | ')}
      </div>

      {Object.entries(sections).map(([sectionName, entries]: [string, any]) => (
        <div key={sectionName} id={`section-${sectionName}`} className="cv-section">
          <h2 className="cv-section-title">
            {sectionName}
            {whyChanged[sectionName] && (
              <span className="cv-change-dot" title={whyChanged[sectionName]} />
            )}
          </h2>
          {(entries as any[]).map((entry, idx) => (
            <div key={idx} className={`cv-entry ${whyChanged[sectionName] ? 'changed' : ''}`}>
              {entry.fields?.title && (
                <h3
                  className="cv-field"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleFieldEdit(sectionName, idx, 'title', e.currentTarget.textContent || '')}
                >
                  {entry.fields.title}
                </h3>
              )}
              {entry.fields?.subtitle && (
                <p
                  className="cv-field cv-subtitle"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleFieldEdit(sectionName, idx, 'subtitle', e.currentTarget.textContent || '')}
                >
                  {entry.fields.subtitle}
                </p>
              )}
              {entry.fields?.date_range && (
                <p
                  className="cv-field cv-date"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleFieldEdit(sectionName, idx, 'date_range', e.currentTarget.textContent || '')}
                >
                  {entry.fields.date_range}
                </p>
              )}
              {entry.fields?.bullets && Array.isArray(entry.fields.bullets) && (
                <ul className="cv-bullets">
                  {entry.fields.bullets.map((b: string, bi: number) => (
                    <li key={bi}
                        className="cv-field cv-bullet"
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
                <p
                  className="cv-field"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleFieldEdit(sectionName, idx, 'description', e.currentTarget.textContent || '')}
                >
                  {entry.fields.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
