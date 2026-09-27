import React, { useState, useRef } from 'react';
import { 
  Database, 
  Upload, 
  FileSpreadsheet, 
  FileJson, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Trash2, 
  Eye, 
  PlayCircle, 
  Plus, 
  Search, 
  Filter,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { QuestionBank, Question, ParseValidationResult } from '../types';
import { 
  parseFile, 
  validateAndParseRows,
  downloadSampleCSV, 
  downloadSampleXLSX, 
  downloadSampleJSON 
} from '../utils/questionParser';
import { ExcelArchiveUploader } from './ExcelArchiveUploader';

interface QuestionBankViewProps {
  questionBanks: QuestionBank[];
  onAddQuestionBank: (newBank: QuestionBank) => void;
  onDeleteQuestionBank: (bankId: string) => void;
  onStartTestWithBank: (bankId: string) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questionBanks,
  onAddQuestionBank,
  onDeleteQuestionBank,
  onStartTestWithBank,
}) => {
  const [uploadMode, setUploadMode] = useState<'supabase-excel' | 'classic'>('supabase-excel');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [bankName, setBankName] = useState<string>('');
  const [bankDescription, setBankDescription] = useState<string>('');
  const [bankPaperType, setBankPaperType] = useState<'paper1' | 'paper2'>('paper1');
  const [bankSubject, setBankSubject] = useState<string>('');
  const [bankFilter, setBankFilter] = useState<'all' | 'paper1' | 'paper2'>('all');
  const [validationResult, setValidationResult] = useState<ParseValidationResult | null>(null);
  const [activeFileName, setActiveFileName] = useState<string>('');
  const [inspectBank, setInspectBank] = useState<QuestionBank | null>(null);
  const [inspectSearch, setInspectSearch] = useState<string>('');
  const [inspectUnit, setInspectUnit] = useState<string>('all');
  const [pasteModalOpen, setPasteModalOpen] = useState<boolean>(false);
  const [pastedJsonText, setPastedJsonText] = useState<string>('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setActiveFileName(file.name);
    try {
      const result = await parseFile(file);
      setValidationResult(result);
      if (!bankName) {
        // Auto-populate bank name from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setBankName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    } catch (err: any) {
      alert(`Error reading file: ${err.message || 'Corrupt format'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveBank = () => {
    if (!validationResult || validationResult.valid.length === 0) return;
    if (!bankName.trim()) {
      alert('Please provide a name for this question bank.');
      return;
    }

    const newBank: QuestionBank = {
      id: `bank-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: bankName.trim(),
      description: bankDescription.trim() || `Uploaded with ${validationResult.valid.length} questions from ${activeFileName}`,
      uploaded_by: 'User',
      created_at: new Date().toISOString(),
      question_count: validationResult.valid.length,
      questions: validationResult.valid.map(q => ({ ...q, paper_type: bankPaperType })),
      paper_type: bankPaperType,
      subject: bankSubject.trim() || (bankPaperType === 'paper2' ? 'Subject Specialization' : 'General Paper I'),
    };

    onAddQuestionBank(newBank);
    // Reset form
    setValidationResult(null);
    setBankName('');
    setBankDescription('');
    setBankSubject('');
    setActiveFileName('');
  };

  const handleParsePastedJson = () => {
    setPasteError(null);
    try {
      const parsed = JSON.parse(pastedJsonText);
      const rows = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.questions) ? parsed.questions : [parsed]);
      const result = validateAndParseRows(rows);
      setValidationResult(result);
      setActiveFileName('Pasted JSON Content');
      if (!bankName) setBankName('Custom Question Bank');
      setPasteModalOpen(false);
      setPastedJsonText('');
    } catch (e: any) {
      setPasteError(`JSON Syntax Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Database className="w-7 h-7 text-indigo-600" />
            Question Bank Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Import, validate, and manage UGC-NET Paper I question banks in CSV, Excel, or JSON
          </p>
        </div>

        {/* Sample Download Links */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Templates:</span>
          <button
            onClick={downloadSampleCSV}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-300"
            title="Download CSV Template"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={downloadSampleXLSX}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition border border-emerald-300"
            title="Download Excel Template"
          >
            <Download className="w-3.5 h-3.5" /> Excel (XLSX)
          </button>
          <button
            onClick={downloadSampleJSON}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold transition border border-indigo-300"
            title="Download JSON Template"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
        </div>
      </div>

      {/* Upload Mode Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setUploadMode('supabase-excel')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs ${
            uploadMode === 'supabase-excel'
              ? 'bg-slate-900 text-white ring-2 ring-emerald-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>10-Year Archives (Supabase Pipeline)</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold ml-1">
            New
          </span>
        </button>

        <button
          type="button"
          onClick={() => setUploadMode('classic')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
            uploadMode === 'classic'
              ? 'bg-slate-900 text-white shadow-xs ring-2 ring-blue-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Upload className="w-4 h-4 text-blue-400" />
          <span>Standard File Importer (CSV/XLSX/JSON)</span>
        </button>
      </div>

      {/* Render 10-Year Excel & Supabase Pipeline Component */}
      {uploadMode === 'supabase-excel' && (
        <ExcelArchiveUploader onSuccessUpload={onAddQuestionBank} />
      )}

      {/* Upload & Validation Section (Classic Importer) */}
      {uploadMode === 'classic' && (
      <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Upload New Question Bank
            </h2>
            <p className="text-xs text-slate-500">
              Files are automatically parsed and strictly validated before import.
            </p>
          </div>

          <button
            onClick={() => setPasteModalOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" /> Paste JSON Directly
          </button>
        </div>

        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition space-y-3"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv, .xlsx, .xls, .json"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900">
              Click to browse or drop your question bank file here
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Supports CSV, Excel (.xlsx, .xls), and JSON with Question, Options A-D, and Correct Answer
            </div>
          </div>
        </div>

        {/* Validation Inspection Report (Requirement 3: Number imported, valid, invalid, duplicates, status) */}
        {validationResult && (
          <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Validation Report for:</span>
                <span className="text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded text-xs">
                  {activeFileName}
                </span>
              </div>
              <button
                onClick={() => setValidationResult(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">Total Rows Read</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {validationResult.totalParsed}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200">
                <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid Questions
                </div>
                <div className="text-xl font-bold text-emerald-700 mt-1">
                  {validationResult.valid.length}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-rose-200">
                <div className="text-xs text-rose-700 font-medium flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Invalid Excluded
                </div>
                <div className="text-xl font-bold text-rose-700 mt-1">
                  {validationResult.invalid.length}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <div className="text-xs text-amber-700 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Duplicates
                </div>
                <div className="text-xl font-bold text-amber-700 mt-1">
                  {validationResult.duplicates.length}
                </div>
              </div>
            </div>

            {/* List of invalid questions if any */}
            {validationResult.invalid.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Excluded Rows ({validationResult.invalid.length}):
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2">
                  {validationResult.invalid.slice(0, 10).map((inv, i) => (
                    <div key={i} className="bg-white/80 p-2 rounded border border-rose-200 text-rose-800">
                      <strong>Row {inv.row}:</strong> {inv.reason}
                    </div>
                  ))}
                  {validationResult.invalid.length > 10 && (
                    <div className="text-slate-500 italic">
                      + {validationResult.invalid.length - 10} more invalid rows excluded.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Input Details to Save Bank */}
            {validationResult.valid.length > 0 ? (
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Paper Module Type:
                    </label>
                    <select
                      value={bankPaperType}
                      onChange={(e) => setBankPaperType(e.target.value as 'paper1' | 'paper2')}
                      className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      <option value="paper1">Paper-I (General Aptitude)</option>
                      <option value="paper2">Paper-II (Subject Specialization)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Question Bank Title:
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder={bankPaperType === 'paper2' ? 'e.g. UGC-NET Paper II — Computer Science' : 'e.g. UGC-NET Paper I — Practice Set 2026'}
                      className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subject / Discipline (Optional):
                    </label>
                    <input
                      type="text"
                      value={bankSubject}
                      onChange={(e) => setBankSubject(e.target.value)}
                      placeholder={bankPaperType === 'paper2' ? 'e.g. Computer Science & Applications' : 'e.g. General Teaching & Research'}
                      className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description (Optional):
                  </label>
                  <input
                    type="text"
                    value={bankDescription}
                    onChange={(e) => setBankDescription(e.target.value)}
                    placeholder="e.g. 100 questions covering core syllabus domains"
                    className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    {validationResult.valid.length >= (bankPaperType === 'paper2' ? 100 : 50) ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Sufficient questions ({validationResult.valid.length}) to generate {bankPaperType === 'paper2' ? '100-Q Paper-II' : '50-Q Paper-I'} tests.
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <Info className="w-4 h-4 text-amber-600" />
                        Contains {validationResult.valid.length} questions ({bankPaperType === 'paper2' ? '100 needed for Paper-II' : '50 needed for Paper-I'}).
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleSaveBank}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition shadow flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Save {bankPaperType === 'paper2' ? 'Paper-II' : 'Paper-I'} Bank
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-rose-700 font-semibold">
                No valid questions could be extracted from this file. Please check required columns: Question, Option A, Option B, Option C, Option D, and Correct Answer.
              </div>
            )}
          </div>
        )}
      </section>
      )}

      {/* Question Banks List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            My Question Banks ({questionBanks.length})
          </h2>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-bold">
            <button
              onClick={() => setBankFilter('all')}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                bankFilter === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({questionBanks.length})
            </button>
            <button
              onClick={() => setBankFilter('paper1')}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                bankFilter === 'paper1' ? 'bg-white shadow text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paper-I ({questionBanks.filter(b => b.paper_type !== 'paper2' && !b.name.includes('Paper II')).length})
            </button>
            <button
              onClick={() => setBankFilter('paper2')}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                bankFilter === 'paper2' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paper-II ({questionBanks.filter(b => b.paper_type === 'paper2' || b.name.includes('Paper II')).length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questionBanks
            .filter(b => {
              if (bankFilter === 'paper1') return b.paper_type !== 'paper2' && !b.name.includes('Paper II');
              if (bankFilter === 'paper2') return b.paper_type === 'paper2' || b.name.includes('Paper II');
              return true;
            })
            .map((bank) => {
              const isP2 = bank.paper_type === 'paper2' || bank.name.includes('Paper II');
              const isEligible = isP2 ? bank.questions.length >= 100 : bank.questions.length >= 50;

              // Unique units represented
              const units = Array.from(new Set(bank.questions.map(q => q.unit || 'General'))).filter(Boolean);

            return (
              <div
                key={bank.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isP2 ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isP2 ? 'Paper-II' : 'Paper-I'}
                        </span>
                        {bank.subject && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {bank.subject}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-slate-900">{bank.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {bank.description || (isP2 ? 'Question bank for UGC NET Paper II.' : 'Question bank for UGC NET Paper I.')}
                      </p>
                    </div>

                    {bank.is_default && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        Default
                      </span>
                    )}
                  </div>

                  {/* Metadata tags */}
                  <div className="flex flex-wrap gap-2 text-xs pt-1">
                    <span className="font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {bank.questions.length} Questions
                    </span>

                    <span className={`font-semibold px-2.5 py-0.5 rounded ${
                      isEligible
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {isEligible ? (isP2 ? '100-Q Test Ready' : '50-Q Test Ready') : (isP2 ? 'Needs 100+ Questions' : 'Needs 50+ Questions')}
                    </span>

                    <span className="text-slate-400 text-[11px] self-center">
                      Uploaded {new Date(bank.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Units preview */}
                  <div className="text-[11px] text-slate-500 pt-1">
                    <span className="font-medium text-slate-700">Units included: </span>
                    {units.slice(0, 3).join(', ')}
                    {units.length > 3 && ` +${units.length - 3} more`}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    disabled={!isEligible}
                    onClick={() => onStartTestWithBank(bank.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      isEligible
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Start Mock Test
                  </button>

                  <button
                    onClick={() => setInspectBank(bank)}
                    className="py-2 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Inspect Questions"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect
                  </button>

                  {!bank.is_default && (
                    <button
                      onClick={() => onDeleteQuestionBank(bank.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete Bank"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Inspect Bank Modal */}
      {inspectBank && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-scale-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {inspectBank.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Total Questions: {inspectBank.questions.length}
                </p>
              </div>
              <button
                onClick={() => setInspectBank(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter toolbar inside inspect */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search questions in bank..."
                  value={inspectSearch}
                  onChange={(e) => setInspectSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Questions list */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {inspectBank.questions
                .filter(q => {
                  if (!inspectSearch.trim()) return true;
                  const query = inspectSearch.toLowerCase();
                  return (
                    q.question_text.toLowerCase().includes(query) ||
                    (q.unit || '').toLowerCase().includes(query) ||
                    (q.topic || '').toLowerCase().includes(query)
                  );
                })
                .map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold text-slate-900">Question #{idx + 1}</span>
                      {q.unit && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {q.unit}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-900 font-medium text-sm leading-relaxed whitespace-pre-line">
                      {q.question_text}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                      <div className={`p-2 rounded border ${q.correct_answer === 'A' ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200'}`}>
                        <strong>A:</strong> {q.option_a}
                      </div>
                      <div className={`p-2 rounded border ${q.correct_answer === 'B' ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200'}`}>
                        <strong>B:</strong> {q.option_b}
                      </div>
                      <div className={`p-2 rounded border ${q.correct_answer === 'C' ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200'}`}>
                        <strong>C:</strong> {q.option_c}
                      </div>
                      <div className={`p-2 rounded border ${q.correct_answer === 'D' ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200'}`}>
                        <strong>D:</strong> {q.option_d}
                      </div>
                    </div>
                    {q.explanation && (
                      <div className="p-2.5 rounded bg-blue-50/70 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Paste JSON Modal */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <FileJson className="w-5 h-5 text-indigo-600" />
                Paste JSON Question Bank
              </h3>
              <button
                onClick={() => setPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paste an array of question objects containing question, option_a, option_b, option_c, option_d, and correct_answer.
            </p>

            <textarea
              rows={8}
              value={pastedJsonText}
              onChange={(e) => setPastedJsonText(e.target.value)}
              placeholder={`[\n  {\n    "question": "Which level of teaching involves reflective inquiry?",\n    "option_a": "Memory",\n    "option_b": "Understanding",\n    "option_c": "Reflective",\n    "option_d": "Autonomous",\n    "correct_answer": "C",\n    "explanation": "Reflective level is the highest cognitive level.",\n    "unit": "Teaching Aptitude"\n  }\n]`}
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {pasteError && (
              <div className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded border border-rose-200">
                {pasteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 rounded-lg border text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleParsePastedJson}
                disabled={!pastedJsonText.trim()}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40"
              >
                Validate & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
