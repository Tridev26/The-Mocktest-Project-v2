import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  Database, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  Layers, 
  ArrowLeft 
} from 'lucide-react';
import { QuestionBank, MarkingSchemeConfig } from '../types';
import { supabase } from '../utils/supabaseClient';

interface StartTestSetupProps {
  questionBanks: QuestionBank[];
  initialBankId?: string;
  markingScheme: MarkingSchemeConfig;
  onBeginTest: (bankId: string) => void;
  onCancel: () => void;
  onUploadRedirect: () => void;
}

export const StartTestSetup: React.FC<StartTestSetupProps> = ({
  initialBankId,
  markingScheme,
  onBeginTest,
  onCancel,
  onUploadRedirect,
}) => {
  const [liveBanks, setLiveBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>(initialBankId || '');
  const [confirmedInstructions, setConfirmedInstructions] = useState(true);

  // Fetch from Supabase when the component loads
  useEffect(() => {
    const fetchBanks = async () => {
      // We select the banks AND count their related questions
      const { data, error } = await supabase
        .from('question_banks')
        .select('*, questions(id)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching banks:', error);
      } else if (data) {
        setLiveBanks(data);
        if (data.length > 0 && !initialBankId) {
          setSelectedBankId(data[0].id);
        }
      }
    };

    fetchBanks();
  }, [initialBankId]);

  const selectedBank = liveBanks.find(b => b.id === selectedBankId);
  const questionCount = selectedBank && selectedBank.questions ? selectedBank.questions.length : 0;
  const isEligible = questionCount >= 50;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top back button */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="bg-slate-900 text-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <PlayCircle className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Start UGC-NET Paper I Mock Test</h1>
              <p className="text-xs sm:text-sm text-slate-300">50 Questions • 60 Minutes • Simulated Exam Engine</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Step 1: Select Question Bank */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              1. Select Question Bank:
            </label>

            {liveBanks.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                No question banks found. Please upload a question bank first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {liveBanks.map((bank) => {
                  const hasEnough = (bank.questions?.length || 0) >= 50;
                  const isSelected = bank.id === selectedBankId;
                  return (
                    <div
                      key={bank.id}
                      onClick={() => setSelectedBankId(bank.id)}
                      className={`p-4 rounded-xl border-2 transition cursor-pointer relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-sm text-slate-900">{bank.name}</div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          hasEnough 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {bank.questions?.length || 0} Questions
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {bank.description || 'Uploaded question bank collection.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Validation Message if bank has < 50 questions */}
            {selectedBank && !isEligible && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 mt-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <div className="font-bold">Insufficient Questions</div>
                  <p className="mt-0.5">
                    "This question bank does not contain enough valid questions to create a 50-question mock test."
                  </p>
                  <p className="mt-1 text-xs text-rose-700">
                    Currently available: <strong>{questionCount}</strong> valid questions. Exactly 50 are required for a standard UGC-NET Paper I test.
                  </p>
                  <button
                    onClick={onUploadRedirect}
                    className="mt-2 text-xs font-semibold text-rose-900 underline hover:text-rose-950"
                  >
                    Upload more questions to this bank or choose another bank →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Exam Structure & Parameters */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              2. Test Structure & Marking Scheme:
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 font-medium">Total Questions</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">50</div>
                <div className="text-[11px] text-slate-500">Randomized Order</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 font-medium">Duration</div>
                <div className="text-xl font-extrabold text-blue-600 mt-1">
                  {markingScheme.test_duration_minutes} Mins
                </div>
                <div className="text-[11px] text-slate-500">Auto-submit at 00:00</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 font-medium">Correct Mark</div>
                <div className="text-xl font-extrabold text-emerald-600 mt-1">
                  +{markingScheme.marks_per_correct}
                </div>
                <div className="text-[11px] text-slate-500">Per question</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 font-medium">Negative Mark</div>
                <div className="text-xl font-extrabold text-rose-600 mt-1">
                  {markingScheme.negative_marks_per_incorrect > 0 
                    ? `-${markingScheme.negative_marks_per_incorrect}` 
                    : '0 (None)'}
                </div>
                <div className="text-[11px] text-slate-500">Per wrong answer</div>
              </div>
            </div>
          </div>

          {/* Step 3: Instructions */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              3. Important Examination Instructions:
            </h2>
            <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2.5 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900">•</span>
                <span>The mock test consists of <strong>50 objective-type multiple-choice questions</strong> spanning UGC-NET Paper I.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900">•</span>
                <span>A continuous <strong>60-minute countdown timer</strong> starts as soon as you begin. Time warnings will be displayed at <strong>15 minutes, 5 minutes, and 1 minute</strong> remaining.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900">•</span>
                <span><strong>Test Safety:</strong> If you accidentally refresh the page or close your browser, your answers, timer, and visited status will be automatically preserved.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900">•</span>
                <span>Use the <strong>Question Palette</strong> to jump directly to any question. You can use <strong>"Mark for Review"</strong> to flag questions you wish to reconsider later.</span>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer text-xs sm:text-sm text-slate-800 font-medium">
              <input
                type="checkbox"
                checked={confirmedInstructions}
                onChange={(e) => setConfirmedInstructions(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>I have read and understood all the instructions and examination rules.</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              disabled={!isEligible || !confirmedInstructions}
              onClick={() => isEligible && onBeginTest(selectedBankId)}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                isEligible && confirmedInstructions
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 cursor-pointer hover:shadow-emerald-500/25 scale-[1.01]'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <PlayCircle className="w-5 h-5" />
              Start 50-Question Examination
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};