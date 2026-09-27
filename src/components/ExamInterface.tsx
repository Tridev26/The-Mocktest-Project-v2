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
  Menu,
  ShieldAlert,
  Send,
  Layers,
  FileText
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
  const [paletteSectionFilter, setPaletteSectionFilter] = useState<'all' | 0 | 1>('all');

  const isCombinedMode = session.paper_mode === 'paper1_paper2';

  // Current section (0 for Paper-I, 1 for Paper-II)
  const currentQ = questions[currentIdx] || questions[0];
  const currentSectionIdx = isCombinedMode ? (currentIdx < 50 ? 0 : 1) : 0;

  // Time spent tracker on current question
  const currentQStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);
  const warned30Ref = useRef<boolean>(session.remaining_seconds <= 1800);
  const warned15Ref = useRef<boolean>(session.remaining_seconds <= 900);
  const warned5Ref = useRef<boolean>(session.remaining_seconds <= 300);
  const warned1Ref = useRef<boolean>(session.remaining_seconds <= 60);

  // Synchronize time spent
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

        // Warnings at 30m (for 2hr/3hr tests), 15m, 5m, 1m
        if (nextVal <= 1800 && !warned30Ref.current && session.duration_seconds > 3600) {
          warned30Ref.current = true;
          triggerWarning('30 minutes remaining in examination.');
        } else if (nextVal <= 900 && !warned15Ref.current) {
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

  // Section 1 and Section 2 breakdown counts
  const section1Questions = isCombinedMode ? questions.slice(0, 50) : questions;
  const section2Questions = isCombinedMode ? questions.slice(50) : [];

  const getStats = (qList: AttemptQuestion[]) => {
    let answered = 0;
    let marked = 0;
    let markedAndAnswered = 0;
    let notAnswered = 0;
    let notVisited = 0;

    qList.forEach(q => {
      const hasAnswer = q.user_answer !== null;
      const isMarked = q.marked_for_review;

      if (hasAnswer && isMarked) {
        markedAndAnswered++;
        answered++;
      } else if (hasAnswer) {
        answered++;
      } else if (isMarked) {
        marked++;
      } else if (q.visited) {
        notAnswered++;
      } else {
        notVisited++;
      }
    });

    return { answered, marked, markedAndAnswered, notAnswered, notVisited, total: qList.length };
  };

  const overallStats = getStats(questions);
  const s1Stats = getStats(section1Questions);
  const s2Stats = getStats(section2Questions);

  const isLastQuestion = currentIdx === questions.length - 1;
  const isFirstQuestion = currentIdx === 0;

  // Visual timer urgency styling
  const isUrgent = remainingSeconds <= 300; // <= 5 minutes
  const isCritical = remainingSeconds <= 60; // <= 1 minute

  // Filter questions for palette view
  const visiblePaletteQuestions = questions.filter((q, idx) => {
    if (!isCombinedMode || paletteSectionFilter === 'all') return true;
    if (paletteSectionFilter === 0) return idx < 50;
    if (paletteSectionFilter === 1) return idx >= 50;
    return true;
  });

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
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 sticky top-0 z-40 shadow-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h1 className="font-bold text-sm sm:text-base tracking-tight flex items-center gap-2">
              <span>{session.question_bank_name}</span>
            </h1>
            <p className="text-xs text-slate-400">
              {session.paper_mode === 'paper1' && 'UGC-NET Paper I • 50 Questions • 60 Minutes (1 Hour)'}
              {session.paper_mode === 'paper2' && 'UGC-NET Paper II • 100 Questions • 120 Minutes (2 Hours)'}
              {session.paper_mode === 'paper1_paper2' && 'UGC-NET Combined (Paper I + II) • 150 Questions • 180 Minutes (3 Hours)'}
            </p>
          </div>
          <div className="sm:hidden font-bold text-xs text-slate-200">
            Q {currentIdx + 1} / {questions.length}
          </div>
        </div>

        {/* Timer Display & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm sm:text-base transition-all ${
            isCritical
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
              : isUrgent
              ? 'bg-amber-600 text-white border-amber-400'
              : 'bg-slate-800 text-blue-300 border-slate-700'
          }`}>
            <Clock className={`w-4 h-4 ${isCritical || isUrgent ? 'text-white' : 'text-blue-400'}`} />
            <span>Time Left: {formatTime(remainingSeconds)}</span>
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
            className="hidden sm:flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs transition shadow cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Test
          </button>
        </div>
      </header>

      {/* Official Section Switcher Bar (For Combined Mode with Two Sections) */}
      {isCombinedMode && (
        <div className="bg-slate-800 px-4 sm:px-6 py-2 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] hidden sm:inline-block">
              Sections:
            </span>

            {/* Section 1 Button */}
            <button
              onClick={() => goToQuestion(0)}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-2 ${
                currentSectionIdx === 0
                  ? 'bg-blue-600 text-white shadow ring-2 ring-blue-400/40'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span>Section 1: Paper-I (1-50)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900/60 font-mono">
                {s1Stats.answered}/50
              </span>
            </button>

            {/* Section 2 Button */}
            <button
              onClick={() => goToQuestion(50)}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-2 ${
                currentSectionIdx === 1
                  ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-400/40'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span>Section 2: Paper-II (51-150)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900/60 font-mono">
                {s2Stats.answered}/100
              </span>
            </button>
          </div>

          <div className="text-slate-400 text-[11px] hidden md:block">
            Candidates may switch between sections at any time
          </div>
        </div>
      )}

      {/* Main Examination Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left / Center: Question & Options Arena */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-5xl mx-auto w-full flex flex-col justify-between">
          <div className="space-y-6">
            {/* Question Info Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5 flex-wrap">
                {isCombinedMode && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md text-white ${
                    currentSectionIdx === 0 ? 'bg-blue-600' : 'bg-indigo-600'
                  }`}>
                    {currentSectionIdx === 0 ? 'Section 1: Paper-I' : 'Section 2: Paper-II'}
                  </span>
                )}

                <span className="font-extrabold text-base sm:text-lg text-slate-900">
                  Question {isCombinedMode ? (currentSectionIdx === 0 ? currentIdx + 1 : currentIdx - 49) : currentIdx + 1}
                  <span className="text-xs sm:text-sm font-normal text-slate-500">
                    {' '}(Overall: {currentIdx + 1} of {questions.length})
                  </span>
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

              <div className="text-xs font-medium text-slate-500 shrink-0">
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
                className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Answer
              </button>

              <button
                onClick={handleToggleReview}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                  currentQ.marked_for_review
                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {currentQ.marked_for_review ? 'Marked for Review' : 'Mark for Review'}
              </button>
            </div>

            {/* Right buttons: Prev, Save & Next */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => goToQuestion(currentIdx - 1)}
                disabled={isFirstQuestion}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {!isLastQuestion ? (
                <button
                  onClick={handleSaveAndNext}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  Save & Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow transition cursor-pointer"
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

            {/* If Combined Mode, show Section tabs inside Palette */}
            {isCombinedMode && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-[11px] font-bold">
                <button
                  onClick={() => setPaletteSectionFilter('all')}
                  className={`flex-1 py-1 rounded transition text-center ${
                    paletteSectionFilter === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All (150)
                </button>
                <button
                  onClick={() => setPaletteSectionFilter(0)}
                  className={`flex-1 py-1 rounded transition text-center ${
                    paletteSectionFilter === 0 ? 'bg-white shadow text-blue-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sec 1 (50)
                </button>
                <button
                  onClick={() => setPaletteSectionFilter(1)}
                  className={`flex-1 py-1 rounded transition text-center ${
                    paletteSectionFilter === 1 ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sec 2 (100)
                </button>
              </div>
            )}

            {/* Visual Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center">
                  {overallStats.answered}
                </span>
                <span>Answered</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                  {overallStats.notAnswered}
                </span>
                <span>Not Answered</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center">
                  {overallStats.marked}
                </span>
                <span>Marked Review</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center border border-slate-300">
                  {overallStats.notVisited}
                </span>
                <span>Not Visited</span>
              </div>
            </div>

            {/* Button Grid */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Jump to Question:</span>
                <span>{visiblePaletteQuestions.length} shown</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 max-h-[360px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  // Filter visibility
                  if (isCombinedMode && paletteSectionFilter !== 'all') {
                    if (paletteSectionFilter === 0 && idx >= 50) return null;
                    if (paletteSectionFilter === 1 && idx < 50) return null;
                  }

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
                      className={`h-8 rounded-lg font-bold text-xs flex items-center justify-center transition border ${bgClass} ${
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
              Continuous auto-save active. Safe on reload.
            </p>
          </div>
        </aside>
      </div>

      {/* Manual Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Confirm Exam Submission</h3>
                <p className="text-xs text-slate-500">Please review your question response summary before finishing.</p>
              </div>
            </div>

            {/* Summary statistics (Sectional if combined, single otherwise) */}
            {isCombinedMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Section 1 */}
                  <div className="bg-blue-50/70 rounded-xl p-3 border border-blue-200 text-xs space-y-1.5">
                    <div className="font-bold text-blue-900 border-b border-blue-200 pb-1 flex items-center justify-between">
                      <span>Section 1 (Paper-I)</span>
                      <span>50 Qs</span>
                    </div>
                    <div className="flex justify-between text-emerald-800">
                      <span>Answered:</span>
                      <strong>{s1Stats.answered}</strong>
                    </div>
                    <div className="flex justify-between text-rose-800">
                      <span>Unanswered:</span>
                      <strong>{50 - s1Stats.answered}</strong>
                    </div>
                    <div className="flex justify-between text-purple-800">
                      <span>Marked:</span>
                      <strong>{s1Stats.marked + s1Stats.markedAndAnswered}</strong>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="bg-indigo-50/70 rounded-xl p-3 border border-indigo-200 text-xs space-y-1.5">
                    <div className="font-bold text-indigo-900 border-b border-indigo-200 pb-1 flex items-center justify-between">
                      <span>Section 2 (Paper-II)</span>
                      <span>100 Qs</span>
                    </div>
                    <div className="flex justify-between text-emerald-800">
                      <span>Answered:</span>
                      <strong>{s2Stats.answered}</strong>
                    </div>
                    <div className="flex justify-between text-rose-800">
                      <span>Unanswered:</span>
                      <strong>{100 - s2Stats.answered}</strong>
                    </div>
                    <div className="flex justify-between text-purple-800">
                      <span>Marked:</span>
                      <strong>{s2Stats.marked + s2Stats.markedAndAnswered}</strong>
                    </div>
                  </div>
                </div>

                {/* Overall Totals */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Total Questions:</span>
                    <span>150 Questions</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Total Answered:</span>
                    <span>{overallStats.answered}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>Total Unanswered:</span>
                    <span>{150 - overallStats.answered}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
                    <span>Time Remaining:</span>
                    <span className="font-mono font-bold text-blue-600">{formatTime(remainingSeconds)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Total Questions:</span>
                  <span className="font-bold text-slate-900">{questions.length}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Answered Questions:
                  </span>
                  <span>{overallStats.answered}</span>
                </div>
                <div className="flex items-center justify-between text-rose-700 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Unanswered Questions:
                  </span>
                  <span>{questions.length - overallStats.answered}</span>
                </div>
                <div className="flex items-center justify-between text-purple-700 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-purple-600" /> Marked for Review:
                  </span>
                  <span>{overallStats.marked + overallStats.markedAndAnswered}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 pt-2 border-t border-slate-200">
                  <span>Time Remaining:</span>
                  <span className="font-mono font-bold text-blue-600">{formatTime(remainingSeconds)}</span>
                </div>
              </div>
            )}

            {/* Cancel | Submit Test */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
              >
                Cancel & Resume Test
              </button>
              <button
                onClick={handleManualSubmitConfirm}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow cursor-pointer"
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
