const REQUIRED_HEADERS = [
  'question_text',
  'question_type',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_answers',
  'marks',
  'negative_marks',
  'solution_text',
];

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeLines(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeCorrectAnswers(rawValue, rawOptions) {
  const letterIndex = { A: 0, B: 1, C: 2, D: 3 };

  return String(rawValue || '')
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const upper = value.toUpperCase();
      if (upper in letterIndex) {
        return rawOptions[letterIndex[upper]] || value;
      }

      const matched = rawOptions.find(
        (option) => option && option.trim().toLowerCase() === value.toLowerCase()
      );

      return matched || value;
    });
}

export function parseQuestionCsv(text) {
  if (!text || !text.trim()) {
    throw new Error('The CSV file is empty (0 bytes). Please upload a file containing header and question rows.');
  }

  const lines = normalizeLines(text);

  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one question row.');
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const headerIndex = Object.fromEntries(headers.map((header, index) => [header, index]));
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

  if (missingHeaders.length) {
    throw new Error(`Missing CSV columns: ${missingHeaders.join(', ')}`);
  }

  return lines.slice(1).map((line, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const values = parseCsvLine(line);
    const rawOptions = [
      values[headerIndex.option_a]?.trim() || '',
      values[headerIndex.option_b]?.trim() || '',
      values[headerIndex.option_c]?.trim() || '',
      values[headerIndex.option_d]?.trim() || '',
    ];
    // Filter out blank options so True/False or 3-option questions work cleanly
    const options = rawOptions.filter(Boolean);
    const questionType = values[headerIndex.question_type]?.trim() || 'single_correct';
    const correctAnswers = normalizeCorrectAnswers(
      values[headerIndex.correct_answers],
      rawOptions
    );
    const marks = Number(values[headerIndex.marks]);
    const negativeMarks = Number(values[headerIndex.negative_marks]);

    if (!['single_correct', 'multiple_correct'].includes(questionType)) {
      throw new Error(`Row ${rowNumber}: question_type must be single_correct or multiple_correct`);
    }

    if (options.length < 2) {
      throw new Error(`Row ${rowNumber}: at least two options are required (e.g. True/False or Option A and B)`);
    }

    if (!correctAnswers.length || correctAnswers.some((answer) => !options.includes(answer))) {
      throw new Error(`Row ${rowNumber}: correct_answers must match one of the options (A, B, C, D or exact option text)`);
    }

    return {
      passage_title: values[headerIndex.passage_title]?.trim() || '',
      passage_text: values[headerIndex.passage_text]?.trim() || '',
      question_text: values[headerIndex.question_text]?.trim(),
      question_type: questionType,
      options,
      correct_answers: correctAnswers,
      marks: Number.isFinite(marks) ? marks : 1,
      negative_marks: Number.isFinite(negativeMarks) ? negativeMarks : 0,
      solution_text: values[headerIndex.solution_text]?.trim() || '',
    };
  });
}


export const sampleQuestionCsv = `passage_title,passage_text,question_text,question_type,option_a,option_b,option_c,option_d,correct_answers,marks,negative_marks,solution_text
Data Table,"A class scored 60, 70, 80, and 90 in four tests.",Which score is the highest?,single_correct,60,70,80,90,D,1,0.25,90 is the highest score in the list.
Data Table,"A class scored 60, 70, 80, and 90 in four tests.",Select all scores above 70.,multiple_correct,60,70,80,90,C|D,2,0.5,80 and 90 are above 70.`;

export const sampleQuestionCsvFiles = [
  {
    label: 'SSC Quant Demo',
    href: '/csv-templates/ssc-quant-demo.csv',
    description: 'Arithmetic and percentages with single and multiple correct questions.',
  },
  {
    label: 'SSC English Demo',
    href: '/csv-templates/ssc-english-demo.csv',
    description: 'Grammar and vocabulary examples for a short English demo test.',
  },
  {
    label: 'Banking Reasoning Demo',
    href: '/csv-templates/banking-reasoning-demo.csv',
    description: 'Reasoning examples with sequence, puzzle logic, and classification.',
  },
  {
    label: 'Railway GA Demo',
    href: '/csv-templates/railway-ga-demo.csv',
    description: 'General awareness questions for a starter railway package.',
  },
];
