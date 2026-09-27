import React, { useState } from 'react';
import { 
  Settings, 
  Award, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  Plus, 
  ShieldAlert, 
  Database, 
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { MarkingSchemeConfig, QuestionBank, Question } from '../types';
import { DEFAULT_MARKING_SCHEME } from '../utils/storage';

interface AdminSettingsViewProps {
  markingScheme: MarkingSchemeConfig;
  onUpdateMarkingScheme: (newConfig: MarkingSchemeConfig) => void;
  questionBanks: QuestionBank[];
  onAddQuestionToBank: (bankId: string, question: Question) => void;
  onRestoreDefaultBank: () => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  markingScheme,
  onUpdateMarkingScheme,
  questionBanks,
  onAddQuestionToBank,
  onRestoreDefaultBank,
}) => {
  const [marksPerCorrect, setMarksPerCorrect] = useState<number>(markingScheme.marks_per_correct);
  const [negativeMarks, setNegativeMarks] = useState<number>(markingScheme.negative_marks_per_incorrect);
  const [durationMinutes, setDurationMinutes] = useState<number>(markingScheme.test_duration_minutes);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Manual Question Addition state
  const [targetBankId, setTargetBankId] = useState<string>(
    questionBanks.length > 0 ? questionBanks[0].id : ''
  );
  const [qText, setQText] = useState<string>('');
  const [optA, setOptA] = useState<string>('');
  const [optB, setOptB] = useState<string>('');
  const [optC, setOptC] = useState<string>('');
  const [optD, setOptD] = useState<string>('');
  const [correctKey, setCorrectKey] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [unit, setUnit] = useState<string>('Teaching Aptitude');
  const [topic, setTopic] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [addNotice, setAddNotice] = useState<string | null>(null);

  const handleSaveMarkingScheme = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: MarkingSchemeConfig = {
      marks_per_correct: Number(marksPerCorrect),
      negative_marks_per_incorrect: Number(negativeMarks),
      test_duration_minutes: Number(durationMinutes),
      questions_per_test: 50,
    };
    onUpdateMarkingScheme(newConfig);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleResetMarkingDefaults = () => {
    setMarksPerCorrect(DEFAULT_MARKING_SCHEME.marks_per_correct);
    setNegativeMarks(DEFAULT_MARKING_SCHEME.negative_marks_per_incorrect);
    setDurationMinutes(DEFAULT_MARKING_SCHEME.test_duration_minutes);
    onUpdateMarkingScheme(DEFAULT_MARKING_SCHEME);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBankId) {
      alert('Please select a target question bank.');
      return;
    }
    if (!qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      alert('Please fill in the question text and all 4 options.');
      return;
    }

    const targetBank = questionBanks.find(b => b.id === targetBankId);
    const newQuestion: Question = {
      id: `manual-q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      question_text: qText.trim(),
      option_a: optA.trim(),
      option_b: optB.trim(),
      option_c: optC.trim(),
      option_d: optD.trim(),
      correct_answer: correctKey,
      explanation: explanation.trim() || undefined,
      unit: unit.trim() || (targetBank?.paper_type === 'paper2' ? 'Computer Science Subject' : 'Paper I General'),
      topic: topic.trim() || 'General',
      difficulty: difficulty,
      paper_type: targetBank?.paper_type || 'paper1',
    };

    onAddQuestionToBank(targetBankId, newQuestion);
    setAddNotice('Question successfully added to bank!');
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setExplanation('');
    setTopic('');
    setTimeout(() => setAddNotice(null), 3500);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-slate-700" />
          Administration & Exam Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure marking scheme, add questions manually, and manage system datasets
        </p>
      </div>

      {/* Section 1: Configurable Scoring Scheme (Requirement 8) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Scoring Scheme & Exam Rules
            </h2>
            <p className="text-xs text-slate-500">
              Values are applied to newly generated mock tests and calculations.
            </p>
          </div>
          <button
            onClick={handleResetMarkingDefaults}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restore UGC Default (+2, 0)
          </button>
        </div>

        <form onSubmit={handleSaveMarkingScheme} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Marks Per Correct Answer:
              </label>
              <input
                type="number"
                step="0.25"
                min="0.5"
                max="10"
                value={marksPerCorrect}
                onChange={(e) => setMarksPerCorrect(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard UGC-NET: <strong>+2 marks</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Negative Marks Per Incorrect:
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="5"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard UGC-NET: <strong>0 (No penalty)</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Test Duration (Minutes):
              </label>
              <input
                type="number"
                min="10"
                max="180"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                className="w-full text-sm font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard UGC-NET: <strong>60 minutes</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {savedNotice && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Marking scheme successfully saved!
                </span>
              )}
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </section>

      {/* Section 2: Add Single Question Manually (Requirement 15) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            Add Single Question to Question Bank
          </h2>
          <p className="text-xs text-slate-500">
            Create or edit individual questions with custom answer keys and explanations.
          </p>
        </div>

        {addNotice && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {addNotice}
          </div>
        )}

        <form onSubmit={handleCreateQuestion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Question Bank:
              </label>
              <select
                value={targetBankId}
                onChange={(e) => setTargetBankId(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              >
                {questionBanks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.questions.length} Qs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UGC-NET Paper I Unit:
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="Teaching Aptitude">Teaching Aptitude</option>
                <option value="Research Aptitude">Research Aptitude</option>
                <option value="Reading Comprehension">Reading Comprehension</option>
                <option value="Communication">Communication</option>
                <option value="Mathematical Reasoning & Aptitude">Mathematical Reasoning & Aptitude</option>
                <option value="Logical Reasoning">Logical Reasoning</option>
                <option value="Data Interpretation">Data Interpretation</option>
                <option value="Information and Communication Technology (ICT)">ICT</option>
                <option value="People, Development and Environment">People & Environment</option>
                <option value="Higher Education System">Higher Education System</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Topic / Concept:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Sampling Methods"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Question Text:
            </label>
            <textarea
              rows={3}
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Enter full question statement..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Option A:</label>
              <input
                type="text"
                value={optA}
                onChange={(e) => setOptA(e.target.value)}
                placeholder="Content for Option A"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Option B:</label>
              <input
                type="text"
                value={optB}
                onChange={(e) => setOptB(e.target.value)}
                placeholder="Content for Option B"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Option C:</label>
              <input
                type="text"
                value={optC}
                onChange={(e) => setOptC(e.target.value)}
                placeholder="Content for Option C"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Option D:</label>
              <input
                type="text"
                value={optD}
                onChange={(e) => setOptD(e.target.value)}
                placeholder="Content for Option D"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Correct Answer:
              </label>
              <div className="flex items-center gap-3 pt-1">
                {(['A', 'B', 'C', 'D'] as const).map((key) => (
                  <label key={key} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="correct_answer_radio"
                      checked={correctKey === key}
                      onChange={() => setCorrectKey(key)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Option {key}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Difficulty:
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Explanation / Solution (Optional):
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Why this answer is correct..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Question to Bank
            </button>
          </div>
        </form>
      </section>

      {/* Section 3: Reset / Restore Default Data */}
      <section className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-600" />
              Restore Default UGC-NET Question Bank
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Reset or reload the 65-question authentic UGC-NET Paper I standard question bank covering all 10 syllabus modules.
            </p>
          </div>

          <button
            onClick={() => {
              if (confirm('Restore the default UGC-NET Paper I question bank?')) {
                onRestoreDefaultBank();
              }
            }}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-sm"
          >
            Reload Default Bank
          </button>
        </div>
      </section>
    </div>
  );
};
