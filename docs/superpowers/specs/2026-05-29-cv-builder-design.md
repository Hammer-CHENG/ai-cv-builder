# CV Builder MVP — Design Spec

## Overview

AI-powered resume builder for Hong Kong job seekers. User builds a master profile (experience, education, skills), pastes a JD, and gets a tailored CV with cover letter + interview questions. Changes are logged for future memory system. ATS-friendly PDF output.

**Target users:** Hong Kong students (internships), fresh grads, 3-5 year professionals — mid-to-high income, batch applying.

**Core value:** Lowers the cognitive barrier of JD-matching; saves repetitive editing; ATS-passing format.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              React SPA (Vite + TS)               │
│  ┌────────────┐ ┌──────────┐ ┌────────────────┐ │
│  │Profile     │ │JD Session│ │Review + Preview │ │
│  │Builder     │ │Panel     │ │(CV + Sidebar)   │ │
│  └────────────┘ └──────────┘ └────────────────┘ │
└─────────────────────┬───────────────────────────┘
                      │ REST (JWT-authenticated)
┌─────────────────────▼───────────────────────────┐
│              FastAPI Backend                     │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │Resume   │ │LLM       │ │PDF Generation     │ │
│  │CRUD     │ │Orchestr. │ │(Jinja2+WeasyPrint)│ │
│  └─────────┘ └──────────┘ └──────────────────┘ │
│  ┌─────────────────┐ ┌───────────────────────┐  │
│  │Edit Log Tracker │ │Prompt Manager          │  │
│  │(diff capture)   │ │(versioned templates)   │  │
│  └─────────────────┘ └───────────────────────┘  │
└─────────────────────┬───────────────────────────┘
                      │ asyncpg
