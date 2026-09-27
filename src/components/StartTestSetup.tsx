import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  Database, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Award, 
  Layers, 
  ArrowLeft,
  Sparkles,
  FileCheck,
  Check
} from 'lucide-react';
import { QuestionBank, MarkingSchemeConfig, TestPaperMode, PAPER_MODE_DETAILS } from '../types';
import { supabase } from '../utils/supabaseClient';

interface StartTestSetupProps {
  questionBanks: QuestionBank[];
  initialBankId?: string;
  initialPaperMode?: TestPaperMode;
  markingScheme: MarkingSchemeConfig;
  onBeginTest: (paperMode: TestPaperMode, paper1BankId?: string, paper2BankId?: string) => void;
  onCancel: () => void;
  onUploadRedirect: () => void;
}

export const StartTestSetup: React.FC<StartTestSetupProps> = ({
  questionBanks,
  initialBankId,
  initialPaperMode = 'paper1',
  markingScheme,
  onBeginTest,
  onCancel,
  onUploadRedirect,
}) => {
  const [paperMode, setPaperMode] = useState<TestPaperMode>(initialPaperMode);
  const [banksList, setBanksList] = useState<QuestionBank[]>(questionBanks);

  // Bank selection state
  const [selectedPaper1BankId, setSelectedPaper1BankId] = useState<string>('');
  const [selectedPaper2BankId, setSelectedPaper2BankId] = useState<string>('');
  const [confirmedInstructions, setConfirmedInstructions] = useState(true);

  // Fetch or sync question banks
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const { data, error } = await supabase
          .from('question_banks')
          .select('*, questions(*)')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          const merged = [...data];
          questionBanks.forEach(qb => {
            if (!merged.some(mb => mb.id === qb.id || mb.name === qb.name)) {
              merged.push(qb);
            }
          });
          setBanksList(merged);
        } else {
          setBanksList(questionBanks);
        }
      } catch (err) {
        setBanksList(questionBanks);
      }
    };

    fetchBanks();
  }, [questionBanks]);

  // Filter banks by paper type
  const paper1Banks = banksList.filter(b => b.paper_type !== 'paper2' && !b.name.toLowerCase().includes('paper ii'));
  const paper2Banks = banksList.filter(b => b.paper_type === 'paper2' || b.name.toLowerCase().includes('paper ii') || b.questions.length >= 100);

  // Initialize selected bank IDs
  useEffect(() => {
    if (paper1Banks.length > 0 && !selectedPaper1BankId) {
      if (initialBankId && paper1Banks.some(b => b.id === initialBankId)) {
        setSelectedPaper1BankId(initialBankId);
      } else {
        setSelectedPaper1BankId(paper1Banks[0].id);
      }
    }

    if (paper2Banks.length > 0 && !selectedPaper2BankId) {
      if (initialBankId && paper2Banks.some(b => b.id === initialBankId)) {
        setSelectedPaper2BankId(initialBankId);
      } else {
        setSelectedPaper2BankId(paper2Banks[0].id);
      }
    }
  }, [banksList, initialBankId, paper1Banks, paper2Banks]);

  const currentModeDetails = PAPER_MODE_DETAILS[paperMode];

  const selectedP1Bank = banksList.find(b => b.id === selectedPaper1BankId);
  const selectedP2Bank = banksList.find(b => b.id === selectedPaper2BankId);

  const p1QuestionCount = selectedP1Bank?.questions?.length || 0;
  const p2QuestionCount = selectedP2Bank?.questions?.length || 0;

  // Eligibility checks
  const isP1Eligible = p1QuestionCount >= 50;
  const isP2Eligible = p2QuestionCount >= 100;

  let canBegin = false;
  if (paperMode === 'paper1') {
    canBegin = Boolean(selectedPaper1BankId && isP1Eligible);
  } else if (paperMode === 'paper2') {
    canBegin = Boolean(selectedPaper2BankId && isP2Eligible);
  } else if (paperMode === 'paper1_paper2') {
    canBegin = Boolean(selectedPaper1BankId && isP1Eligible && selectedPaper2BankId && isP2Eligible);
  }

  const handleStart = () => {
    if (!canBegin || !confirmedInstructions) return;

    if (paperMode === 'paper1') {
      onBeginTest('paper1', selectedPaper1BankId, undefined);
    } else if (paperMode === 'paper2') {
      onBeginTest('paper2', undefined, selectedPaper2BankId);
    } else {
      onBeginTest('paper1_paper2', selectedPaper1BankId, selectedPaper2BankId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top back button */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
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
              <h1 className="text-xl sm:text-2xl font-bold">Configure UGC-NET Mock Examination</h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Paper-I (1 Hour) • Paper-II (2 Hours) • Paper-I + II Combined (3 Hours)
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Step 1: Select Examination Paper Mode */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                1. Select Examination Paper & Duration:
              </span>
              <span className="text-xs font-normal text-slate-500">Choose one mode</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Option a: Paper-I 1 Hour (One section 50-questions) */}
              <div
                onClick={() => setPaperMode('paper1')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                  paperMode === 'paper1'
                    ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-extrabold text-sm text-slate-900">
                      a) Paper-I Only
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      1 Hour (60m)
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-blue-700 mb-2">
                    One Section • 50 Questions
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    General Teaching & Research Aptitude, Comprehension, Communication, Mathematical Reasoning & ICT.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>Max: 100 Marks</span>
                  {paperMode === 'paper1' && (
                    <span className="text-blue-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </div>
              </div>

              {/* Option b: Paper-II 2 Hours (One section 100-questions) */}
              <div
                onClick={() => setPaperMode('paper2')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                  paperMode === 'paper2'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-extrabold text-sm text-slate-900">
                      b) Paper-II Only
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      2 Hours (120m)
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-indigo-700 mb-2">
                    One Section • 100 Questions
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Subject Specialization (Computer Science & Applications) covering all 10 core technical syllabus domains.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>Max: 200 Marks</span>
                  {paperMode === 'paper2' && (
                    <span className="text-indigo-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </div>
              </div>

              {/* Option c: Paper-I+II 3 Hours (Two Sections 150-questions, 50 for paper-I and 100 for Paper-II) */}
              <div
                onClick={() => setPaperMode('paper1_paper2')}
                className={`p-4 rounded-xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                  paperMode === 'paper1_paper2'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-extrabold text-sm text-slate-900">
                      c) Paper-I + Paper-II
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      3 Hours (180m)
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 mb-2">
                    Two Sections • 150 Questions
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Full NTA CBT Simulation: Section 1 (50 Qs Paper-I) and Section 2 (100 Qs Paper-II) with uninterrupted timer.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>Max: 300 Marks</span>
                  {paperMode === 'paper1_paper2' && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Question Bank Selection according to Mode */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              2. Select Question Bank Source:
            </h2>

            {/* Paper-I Bank Selection (Shown in paper1 or paper1_paper2 mode) */}
            {(paperMode === 'paper1' || paperMode === 'paper1_paper2') && (
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                      1
                    </span>
                    {paperMode === 'paper1_paper2' ? 'Section 1: Paper-I Question Bank (50 Questions Required)' : 'Select Paper-I Question Bank'}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Selected Bank has: <strong>{p1QuestionCount}</strong> Qs
                  </span>
                </div>

                <select
                  value={selectedPaper1BankId}
                  onChange={(e) => setSelectedPaper1BankId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paper1Banks.length === 0 ? (
                    <option value="">No Paper-I banks available</option>
                  ) : (
                    paper1Banks.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.questions?.length || 0} Questions)
                      </option>
                    ))
                  )}
                </select>

                {selectedP1Bank && !isP1Eligible && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Insufficient Questions:</strong> This bank has only {p1QuestionCount} questions. At least 50 questions are required for Paper-I.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paper-II Bank Selection (Shown in paper2 or paper1_paper2 mode) */}
            {(paperMode === 'paper2' || paperMode === 'paper1_paper2') && (
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                      {paperMode === 'paper1_paper2' ? '2' : '1'}
                    </span>
                    {paperMode === 'paper1_paper2' ? 'Section 2: Paper-II Question Bank (100 Questions Required)' : 'Select Paper-II Question Bank'}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Selected Bank has: <strong>{p2QuestionCount}</strong> Qs
                  </span>
                </div>

                <select
                  value={selectedPaper2BankId}
                  onChange={(e) => setSelectedPaper2BankId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {paper2Banks.length === 0 ? (
                    <option value="">No Paper-II banks available</option>
                  ) : (
                    paper2Banks.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.questions?.length || 0} Questions)
                      </option>
                    ))
                  )}
                </select>

                {selectedP2Bank && !isP2Eligible && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Insufficient Questions:</strong> This bank has only {p2QuestionCount} questions. At least 100 questions are required for Paper-II.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Exam Structure & Parameters */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              3. Examination Parameters for {currentModeDetails.title}:
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 font-medium">Total Questions</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {currentModeDetails.questionCount}
                </div>
                <div className="text-[11px] text-slate-500">
                  {currentModeDetails.sectionsCount === 1 ? '1 Section' : '2 Sections (50 + 100)'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 font-medium">Duration</div>
                <div className="text-xl font-extrabold text-blue-600 mt-1">
                  {currentModeDetails.durationLabel}
                </div>
                <div className="text-[11px] text-slate-500">{currentModeDetails.durationMinutes} Minutes total</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 font-medium">Maximum Marks</div>
                <div className="text-xl font-extrabold text-emerald-600 mt-1">
                  {currentModeDetails.maxMarks}
                </div>
                <div className="text-[11px] text-slate-500">+2 per correct</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 font-medium">Negative Marking</div>
                <div className="text-xl font-extrabold text-slate-700 mt-1">
                  {markingScheme.negative_marks_per_incorrect > 0 
                    ? `-${markingScheme.negative_marks_per_incorrect}` 
                    : '0 (None)'}
                </div>
                <div className="text-[11px] text-slate-500">No penalty</div>
              </div>
            </div>
          </div>

          {/* Step 4: Important Examination Instructions */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              4. Important Examination Instructions:
            </h2>
            <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2.5 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900">•</span>
                <span>
                  <strong>Structure:</strong>{' '}
                  {paperMode === 'paper1' && 'Paper-I contains 50 objective-type MCQs covering General Teaching and Research Aptitude.'}
                  {paperMode === 'paper2' && 'Paper-II contains 100 objective-type MCQs covering Computer Science & Applications across all 10 core syllabus units.'}
                  {paperMode === 'paper1_paper2' && 'This test replicates the full official UGC-NET examination with 150 questions across two distinct sections: Section 1 (Paper-I: 50 Qs) and Section 2 (Paper-II: 100 Qs).'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900">•</span>
                <span>
                  <strong>Section Switching:</strong>{' '}
                  {paperMode === 'paper1_paper2'
                    ? 'You can freely switch between Section 1 (Paper-I) and Section 2 (Paper-II) at any point during the 3 hours using the Section Tabs in the exam header.'
                    : 'All questions belong to a single comprehensive section.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900">•</span>
                <span>
                  <strong>Timer & Warnings:</strong> The countdown timer will run for <strong>{currentModeDetails.durationLabel}</strong>. Warning banners will appear as the time runs down, and the exam will auto-submit when the clock expires.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900">•</span>
                <span>
                  <strong>Crash Protection:</strong> Your answers, current question, marked status, and elapsed time are auto-saved locally every second. Accidental page refresh will safely resume without losing state.
                </span>
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
              <span>I have read and understood all the examination rules and module instructions.</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={!canBegin || !confirmedInstructions}
              onClick={handleStart}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                canBegin && confirmedInstructions
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 cursor-pointer hover:shadow-emerald-500/25 scale-[1.01]'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <PlayCircle className="w-5 h-5" />
              {paperMode === 'paper1' && 'Start Paper-I Examination (50 Questions • 1 Hour)'}
              {paperMode === 'paper2' && 'Start Paper-II Examination (100 Questions • 2 Hours)'}
              {paperMode === 'paper1_paper2' && 'Start Combined Examination (150 Questions • 3 Hours • Two Sections)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};