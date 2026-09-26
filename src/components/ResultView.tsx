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
  AlertCircle
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

  // Performance tier evaluation
  let performanceTier = 'Needs Preparation';
  let tierColor = 'text-rose-600';
  let tierBg = 'bg-rose-50 border-rose-200';
  if (attempt.percentage >= 70) {
    performanceTier = 'JRF Qualified Standard';
    tierColor = 'text-emerald-700';
    tierBg = 'bg-emerald-50 border-emerald-200';
  } else if (attempt.percentage >= 55) {
    performanceTier = 'Assistant Professor Standard (NET Qualified)';
    tierColor = 'text-blue-700';
    tierBg = 'bg-blue-50 border-blue-200';
  } else if (attempt.percentage >= 40) {
    performanceTier = 'Average Pass Threshold';
    tierColor = 'text-amber-700';
    tierBg = 'bg-amber-50 border-amber-200';
  }

  // SVG Circular Gauge calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attempt.percentage / 100) * circumference;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRetakeTest(attempt.question_bank_id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Start New Test
          </button>
        </div>
      </div>

      {/* Result Tabs Navigation Bar */}
      <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm flex items-center gap-1">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
            activeTab === 'summary'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-4 h-4" /> Overall Result
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
            activeTab === 'analysis'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListOrdered className="w-4 h-4" /> Question-by-Question Analysis
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
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
              {/* Circular Gauge Meter (Requirement 9 Performance Indicator) */}
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
                  <h2 className="text-2xl font-black text-slate-900 mt-1">
                    {attempt.question_bank_name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official UGC-NET Paper I Mock Evaluation • 50 Questions
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
                  <h3 className="font-bold text-sm text-slate-900">Review All 50 Questions</h3>
                  <p className="text-xs text-slate-500">Inspect correct answers, your choices, and explanations</p>
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
                  <p className="text-xs text-slate-500">Analyze Teaching, Research, ICT, and Reasoning strengths</p>
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
