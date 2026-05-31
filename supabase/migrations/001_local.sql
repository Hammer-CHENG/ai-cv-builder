CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    memory JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.jd_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    jd_text TEXT NOT NULL,
    tailored_cv_json JSONB NOT NULL DEFAULT '{}',
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    llm_annotations JSONB DEFAULT '{}',
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.edit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    jd_session_id UUID REFERENCES public.jd_sessions(id) ON DELETE SET NULL,
    original_json JSONB NOT NULL,
    edited_json JSONB NOT NULL,
    diff JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(prompt_name, version)
);

CREATE INDEX IF NOT EXISTS idx_jd_sessions_user ON public.jd_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jd_sessions_resume ON public.jd_sessions(resume_id);
CREATE INDEX IF NOT EXISTS idx_edit_logs_user ON public.edit_logs(user_id, created_at DESC);

INSERT INTO public.prompt_versions (prompt_name, version, content, status) VALUES
('tailor_cv', 1, '', 'active'),
('cover_letter', 1, '', 'active'),
('interview_questions', 1, '', 'active'),
('match_scoring', 1, '', 'active')
ON CONFLICT (prompt_name, version) DO NOTHING;
