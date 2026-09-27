import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Target, 
  Layers, 
  BookOpen, 
  Award,
  Zap
} from 'lucide-react';
import { TestAttempt } from '../types';
import { computeUnitStatistics, formatDetailedTime } from '../utils/testEngine';

interface AnalyticsViewProps {
  currentAttempt?: TestAttempt;
  allAttempts: TestAttempt[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  currentAttempt,
  allAttempts,
}) => {
  // If no specific current attempt is passed, use the latest attempt if available
  const activeAttempt = currentAttempt || (allAttempts.length > 0 ? allAttempts[0] : null);

  // Unit-wise analysis for active attempt
  const unitStats = activeAttempt ? computeUnitStatistics(activeAttempt.attempt_questions) : [];

  // Average time per question
  const avgTimePerQuestion = activeAttempt && activeAttempt.total_questions > 0
    ? Math.round(activeAttempt.time_used_seconds / activeAttempt.total_questions)
    : 0;

  // Historical progression sorted chronologically (oldest to newest)
  const chronologicalAttempts = [...allAttempts].reverse();

  // Aggregate metrics
  const totalTests = allAttempts.length;
  let totalScoreSum = 0;
  let highestScore = 0;
  let totalAccuracySum = 0;

  allAttempts.forEach(a => {
    totalScoreSum += a.score;
    if (a.score > highestScore) highestScore = a.score;
    totalAccuracySum += a.accuracy;
  });

  const overallAvgScore = totalTests > 0 ? Math.round((totalScoreSum / totalTests) * 10) / 10 : 0;
  const overallAvgAccuracy = totalTests > 0 ? Math.round((totalAccuracySum / totalTests) * 10) / 10 : 0;
  const latestScore = allAttempts.length > 0 ? allAttempts[0].score : 0;

  return (
    <div className="space-y-8">
      {/* Title & Overview Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Performance Analytics & Diagnostic Insights</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {activeAttempt
                ? `Evaluation of ${activeAttempt.question_bank_name} • ${new Date(activeAttempt.completed_at).toLocaleDateString()}`
                : 'Overall Candidate Progress'}
            </p>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="text-xs text-slate-400">Recent Score</div>
            <div className="text-2xl font-black text-white mt-1">
              {latestScore} <span className="text-xs font-normal text-slate-400">/ {activeAttempt?.max_score || 100}</span>
            </div>
            <div className="text-[11px] text-blue-400 mt-0.5">Latest test</div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="text-xs text-slate-400">Average Score</div>
            <div className="text-2xl font-black text-indigo-300 mt-1">
              {overallAvgScore}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across {totalTests} attempts</div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="text-xs text-slate-400">Best Score</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {highestScore}
            </div>
            <div className="text-[11px] text-emerald-300 mt-0.5">Highest achieved</div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="text-xs text-slate-400">Average Accuracy</div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {overallAvgAccuracy}%
            </div>
            <div className="text-[11px] text-amber-300 mt-0.5">Precision rate</div>
          </div>
        </div>
      </div>

      {activeAttempt && (
        <>
          {/* Active Test Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Time Efficiency */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Clock className="w-4 h-4 text-blue-600" /> Time Metrics
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatDetailedTime(activeAttempt.time_used_seconds)}
              </div>
              <p className="text-xs text-slate-500">
                Total time taken out of 60 minutes.
              </p>
              <div className="pt-2 text-xs font-semibold text-slate-700 flex items-center justify-between border-t border-slate-100">
                <span>Avg per question:</span>
                <span className="font-mono text-blue-600">{avgTimePerQuestion} seconds</span>
              </div>
            </div>

            {/* Answer Distribution */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Target className="w-4 h-4 text-emerald-600" /> Answer Quality
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-emerald-700 font-medium">Correct:</span>
                  <span className="font-bold">{activeAttempt.correct_count} ({(activeAttempt.correct_count / 50 * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-700 font-medium">Incorrect:</span>
                  <span className="font-bold">{activeAttempt.incorrect_count} ({(activeAttempt.incorrect_count / 50 * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Unattempted:</span>
                  <span className="font-bold">{activeAttempt.unattempted_count} ({(activeAttempt.unattempted_count / 50 * 100).toFixed(0)}%)</span>
                </div>
              </div>
            </div>

            {/* Exam Diagnostic */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Zap className="w-4 h-4 text-amber-500" /> Diagnostic Summary
              </div>
              <div className="text-base font-bold text-slate-900">
                {activeAttempt.accuracy >= 75
                  ? 'Strong Conceptual Foundation'
                  : activeAttempt.accuracy >= 60
                  ? 'Satisfactory with Room for Speed'
                  : 'Revision Needed on Weak Units'}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review the unit-wise matrix below to identify specific topics requiring targeted revision.
              </p>
            </div>
          </div>

          {/* Unit-Wise Performance Table (Requirement 11) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Unit-Wise Performance Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed breakdown by UGC-NET Paper I syllabus modules
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
                {unitStats.length} Units Tested
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Unit / Subject</th>
                    <th className="py-3 px-3 text-center">Questions</th>
                    <th className="py-3 px-3 text-center">Attempted</th>
                    <th className="py-3 px-3 text-center">Correct</th>
                    <th className="py-3 px-3 text-center">Incorrect</th>
                    <th className="py-3 px-4 text-right">Accuracy %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {unitStats.map((item) => {
                    const accuracyColor =
                      item.accuracy >= 70
                        ? 'text-emerald-700 font-bold'
                        : item.accuracy >= 50
                        ? 'text-amber-700 font-bold'
                        : 'text-rose-700 font-bold';

                    return (
                      <tr key={item.unit} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                          {item.unit}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono">{item.total}</td>
                        <td className="py-3.5 px-3 text-center font-mono">{item.attempted}</td>
                        <td className="py-3.5 px-3 text-center font-mono text-emerald-600 font-bold">
                          {item.correct}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-rose-600">
                          {item.incorrect}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={accuracyColor}>{item.accuracy}%</span>
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                              <div
                                style={{ width: `${item.accuracy}%` }}
                                className={`h-full ${
                                  item.accuracy >= 70
                                    ? 'bg-emerald-500'
                                    : item.accuracy >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Progress Over Time (Requirement 13) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Score & Accuracy Progression Across Attempts
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical learning curve tracking your preparation trajectory
          </p>
        </div>

        {chronologicalAttempts.length < 2 ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            Take at least 2 mock tests to unlock your historical score progression curve.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {chronologicalAttempts.map((att, idx) => (
                <div
                  key={att.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center hover:bg-blue-50/50 transition"
                >
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Test #{idx + 1}
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {att.score}
                    <span className="text-[11px] font-normal text-slate-500">/100</span>
                  </div>
                  <div className="text-xs text-blue-600 font-bold mt-0.5">
                    {att.percentage}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Acc: {att.accuracy}%
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Bar Progression */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-slate-600">Visual Comparison:</div>
              <div className="space-y-2">
                {chronologicalAttempts.map((att, idx) => (
                  <div key={att.id} className="flex items-center gap-3 text-xs">
                    <span className="w-14 font-semibold text-slate-500">Test {idx + 1}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(5, att.percentage))}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                      />
                    </div>
                    <span className="w-12 text-right font-bold text-slate-900 font-mono">
                      {att.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
