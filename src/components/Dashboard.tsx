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
  Layers,
  Award,
  Check
} from 'lucide-react';
import { QuestionBank, TestAttempt, TestPaperMode } from '../types';
import { formatDetailedTime } from '../utils/testEngine';

interface DashboardProps {
  questionBanks: QuestionBank[];
  testAttempts: TestAttempt[];
  onStartTest: (bankId?: string, mode?: TestPaperMode) => void;
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
  const [selectedMode, setSelectedMode] = useState<TestPaperMode>('paper1');
  const [selectedBankId, setSelectedBankId] = useState<string>('');

  const paper1Banks = questionBanks.filter(b => b.paper_type !== 'paper2' && !b.name.toLowerCase().includes('paper ii'));
  const paper2Banks = questionBanks.filter(b => b.paper_type === 'paper2' || b.name.toLowerCase().includes('paper ii') || b.questions.length >= 100);

  // Auto-select bank depending on mode
  const currentBanks = selectedMode === 'paper2' ? paper2Banks : paper1Banks;
  const activeBankId = selectedBankId || (currentBanks.length > 0 ? currentBanks[0].id : (questionBanks[0]?.id || ''));
  const currentSelectedBank = questionBanks.find(b => b.id === activeBankId) || currentBanks[0] || questionBanks[0];

  const requiredCount = selectedMode === 'paper1' ? 50 : (selectedMode === 'paper2' ? 100 : 150);
  const canStartTest = selectedMode === 'paper1'
    ? (currentSelectedBank && currentSelectedBank.questions.length >= 50)
    : (selectedMode === 'paper2'
      ? (currentSelectedBank && currentSelectedBank.questions.length >= 100)
      : (paper1Banks.some(b => b.questions.length >= 50) && paper2Banks.some(b => b.questions.length >= 100)));

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

