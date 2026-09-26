import React, { useState } from 'react';
import { 
  PlayCircle, 
  Database, 
  Trophy, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  Calendar, 
  Upload, 
  Trash2, 
  Eye, 
  Sparkles,
  BookOpen,
  Info,
  FileText,
  TrendingUp
} from 'lucide-react';
import { QuestionBank, TestAttempt } from '../types';
import { formatDetailedTime } from '../utils/testEngine';

interface DashboardProps {
  questionBanks: QuestionBank[];
  testAttempts: TestAttempt[];
  onStartTest: (bankId: string) => void;
  onNavigateTab: (tab: string) => void;
  onViewAttemptResults: (attempt: TestAttempt) => void;
  onDeleteBank: (bankId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  questionBanks,
  testAttempts,
  onStartTest,
  onNavigateTab,
  onViewAttemptResults,
  onDeleteBank,
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string>(
    questionBanks.length > 0 ? questionBanks[0].id : ''
  );

  // Performance calculations
  const totalAttempts = testAttempts.length;
  let totalScore = 0;
  let bestScore = 0;
  let totalAccuracySum = 0;
  let totalQuestionsAttempted = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;

  testAttempts.forEach(att => {
    totalScore += att.score;
    if (att.score > bestScore) bestScore = att.score;
    totalAccuracySum += att.accuracy;
    totalCorrect += att.correct_count;
    totalIncorrect += att.incorrect_count;
    totalQuestionsAttempted += (att.correct_count + att.incorrect_count);
  });

  const avgScore = totalAttempts > 0 ? Math.round((totalScore / totalAttempts) * 10) / 10 : 0;
  const avgAccuracy = totalAttempts > 0 ? Math.round((totalAccuracySum / totalAttempts) * 10) / 10 : 0;

  // Selected bank metadata
  const currentSelectedBank = questionBanks.find(b => b.id === selectedBankId) || questionBanks[0];
  const canStartTest = currentSelectedBank && currentSelectedBank.questions.length >= 50;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero / Start Mock Test Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Standard UGC-NET Paper I Pattern
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              UGC-NET Paper I Mock Examination
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Experience the realistic examination environment with exactly <span className="text-white font-semibold">50 questions</span>, a <span className="text-white font-semibold">60-minute countdown</span>, instant scoring, question-by-question explanations, and in-depth performance analytics.
            </p>

            <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> 60 Minutes
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> 50 Questions (MCQs)
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
                <Target className="w-3.5 h-3.5 text-purple-400" /> 100 Maximum Marks
              </span>
            </div>
          </div>

          {/* Quick Start Card */}
          <div className="lg:col-span-5 bg-slate-800/90 backdrop-blur-md rounded-xl p-5 sm:p-6 border border-slate-700 shadow-2xl">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
              <span>Start New Mock Test</span>
              <span className="text-xs font-normal text-slate-400">Select Bank</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Choose Question Bank:
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {questionBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} ({bank.questions.length} questions)
                    </option>
                  ))}
                </select>
              </div>

              {currentSelectedBank && (
                <div className={`p-3 rounded-lg text-xs border ${
                  canStartTest 
                    ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200' 
                    : 'bg-amber-950/40 border-amber-800/50 text-amber-200'
                }`}>
                  {canStartTest ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Ready: 50 questions will be randomly selected and ordered.</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        This question bank has <strong>{currentSelectedBank.questions.length}</strong> questions. Exactly 50 valid questions are required to start a mock test.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                disabled={!canStartTest}
                onClick={() => canStartTest && onStartTest(currentSelectedBank.id)}
                className={`w-full py-3.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                  canStartTest
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 cursor-pointer hover:shadow-emerald-500/20 hover:scale-[1.01]'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <PlayCircle className="w-5 h-5" />
                Start 50-Question Mock Test Now
              </button>

              <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                <button
                  onClick={() => onNavigateTab('question-banks')}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload custom question bank
                </button>
                <button
                  onClick={() => onNavigateTab('start-test')}
                  className="text-slate-300 hover:text-white flex items-center gap-1 hover:underline"
                >
                  Test Guidelines <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Summary Metrics - Single Unified Merged Component */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            Performance Summary
          </h2>
          {totalAttempts > 0 && (
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Full Analytics <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Single Unified Merged Component Housing All 7 Performance Metrics */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 gap-y-4">
            {/* 1. Tests Attempted */}
            <div className="px-3 sm:px-4 py-1.5 first:pl-0">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Tests Attempted</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                {totalAttempts}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">Total 50-Q sessions</div>
            </div>

            {/* 2. Average Score */}
            <div className="px-3 sm:px-4 py-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                <span>Average Score</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-indigo-600 tracking-tight">
                {totalAttempts > 0 ? avgScore : '—'}
                {totalAttempts > 0 && <span className="text-xs font-normal text-slate-400 ml-1">/100</span>}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">Out of 100 marks</div>
            </div>

            {/* 3. Best Score */}
            <div className="px-3 sm:px-4 py-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Best Score</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-600 tracking-tight">
                {totalAttempts > 0 ? bestScore : '—'}
                {totalAttempts > 0 && <span className="text-xs font-normal text-slate-400 ml-1">/100</span>}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">High watermark</div>
            </div>

            {/* 4. Avg Accuracy */}
            <div className="px-3 sm:px-4 py-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                <span>Avg Accuracy</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-600 tracking-tight">
                {totalAttempts > 0 ? `${avgAccuracy}%` : '—'}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">Correct / Attempted</div>
            </div>

            {/* 5. Questions Answered */}
            <div className="px-3 sm:px-4 py-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Answered</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800 tracking-tight">
                {totalQuestionsAttempted}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">Total responses</div>
            </div>

            {/* 6. Correct Answers */}
            <div className="px-3 sm:px-4 py-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Correct</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-600 tracking-tight">
                {totalCorrect}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">All-time correct</div>
            </div>

            {/* 7. Incorrect Answers */}
            <div className="px-3 sm:px-4 py-1.5 last:pr-0">
              <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Incorrect</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-600 tracking-tight">
                {totalIncorrect}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">All-time incorrect</div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Section: Recent Attempts & Question Banks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Attempts (8 cols) */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Recent Attempts
              </h2>
              <p className="text-xs text-slate-500">Your latest UGC-NET Paper I mock test performances</p>
            </div>
            {testAttempts.length > 0 && (
              <button
                onClick={() => onNavigateTab('history')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All ({testAttempts.length})
              </button>
            )}
          </div>

          {testAttempts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-dashed border-slate-300 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <PlayCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Mock Tests Taken Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Begin your UGC-NET Paper I preparation by taking your first timed 50-question mock test.
              </p>
              <button
                disabled={!canStartTest}
                onClick={() => canStartTest && onStartTest(currentSelectedBank.id)}
                className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                Start First Mock Test
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
              {testAttempts.slice(0, 4).map((attempt) => (
                <div key={attempt.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {attempt.question_bank_name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                        {new Date(attempt.completed_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDetailedTime(attempt.time_used_seconds)}
                      </span>
                      <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {attempt.correct_count}
                      </span>
                      <span className="text-rose-600 font-medium flex items-center gap-0.5">
                        <XCircle className="w-3.5 h-3.5" /> {attempt.incorrect_count}
                      </span>
                      <span className="text-slate-400">
                        {attempt.unattempted_count} skipped
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900">
                        {attempt.score} <span className="text-xs text-slate-500 font-normal">/ {attempt.max_score}</span>
                      </div>
                      <div className="text-[11px] text-blue-600 font-medium">
                        {attempt.accuracy}% Acc • {attempt.percentage}%
                      </div>
                    </div>

                    <button
                      onClick={() => onViewAttemptResults(attempt)}
                      className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Results
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Question Banks Quick Management (5 cols) */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                Question Banks
              </h2>
              <p className="text-xs text-slate-500">Available banks for mock tests</p>
            </div>
            <button
              onClick={() => onNavigateTab('question-banks')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Manage Banks <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {questionBanks.map((bank) => {
              const isEligible = bank.questions.length >= 50;
              return (
                <div
                  key={bank.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">{bank.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {bank.description || 'Uploaded question bank for UGC NET Paper I.'}
                      </p>
                    </div>
                    {bank.is_default && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span className="font-medium text-slate-700">
                      {bank.questions.length} questions
                    </span>

                    <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                      isEligible 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {isEligible ? 'Ready for 50-Q Test' : 'Needs 50+ Questions'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      disabled={!isEligible}
                      onClick={() => onStartTest(bank.id)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        isEligible
                          ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Take Mock Test
                    </button>

                    {!bank.is_default && (
                      <button
                        onClick={() => onDeleteBank(bank.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition"
                        title="Delete Question Bank"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Upload action card */}
            <div
              onClick={() => onNavigateTab('question-banks')}
              className="bg-slate-50 hover:bg-blue-50/50 border border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer transition"
            >
              <Upload className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-slate-800">Upload New Question Bank</div>
              <div className="text-[11px] text-slate-500">Supports CSV, Excel (XLSX), and JSON formats</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
