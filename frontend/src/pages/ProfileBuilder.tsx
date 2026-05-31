import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
        // Convert bullets arrays to newline-separated strings for textarea
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
      () => setLoading(false) // 404 = no profile yet
    )
  }, [reset])

  // Process data before sending: convert bullets strings to arrays
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

  if (loading) return <p>Loading profile...</p>

  const sections = getValues('sections') || {}
  const allSectionNames = [...PREBUILT_SECTIONS, ...Object.keys(sections).filter(s => !PREBUILT_SECTIONS.includes(s))]

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ marginBottom: '16px' }}>My Profile</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Contact Info */}
        <fieldset style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '4px', marginBottom: '16px', background: 'white' }}>
          <legend style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-dark)', fontWeight: 'bold', padding: '0 8px' }}>
            Contact Information
          </legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Full Name</label>
              <input {...register('contact.name')} style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '3px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email</label>
              <input {...register('contact.email')} type="email" style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '3px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Phone</label>
              <input {...register('contact.phone')} style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '3px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Location</label>
              <input {...register('contact.location')} style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '3px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>LinkedIn</label>
              <input {...register('contact.linkedin')} style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '3px' }} />
            </div>
          </div>
        </fieldset>

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
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Add Custom Section</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={customSection}
              onChange={(e) => setCustomSection(e.target.value)}
              placeholder="e.g., Volunteer Work, Awards"
              style={{ flex: 1, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '3px' }}
            />
            <button type="button" onClick={addCustomSection} style={{
              padding: '6px 16px',
              background: 'var(--gold)',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
            }}>
              Add
            </button>
          </div>
        </div>

        <button type="submit" disabled={saving} style={{
          padding: '10px 24px',
          background: saving ? 'var(--text-muted)' : 'var(--gold-dark)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '15px',
          fontFamily: 'var(--font-display)',
        }}>
          {saving ? 'Saving...' : resumeId ? 'Update Profile' : 'Create Profile'}
        </button>
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

  // Get current entries safely
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
    <details style={{
      border: '1px solid var(--border)',
      borderRadius: '4px',
      marginBottom: '8px',
      background: 'white',
      padding: '12px',
    }} open={expanded} onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}>
      <summary style={{
        fontFamily: 'var(--font-display)',
        color: 'var(--gold-dark)',
        fontWeight: 'bold',
        cursor: 'pointer',
      }}>
        {sectionName}
      </summary>
      {/* Render entries */}
      {entries.map((_: any, idx: number) => (
        <SectionEntry
          key={idx}
          sectionType={sectionName}
          index={idx}
          register={register}
          remove={handleRemoveEntry}
        />
      ))}
      <button
        type="button"
        onClick={handleAddEntry}
        style={{
          padding: '6px 12px',
          background: 'transparent',
          border: '1px dashed var(--gold)',
          borderRadius: '3px',
          color: 'var(--gold-dark)',
          marginTop: '8px',
        }}
      >
        + Add Entry
      </button>
    </details>
  )
}
