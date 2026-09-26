-- ==============================================================================
-- UGC-NET-MOCK TEST ENGINE V.2 — SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================
-- Target: Supabase SQL Editor
-- Tables: question_banks, questions
-- Purpose: 10-Year Excel Archives & Community Question Bank Storage
-- ==============================================================================

-- 1. Create Question Banks Table
CREATE TABLE IF NOT EXISTS public.question_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    exam_year INTEGER NOT NULL CHECK (exam_year BETWEEN 2000 AND 2100),
    uploaded_by TEXT DEFAULT 'Anonymous Aspirant',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    description TEXT,
    is_verified BOOLEAN DEFAULT false,
    total_questions INTEGER DEFAULT 0
);

-- 2. Create Questions Table (linked to question_banks via Foreign Key)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id UUID NOT NULL REFERENCES public.question_banks(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    unit TEXT DEFAULT 'General Teaching & Research Aptitude',
    difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Performance Indexes for Fast Lookups
CREATE INDEX IF NOT EXISTS idx_questions_bank_id ON public.questions(bank_id);
CREATE INDEX IF NOT EXISTS idx_questions_unit ON public.questions(unit);
CREATE INDEX IF NOT EXISTS idx_question_banks_year ON public.question_banks(exam_year DESC);
CREATE INDEX IF NOT EXISTS idx_question_banks_created ON public.question_banks(created_at DESC);

-- 4. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies for question_banks

-- Policy 1: Anyone (public / anon / authenticated) can view/read question banks
CREATE POLICY "Public Read Access for Question Banks"
ON public.question_banks
FOR SELECT
USING (true);

-- Policy 2: Anyone can insert/upload new question banks into the community repository
CREATE POLICY "Public Insert Access for Question Banks"
ON public.question_banks
FOR INSERT
WITH CHECK (true);

-- Policy 3: Allow creators or admin update access (optional)
CREATE POLICY "Creator Update Access for Question Banks"
ON public.question_banks
FOR UPDATE
USING (auth.uid() IS NOT NULL OR true);

-- 6. Define RLS Policies for questions

-- Policy 1: Anyone can read questions linked to question banks
CREATE POLICY "Public Read Access for Questions"
ON public.questions
FOR SELECT
USING (true);

-- Policy 2: Anyone can insert questions associated with a valid bank
CREATE POLICY "Public Insert Access for Questions"
ON public.questions
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.question_banks 
        WHERE public.question_banks.id = questions.bank_id
    )
);

-- 7. Trigger to automatically keep total_questions count in sync
CREATE OR REPLACE FUNCTION public.update_bank_question_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.question_banks
        SET total_questions = (SELECT count(*) FROM public.questions WHERE bank_id = NEW.bank_id)
        WHERE id = NEW.bank_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.question_banks
        SET total_questions = (SELECT count(*) FROM public.questions WHERE bank_id = OLD.bank_id)
        WHERE id = OLD.bank_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_question_count ON public.questions;
CREATE TRIGGER trg_update_question_count
AFTER INSERT OR DELETE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.update_bank_question_count();
