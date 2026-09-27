import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Database, 
  Copy, 
  Check, 
  Calendar, 
  User, 
  BookOpen, 
  Loader2, 
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { 
  insertQuestionBankWithQuestions, 
  isSupabaseConfigured, 
  ParsedExcelQuestion 
} from '../utils/supabaseClient';
import { QuestionBank, Question } from '../types';

interface ExcelArchiveUploaderProps {
  onSuccessUpload?: (newBank: QuestionBank) => void;
  defaultUploaderName?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const REQUIRED_HEADERS = [
  'Question',
  'Option A',
  'Option B',
  'Option C',
  'Option D',
  'Correct Answer'
];

export const ExcelArchiveUploader: React.FC<ExcelArchiveUploaderProps> = ({
  onSuccessUpload,
  defaultUploaderName = 'Guest Candidate',
}) => {
  // Form fields
  const [bankName, setBankName] = useState('');
  const [examYear, setExamYear] = useState<number>(new Date().getFullYear());
  const [uploaderName, setUploaderName] = useState(defaultUploaderName);
  const [description, setDescription] = useState('');

  // File parsing states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedExcelQuestion[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
  const [parseSummary, setParseSummary] = useState<{ totalRows: number; validCount: number } | null>(null);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    bankId?: string;
  }>({ status: 'idle', message: '' });

  // SQL schema drawer state
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabaseReady = isSupabaseConfigured();

  // Clean column header strings for flexible matching
  const normalizeKey = (key: string): string => {
    return key.trim().toLowerCase().replace(/[\s_-]+/g, '');
  };