┌─────────────────────▼───────────────────────────┐
│              Supabase (PostgreSQL)               │
│  users | resumes | edit_logs | prompt_versions   │
│  jd_sessions                                     │
└──────────────────────────────────────────────────┘
```

---

## Data Model

### users
- `id` (UUID, PK) — Supabase auth user ID
- `email` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `memory` (JSONB, default `{}`) — Reserved for V1.1 preference tags

### resumes
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `profile_json` (JSONB) — Master profile: all sections (contact, education, work, projects, custom)
- `created_at` / `updated_at` (TIMESTAMPTZ)

### jd_sessions
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `resume_id` (UUID, FK → resumes)
- `jd_text` (TEXT) — Raw JD pasted by user
- `tailored_cv_json` (JSONB) — LLM-generated tailored CV
- `match_score` (INTEGER, 0-100)
- `llm_annotations` (JSONB) — why_changed per section, interview_questions, cover_letter
- `user_rating` (INTEGER, 1-5, nullable) — User feedback on usefulness
- `created_at` (TIMESTAMPTZ)

### edit_logs
- `id` (UUID, PK)
- `user_id` (UUID, FK → users)
- `jd_session_id` (UUID, FK → jd_sessions, nullable)
- `original_json` (JSONB) — LLM output before user edits
- `edited_json` (JSONB) — User's final version
- `diff` (JSONB) — Structured diff (field-level changes)
- `created_at` (TIMESTAMPTZ)

### prompt_versions
- `id` (UUID, PK)
- `prompt_name` (TEXT) — e.g., "tailor_cv", "match_scoring"
- `version` (INTEGER)
- `content` (TEXT) — Prompt template body
- `status` (TEXT) — draft | active
- `created_at` (TIMESTAMPTZ)

**Relationship:** `resumes` 1:N `jd_sessions`. Master profile is never modified by JD sessions; sessions produce independent outputs.

### Supabase Auth → public.users Sync
Supabase writes new users to `auth.users` (protected schema), not `public.users`. A PostgreSQL trigger in `001_initial_schema.sql` auto-creates the `public.users` row:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (new.id, new.email, new.created_at);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## API Endpoints

### Auth
All endpoints require `Authorization: Bearer <supabase-jwt>`. JWT validated via FastAPI dependency.

### Resume (Master Profile)
- `POST /api/resumes` — Create master profile (enforced single per user via `UNIQUE(user_id)` constraint on `resumes` table)
- `GET /api/resumes` — Get user's master profile
- `PUT /api/resumes/{id}` — Update master profile (section-level or full replace)
- `POST /api/resumes/{id}/sections` — Add a new section to profile

### JD Sessions
- `POST /api/jd-sessions` — Start new JD tailoring session
  - Input: `{ resume_id, jd_text }`
  - Triggers: LLM tailoring → returns `tailored_cv_json`, `match_score`, `annotations`
- `GET /api/jd-sessions` — List user's JD sessions (chronological)
- `GET /api/jd-sessions/{id}` — Get single session detail

### Edit Logs
- `POST /api/edit-logs` — Log user modifications (triggered on Save/Next)
  - Input: `{ jd_session_id, original_json, edited_json }`
  - Backend computes diff server-side

### Export
- `POST /api/export/pdf` — Generate ATS-friendly PDF
  - Input: `{ cv_json }` (can be from jd_sessions or master profile)
  - Returns: PDF binary download
  - Sync with loading state on frontend

### Feedback
- `POST /api/jd-sessions/{id}/rate` — User rates session usefulness (1-5)

---

## LLM Integration

### Provider: Qwen (OpenAI-compatible API)

### Prompt Templates (stored in `prompts/` directory + `prompt_versions` DB)
- `tailor_cv.txt` — Tailor CV to JD. Input: master profile JSON + JD text. Output: tailored CV JSON + why_changed annotations
- `cover_letter.txt` — Generate cover letter. Input: tailored CV JSON + JD text
- `interview_questions.txt` — Generate 3 JD-based + 2 CV-based questions
- `match_scoring.txt` — Score CV-JD match percentage

### Output Constraints
- Strict JSON Schema via `response_format` parameter
- Pydantic validation on backend
- Retry once on format failure
- **Timeout:** Backend LLM client timeout = 45s. Frontend fetch timeout = 60s. Prevents gateway/Nginx from killing the connection prematurely.

### Memory System (MVP: Data Collection Only)
- **No LLM inference** during MVP phase
- Edit diffs captured and stored in `edit_logs`
- Hardcoded system preferences injected into prompt:
  - "Always use strong action verbs"
  - "Keep output to single page where possible"
  - "Maintain ATS-friendly structure"
- V1.1: LLM analyzes edit_logs → generates preference tags → aggregates into system rules

---

## Frontend

### Stack
- React 18 + TypeScript
- Vite
- react-router (navigation)
- react-hook-form (dynamic form handling)
- Custom components (no heavy UI framework)

### Pages

**1. Profile Builder**
- Hybrid section form: pre-built templates (Education, Work, Projects, Certifications, Skills, Languages) + "Add Custom Section"
- Each section type has its own field schema (dates for Education, company+title for Work, etc.)
- Sections are repeatable (add/remove entries)
- Save button persists to backend

**2. JD Session Panel**
- Text area for pasting JD
- "Tailor My CV" button → triggers LLM call → transitions to Review page
- Session history list (past JD sessions with match scores)

**3. Review + Preview**
- **Center:** Full CV preview in warm theme (serif accents, warm neutrals, amber highlights on changed sections)
- **Right sidebar:** Change summary list with amber dots. Each item shows "why changed" explanation from `llm_annotations`. Click scrolls to section.
- **Inline editing:** User can edit any section directly in the preview
- **Bottom bar:** "Generate Cover Letter" | "Generate Interview Questions" | "Export PDF"
- **Best Practice Tips (MVP):** Static tooltips powered by `llm_annotations`, not user history. Example: hovering on a changed bullet shows "AI emphasized leadership — JD requires team management experience". True personalized Memory Hints deferred to V1.1.

### Visual Theme
- CSS variables for warm palette: cream backgrounds (`#fffef5`), warm gold accents (`#d4a574`, `#8b6914`), sage green for positive states (`#6b8e23`)
- Serif display font for headings, clean sans-serif for body
- Generous whitespace, editorial typography feel
- Amber (`#fde68a`) for LLM-highlighted changes

