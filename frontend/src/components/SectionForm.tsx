import { UseFormRegister, UseFieldArrayRemove } from 'react-hook-form'

interface SectionFieldProps {
  sectionType: string
  index: number
  register: UseFormRegister<any>
  remove: UseFieldArrayRemove
}

const SECTION_SCHEMAS: Record<string, { name: string; type: string }[]> = {
  'Work Experience': [
    { name: 'title', type: 'text' },
    { name: 'subtitle', type: 'text' },
    { name: 'date_range', type: 'text' },
    { name: 'bullets', type: 'textarea' },
  ],
  'Education': [
    { name: 'title', type: 'text' },
    { name: 'subtitle', type: 'text' },
    { name: 'date_range', type: 'text' },
  ],
  'Projects': [
    { name: 'title', type: 'text' },
    { name: 'subtitle', type: 'text' },
    { name: 'date_range', type: 'text' },
    { name: 'bullets', type: 'textarea' },
  ],
  'Certifications': [
    { name: 'title', type: 'text' },
    { name: 'subtitle', type: 'text' },
    { name: 'date_range', type: 'text' },
  ],
  'Skills': [
    { name: 'description', type: 'textarea' },
  ],
  'Languages': [
    { name: 'title', type: 'text' },
    { name: 'description', type: 'text' },
  ],
}

export default function SectionEntry({ sectionType, index, register, remove }: SectionFieldProps) {
  const schema = SECTION_SCHEMAS[sectionType] || [
    { name: 'title', type: 'text' },
    { name: 'description', type: 'textarea' },
  ]

  return (
    <div className="section-entry" style={{
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '12px',
      marginBottom: '8px',
      background: 'white',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-dark)', fontWeight: 'bold' }}>
          Entry #{index + 1}
        </span>
        <button
          type="button"
          onClick={() => remove(index)}
          style={{ color: 'var(--error)', background: 'none', border: 'none', fontSize: '14px' }}
        >
          Remove
        </button>
      </div>
      {schema.map((field) => (
        <div key={field.name} style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
            {field.name.replace('_', ' ')}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              {...register(`sections.${sectionType}.${index}.fields.${field.name}`)}
              rows={3}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
              }}
            />
          ) : (
            <input
              type="text"
              {...register(`sections.${sectionType}.${index}.fields.${field.name}`)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