  /**
   * Reads and strictly validates the uploaded Excel (.xlsx/.xls) or CSV file.
   */
  const handleFileProcess = async (file: File) => {
    setIsParsing(true);
    setValidationErrors([]);
    setMissingHeaders([]);
    setUploadStatus({ status: 'idle', message: '' });
    setParsedQuestions([]);
    setParseSummary(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('The uploaded Excel spreadsheet contains no visible sheets.');
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

      if (rawRows.length === 0) {
        throw new Error('The uploaded sheet is empty. Please provide questions formatted according to the template.');
      }

      // Check Column Headers from the first row keys
      const sampleRow = rawRows[0];
      const detectedKeys = Object.keys(sampleRow);
      const normalizedDetected = detectedKeys.map(normalizeKey);

      // Define header aliases mapping
      const keyMap: Record<string, string> = {
        question: 'Question',
        questiontext: 'Question',
        optiona: 'Option A',
        opt1: 'Option A',
        optionb: 'Option B',
        opt2: 'Option B',
        optionc: 'Option C',
        opt3: 'Option C',
        optiond: 'Option D',
        opt4: 'Option D',
        correctanswer: 'Correct Answer',
        answer: 'Correct Answer',
        correct: 'Correct Answer',
        unit: 'Unit',
        explanation: 'Explanation',
        difficulty: 'Difficulty'
      };

      // Verify that all 6 required columns exist
      const missing: string[] = [];
      REQUIRED_HEADERS.forEach(requiredHeader => {
        const normReq = normalizeKey(requiredHeader);
        const matchFound = normalizedDetected.some(k => keyMap[k] === requiredHeader || k === normReq);
        if (!matchFound) {
          missing.push(requiredHeader);
        }
      });

      if (missing.length > 0) {
        setMissingHeaders(missing);
        setIsParsing(false);
        return;
      }

      // Validate each row
      const validQuestions: ParsedExcelQuestion[] = [];
      const errors: ValidationError[] = [];

      rawRows.forEach((row, idx) => {
        const rowNum = idx + 2; // +2 for 1-based indexing plus header row

        // Helper to get row value by flexible header name
        const getVal = (targetHeader: string): string => {
          const foundKey = detectedKeys.find(k => {
            const norm = normalizeKey(k);
            return keyMap[norm] === targetHeader || norm === normalizeKey(targetHeader);
          });
          if (!foundKey) return '';
          return String(row[foundKey] ?? '').trim();
        };

        const questionText = getVal('Question');
        const optA = getVal('Option A');
        const optB = getVal('Option B');
        const optC = getVal('Option C');
        const optD = getVal('Option D');
        const rawAns = getVal('Correct Answer').toUpperCase();
        const unit = getVal('Unit') || 'General Teaching & Research Aptitude';
        const explanation = getVal('Explanation') || 'Standard UGC-NET Paper I question.';
        const difficulty = getVal('Difficulty') || 'Medium';

        // Check required fields
        if (!questionText) {
          errors.push({ row: rowNum, field: 'Question', message: 'Question statement cannot be blank.' });
        }
        if (!optA) errors.push({ row: rowNum, field: 'Option A', message: 'Option A is missing.' });
        if (!optB) errors.push({ row: rowNum, field: 'Option B', message: 'Option B is missing.' });
        if (!optC) errors.push({ row: rowNum, field: 'Option C', message: 'Option C is missing.' });
        if (!optD) errors.push({ row: rowNum, field: 'Option D', message: 'Option D is missing.' });

        // STRICT VALIDATION: Correct Answer must only contain 'A', 'B', 'C', or 'D'
        if (!['A', 'B', 'C', 'D'].includes(rawAns)) {
          errors.push({
            row: rowNum,
            field: 'Correct Answer',
            message: `Invalid key "${rawAns || '(empty)'}". Correct Answer must strictly be A, B, C, or D.`
          });
        }

        // If no critical errors on this row, add to valid list
        if (questionText && optA && optB && optC && optD && ['A', 'B', 'C', 'D'].includes(rawAns)) {
          validQuestions.push({
            question_text: questionText,
            option_a: optA,
            option_b: optB,
            option_c: optC,
            option_d: optD,
            correct_answer: rawAns as 'A' | 'B' | 'C' | 'D',
            unit,
            explanation,
            difficulty: (['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium') as 'Easy' | 'Medium' | 'Hard'
          });
        }
      });

      setValidationErrors(errors);
      setParsedQuestions(validQuestions);
      setParseSummary({
        totalRows: rawRows.length,
        validCount: validQuestions.length
      });

      // Suggest default name if blank
      if (!bankName) {
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setBankName(`UGC-NET Archive ${examYear} - ${baseName}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse Excel file.';
      setValidationErrors([{ row: 1, field: 'File Format', message: msg }]);
    } finally {
      setIsParsing(false);
    }
  };

  /**
   * Two-Step Database Insert Execution:
   * Inserts into question_banks -> retrieves parent UUID -> inserts all questions.
   */
  const handleDatabaseInsert = async () => {
    if (parsedQuestions.length === 0) {
      alert('Cannot upload: No valid questions found in the Excel sheet.');
      return;
    }

    if (!bankName.trim()) {
      alert('Please enter a name for this 10-year question archive.');
      return;
    }

    setIsUploading(true);
    setUploadStatus({ status: 'idle', message: '' });

    // Execute Two-Step Database Insert via Supabase Client
    const result = await insertQuestionBankWithQuestions(
      {
        name: bankName.trim(),
        exam_year: Number(examYear),
        uploaded_by: uploaderName.trim() || 'Anonymous Aspirant',
        description: description.trim() || `UGC-NET Paper I Archive (${examYear}) with ${parsedQuestions.length} validated MCQs`,
      },
      parsedQuestions
    );

    // Prepare local fallback QuestionBank object so user can test and practice immediately
    const generatedId = result.bankId || `bank-archive-${Date.now()}`;
    const localBankObject: QuestionBank = {
      id: generatedId,
      name: bankName.trim(),
      description: description.trim() || `UGC-NET Paper I Archive (${examYear}) with ${parsedQuestions.length} validated MCQs`,
      uploaded_by: uploaderName.trim() || 'Anonymous Aspirant',
      created_at: new Date().toISOString(),
      question_count: parsedQuestions.length,
      questions: parsedQuestions.map((q, idx) => ({
        id: `q-arch-${idx + 1}-${Date.now()}`,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        unit: q.unit,
        difficulty: q.difficulty,
      })),
      is_default: false,
    };

    if (result.success) {
      setUploadStatus({
        status: 'success',
        message: `Successfully uploaded "${bankName}" to Supabase! Added ${result.count} questions under Parent Bank ID: ${result.bankId}`,
        bankId: result.bankId,
      });

      // Synchronize into local Question Banks for immediate practice
      if (onSuccessUpload) {
        onSuccessUpload(localBankObject);
      }
    } else {
      // In case Supabase credentials are missing or network failed, give clear feedback and allow local import
      setUploadStatus({
        status: 'error',
        message: `${result.error}. (Archive saved to your local session so you can practice right now!)`,
      });

      // Save locally so the user isn't blocked while setting up Supabase
      if (onSuccessUpload) {
        onSuccessUpload(localBankObject);
      }
    }

    setIsUploading(false);
  };

  /**
   * Generates and downloads a clean, pre-formatted UGC-NET 10-Year Excel Template.
   */
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Question': 'Which of the following is the key characteristic of formative evaluation?',
        'Option A': 'It is conducted at the end of an academic session',
        'Option B': 'It provides continuous feedback to both teachers and students during instruction',
        'Option C': 'It assigns grades and final rank certificates to students',
        'Option D': 'It determines readiness before teaching begins',
        'Correct Answer': 'B',
        'Unit': 'Teaching Aptitude',
        'Explanation': 'Formative assessment happens during the instructional process to monitor student learning and provide ongoing feedback.',
        'Difficulty': 'Easy'
      },
      {
        'Question': 'In research methodology, which type of sampling technique gives every member of the population an equal probability of selection?',
        'Option A': 'Purposive Sampling',
        'Option B': 'Snowball Sampling',
        'Option C': 'Simple Random Sampling',
        'Option D': 'Quota Sampling',
        'Correct Answer': 'C',
        'Unit': 'Research Aptitude',
        'Explanation': 'Simple random sampling is a probability sampling method where every member of the target population has an equal chance of being chosen.',
        'Difficulty': 'Medium'
      },
      {
        'Question': 'What is the full form of the ICT term "SWAYAM" initiated by the Ministry of Education, Government of India?',
        'Option A': 'Study Webs of Active-Learning for Young Aspiring Minds',
        'Option B': 'Scientific Web Application for Youth Academic Mastery',
        'Option C': 'Students Web Arena for Yielding Academic Marks',
        'Option D': 'Standard Web Association for Youth Automated Modules',
        'Correct Answer': 'A',
        'Unit': 'Information & Communication Technology (ICT)',
        'Explanation': 'SWAYAM stands for Study Webs of Active-Learning for Young Aspiring Minds, providing free MOOCs for Indian learners.',
        'Difficulty': 'Easy'
      },
      {
        'Question': 'Which of the following gases is primarily responsible for global warming and climate change?',
        'Option A': 'Oxygen (O2)',
        'Option B': 'Carbon Dioxide (CO2)',
        'Option C': 'Nitrogen (N2)',
        'Option D': 'Argon (Ar)',
        'Correct Answer': 'B',
        'Unit': 'People, Development & Environment',
        'Explanation': 'Carbon dioxide (CO2) is the primary greenhouse gas emitted through human activities like fossil fuel burning and deforestation.',
        'Difficulty': 'Easy'
      },
      {
        'Question': 'According to the Classical Indian School of Logic (Nyaya), which source of valid knowledge represents knowledge derived from perception?',
        'Option A': 'Anumana (Inference)',
        'Option B': 'Upamana (Comparison)',
        'Option C': 'Pratyaksha (Perception)',
        'Option D': 'Sabda (Verbal Testimony)',
        'Correct Answer': 'C',
        'Unit': 'Logical Reasoning',
        'Explanation': 'Pratyaksha corresponds to direct sensory perception, one of the foundational pramanas in Indian philosophy.',
        'Difficulty': 'Medium'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 60 }, // Question
      { wch: 35 }, // Option A
      { wch: 35 }, // Option B
      { wch: 35 }, // Option C
      { wch: 35 }, // Option D
      { wch: 15 }, // Correct Answer
      { wch: 35 }, // Unit
      { wch: 50 }, // Explanation
      { wch: 12 }, // Difficulty
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'UGC_NET_Paper1_Archive');

    XLSX.writeFile(workbook, 'UGC_NET_Paper1_10Year_Archive_Template.xlsx');
  };

  const copySqlToClipboard = () => {
    const sqlScript = `-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.question_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    exam_year INTEGER NOT NULL,
    uploaded_by TEXT DEFAULT 'Anonymous',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    description TEXT,
    total_questions INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id UUID NOT NULL REFERENCES public.question_banks(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    unit TEXT DEFAULT 'General Teaching & Research Aptitude',
    difficulty TEXT DEFAULT 'Medium',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON public.question_banks FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.question_banks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Public Insert Questions" ON public.questions FOR INSERT WITH CHECK (true);`;

    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                10-Year Archive Pipeline
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Supabase PostgreSQL
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-emerald-400" />
              Community Excel Archive Uploader
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Upload UGC-NET 10-year question banks using the standardized Excel template. The parser validates schema, ensures question integrity, and inserts into Supabase using a relational two-step foreign key pipeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition"
              title="Download standard Excel spreadsheet template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template</span>
            </button>

            <button
              onClick={() => setShowSqlModal(!showSqlModal)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>View Supabase SQL Schema</span>
            </button>
          </div>
        </div>

        {/* Supabase Connection Status Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${supabaseReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>
              Supabase Status:{' '}
              <strong className={supabaseReady ? 'text-emerald-300' : 'text-amber-300'}>
                {supabaseReady ? 'Connected (VITE_SUPABASE_URL Active)' : 'Demo Mode (Add VITE_SUPABASE_URL in .env)'}
              </strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Supports .xlsx, .xls, .csv with strict Answer Key Validation (A, B, C, D)
          </span>
        </div>
      </div>

      {/* SQL Schema Accordion / Modal */}
      {showSqlModal && (
        <div className="p-5 bg-slate-950 text-slate-200 border-b border-slate-800 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Supabase SQL Editor Script (Tables & RLS Policies)
              </h4>
            </div>
            <button
              onClick={copySqlToClipboard}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto text-emerald-400 leading-relaxed max-h-48">
{`-- Run in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.question_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    exam_year INTEGER NOT NULL,
    uploaded_by TEXT DEFAULT 'Anonymous',
    created_at TIMESTAMPTZ DEFAULT now(),
    description TEXT,
    total_questions INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id UUID NOT NULL REFERENCES public.question_banks(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    unit TEXT,
    difficulty TEXT DEFAULT 'Medium',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON public.question_banks FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON public.question_banks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Public Insert Questions" ON public.questions FOR INSERT WITH CHECK (true);`}
          </pre>
        </div>
      )}

      {/* Main Upload & Parser Form */}
      <div className="p-6 space-y-6">
        {/* Upload Status Alert */}
        {uploadStatus.status === 'success' && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-sm text-emerald-950">Database Insertion Successful!</p>
              <p>{uploadStatus.message}</p>
              {uploadStatus.bankId && (
                <p className="font-mono text-[11px] text-emerald-800">
                  Parent Bank UUID: <strong>{uploadStatus.bankId}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {uploadStatus.status === 'error' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-sm text-amber-950">Supabase Notice</p>
              <p>{uploadStatus.message}</p>
            </div>
          </div>
        )}

        {/* Step 1: Archive Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Archive / Question Bank Name *
            </label>
            <input
              type="text"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. UGC-NET Paper I (December 2023 - Shift 1)"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Exam Year (10-Year Archive) *
            </label>
            <input
              type="number"
              min="2010"
              max="2030"
              value={examYear}
              onChange={(e) => setExamYear(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contributor / Uploader Handle
            </label>
            <input
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="e.g. Tridev Ruidas"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Step 2: Drag and Drop File Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 transition-all rounded-xl p-8 text-center cursor-pointer group space-y-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFile(file);
                handleFileProcess(file);
              }
            }}
          />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
            <Upload className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              {selectedFile ? (
                <span className="text-blue-600 font-bold">{selectedFile.name}</span>
              ) : (
                'Click or drag an Excel file (.xlsx, .xls, .csv) here to upload'
              )}
            </p>
            <p className="text-xs text-slate-500">
              Requires columns: Question, Option A, Option B, Option C, Option D, Correct Answer
            </p>
          </div>

          {isParsing && (
            <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validating columns and checking answer keys...</span>
            </div>
          )}
        </div>

        {/* Missing Column Headers Error Alert */}
        {missingHeaders.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-950">
                Validation Failed: Missing Required Columns
              </h4>
            </div>
            <p className="text-xs text-rose-800">
              The uploaded spreadsheet is missing the following mandatory headers:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {missingHeaders.map((col) => (
                <span
                  key={col}
                  className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-mono text-xs font-semibold border border-rose-300"
                >
                  ✕ {col}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-rose-700 pt-1">
              Tip: Click "Download Excel Template" above to get an exact template with pre-built columns.
            </p>
          </div>
        )}

        {/* Row-by-Row Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-rose-950">
                  Validation Failed ({validationErrors.length} Issue{validationErrors.length > 1 ? 's' : ''} Found)
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-rose-800">
                Fix highlighted rows in your Excel file
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-rose-200 text-xs">
              {validationErrors.slice(0, 15).map((err, i) => (
                <div key={i} className="pt-1.5 flex items-start justify-between gap-4">
                  <span className="font-semibold text-rose-950 shrink-0">
                    Row {err.row} [{err.field}]:
                  </span>
                  <span className="text-rose-800 text-right">{err.message}</span>
                </div>
              ))}
              {validationErrors.length > 15 && (
                <p className="text-[11px] text-rose-700 italic pt-2">
                  ...and {validationErrors.length - 15} more invalid row(s).
                </p>
              )}
            </div>
          </div>
        )}

        {/* Successful Parse Summary & Question Preview */}
        {parseSummary && parseSummary.validCount > 0 && (
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-sm text-slate-900">
                    Validation Passed: {parseSummary.validCount} Questions Ready
                  </span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                    Strict Keys (A-D) OK
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Target Exam Year: <strong>{examYear}</strong> • Uploader: <strong>{uploaderName}</strong>
                </p>
              </div>

              <button
                type="button"
                disabled={isUploading}
                onClick={handleDatabaseInsert}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Two-Step Insert...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Upload to Supabase Database</span>
                  </>
                )}
              </button>
            </div>

            {/* Questions Sample Preview */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Sample Validated Questions Preview ({Math.min(3, parsedQuestions.length)} of {parsedQuestions.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {parsedQuestions.slice(0, 3).map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Q{idx + 1}</span>
                      <span className="font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                        Key: {q.correct_answer}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium line-clamp-2">{q.question_text}</p>
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p className="truncate">A: {q.option_a}</p>
                      <p className="truncate">B: {q.option_b}</p>
                    </div>
                    <span className="inline-block text-[10px] text-blue-600 font-medium truncate bg-blue-50 px-1.5 py-0.5 rounded">
                      {q.unit}
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
