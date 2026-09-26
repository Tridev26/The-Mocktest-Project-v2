import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Bookmark, 
  HelpCircle, 
  Search, 
  Filter, 
  BookOpen, 
  Lightbulb 
} from 'lucide-react';
import { AttemptQuestion } from '../types';

interface QuestionAnalysisProps {
  attemptQuestions: AttemptQuestion[];
}

export const QuestionAnalysis: React.FC<QuestionAnalysisProps> = ({
  attemptQuestions,
}) => {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted' | 'review'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const correctCount = attemptQuestions.filter(q => q.is_correct).length;
  const incorrectCount = attemptQuestions.filter(q => q.user_answer !== null && !q.is_correct).length;
  const unattemptedCount = attemptQuestions.filter(q => q.user_answer === null).length;
  const reviewCount = attemptQuestions.filter(q => q.marked_for_review).length;

  const filteredQuestions = attemptQuestions.filter(q => {
    // Status filter
    if (filter === 'correct' && !q.is_correct) return false;
    if (filter === 'incorrect' && (q.user_answer === null || q.is_correct)) return false;
    if (filter === 'unattempted' && q.user_answer !== null) return false;
    if (filter === 'review' && !q.marked_for_review) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const qText = q.question_text.toLowerCase();
      const unit = (q.unit || '').toLowerCase();
      const topic = (q.topic || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return qText.includes(query) || unit.includes(query) || topic.includes(query);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Questions ({attemptQuestions.length})
            </button>

            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                filter === 'correct'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Correct ({correctCount})
            </button>

            <button
              onClick={() => setFilter('incorrect')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                filter === 'incorrect'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" /> Incorrect ({incorrectCount})
            </button>

            <button
              onClick={() => setFilter('unattempted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                filter === 'unattempted'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Unattempted ({unattemptedCount})
            </button>

            <button
              onClick={() => setFilter('review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                filter === 'review'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" /> Review ({reviewCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search question or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
            <p className="text-sm text-slate-500">No questions match the selected filter or search query.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const hasAnswer = q.user_answer !== null;
            const isCorrect = q.is_correct;
            const isUnattempted = !hasAnswer;

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Header row */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      Question {q.question_order}
                    </span>

                    {q.unit && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {q.unit}
                      </span>
                    )}

                    {q.topic && (
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        • {q.topic}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Time spent */}
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {q.time_spent || 0}s spent
                    </span>

                    {/* Status Badge */}
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : isUnattempted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                        <HelpCircle className="w-3.5 h-3.5" /> Unattempted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>
                </div>

                {/* Question body */}
                <div className="p-5 sm:p-6 space-y-4">
                  <p className="text-slate-900 text-sm sm:text-base font-medium leading-relaxed whitespace-pre-line">
                    {q.question_text}
                  </p>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {q.options.map((opt) => {
                      const isCandidateChoice = q.user_answer === opt.key;
                      const isActualCorrect = q.correct_answer === opt.key;

                      let optStyle = 'border-slate-200 bg-white text-slate-800';
                      let badge = null;

                      if (isActualCorrect) {
                        optStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold ring-1 ring-emerald-400';
                        badge = (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> Correct Answer
                          </span>
                        );
                      } else if (isCandidateChoice && !isActualCorrect) {
                        optStyle = 'border-rose-400 bg-rose-50/70 text-rose-950 font-medium ring-1 ring-rose-300';
                        badge = (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1 shrink-0">
                            <XCircle className="w-3 h-3" /> Your Selection
                          </span>
                        );
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${optStyle}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                              isActualCorrect
                                ? 'bg-emerald-600 text-white'
                                : isCandidateChoice
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {opt.key}
                            </span>
                            <span className="pt-0.5">{opt.text}</span>
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Section */}
                  {q.explanation && (
                    <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs sm:text-sm text-slate-800 space-y-1">
                      <div className="font-bold text-blue-900 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                        Explanation:
                      </div>
                      <p className="text-slate-700 leading-relaxed pl-5 whitespace-pre-line">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
