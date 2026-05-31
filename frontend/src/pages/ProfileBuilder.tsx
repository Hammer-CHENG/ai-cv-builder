import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { api } from '../api/client'
import SectionEntry from '../components/SectionForm'

const PREBUILT_SECTIONS = ['Work Experience', 'Education', 'Projects', 'Certifications', 'Skills', 'Languages']

export default function ProfileBuilder() {
  const { register, control, handleSubmit, reset, setValue, getValues } = useForm({
    defaultValues: {
      contact: { name: '', email: '', phone: '', location: '', linkedin: '' },
      sections: {},
    },
  })
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customSection, setCustomSection] = useState('')
  const [, forceRender] = useState(0)

  // Load existing profile on mount
  useEffect(() => {
    api.resume.get().then(
      (data) => {
        const profile = data.profile_json
        for (const [sectionName, entries] of Object.entries((profile as any).sections || {})) {
          for (const entry of (entries as any[])) {
            if (entry.fields?.bullets && Array.isArray(entry.fields.bullets)) {
              entry.fields.bullets = entry.fields.bullets.join('\n')
            }
          }
        }
        reset(profile)
        setResumeId(data.id)
        setLoading(false)
      },
      () => setLoading(false)
    )
  }, [reset])

  const processData = (data: any) => {
    const processed = JSON.parse(JSON.stringify(data))
    for (const [sectionName, entries] of Object.entries(processed.sections || {})) {
      for (const entry of (entries as any[])) {
        if (entry.fields?.bullets && typeof entry.fields.bullets === 'string') {
          entry.fields.bullets = entry.fields.bullets.split('\n').filter((b: string) => b.trim())
        }
      }
    }
    return processed
  }

  const onSubmit = async (data: any) => {
    setSaving(true)
    const processed = processData(data)
    try {
      if (resumeId) {
        const updated = await api.resume.update(resumeId, processed)
        setResumeId(updated.id)
      } else {
        const created = await api.resume.create(processed)
        setResumeId(created.id)
      }
      alert('Profile saved!')
    } catch (e: any) {
      alert(`Save failed: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const addCustomSection = () => {
    if (!customSection.trim()) return
    setValue(`sections.${customSection}`, [], { shouldDirty: true })
    setCustomSection('')
    forceRender(n => n + 1)
  }

  if (loading) return <p className="spinner-container">Loading profile...</p>

  const sections = getValues('sections') || {}
  const allSectionNames = [...PREBUILT_SECTIONS, ...Object.keys(sections).filter(s => !PREBUILT_SECTIONS.includes(s))]

  return (
    <div className="page-enter">
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">Build your master profile — this will be tailored to each job description later.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Contact Info */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Contact Information</h3>
          </div>
          <div className="card-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label>Full Name</label>
                <input {...register('contact.name')} className="form-input" placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input {...register('contact.email')} type="email" className="form-input" placeholder="john@example.com" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input {...register('contact.phone')} className="form-input" placeholder="+852 1234 5678" />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input {...register('contact.location')} className="form-input" placeholder="Hong Kong" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>LinkedIn</label>
                <input {...register('contact.linkedin')} className="form-input" placeholder="https://linkedin.com/in/johndoe" />
              </div>
            </div>
          </div>
        </div>

        {/* All Sections (prebuilt + custom) */}
        {allSectionNames.map((sectionName) => (
          <SectionGroup
            key={sectionName}
            sectionName={sectionName}
            register={register}
            control={control}
            setValue={setValue}
            forceRender={forceRender}
          />
        ))}

        {/* Custom Section */}
        <div className="custom-section-bar">
          <input
            className="form-input"
            value={customSection}
            onChange={(e) => setCustomSection(e.target.value)}
            placeholder="Add a custom section, e.g., Volunteer Work, Awards, Publications"
          />
          <button type="button" className="btn btn-secondary" onClick={addCustomSection}>
            Add
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving...' : resumeId ? 'Update Profile' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}

function SectionGroup({ sectionName, register, control, setValue, forceRender }: {
  sectionName: string
  register: any
  control: any
  setValue: any
  forceRender: (fn: (n: number) => number) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const sections = control._formValues?.sections || {}
  const entries = sections[sectionName] || []

  const handleAddEntry = () => {
    const currentEntries = [...(sections[sectionName] || [])]
    currentEntries.push({ id: crypto.randomUUID(), fields: {} })
    setValue(`sections.${sectionName}`, currentEntries, { shouldDirty: true })
    forceRender(n => n + 1)
  }

  const handleRemoveEntry = (idx: number) => {
    const currentEntries = [...(sections[sectionName] || [])]
    currentEntries.splice(idx, 1)
    setValue(`sections.${sectionName}`, currentEntries, { shouldDirty: true })
    forceRender(n => n + 1)
  }

  return (
    <details
      className="section-accordion"
      open={expanded}
      onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}
    >
      <summary>{sectionName}</summary>
      <div className="section-content">
        {entries.map((_: any, idx: number) => (
          <SectionEntry
            key={idx}
            sectionType={sectionName}
            index={idx}
            register={register}
            remove={handleRemoveEntry}
          />
        ))}
        <button type="button" className="btn-add" onClick={handleAddEntry}>
          + Add Entry
        </button>
      </div>
    </details>
  )
}
