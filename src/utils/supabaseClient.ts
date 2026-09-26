import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable retrieval
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Checks if Supabase credentials have been configured in environment variables.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('http') && 
    !supabaseUrl.includes('your-project-id')
  );
};

// Singleton Supabase Client instance (safe initialization even with placeholder values)
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Database Interfaces
export interface DbQuestionBank {
  id: string;
  name: string;
  exam_year: number;
  uploaded_by: string;
  created_at: string;
  description?: string;
  is_verified?: boolean;
  total_questions?: number;
}

export interface DbQuestion {
  id?: string;
  bank_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  unit?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  created_at?: string;
}

export interface InsertBankParams {
  name: string;
  exam_year: number;
  uploaded_by?: string;
  description?: string;
}

export interface ParsedExcelQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  unit?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

/**
 * Two-Step Database Insert Function:
 * 1. Inserts the bank details (name, year, uploader) into question_banks table and returns the generated UUID.
 * 2. Inserts all parsed questions into the questions table using that generated bank_id.
 */
export async function insertQuestionBankWithQuestions(
  bankDetails: InsertBankParams,
  questionsList: ParsedExcelQuestion[]
): Promise<{ success: boolean; bankId?: string; count?: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase credentials are not configured in .env (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).',
    };
  }

  try {
    // Step 1: Insert parent question_bank
    const { data: bankData, error: bankError } = await supabase
      .from('question_banks')
      .insert({
        name: bankDetails.name.trim(),
        exam_year: Number(bankDetails.exam_year),
        uploaded_by: (bankDetails.uploaded_by || 'Anonymous Aspirant').trim(),
        description: bankDetails.description || `UGC-NET 10-Year Archive (${bankDetails.exam_year})`,
        total_questions: questionsList.length,
      })
      .select('id, name, exam_year')
      .single();

    if (bankError || !bankData) {
      console.error('Failed to insert question_banks record:', bankError);
      return {
        success: false,
        error: `Step 1 Failed (Bank Insertion): ${bankError?.message || 'Unknown database error'}`,
      };
    }

    const generatedBankId = bankData.id;

    // Step 2: Prepare questions batch with foreign key bank_id
    const questionsPayload: DbQuestion[] = questionsList.map((q) => ({
      bank_id: generatedBankId,
      question_text: q.question_text.trim(),
      option_a: q.option_a.trim(),
      option_b: q.option_b.trim(),
      option_c: q.option_c.trim(),
      option_d: q.option_d.trim(),
      correct_answer: q.correct_answer,
      explanation: q.explanation?.trim() || 'No detailed explanation provided for this question.',
      unit: q.unit?.trim() || 'General Teaching & Research Aptitude',
      difficulty: q.difficulty || 'Medium',
    }));

    // Step 3: Insert question rows into questions table in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < questionsPayload.length; i += chunkSize) {
      const chunk = questionsPayload.slice(i, i + chunkSize);
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(chunk);

      if (questionsError) {
        console.error('Failed to insert questions batch:', questionsError);
        // Attempt cleanup of orphan bank record if insertion fails
        await supabase.from('question_banks').delete().eq('id', generatedBankId);
        return {
          success: false,
          error: `Step 2 Failed (Questions Insertion): ${questionsError.message}`,
        };
      }
    }

    return {
      success: true,
      bankId: generatedBankId,
      count: questionsPayload.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Network/Database exception: ${message}`,
    };
  }
}

/**
 * Fetch all available community question banks from Supabase
 */
export async function fetchCommunityQuestionBanks(): Promise<{ data: DbQuestionBank[]; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Supabase is not configured' };
  }

  const { data, error } = await supabase
    .from('question_banks')
    .select('*')
    .order('exam_year', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as DbQuestionBank[] };
}

/**
 * Fetch questions for a specific bank
 */
export async function fetchBankQuestions(bankId: string): Promise<{ data: DbQuestion[]; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Supabase is not configured' };
  }

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('bank_id', bankId);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data as DbQuestion[] };
}
