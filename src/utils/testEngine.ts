import { Question, QuestionBank, AttemptQuestion, TestAttempt, MarkingSchemeConfig, QuestionOption } from '../types';

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

// Generate exactly 50 questions
export function generateTestQuestions(bank: QuestionBank, count: number = 50): AttemptQuestion[] {
  if (bank.questions.length < count) {
    throw new Error(`This question bank contains only ${bank.questions.length} questions, but ${count} are required.`);
  }

  // Shuffle all bank questions and take exactly `count` questions
  const selectedQuestions = shuffleArray(bank.questions).slice(0, count);

  return selectedQuestions.map((q, index) => {
    const { options, correctAnswer } = shuffleOptions(q);
    return {
      id: `att-q-${index + 1}-${q.id}`,
      question_id: q.id,
      question_order: index + 1,
      question_text: q.question_text,
      options,
      user_answer: null,
      correct_answer: correctAnswer,
      is_correct: false,
      time_spent: 0,
      marked_for_review: false,
      visited: index === 0, // first question marked visited initially
      explanation: q.explanation,
      unit: q.unit || 'General Paper I',
      topic: q.topic || 'General',
      difficulty: q.difficulty || 'Medium',
    };
  });
}

// Calculate scores and metrics for a completed test
export function evaluateTest(
  attemptQuestions: AttemptQuestion[],
  bankId: string,
  bankName: string,
  startedAt: string,
  timeUsedSeconds: number,
  config: MarkingSchemeConfig
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
  // Ensure score doesn't display weird floating-point precision issues
  const score = Math.round(rawScore * 100) / 100;
  const maxScore = attemptQuestions.length * config.marks_per_correct;
  const attemptedCount = correctCount + incorrectCount;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 1000) / 10 : 0;
  const percentage = maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 1000) / 10) : 0;

  return {
    id: `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: 'candidate-current',
    question_bank_id: bankId,
    question_bank_name: bankName,
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
  };
}

export interface UnitStat {
  unit: string;
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
}

export function computeUnitStatistics(attemptQuestions: AttemptQuestion[]): UnitStat[] {
  const map = new Map<string, { total: number; attempted: number; correct: number; incorrect: number; unattempted: number }>();

  attemptQuestions.forEach(q => {
    const unitName = q.unit || 'General';
    if (!map.has(unitName)) {
      map.set(unitName, { total: 0, attempted: 0, correct: 0, incorrect: 0, unattempted: 0 });
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
    total: data.total,
    attempted: data.attempted,
    correct: data.correct,
    incorrect: data.incorrect,
    unattempted: data.unattempted,
    accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0,
  })).sort((a, b) => b.total - a.total);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDetailedTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}
