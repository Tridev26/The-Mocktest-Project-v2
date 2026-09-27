import React, { useState } from 'react';
import { 
  History as HistoryIcon, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Trash2, 
  ArrowLeft, 
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { TestAttempt } from '../types';
import { formatDetailedTime } from '../utils/testEngine';

interface HistoryViewProps {
  attempts: TestAttempt[];
  onViewAttempt: (attempt: TestAttempt) => void;
  onDeleteAttempt: (id: string) => void;
  onClearAll: () => void;
  onStartNewTest: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  attempts,
  onViewAttempt,
  onDeleteAttempt,
  onClearAll,
  onStartNewTest,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <HistoryIcon className="w-7 h-7 text-blue-600" />
            Mock Test Attempt History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete record of your past simulated UGC-NET Paper I examinations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {attempts.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-3 py-2 rounded-lg border border-rose-200 hover:bg-rose-50 transition"
            >
              Clear All History
            </button>
          )}

          <button
            onClick={onStartNewTest}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow flex items-center gap-1.5"
          >
            <PlayCircle className="w-4 h-4" /> Start New Test
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">Clear All Test History?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action will permanently delete all past mock test attempts and historical scoring records.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-1.5 rounded-lg border text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attempts Table / Cards */}
      {attempts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">No Previous Attempts Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you complete a 50-question mock test, your complete answers, score, and explanations will be stored here permanently.
          </p>
          <button
            onClick={onStartNewTest}
            className="mt-2 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
          >
            <PlayCircle className="w-4 h-4" /> Start Mock Test
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Test Date</th>
                  <th className="py-3 px-4">Question Bank</th>
                  <th className="py-3 px-3 text-center">Score</th>
                  <th className="py-3 px-3 text-center">Accuracy</th>
                  <th className="py-3 px-3 text-center">Correct / Wrong</th>
                  <th className="py-3 px-3 text-center">Time Used</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {new Date(attempt.completed_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(attempt.completed_at).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-semibold text-slate-900 max-w-xs">
                      <div className="truncate">{attempt.question_bank_name}</div>
                      <div className="mt-1">
                        {attempt.paper_mode === 'paper1' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            Paper-I (50 Qs)
                          </span>
                        )}
                        {attempt.paper_mode === 'paper2' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                            Paper-II (100 Qs)
                          </span>
                        )}
                        {attempt.paper_mode === 'paper1_paper2' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Paper-I + II (150 Qs)
                          </span>
                        )}
                        {!attempt.paper_mode && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            Paper-I
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      <div className="font-black text-slate-900 text-sm">
                        {attempt.score} <span className="text-[11px] font-normal text-slate-500">/ {attempt.max_score}</span>
                      </div>
                      <div className="text-[11px] font-bold text-blue-600">
                        {attempt.percentage}%
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center font-bold text-blue-600">
                      {attempt.accuracy}%
                    </td>

                    <td className="py-4 px-3 text-center whitespace-nowrap">
                      <span className="text-emerald-700 font-bold">{attempt.correct_count}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-rose-700 font-bold">{attempt.incorrect_count}</span>
                      <span className="text-slate-400 text-[10px] block">
                        ({attempt.unattempted_count} skipped)
                      </span>
                    </td>

                    <td className="py-4 px-3 text-center font-mono text-xs text-slate-600 whitespace-nowrap">
                      {formatDetailedTime(attempt.time_used_seconds)}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewAttempt(attempt)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                          title="View Complete Test Answers & Review"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Detailed Results
                        </button>

                        <button
                          onClick={() => onDeleteAttempt(attempt.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition"
                          title="Delete Attempt Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
