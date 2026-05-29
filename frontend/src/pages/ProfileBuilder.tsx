import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { api } from '../api/client'
import SectionEntry from '../components/SectionForm'

const PREBUILT_SECTIONS = ['Work Experience', 'Education', 'Projects', 'Certifications', 'Skills', 'Languages']

export default function ProfileBuilder() {
  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      contact: { name: '', email: '', phone: '', location: '', linkedin: '' },
      sections: {},
    },
  })
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customSection, setCustomSection] = useState('')

  // Load existing profile on mount
  useEffect(() => {
    api.resume.get().then(
      (data) => {
        reset(data.profile_json)
        setResumeId(data.id)
        setLoading(false)
      },
      () => setLoading(false) // 404 = no profile yet
    )
  }, [reset])

  const onSubmit = async (data: any) => {
    setSaving(true)
    try {
      if (resumeId) {
        const updated = await api.resume.update(resumeId, data)
        setResumeId(updated.id)
      } else {
        const created = await api.resume.create(data)
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
    // Append to sections in form — user can add entries next
    const current = control._formValues?.sections || {}
    control._formValues = {
      ...control._formValues,
      sections: { ...current, [customSection]: [] },
    }
    setCustomSection('')
  }

  if (loading) return <p>Loading profile...</p>

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

        {/* Prebuilt Sections */}
        {PREBUILT_SECTIONS.map((sectionName) => (
          <SectionGroup
            key={sectionName}
            sectionName={sectionName}
            register={register}
            control={control}
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

function SectionGroup({ sectionName, register, control }: {
  sectionName: string
  register: any
  control: any
}) {
  const [expanded, setExpanded] = useState(false)

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
      {/* Render entries if they exist */}
      {control._formValues?.sections?.[sectionName]?.map((_: any, idx: number) => (
        <SectionEntry
          key={idx}
          sectionType={sectionName}
          index={idx}
          register={register}
          remove={() => {
            const entries = control._formValues.sections[sectionName]
            entries.splice(idx, 1)
            control._formValues = { ...control._formValues }
          }}
        />
      ))}
      <button
        type="button"
        onClick={() => {
          const current = control._formValues?.sections || {}
          const entries = current[sectionName] || []
          entries.push({ id: crypto.randomUUID(), fields: {} })
          control._formValues = { ...control._formValues, sections: { ...current, [sectionName]: entries } }
        }}
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