---

## PDF Generation

### Technology: Jinja2 + WeasyPrint
### ATS Compliance Rules
- Single-column layout only (no float/grid/flex in output)
- Standard fonts: Arial, Helvetica, sans-serif
- No images, icons, tables, or background colors
- Semantic HTML: `<h1>` name, `<h2>` sections, `<ul>/<li>` for bullets
- A4 page size, 0.8in margins

### Flow
1. Final CV JSON → Jinja2 template renders HTML
2. WeasyPrint converts HTML → PDF
3. Sync response with frontend loading spinner
4. If timeout > 10s, fallback to BackgroundTasks + polling (V1.1)

---

## Auth

### Supabase Auth
- Frontend: `@supabase/supabase-js` for signup/login/reset-password
- Backend: `dependencies.py` with `get_current_user()` that validates JWT from Authorization header
- No auth routes in FastAPI — Supabase handles it entirely

---

## Error Handling

- LLM failure: retry once, show user-friendly error ("AI is thinking... let's try again")
- JSON Schema violation: auto-retry with stricter prompt
- PDF timeout: loading state → timeout message → retry option
- Auth failure: redirect to login

---

## File Structure

```
cv-builder/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── dependencies.py              # Supabase JWT validation
│   ├── models/
│   │   ├── resume.py
│   │   ├── jd_session.py
│   │   ├── edit_log.py
│   │   └── memory.py
│   ├── routes/
│   │   ├── resume.py
│   │   ├── jd.py
│   │   ├── export.py
│   │   └── edit_log.py
│   ├── services/
│   │   ├── llm_service.py           # Qwen orchestration + JSON parsing
│   │   ├── pdf_service.py           # WeasyPrint rendering
│   │   └── diff_service.py          # jsondiffpatch computation
│   ├── prompts/
│   │   ├── tailor_cv.txt
│   │   ├── cover_letter.txt
│   │   ├── interview_questions.txt
│   │   └── match_scoring.txt
│   ├── templates/
│   │   └── cv_ats.html              # Jinja2 ATS-compliant template
│   ├── utils/
│   │   ├── json_diff.py
│   │   └── text_cleaner.py
│   └── tests/
│       ├── conftest.py
│       └── test_jd_tailoring.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── api/
│       │   └── client.ts            # Supabase-authenticated fetch
│       ├── pages/
│       │   ├── ProfileBuilder.tsx
│       │   ├── JDSession.tsx
│       │   └── ReviewPreview.tsx
│       ├── components/
│       │   ├── SectionForm.tsx       # Dynamic section renderer
│       │   ├── CVPreview.tsx         # Warm-themed CV display
│       │   ├── ChangeSidebar.tsx     # Amber change indicators
│       │   ├── MemoryHint.tsx        # Static best-practice tooltip
│       │   └── LoadingSpinner.tsx
│       └── styles/
│           ├── theme.css             # Warm theme CSS variables
│           └── components.css
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .devcontainer/                    # Docker dev env for WeasyPrint C deps
│   ├── devcontainer.json
│   └── Dockerfile
├── docker-compose.yml                # Backend + frontend services
├── pyproject.toml
└── package.json                      # Workspace root (optional)
```

### Local Development Environment
WeasyPrint depends on C libraries (Pango, Cairo, GDK-PixBuf) that are painful to configure on Windows. **Use Dev Containers / Docker Compose** for local development — run FastAPI inside a Linux container to avoid native dependency issues. The `.devcontainer/` and `docker-compose.yml` are included from day one.
