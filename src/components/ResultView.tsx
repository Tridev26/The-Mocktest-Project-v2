import React, { useState } from 'react';
import { 
  Trophy, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  ListOrdered, 
  BarChart2, 
  ArrowLeft, 
  Award, 
  BookOpen,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { TestAttempt } from '../types';
import { formatDetailedTime } from '../utils/testEngine';
import { QuestionAnalysis } from './QuestionAnalysis';
import { AnalyticsView } from './AnalyticsView';

interface ResultViewProps {
  attempt: TestAttempt;
  allAttempts: TestAttempt[];
  onRetakeTest: (bankId: string) => void;
  onBackToDashboard: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  attempt,
  allAttempts,
  onRetakeTest,
  onBackToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'analysis' | 'analytics'>('summary');

  // Performance tier evaluation based on percentage
  let performanceTier = 'Needs Preparation';
  let tierColor = 'text-rose-600';
  let tierBg = 'bg-rose-50 border-rose-200';
  if (attempt.percentage >= 70) {
    performanceTier = 'JRF Qualified Standard (Distinction)';
    tierColor = 'text-emerald-700';
    tierBg = 'bg-emerald-50 border-emerald-200';
  } else if (attempt.percentage >= 55) {
    performanceTier = 'Assistant Professor Standard (NET Qualified)';
    tierColor = 'text-blue-700';
    tierBg = 'bg-blue-50 border-blue-200';
  } else if (attempt.percentage >= 40) {
    performanceTier = 'Pass Threshold Qualified';
    tierColor = 'text-amber-700';
    tierBg = 'bg-amber-50 border-amber-200';
  }

  // SVG Circular Gauge calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, attempt.percentage)) / 100) * circumference;

  const isCombined = attempt.paper_mode === 'paper1_paper2';
  const hasSections = Boolean(attempt.sections && attempt.sections.length >= 2);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRetakeTest(attempt.question_bank_id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Start New Test
          </button>
        </div>
      </div>

      {/* Result Tabs Navigation Bar */}
      <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm flex items-center gap-1">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-4 h-4" /> Overall Result
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'analysis'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListOrdered className="w-4 h-4" /> Question-by-Question Analysis
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Performance Analytics
        </button>
      </div>

      {/* Main Tab 1: Overall Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Main Score Hero Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Circular Gauge Meter */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
                    <circle
                      cx="65"
                      cy="65"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-slate-100"
                      fill="transparent"
                    />
                    <circle
                      cx="65"
                      cy="65"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="text-blue-600 transition-all duration-1000 ease-out"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {attempt.percentage}%
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Percentage
                    </span>
                  </div>
                </div>

                <div className={`mt-4 px-3.5 py-1.5 rounded-full text-xs font-bold border ${tierBg} ${tierColor}`}>
                  {performanceTier}
                </div>
              </div>

              {/* Score Details & Stats */}
              <div className="md:col-span-8 space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Completed on {new Date(attempt.completed_at).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <h2 className="text-2xl font-black text-slate-900">
                      {attempt.question_bank_name}
                    </h2>

                    {attempt.paper_mode === 'paper1' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Paper-I (1 Hour • 50 Qs)
                      </span>
                    )}
                    {attempt.paper_mode === 'paper2' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Paper-II (2 Hours • 100 Qs)
                      </span>
                    )}
                    {attempt.paper_mode === 'paper1_paper2' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Paper-I + II Combined (3 Hours • 150 Qs)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    {attempt.paper_mode === 'paper1_paper2'
                      ? 'Full UGC-NET Examination Simulation • Section 1 (Paper-I) + Section 2 (Paper-II)'
                      : (attempt.paper_mode === 'paper2' ? 'UGC-NET Paper II Subject Specialization Examination' : 'UGC-NET Paper I General Aptitude Examination')}
                  </p>
                </div>

                {/* Score Big Display */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Final Score</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {attempt.score} <span className="text-xs font-normal text-slate-500">/ {attempt.max_score}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Accuracy</div>
                    <div className="text-2xl font-black text-blue-600 mt-1">
                      {attempt.accuracy}%
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Time Taken</div>
                    <div className="text-2xl font-black text-indigo-600 mt-1">
                      {formatDetailedTime(attempt.time_used_seconds)}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Total Questions</div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {attempt.total_questions}
                    </div>
                  </div>
                </div>

                {/* Breakdown Bar: Correct vs Incorrect vs Unattempted */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Correct: <strong>{attempt.correct_count}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" /> Incorrect: <strong>{attempt.incorrect_count}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Unattempted: <strong>{attempt.unattempted_count}</strong>
                    </span>
                  </div>

                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${(attempt.correct_count / attempt.total_questions) * 100}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Correct: ${attempt.correct_count}`}
                    />
                    <div
                      style={{ width: `${(attempt.incorrect_count / attempt.total_questions) * 100}%` }}
                      className="bg-rose-500 h-full transition-all"
                      title={`Incorrect: ${attempt.incorrect_count}`}
                    />
                    <div
                      style={{ width: `${(attempt.unattempted_count / attempt.total_questions) * 100}%` }}
                      className="bg-slate-300 h-full transition-all"
                      title={`Unattempted: ${attempt.unattempted_count}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sectional Scorecards for Combined Paper-I + Paper-II */}
          {isCombined && hasSections && attempt.sections && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Sectional Performance Breakdown:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Section 1 Card */}
                {attempt.sections[0] && (
                  <div className="bg-white rounded-2xl p-6 border-2 border-blue-200/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          Section 1
                        </span>
                        <h4 className="font-extrabold text-base text-slate-900">
                          Paper-I (General Aptitude)
                        </h4>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                        {attempt.sections[0].total_questions} Questions
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500">Score</div>
                        <div className="text-xl font-black text-slate-900 mt-0.5">
                          {attempt.sections[0].score}
                          <span className="text-[10px] font-normal text-slate-500"> / {attempt.sections[0].max_score}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500">Percentage</div>
                        <div className="text-xl font-black text-blue-600 mt-0.5">
                          {attempt.sections[0].percentage}%
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500">Accuracy</div>
                        <div className="text-xl font-black text-emerald-600 mt-0.5">
                          {attempt.sections[0].accuracy}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <span className="text-emerald-700 font-semibold">
                        Correct: <strong>{attempt.sections[0].correct_count}</strong>
                      </span>
                      <span className="text-rose-700 font-semibold">
                        Incorrect: <strong>{attempt.sections[0].incorrect_count}</strong>
                      </span>
                      <span className="text-slate-500">
                        Skipped: <strong>{attempt.sections[0].unattempted_count}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Section 2 Card */}
                {attempt.sections[1] && (
                  <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          Section 2
                        </span>
                        <h4 className="font-extrabold text-base text-slate-900">
                          Paper-II (Subject Specialization)
                        </h4>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                        {attempt.sections[1].total_questions} Questions
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500">Score</div>
                        <div className="text-xl font-black text-slate-900 mt-0.5">
                          {attempt.sections[1].score}
                          <span className="text-[10px] font-normal text-slate-500"> / {attempt.sections[1].max_score}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500">Percentage</div>
                        <div className="text-xl font-black text-indigo-600 mt-0.5">
                          {attempt.sections[1].percentage}%
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="text-[11px] text-slate-500">Accuracy</div>
                        <div className="text-xl font-black text-emerald-600 mt-0.5">
                          {attempt.sections[1].accuracy}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <span className="text-emerald-700 font-semibold">
                        Correct: <strong>{attempt.sections[1].correct_count}</strong>
                      </span>
                      <span className="text-rose-700 font-semibold">
                        Incorrect: <strong>{attempt.sections[1].incorrect_count}</strong>
                      </span>
                      <span className="text-slate-500">
                        Skipped: <strong>{attempt.sections[1].unattempted_count}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Review Suggestions & Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setActiveTab('analysis')}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Review All {attempt.total_questions} Questions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspect correct answers, candidate choices, and full explanations
                  </p>
                </div>
              </div>
              <span className="text-blue-600 text-xs font-bold">Open →</span>
            </div>

            <div
              onClick={() => setActiveTab('analytics')}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Unit-Wise Performance</h3>
                  <p className="text-xs text-slate-500">
                    Detailed diagnostic insights across all syllabus units
                  </p>
                </div>
              </div>
              <span className="text-indigo-600 text-xs font-bold">Open →</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: Question-by-Question Analysis */}
      {activeTab === 'analysis' && (
        <QuestionAnalysis attemptQuestions={attempt.attempt_questions} />
      )}

      {/* Main Tab 3: Performance Analytics */}
      {activeTab === 'analytics' && (
        <AnalyticsView currentAttempt={attempt} allAttempts={allAttempts} />
      )}
    </div>
  );
};
