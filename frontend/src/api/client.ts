import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

const API_BASE = '/api'
const FETCH_TIMEOUT = 60000 // 60s for LLM calls

async function authenticatedFetch(path: string, options: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      signal: controller.signal,
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }
    if (response.headers.get('content-type')?.includes('application/pdf')) {
      return response.blob()
    }
    return response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

export const api = {
  resume: {
    get: () => authenticatedFetch('/resumes/'),
    create: (profile_json: object) => authenticatedFetch('/resumes/', {
      method: 'POST',
      body: JSON.stringify({ profile_json }),
    }),
    update: (id: string, profile_json: object) => authenticatedFetch(`/resumes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ profile_json }),
    }),
    addSection: (id: string, section_name: string, entries: object[]) =>
      authenticatedFetch(`/resumes/${id}/sections`, {
        method: 'POST',
        body: JSON.stringify({ section_name, entries }),
      }),
  },
  jdSessions: {
    create: (resume_id: string, jd_text: string) => authenticatedFetch('/jd-sessions/', {
      method: 'POST',
      body: JSON.stringify({ resume_id, jd_text }),
    }),
    list: () => authenticatedFetch('/jd-sessions/'),
    get: (id: string) => authenticatedFetch(`/jd-sessions/${id}`),
    rate: (id: string, rating: number) => authenticatedFetch(`/jd-sessions/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    }),
  },
  editLog: {
    create: (jd_session_id: string | null, original_json: object, edited_json: object) =>
      authenticatedFetch('/edit-logs/', {
        method: 'POST',
        body: JSON.stringify({ jd_session_id, original_json, edited_json }),
      }),
  },
  export: {
    pdf: (cv_json: object) => authenticatedFetch('/export/pdf', {
      method: 'POST',
      body: JSON.stringify({ cv_json }),
    }),
  },
}
