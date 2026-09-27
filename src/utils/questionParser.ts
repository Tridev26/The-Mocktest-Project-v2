import * as XLSX from 'xlsx';
import { Question, ParseValidationResult } from '../types';

// Helper to sanitize key strings
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Find key from object with flexible synonyms
function getValue(row: Record<string, any>, possibleKeys: string[]): string {
  const normKeys = possibleKeys.map(k => normalizeKey(k));
  for (const rawKey of Object.keys(row)) {
    const nKey = normalizeKey(rawKey);
    if (normKeys.includes(nKey)) {
      const val = row[rawKey];
      return val !== null && val !== undefined ? String(val).trim() : '';
    }
  }
  return '';
}

// Normalize correct answer string to 'A' | 'B' | 'C' | 'D'
function normalizeCorrectAnswer(
  ans: string,
  optA: string,
  optB: string,
  optC: string,
  optD: string
): 'A' | 'B' | 'C' | 'D' | null {
  if (!ans) return null;
  const clean = ans.trim().toUpperCase();

  // Direct single letters
  if (clean === 'A' || clean === '1') return 'A';
  if (clean === 'B' || clean === '2') return 'B';
  if (clean === 'C' || clean === '3') return 'C';
  if (clean === 'D' || clean === '4') return 'D';

  // Patterns like "(A)", "[A]", "Option A", "Option 1"
  const letterMatch = clean.match(/(?:OPTION\s*|^\()?([A-D1-4])\)?$/i);
  if (letterMatch) {
    const char = letterMatch[1].toUpperCase();
    if (char === '1') return 'A';
    if (char === '2') return 'B';
    if (char === '3') return 'C';
    if (char === '4') return 'D';
    if (['A', 'B', 'C', 'D'].includes(char)) return char as 'A' | 'B' | 'C' | 'D';
  }

  // Match against option content text
  const cleanContent = ans.trim().toLowerCase();
  if (cleanContent && optA.trim().toLowerCase() === cleanContent) return 'A';
  if (cleanContent && optB.trim().toLowerCase() === cleanContent) return 'B';
  if (cleanContent && optC.trim().toLowerCase() === cleanContent) return 'C';
  if (cleanContent && optD.trim().toLowerCase() === cleanContent) return 'D';

  return null;
}

export function validateAndParseRows(rows: Record<string, any>[]): ParseValidationResult {
  const valid: Question[] = [];
  const invalid: { row: number; rawText?: string; reason: string }[] = [];
  const duplicates: Question[] = [];
  const seenQuestions = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 1;
    const questionText = getValue(row, ['question', 'question_text', 'questiontext', 'q', 'statement', 'problem']);
    const optA = getValue(row, ['option_a', 'optiona', 'opt_a', 'opta', 'a', 'option1', 'opt1', 'choice_a', 'choice1']);
    const optB = getValue(row, ['option_b', 'optionb', 'opt_b', 'optb', 'b', 'option2', 'opt2', 'choice_b', 'choice2']);
    const optC = getValue(row, ['option_c', 'optionc', 'opt_c', 'optc', 'c', 'option3', 'opt3', 'choice_c', 'choice3']);
    const optD = getValue(row, ['option_d', 'optiond', 'opt_d', 'optd', 'd', 'option4', 'opt4', 'choice_d', 'choice4']);
    const rawAnswer = getValue(row, ['correct_answer', 'correctanswer', 'answer', 'ans', 'correct', 'key', 'right_answer']);
    const explanation = getValue(row, ['explanation', 'exp', 'rationale', 'solution', 'description']);
    const unit = getValue(row, ['unit', 'unit_name', 'section', 'subject', 'module']) || 'Paper I General';
    const topic = getValue(row, ['topic', 'subtopic', 'chapter', 'concept']) || 'General';
    const difficultyRaw = getValue(row, ['difficulty', 'level']);

    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    if (/easy/i.test(difficultyRaw)) difficulty = 'Easy';
    else if (/hard|difficult/i.test(difficultyRaw)) difficulty = 'Hard';

    if (!questionText) {
      invalid.push({
        row: rowNum,
        rawText: JSON.stringify(row).slice(0, 100),
        reason: 'Missing question text',
      });
      return;
    }

    if (!optA || !optB || !optC || !optD) {
      invalid.push({
        row: rowNum,
        rawText: questionText.slice(0, 80),
        reason: 'One or more of the 4 options (A, B, C, D) are missing',
      });
      return;
    }

    const normalizedAns = normalizeCorrectAnswer(rawAnswer, optA, optB, optC, optD);
    if (!normalizedAns) {
      invalid.push({
        row: rowNum,
        rawText: questionText.slice(0, 80),
        reason: `Invalid or missing correct answer "${rawAnswer}". Must be A, B, C, D (or 1, 2, 3, 4) or match an option text.`,
      });
      return;
    }

    // Deduplication key
    const dedupeKey = questionText.toLowerCase().replace(/[^a-z0-9]/g, '');
    const questionObj: Question = {
      id: `q-up-${Date.now()}-${rowNum}-${Math.random().toString(36).substring(2, 6)}`,
      question_text: questionText,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_answer: normalizedAns,
      explanation: explanation || undefined,
      unit: unit,
      topic: topic,
      difficulty: difficulty,
    };

    if (seenQuestions.has(dedupeKey)) {
      duplicates.push(questionObj);
      invalid.push({
        row: rowNum,
        rawText: questionText.slice(0, 80),
        reason: 'Duplicate question text already present in this file',
      });
    } else {
      seenQuestions.add(dedupeKey);
      valid.push(questionObj);
    }
  });

  return {
    valid,
    invalid,
    duplicates,
    totalParsed: rows.length,
  };
}

