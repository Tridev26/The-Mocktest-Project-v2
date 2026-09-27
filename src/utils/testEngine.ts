import { 
  Question, 
  QuestionBank, 
  AttemptQuestion, 
  TestAttempt, 
  MarkingSchemeConfig, 
  QuestionOption,
  TestPaperMode,
  PaperType,
  SectionSummary
} from '../types';

// Standard Fisher-Yates shuffle
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Randomize question options and rebind correct answer
export function shuffleOptions(question: Question): { options: QuestionOption[]; correctAnswer: 'A' | 'B' | 'C' | 'D' } {
  const originalOptions: { originalKey: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
    { originalKey: 'A', text: question.option_a },
    { originalKey: 'B', text: question.option_b },
    { originalKey: 'C', text: question.option_c },
    { originalKey: 'D', text: question.option_d },
  ];

  const shuffled = shuffleArray(originalOptions);
  const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  const options: QuestionOption[] = [];
  let newCorrectAnswer: 'A' | 'B' | 'C' | 'D' = 'A';

  shuffled.forEach((item, idx) => {
    const newKey = keys[idx];
    options.push({
      key: newKey,
      text: item.text,
    });
    if (item.originalKey === question.correct_answer) {
      newCorrectAnswer = newKey;
    }
  });

  return { options, correctAnswer: newCorrectAnswer };
}

// Generate questions from a specific bank with configurable count and metadata
export function generateTestQuestions(
  bank: QuestionBank, 
  count: number = 50,
  paperType: PaperType = 'paper1',
  sectionIndex: number = 0,
  sectionName: string = 'Section 1: Paper-I (General)',
  startOrder: number = 1
): AttemptQuestion[] {
  if (bank.questions.length < count) {
    throw new Error(`This question bank (${bank.name}) contains only ${bank.questions.length} questions, but ${count} are required.`);
  }

  // Shuffle all bank questions and take exactly `count` questions
  const selectedQuestions = shuffleArray(bank.questions).slice(0, count);

  return selectedQuestions.map((q, index) => {
    const currentOrder = startOrder + index;
    const { options, correctAnswer } = shuffleOptions(q);
    return {
      id: `att-q-${currentOrder}-${q.id}`,
      question_id: q.id,
      question_order: currentOrder,
      question_text: q.question_text,
      options,
      user_answer: null,
      correct_answer: correctAnswer,
      is_correct: false,
      time_spent: 0,
      marked_for_review: false,
      visited: currentOrder === 1, // first question marked visited initially
      explanation: q.explanation,
      unit: q.unit || (paperType === 'paper2' ? 'Computer Science Subject' : 'General Paper I'),
      topic: q.topic || 'General',
      difficulty: q.difficulty || 'Medium',
      paper_type: paperType,
      section_index: sectionIndex,
      section_name: sectionName,
    };
  });
}

/**
 * Generate test questions according to the selected Paper Mode:
 * - paper1: Exactly 50 questions (One Section)
 * - paper2: Exactly 100 questions (One Section)
 * - paper1_paper2: Exactly 150 questions (Two Sections: 50 for Paper-I + 100 for Paper-II)
 */
export function generatePaperModeQuestions(
  mode: TestPaperMode,
  paper1Bank?: QuestionBank,
  paper2Bank?: QuestionBank
): AttemptQuestion[] {
  if (mode === 'paper1') {
    if (!paper1Bank) throw new Error('Paper-I question bank is required.');
    return generateTestQuestions(
      paper1Bank, 
      50, 
      'paper1', 
      0, 
      'Section 1: Paper-I (General Aptitude)', 
      1
    );
  }

  if (mode === 'paper2') {
    if (!paper2Bank) throw new Error('Paper-II question bank is required.');
    return generateTestQuestions(
      paper2Bank, 
      100, 
      'paper2', 
      0, 
      'Section 1: Paper-II (Subject Specialization)', 
      1
    );
  }

  if (mode === 'paper1_paper2') {
    if (!paper1Bank) throw new Error('Paper-I question bank is required for combined test.');
    if (!paper2Bank) throw new Error('Paper-II question bank is required for combined test.');

    const section1Qs = generateTestQuestions(
      paper1Bank, 
      50, 
      'paper1', 
      0, 
      'Section 1: Paper-I (General Aptitude)', 
      1
    );

    const section2Qs = generateTestQuestions(
      paper2Bank, 
      100, 
      'paper2', 
      1, 
      'Section 2: Paper-II (Subject Specialization)', 
      51
    );

    return [...section1Qs, ...section2Qs];
  }

  throw new Error(`Unsupported paper mode: ${mode}`);
}

