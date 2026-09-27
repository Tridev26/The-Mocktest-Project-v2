export type PaperType = 'paper1' | 'paper2';

export type TestPaperMode = 'paper1' | 'paper2' | 'paper1_paper2';

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
  paper_type?: PaperType;
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
  paper_type?: PaperType;
  subject?: string;
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
  paper_type?: PaperType;
  section_index?: number; // 0 for Section 1, 1 for Section 2
  section_name?: string;
}

export interface SectionSummary {
  section_index: number;
  name: string;
  paper_type: PaperType;
  total_questions: number;
  score: number;
  max_score: number;
  percentage: number;
  accuracy: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  time_spent_seconds?: number;
}

export interface TestAttempt {
  id: string;
  user_id: string;
  paper_mode?: TestPaperMode;
  question_bank_id: string;
  question_bank_name: string;
  paper2_bank_id?: string;
  paper2_bank_name?: string;
  started_at: string;
  completed_at: string;
  total_questions: number; // 50, 100, or 150
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
  sections?: SectionSummary[];
}

export interface ActiveTestSession {
  id: string;
  paper_mode: TestPaperMode;
  question_bank_id: string;
  question_bank_name: string;
  paper2_bank_id?: string;
  paper2_bank_name?: string;
  started_at: number; // timestamp ms
  duration_seconds: number; // 3600, 7200, or 10800
  remaining_seconds: number;
  current_index: number;
  attempt_questions: AttemptQuestion[];
  marks_per_correct: number;
  negative_marks_per_incorrect: number;
  last_tick_timestamp: number;
  active_section_tab?: number; // 0 or 1
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

export interface PaperModeDetails {
  mode: TestPaperMode;
  title: string;
  subtitle: string;
  durationMinutes: number;
  durationLabel: string;
  questionCount: number;
  marksPerQuestion: number;
  maxMarks: number;
  sectionsCount: number;
  sectionNames: string[];
}

export const PAPER_MODE_DETAILS: Record<TestPaperMode, PaperModeDetails> = {
  paper1: {
    mode: 'paper1',
    title: 'Paper-I Only',
    subtitle: 'General Paper on Teaching & Research Aptitude',
    durationMinutes: 60,
    durationLabel: '1 Hour',
    questionCount: 50,
    marksPerQuestion: 2,
    maxMarks: 100,
    sectionsCount: 1,
    sectionNames: ['Section 1: Paper-I (General Aptitude)'],
  },
  paper2: {
    mode: 'paper2',
    title: 'Paper-II Only',
    subtitle: 'Subject Specific Comprehensive Paper',
    durationMinutes: 120,
    durationLabel: '2 Hours',
    questionCount: 100,
    marksPerQuestion: 2,
    maxMarks: 200,
    sectionsCount: 1,
    sectionNames: ['Section 1: Paper-II (Subject Specialization)'],
  },
  paper1_paper2: {
    mode: 'paper1_paper2',
    title: 'Paper-I + Paper-II Combined',
    subtitle: 'Full NTA Mock Simulation (Two Sections)',
    durationMinutes: 180,
    durationLabel: '3 Hours',
    questionCount: 150,
    marksPerQuestion: 2,
    maxMarks: 300,
    sectionsCount: 2,
    sectionNames: [
      'Section 1: Paper-I (50 Questions)',
      'Section 2: Paper-II (100 Questions)',
    ],
  },
};
