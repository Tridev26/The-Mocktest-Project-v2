export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  unit?: string;
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface QuestionBank {
  id: string;
  name: string;
  description?: string;
  uploaded_by: string;
  created_at: string;
  question_count: number;
  questions: Question[];
  is_default?: boolean;
}

export interface AttemptQuestion {
  id: string;
  question_id: string;
  question_order: number;
  question_text: string;
  options: QuestionOption[];
  user_answer: 'A' | 'B' | 'C' | 'D' | null;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  time_spent: number; // in seconds
  marked_for_review: boolean;
  visited: boolean;
  explanation?: string;
  unit?: string;
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface TestAttempt {
  id: string;
  user_id: string;
  question_bank_id: string;
  question_bank_name: string;
  started_at: string;
  completed_at: string;
  total_questions: number; // exactly 50
  marks_per_correct: number;
  negative_marks_per_incorrect: number;
  score: number;
  max_score: number;
  percentage: number;
  accuracy: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  time_used_seconds: number;
  attempt_questions: AttemptQuestion[];
}

export interface ActiveTestSession {
  id: string;
  question_bank_id: string;
  question_bank_name: string;
  started_at: number; // timestamp ms
  duration_seconds: number; // 3600
  remaining_seconds: number;
  current_index: number;
  attempt_questions: AttemptQuestion[];
  marks_per_correct: number;
  negative_marks_per_incorrect: number;
  last_tick_timestamp: number;
}

export interface MarkingSchemeConfig {
  marks_per_correct: number;
  negative_marks_per_incorrect: number;
  test_duration_minutes: number;
  questions_per_test: number;
}

export interface ParseValidationResult {
  valid: Question[];
  invalid: {
    row: number;
    rawText?: string;
    reason: string;
  }[];
  duplicates: Question[];
  totalParsed: number;
}

export interface UserProfile {
  name: string;
  email: string;
  rollNumber: string;
  targetExam: string;
  category: string;
  targetScore: number;
  preparationStartDate?: string;
  avatarUrl?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isLoggedIn: boolean;
  provider: 'google';
  loginTimestamp?: number;
}
