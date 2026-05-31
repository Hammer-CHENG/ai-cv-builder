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
    <div className="section-entry">
      <div className="section-entry-header">
        <span className="section-entry-label">Entry #{index + 1}</span>
        <button type="button" className="btn-remove" onClick={() => remove(index)}>
          Remove
        </button>
      </div>
      {schema.map((field) => (
        <div key={field.name} className="form-group" style={{ marginBottom: '12px' }}>
          <label>{field.name.replace('_', ' ')}</label>
          {field.type === 'textarea' ? (
            <textarea
              {...register(`sections.${sectionType}.${index}.fields.${field.name}`)}
              className="form-textarea"
              rows={3}
            />
          ) : (
            <input
              type="text"
              {...register(`sections.${sectionType}.${index}.fields.${field.name}`)}
              className="form-input"
            />
          )}
        </div>
      ))}
    </div>
  )
}
