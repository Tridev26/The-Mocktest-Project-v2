import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  Check, 
  X, 
  HelpCircle,
  Menu,
  ShieldAlert,
  Send,
  Sparkles
} from 'lucide-react';
import { ActiveTestSession, AttemptQuestion } from '../types';
import { formatTime } from '../utils/testEngine';

interface ExamInterfaceProps {
  session: ActiveTestSession;
  onUpdateSession: (updated: ActiveTestSession) => void;
  onSubmitTest: (session: ActiveTestSession) => void;
}

export const ExamInterface: React.FC<ExamInterfaceProps> = ({
  session,
  onUpdateSession,
  onSubmitTest,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(session.current_index || 0);
  const [questions, setQuestions] = useState<AttemptQuestion[]>(session.attempt_questions);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(session.remaining_seconds);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);

  // Time spent tracker on current question
  const currentQStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);
  const warned15Ref = useRef<boolean>(session.remaining_seconds <= 900);
  const warned5Ref = useRef<boolean>(session.remaining_seconds <= 300);
  const warned1Ref = useRef<boolean>(session.remaining_seconds <= 60);

  // Synchronize state when question changes
  const recordQuestionTime = (fromIndex: number) => {
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - currentQStartTimeRef.current) / 1000));
    setQuestions(prev => {
      const copy = [...prev];
      if (copy[fromIndex]) {
        copy[fromIndex] = {
          ...copy[fromIndex],
          time_spent: (copy[fromIndex].time_spent || 0) + elapsedSeconds,
        };
      }
      return copy;
    });
    currentQStartTimeRef.current = Date.now();
  };

  // Main countdown timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleAutoSubmit();
          return 0;
        }

        const nextVal = prev - 1;

        // Warnings at 15m (900s), 5m (300s), 1m (60s)
        if (nextVal <= 900 && !warned15Ref.current) {
          warned15Ref.current = true;
          triggerWarning('15 minutes remaining! Review your unanswered questions.');
        } else if (nextVal <= 300 && !warned5Ref.current) {
          warned5Ref.current = true;
          triggerWarning('5 minutes remaining! Prepare for test submission.');
        } else if (nextVal <= 60 && !warned1Ref.current) {
          warned1Ref.current = true;
          triggerWarning('1 minute remaining! Test will automatically submit shortly.');
        }

        return nextVal;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const triggerWarning = (msg: string) => {
    setTimeWarning(msg);
    setTimeout(() => {
      setTimeWarning(null);
    }, 7000);
  };

  // Auto-submit when time reaches zero
  const handleAutoSubmit = () => {
    recordQuestionTime(currentIdx);
    setQuestions(currentQuestions => {
      const finalSession: ActiveTestSession = {
        ...session,
        remaining_seconds: 0,
        current_index: currentIdx,
        attempt_questions: currentQuestions,
        last_tick_timestamp: Date.now(),
      };
      onSubmitTest(finalSession);
      return currentQuestions;
    });
  };

  // Keep parent session updated for crash safety
  useEffect(() => {
    const updatedSession: ActiveTestSession = {
      ...session,
      current_index: currentIdx,
      remaining_seconds: remainingSeconds,
      attempt_questions: questions,
      last_tick_timestamp: Date.now(),
    };
    onUpdateSession(updatedSession);
  }, [currentIdx, questions, remainingSeconds]);

  // Navigate to target question
  const goToQuestion = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= questions.length || targetIdx === currentIdx) return;
    recordQuestionTime(currentIdx);

    setQuestions(prev => {
      const copy = [...prev];
      if (copy[targetIdx]) {
        copy[targetIdx] = {
          ...copy[targetIdx],
          visited: true,
        };
      }
      return copy;
    });

    setCurrentIdx(targetIdx);
    setPaletteOpen(false);
  };

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    setQuestions(prev => {
      const copy = [...prev];
      const q = copy[currentIdx];
      copy[currentIdx] = {
        ...q,
        user_answer: key,
        visited: true,
      };
      return copy;
    });
  };

  const handleClearAnswer = () => {
    setQuestions(prev => {
      const copy = [...prev];
      const q = copy[currentIdx];
      copy[currentIdx] = {
        ...q,
        user_answer: null,
      };
      return copy;
    });
  };

  const handleToggleReview = () => {
    setQuestions(prev => {
      const copy = [...prev];
      const q = copy[currentIdx];
      copy[currentIdx] = {
        ...q,
        marked_for_review: !q.marked_for_review,
        visited: true,
      };
      return copy;
    });
  };

  const handleSaveAndNext = () => {
    if (currentIdx < questions.length - 1) {
      goToQuestion(currentIdx + 1);
    }
  };

  const handleMarkAndNext = () => {
    handleToggleReview();
    if (currentIdx < questions.length - 1) {
      setTimeout(() => goToQuestion(currentIdx + 1), 50);
    }
  };

  const handleManualSubmitConfirm = () => {
    recordQuestionTime(currentIdx);
    setShowSubmitModal(false);
    const finalSession: ActiveTestSession = {
      ...session,
      remaining_seconds: remainingSeconds,
      current_index: currentIdx,
      attempt_questions: questions,
      last_tick_timestamp: Date.now(),
    };
    onSubmitTest(finalSession);
  };

  // Status counts for palette and modal
  let answeredCount = 0;
  let markedCount = 0;
  let markedAndAnsweredCount = 0;
  let notAnsweredCount = 0;
  let notVisitedCount = 0;

  questions.forEach(q => {
    const hasAnswer = q.user_answer !== null;
    const isMarked = q.marked_for_review;

    if (hasAnswer && isMarked) {
      markedAndAnsweredCount++;
      answeredCount++;
    } else if (hasAnswer) {
      answeredCount++;
    } else if (isMarked) {
      markedCount++;
    } else if (q.visited) {
      notAnsweredCount++;
    } else {
      notVisitedCount++;
    }
  });

  const currentQ = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;
  const isFirstQuestion = currentIdx === 0;

  // Visual timer urgency styling
  const isUrgent = remainingSeconds <= 300; // <= 5 minutes
  const isCritical = remainingSeconds <= 60; // <= 1 minute

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -my-6 sm:-my-8">
      {/* Time Warning Banner Toast */}
      {timeWarning && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2 border-2 border-amber-300 animate-bounce">
          <AlertTriangle className="w-5 h-5 text-slate-950" />
          <span>{timeWarning}</span>
          <button onClick={() => setTimeWarning(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Focus Mode Exam Header */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-3 sticky top-0 z-40 shadow-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h1 className="font-bold text-base tracking-tight">{session.question_bank_name}</h1>
            <p className="text-xs text-slate-400">UGC-NET Paper I • 50 Questions • 60 Minutes</p>
          </div>
          <div className="sm:hidden font-bold text-sm text-slate-200">
            Q {currentIdx + 1} / {questions.length}
          </div>
        </div>

        {/* Timer Display */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-base transition-all ${
            isCritical
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
              : isUrgent
              ? 'bg-amber-600 text-white border-amber-400'
              : 'bg-slate-800 text-blue-300 border-slate-700'
          }`}>
            <Clock className={`w-4 h-4 ${isCritical || isUrgent ? 'text-white' : 'text-blue-400'}`} />
            <span>Time Remaining: {formatTime(remainingSeconds)}</span>
          </div>

          {/* Mobile Palette Toggle */}
          <button
            onClick={() => setPaletteOpen(!paletteOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
            title="Toggle Question Palette"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Submit Test Button in Header */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="hidden sm:flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition shadow cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Examination Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left / Center: Question & Options Arena */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-5xl mx-auto w-full flex flex-col justify-between">
          <div className="space-y-6">
            {/* Question Info Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-extrabold text-lg text-slate-900">
                  Question {currentIdx + 1}
                  <span className="text-sm font-normal text-slate-500"> of {questions.length}</span>
                </span>

                {currentQ.unit && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {currentQ.unit}
                  </span>
                )}

                {currentQ.topic && (
                  <span className="text-xs text-slate-500 hidden sm:inline-block">
                    • {currentQ.topic}
                  </span>
                )}
              </div>

              <div className="text-xs font-medium text-slate-500">
                Marks: <strong className="text-emerald-600">+{session.marks_per_correct}</strong>
                {session.negative_marks_per_incorrect > 0 && (
                  <span> / <strong className="text-rose-600">-{session.negative_marks_per_incorrect}</strong></span>
                )}
              </div>
            </div>

            {/* Question Statement Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-slate-900">
              <p className="text-base sm:text-lg leading-relaxed font-medium whitespace-pre-line text-slate-800">
                {currentQ.question_text}
              </p>
            </div>

            {/* Answer Options (Radio Cards) */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Select One Option:
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentQ.options.map((opt) => {
                  const isSelected = currentQ.user_answer === opt.key;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}>
                        {opt.key}
                      </div>

                      <div className="flex-1 text-sm sm:text-base text-slate-800 pt-1 leading-relaxed">
                        {opt.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Action Control Bar */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-sm border">
            {/* Left buttons: Clear response & Mark for review */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleClearAnswer}
                disabled={currentQ.user_answer === null}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Answer
              </button>

              <button
                onClick={handleToggleReview}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                  currentQ.marked_for_review
                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {currentQ.marked_for_review ? 'Marked for Review' : 'Mark for Review'}
              </button>
            </div>

            {/* Right buttons: Prev, Mark & Next, Save & Next */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => goToQuestion(currentIdx - 1)}
                disabled={isFirstQuestion}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {!isLastQuestion ? (
                <button
                  onClick={handleSaveAndNext}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow transition"
                >
                  Save & Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow transition"
                >
                  <Check className="w-4 h-4" /> Finish & Submit
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar: Question Palette (Collapsible on mobile) */}
        <aside className={`
          lg:w-80 bg-white border-l border-slate-200 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto z-30
          fixed lg:static inset-y-0 right-0 max-w-xs w-full shadow-2xl lg:shadow-none transition-transform duration-300
          ${paletteOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Question Palette</h3>
              <button
                onClick={() => setPaletteOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center">
                  {answeredCount}
                </span>
                <span>Answered</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                  {notAnsweredCount}
                </span>
                <span>Not Answered</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center">
                  {markedCount}
                </span>
                <span>Marked Review</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center border border-slate-300">
                  {notVisitedCount}
                </span>
                <span>Not Visited</span>
              </div>
            </div>

            {/* 1..50 Button Grid */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Jump to Question:</div>
              <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIdx;
                  const hasAnswer = q.user_answer !== null;
                  const isMarked = q.marked_for_review;
                  const isVisited = q.visited;

                  let bgClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300';
                  if (hasAnswer && isMarked) {
                    bgClass = 'bg-purple-700 text-white border-purple-800';
                  } else if (hasAnswer) {
                    bgClass = 'bg-emerald-600 text-white border-emerald-700';
                  } else if (isMarked) {
                    bgClass = 'bg-purple-500 text-white border-purple-600';
                  } else if (isVisited) {
                    bgClass = 'bg-rose-500 text-white border-rose-600';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center transition border ${bgClass} ${
                        isCurrent ? 'ring-2 ring-blue-500 ring-offset-2 scale-105 shadow-sm' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Test Trigger in Palette */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Submit Examination
            </button>
            <p className="text-[10px] text-center text-slate-400">
              Auto-saves every second. Safe against page reload.
            </p>
          </div>
        </aside>
      </div>

      {/* Manual Submission Confirmation Modal (Test Safety Requirement 7) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Are you sure you want to submit?</h3>
                <p className="text-xs text-slate-500">Please review your question response summary before finishing.</p>
              </div>
            </div>

            {/* Summary statistics */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Total Questions:</span>
                <span className="font-bold text-slate-900">50</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Answered Questions:
                </span>
                <span>{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between text-rose-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Unanswered Questions:
                </span>
                <span>{questions.length - answeredCount}</span>
              </div>
              <div className="flex items-center justify-between text-purple-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-purple-600" /> Marked for Review:
                </span>
                <span>{markedCount + markedAndAnsweredCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 pt-2 border-t border-slate-200">
                <span>Time Remaining:</span>
                <span className="font-mono font-bold text-blue-600">{formatTime(remainingSeconds)}</span>
              </div>
            </div>

            {/* Cancel | Submit Test */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
              >
                Cancel & Resume Test
              </button>
              <button
                onClick={handleManualSubmitConfirm}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow"
              >
                Yes, Submit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