export async function parseFile(file: File): Promise<ParseValidationResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'json') {
    const text = await file.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        valid: [],
        invalid: [{ row: 0, reason: 'Invalid JSON format. Please verify syntax.' }],
        duplicates: [],
        totalParsed: 0,
      };
    }

    const rows = Array.isArray(data) ? data : (Array.isArray(data.questions) ? data.questions : [data]);
    return validateAndParseRows(rows);
  }

  // Handles XLSX, XLS, and CSV seamlessly
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return {
      valid: [],
      invalid: [{ row: 0, reason: 'Uploaded file has no readable sheets' }],
      duplicates: [],
      totalParsed: 0,
    };
  }
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
  return validateAndParseRows(rows);
}

// Helper to generate sample downloadable files
export function generateSampleData() {
  return [
    {
      Question: 'Which of the following research methods provides the strongest basis for causal inference?',
      'Option A': 'Case Study',
      'Option B': 'Experimental Method',
      'Option C': 'Ethnography',
      'Option D': 'Historical Method',
      'Correct Answer': 'B',
      Explanation: 'Experimental method manipulates independent variables while controlling confounders to prove causality.',
      Unit: 'Research Aptitude',
      Topic: 'Research Methods',
      Difficulty: 'Easy'
    },
    {
      Question: 'In classroom communication, what does body language and facial expression constitute?',
      'Option A': 'Kinesics',
      'Option B': 'Proxemics',
      'Option C': 'Chronemics',
      'Option D': 'Haptics',
      'Correct Answer': 'A',
      Explanation: 'Kinesics is the study of non-verbal bodily movements, postures, and gestures.',
      Unit: 'Communication',
      Topic: 'Non-verbal Communication',
      Difficulty: 'Medium'
    },
    {
      Question: 'Which protocol is used for secure encrypted transfer over the World Wide Web?',
      'Option A': 'FTP',
      'Option B': 'SMTP',
      'Option C': 'HTTPS',
      'Option D': 'TELNET',
      'Correct Answer': 'C',
      Explanation: 'HTTPS incorporates SSL/TLS cryptographic encryption over port 443.',
      Unit: 'Information and Communication Technology (ICT)',
      Topic: 'Internet Protocols',
      Difficulty: 'Easy'
    }
  ];
}

export function downloadSampleCSV(): void {
  const data = generateSampleData();
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'ugc_net_paper1_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadSampleXLSX(): void {
  const data = generateSampleData();
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'UGC_Questions');
  XLSX.writeFile(workbook, 'ugc_net_paper1_template.xlsx');
}

export function downloadSampleJSON(): void {
  const data = generateSampleData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'ugc_net_paper1_template.json');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