// Calculate scores and metrics for a completed test
export function evaluateTest(
  attemptQuestions: AttemptQuestion[],
  bankId: string,
  bankName: string,
  startedAt: string,
  timeUsedSeconds: number,
  config: MarkingSchemeConfig,
  paperMode: TestPaperMode = 'paper1',
  paper2BankId?: string,
  paper2BankName?: string
): TestAttempt {
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  const evaluatedQuestions = attemptQuestions.map(q => {
    const isCorrect = q.user_answer !== null && q.user_answer === q.correct_answer;
    if (q.user_answer === null) {
      unattemptedCount++;
    } else if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }
    return {
      ...q,
      is_correct: isCorrect,
    };
  });

  const rawScore = (correctCount * config.marks_per_correct) - (incorrectCount * config.negative_marks_per_incorrect);
  const score = Math.round(rawScore * 100) / 100;
  const maxScore = attemptQuestions.length * config.marks_per_correct;
  const attemptedCount = correctCount + incorrectCount;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 1000) / 10 : 0;
  const percentage = maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 1000) / 10) : 0;

  // Build section summaries
  const sections: SectionSummary[] = [];

  if (paperMode === 'paper1_paper2') {
    // Section 1: Paper I (first 50 or paper_type === 'paper1')
    const s1Questions = evaluatedQuestions.filter(q => q.paper_type === 'paper1' || (q.section_index === 0 && q.question_order <= 50));
    const s1Correct = s1Questions.filter(q => q.is_correct).length;
    const s1Incorrect = s1Questions.filter(q => q.user_answer !== null && !q.is_correct).length;
    const s1Unattempted = s1Questions.filter(q => q.user_answer === null).length;
    const s1RawScore = (s1Correct * config.marks_per_correct) - (s1Incorrect * config.negative_marks_per_incorrect);
    const s1MaxScore = s1Questions.length * config.marks_per_correct;
    const s1Attempted = s1Correct + s1Incorrect;
    const s1Accuracy = s1Attempted > 0 ? Math.round((s1Correct / s1Attempted) * 1000) / 10 : 0;
    const s1Percentage = s1MaxScore > 0 ? Math.max(0, Math.round((s1RawScore / s1MaxScore) * 1000) / 10) : 0;
    const s1TimeSpent = s1Questions.reduce((acc, q) => acc + (q.time_spent || 0), 0);

    sections.push({
      section_index: 0,
      name: 'Section 1: Paper-I (General Aptitude)',
      paper_type: 'paper1',
      total_questions: s1Questions.length,
      score: Math.round(s1RawScore * 100) / 100,
      max_score: s1MaxScore,
      percentage: s1Percentage,
      accuracy: s1Accuracy,
      correct_count: s1Correct,
      incorrect_count: s1Incorrect,
      unattempted_count: s1Unattempted,
      time_spent_seconds: s1TimeSpent,
    });

    // Section 2: Paper II (remaining 100 or paper_type === 'paper2')
    const s2Questions = evaluatedQuestions.filter(q => q.paper_type === 'paper2' || (q.section_index === 1 || q.question_order > 50));
    const s2Correct = s2Questions.filter(q => q.is_correct).length;
    const s2Incorrect = s2Questions.filter(q => q.user_answer !== null && !q.is_correct).length;
    const s2Unattempted = s2Questions.filter(q => q.user_answer === null).length;
    const s2RawScore = (s2Correct * config.marks_per_correct) - (s2Incorrect * config.negative_marks_per_incorrect);
    const s2MaxScore = s2Questions.length * config.marks_per_correct;
    const s2Attempted = s2Correct + s2Incorrect;
    const s2Accuracy = s2Attempted > 0 ? Math.round((s2Correct / s2Attempted) * 1000) / 10 : 0;
    const s2Percentage = s2MaxScore > 0 ? Math.max(0, Math.round((s2RawScore / s2MaxScore) * 1000) / 10) : 0;
    const s2TimeSpent = s2Questions.reduce((acc, q) => acc + (q.time_spent || 0), 0);

    sections.push({
      section_index: 1,
      name: 'Section 2: Paper-II (Subject Specialization)',
      paper_type: 'paper2',
      total_questions: s2Questions.length,
      score: Math.round(s2RawScore * 100) / 100,
      max_score: s2MaxScore,
      percentage: s2Percentage,
      accuracy: s2Accuracy,
      correct_count: s2Correct,
      incorrect_count: s2Incorrect,
      unattempted_count: s2Unattempted,
      time_spent_seconds: s2TimeSpent,
    });
  } else {
    // Single Section
    const paperType: PaperType = paperMode === 'paper2' ? 'paper2' : 'paper1';
    const sectionName = paperMode === 'paper2' 
      ? 'Section 1: Paper-II (Subject Specialization)' 
      : 'Section 1: Paper-I (General Aptitude)';

    sections.push({
      section_index: 0,
      name: sectionName,
      paper_type: paperType,
      total_questions: evaluatedQuestions.length,
      score,
      max_score: maxScore,
      percentage,
      accuracy,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unattempted_count: unattemptedCount,
      time_spent_seconds: timeUsedSeconds,
    });
  }

  return {
    id: `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: 'candidate-current',
    paper_mode: paperMode,
    question_bank_id: bankId,
    question_bank_name: bankName,
    paper2_bank_id: paper2BankId,
    paper2_bank_name: paper2BankName,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    total_questions: attemptQuestions.length,
    marks_per_correct: config.marks_per_correct,
    negative_marks_per_incorrect: config.negative_marks_per_incorrect,
    score,
    max_score: maxScore,
    percentage,
    accuracy,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    unattempted_count: unattemptedCount,
    time_used_seconds: timeUsedSeconds,
    attempt_questions: evaluatedQuestions,
    sections,
  };
}

export interface UnitStat {
  unit: string;
  paperType?: PaperType;
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
}

export function computeUnitStatistics(attemptQuestions: AttemptQuestion[]): UnitStat[] {
  const map = new Map<string, { total: number; attempted: number; correct: number; incorrect: number; unattempted: number; paperType?: PaperType }>();

  attemptQuestions.forEach(q => {
    const unitName = q.unit || 'General';
    if (!map.has(unitName)) {
      map.set(unitName, { total: 0, attempted: 0, correct: 0, incorrect: 0, unattempted: 0, paperType: q.paper_type });
    }
    const stat = map.get(unitName)!;
    stat.total++;
    if (q.user_answer === null) {
      stat.unattempted++;
    } else if (q.is_correct) {
      stat.attempted++;
      stat.correct++;
    } else {
      stat.attempted++;
      stat.incorrect++;
    }
  });

  return Array.from(map.entries()).map(([unit, data]) => ({
    unit,
    paperType: data.paperType,
    total: data.total,
    attempted: data.attempted,
    correct: data.correct,
    incorrect: data.incorrect,
    unattempted: data.unattempted,
    accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0,
  })).sort((a, b) => b.total - a.total);
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDetailedTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    if (m === 0) return `${h}h ${s}s`;
    return `${h}h ${m}m ${s}s`;
  }
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}
