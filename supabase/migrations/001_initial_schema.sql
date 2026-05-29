-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from auth.users via trigger)
CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    memory JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master resume (one per user)
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- JD tailoring sessions (many per resume)
CREATE TABLE public.jd_sessions (
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

-- Edit logs (captures user modifications for future memory system)
CREATE TABLE public.edit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    jd_session_id UUID REFERENCES public.jd_sessions(id) ON DELETE SET NULL,
    original_json JSONB NOT NULL,
    edited_json JSONB NOT NULL,
    diff JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt versions (versioned LLM prompt templates)
CREATE TABLE public.prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(prompt_name, version)
);

-- Indexes for common queries
CREATE INDEX idx_jd_sessions_user ON public.jd_sessions(user_id, created_at DESC);
CREATE INDEX idx_jd_sessions_resume ON public.jd_sessions(resume_id);
CREATE INDEX idx_edit_logs_user ON public.edit_logs(user_id, created_at DESC);

-- Auto-create public.user row when auth.users gets a new signup
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

-- Seed prompt templates as version 1, active
INSERT INTO public.prompt_versions (prompt_name, version, content, status) VALUES
('tailor_cv', 1, '', 'active'),
('cover_letter', 1, '', 'active'),
('interview_questions', 1, '', 'active'),
('match_scoring', 1, '', 'active');