  return (
    <div className="space-y-8 pb-12">
      {/* Hero / Start Mock Test Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Official NTA UGC-NET CBT Simulation Engine
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              UGC-NET Mock Examination Hub
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Experience the authentic NTA examination interface. Choose from <strong className="text-white">Paper-I</strong> (1 Hour, 50 Qs), <strong className="text-white">Paper-II</strong> (2 Hours, 100 Qs), or the full <strong className="text-white">Combined Paper-I + II</strong> (3 Hours, 150 Qs) with instant scoring and in-depth analytics.
            </p>

            <div className="flex flex-wrap gap-3 pt-1 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> 1h / 2h / 3h Options
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> 50, 100 & 150 MCQs
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
                <Target className="w-3.5 h-3.5 text-purple-400" /> Up to 300 Maximum Marks
              </span>
            </div>
          </div>

          {/* Quick Start Card with Paper Mode Selector */}
          <div className="lg:col-span-5 bg-slate-800/90 backdrop-blur-md rounded-xl p-5 sm:p-6 border border-slate-700 shadow-2xl space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center justify-between">
              <span>Start New Mock Test</span>
              <span className="text-xs font-normal text-slate-400">Select Mode</span>
            </h2>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-lg">
              <button
                onClick={() => {
                  setSelectedMode('paper1');
                  if (paper1Banks.length > 0) setSelectedBankId(paper1Banks[0].id);
                }}
                className={`py-1.5 px-2 rounded text-xs font-bold transition text-center cursor-pointer ${
                  selectedMode === 'paper1'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Paper-I (1h)
              </button>

              <button
                onClick={() => {
                  setSelectedMode('paper2');
                  if (paper2Banks.length > 0) setSelectedBankId(paper2Banks[0].id);
                }}
                className={`py-1.5 px-2 rounded text-xs font-bold transition text-center cursor-pointer ${
                  selectedMode === 'paper2'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Paper-II (2h)
              </button>

              <button
                onClick={() => setSelectedMode('paper1_paper2')}
                className={`py-1.5 px-2 rounded text-xs font-bold transition text-center cursor-pointer ${
                  selectedMode === 'paper1_paper2'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Paper I+II (3h)
              </button>
            </div>

            {/* Bank details depending on mode */}
            {selectedMode !== 'paper1_paper2' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Choose {selectedMode === 'paper1' ? 'Paper-I' : 'Paper-II'} Question Bank:
                </label>
                <select
                  value={currentSelectedBank?.id || ''}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currentBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} ({bank.questions.length} Qs)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 text-xs space-y-1 text-slate-300">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Combined Test (Two Sections):
                </div>
                <div>• Section 1: Paper-I (50 Questions from standard bank)</div>
                <div>• Section 2: Paper-II (100 Questions from subject bank)</div>
              </div>
            )}

            {/* Status note */}
            <div className={`p-2.5 rounded-lg text-xs border ${
              canStartTest 
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200' 
                : 'bg-amber-950/40 border-amber-800/50 text-amber-200'
            }`}>
              {canStartTest ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Ready: {selectedMode === 'paper1' && '50 Qs • 60 Mins • 100 Marks'}
                    {selectedMode === 'paper2' && '100 Qs • 120 Mins • 200 Marks'}
                    {selectedMode === 'paper1_paper2' && '150 Qs • 180 Mins • 300 Marks (Two Sections)'}
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Insufficient questions. Required: {requiredCount} questions.
                  </span>
                </div>
              )}
            </div>

            {/* Start Button */}
            <button
              disabled={!canStartTest}
              onClick={() => onStartTest(currentSelectedBank?.id, selectedMode)}
              className={`w-full py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                canStartTest
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 cursor-pointer hover:shadow-emerald-500/20 hover:scale-[1.01]'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <PlayCircle className="w-5 h-5" />
              {selectedMode === 'paper1' && 'Start Paper-I Test (50 Qs • 1 Hr)'}
              {selectedMode === 'paper2' && 'Start Paper-II Test (100 Qs • 2 Hrs)'}
              {selectedMode === 'paper1_paper2' && 'Start Combined Test (150 Qs • 3 Hrs)'}
            </button>
          </div>
        </div>
      </section>

      {/* 3 Paper Mode Launch Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Paper-I */}
        <div
          onClick={() => onStartTest(undefined, 'paper1')}
          className="bg-white rounded-2xl p-5 border-2 border-blue-200/80 hover:border-blue-500 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Option A
              </span>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> 1 Hour (60m)
              </span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition">
              Paper-I (General Aptitude)
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Teaching & Research Aptitude, Comprehension, Communication, Mathematical Reasoning, ICT & Higher Education.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">50 Questions • 100 Marks</span>
            <span className="font-bold text-blue-600 flex items-center gap-1">
              Start Test <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Paper-II */}
        <div
          onClick={() => onStartTest(undefined, 'paper2')}
          className="bg-white rounded-2xl p-5 border-2 border-indigo-200/80 hover:border-indigo-500 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                Option B
              </span>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> 2 Hours (120m)
              </span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition">
              Paper-II (Subject Specialization)
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Computer Science & Applications covering all 10 core technical domains (Discrete Math, Architecture, OS, TOC, AI).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">100 Questions • 200 Marks</span>
            <span className="font-bold text-indigo-600 flex items-center gap-1">
              Start Test <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Paper-I + II */}
        <div
          onClick={() => onStartTest(undefined, 'paper1_paper2')}
          className="bg-white rounded-2xl p-5 border-2 border-emerald-200/80 hover:border-emerald-500 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Option C • Full Mock
              </span>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" /> 3 Hours (180m)
              </span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-600 transition">
              Paper-I + Paper-II Combined
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Complete two-section NTA CBT simulation: Section 1 (50 Qs Paper-I) + Section 2 (100 Qs Paper-II).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">150 Questions • 300 Marks</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              Start Test <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </section>

      {/* Unified Candidate Performance Summary */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Overall Performance Summary
              </h2>
              <p className="text-xs text-slate-500">
                Aggregated statistics across all completed mock tests
              </p>
            </div>
          </div>

          {totalAttempts > 0 && (
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Diagnostic Analytics <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Tests Taken</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{totalAttempts}</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Avg Score</div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">{avgScore}</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Best Score</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{bestScore}</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Avg Accuracy</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">{avgAccuracy}%</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Attempted</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{totalQuestionsAttempted}</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Correct</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{totalCorrect}</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Incorrect</div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">{totalIncorrect}</div>
          </div>
        </div>
      </section>

      {/* Lower Section: Recent Attempts & Question Banks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Test Attempts */}
        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-600" />
              <h2 className="font-bold text-base text-slate-900">Recent Test Attempts</h2>
            </div>
            {testAttempts.length > 0 && (
              <button
                onClick={() => onNavigateTab('history')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                View All History <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {testAttempts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Mock Test Attempts Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select Paper-I, Paper-II, or Paper-I+II above to begin your first simulated exam session.
              </p>
              <button
                onClick={() => onStartTest(undefined, 'paper1')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" /> Start Paper-I Test
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {testAttempts.slice(0, 5).map((att) => (
                  <div
                    key={att.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => onViewAttemptResults(att)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {att.question_bank_name}
                        </span>

                        {att.paper_mode === 'paper1' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            Paper-I (50 Qs)
                          </span>
                        )}
                        {att.paper_mode === 'paper2' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                            Paper-II (100 Qs)
                          </span>
                        )}
                        {att.paper_mode === 'paper1_paper2' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Paper-I + II (150 Qs)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{new Date(att.completed_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Time: {formatDetailedTime(att.time_used_seconds)}</span>
                        <span>•</span>
                        <span>Accuracy: <strong>{att.accuracy}%</strong></span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-slate-900">
                        {att.score} <span className="text-xs font-normal text-slate-500">/ {att.max_score}</span>
                      </div>
                      <div className="text-xs font-bold text-blue-600">
                        {att.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right: Available Question Banks */}
        <section className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-600" />
              <h2 className="font-bold text-base text-slate-900">Question Banks</h2>
            </div>
            <button
              onClick={() => onNavigateTab('question-banks')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {questionBanks.map((bank) => {
              const isP2 = bank.paper_type === 'paper2' || bank.name.toLowerCase().includes('paper ii');
              const isEligible = isP2 ? bank.questions.length >= 100 : bank.questions.length >= 50;

              return (
                <div
                  key={bank.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isP2 ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isP2 ? 'Paper-II' : 'Paper-I'}
                        </span>
                        <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">{bank.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {bank.description || 'Uploaded question collection.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">
                      {bank.questions.length} questions
                    </span>

                    <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                      isEligible 
                        ? 'bg-emerald-50 text-emerald-700 font-bold' 
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {isEligible ? 'Ready to Test' : `Needs ${isP2 ? '100+' : '50+'} Qs`}
                    </span>
                  </div>

                  <div className="pt-1">
                    <button
                      disabled={!isEligible}
                      onClick={() => onStartTest(bank.id, isP2 ? 'paper2' : 'paper1')}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        isEligible
                          ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Take {isP2 ? 'Paper-II' : 'Paper-I'} Test
                    </button>
                  </div>
                </div>
              );
            })}

            <div
              onClick={() => onNavigateTab('question-banks')}
              className="bg-slate-50 hover:bg-blue-50/50 border border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-3.5 text-center cursor-pointer transition"
            >
              <Upload className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-800">Upload Paper-I or Paper-II Bank</div>
              <div className="text-[11px] text-slate-500">Supports CSV, XLSX, and JSON formats</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
