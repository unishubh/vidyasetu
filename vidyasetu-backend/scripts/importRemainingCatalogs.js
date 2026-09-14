const fs = require('fs');
const path = require('path');
const adminService = require('../services/adminService');

// Robust CSV parser identical to frontend parseQuestionCsv
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function parseQuestionCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row');
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1);

  return rows.map((rowText, rowIndex) => {
    const values = parseCsvLine(rowText);
    const row = {};

    header.forEach((columnName, index) => {
      row[columnName] = values[index] ?? '';
    });

    const options = [row.option_a, row.option_b, row.option_c, row.option_d]
      .filter((opt) => opt !== undefined && opt !== null && opt.trim() !== '')
      .map((opt) => opt.trim());

    if (options.length < 2) {
      throw new Error(`Row ${rowIndex + 2} has fewer than 2 valid options`);
    }

    const rawAnswers = (row.correct_answers || '')
      .split(';')
      .map((ans) => ans.trim())
      .filter(Boolean);

    const letterToIndex = { A: 0, B: 1, C: 2, D: 3 };
    const correctAnswers = rawAnswers.map((ans) => {
      const upper = ans.toUpperCase();
      if (upper in letterToIndex && letterToIndex[upper] < options.length) {
        return options[letterToIndex[upper]];
      }
      const matchingOption = options.find((opt) => opt.toLowerCase() === ans.toLowerCase());
      if (matchingOption) {
        return matchingOption;
      }
      return ans;
    });

    return {
      passage_title: row.passage_title || null,
      passage_text: row.passage_text || '',
      question_text: row.question_text || `Question ${rowIndex + 1}`,
      question_type: row.question_type || 'single_correct',
      options,
      correct_answers: correctAnswers,
      marks: Number(row.marks) || 1,
      negative_marks: Number(row.negative_marks) || 0.25,
      solution_text: row.solution_text || null,
    };
  });
}

const catalogsToCreate = [
  {
    csvFile: 'equity_derivates.csv',
    catalog: {
      title: 'Equity Derivatives',
      slug: 'equity-derivatives',
      description: 'Comprehensive preparation for NISM Series VIII: Equity Derivatives certification exam, including options, futures, hedging, and trading strategies.',
    },
    section: {
      title: 'Equity Derivatives Mock Series',
      slug: 'equity-derivatives-mock-series',
      description: 'Complete test series with 50 in-depth practice questions, answer keys, and detailed solutions.',
      price_paise: 29900,
      validity_days: 30,
      max_attempts_per_test: 5,
      is_demo_available: true,
    },
    test: {
      title: 'Equity Derivatives Full Mock Exam',
      description: '50 comprehensive questions covering options Greeks, margins, clearing, and market mechanics.',
      duration_minutes: 60,
      attempt_limit: 5,
      is_demo: false,
    },
  },
  {
    csvFile: 'interest_rate_derivates.csv',
    catalog: {
      title: 'Interest Rate Derivatives',
      slug: 'interest-rate-derivatives',
      description: 'Complete practice modules for NISM Series IV: Interest Rate Derivatives exam, covering Government Bond futures, T-Bills, and YTM.',
    },
    section: {
      title: 'Interest Rate Derivatives Mock Series',
      slug: 'interest-rate-derivatives-mock-series',
      description: 'Targeted mock tests on interest rate futures, conversion factors, basis risk, and trading mechanisms.',
      price_paise: 24900,
      validity_days: 30,
      max_attempts_per_test: 5,
      is_demo_available: true,
    },
    test: {
      title: 'Interest Rate Derivatives Mock Exam',
      description: '30 detailed questions testing sovereign bond futures, tick values, and money market instruments.',
      duration_minutes: 45,
      attempt_limit: 5,
      is_demo: false,
    },
  },
  {
    csvFile: 'nism-viiii.csv',
    catalog: {
      title: 'NISM Series VIII Rapid Review',
      slug: 'nism-series-viii-rapid-review',
      description: 'High-yield rapid review questions for NISM Series VIII Equity Derivatives certification.',
    },
    section: {
      title: 'Series VIII High-Yield Practice',
      slug: 'series-viii-high-yield-practice',
      description: 'Essential exam drills covering index options, arbitrage, calendar spreads, and impact cost.',
      price_paise: 19900,
      validity_days: 30,
      max_attempts_per_test: 5,
      is_demo_available: true,
    },
    test: {
      title: 'NISM Series VIII Rapid Drill',
      description: '10 focused questions with full rationales and solutions for swift revision.',
      duration_minutes: 20,
      attempt_limit: 5,
      is_demo: false,
    },
  },
];

async function main() {
  const teacherId = 2; // Teacher One
  console.log('Starting catalog creation for remaining CSV files...');

  for (const item of catalogsToCreate) {
    const csvPath = path.join(__dirname, '../../data', item.csvFile);
    console.log(`\nReading ${item.csvFile}...`);
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const questions = parseQuestionCsv(csvContent);
    console.log(`Parsed ${questions.length} questions from ${item.csvFile}`);

    // 1. Create Catalog
    console.log(`Creating Catalog: "${item.catalog.title}"...`);
    const createdCatalog = adminService.createCatalog(item.catalog);
    console.log(`✓ Catalog created with ID: ${createdCatalog.id}`);

    // 2. Create Section
    console.log(`Creating Section: "${item.section.title}"...`);
    const createdSection = adminService.createSection({
      ...item.section,
      catalog_id: createdCatalog.id,
    });
    console.log(`✓ Section created with ID: ${createdSection.id}`);

    // 3. Create Test with Questions
    console.log(`Creating Test: "${item.test.title}" with ${questions.length} questions...`);
    const createdTest = adminService.createTestWithQuestions({
      user_id: teacherId,
      section_id: createdSection.id,
      title: item.test.title,
      description: item.test.description,
      duration_minutes: item.test.duration_minutes,
      attempt_limit: item.test.attempt_limit,
      is_demo: item.test.is_demo,
      questions,
    });
    console.log(`✓ Test created with ID: ${createdTest.testId} (Total questions inserted: ${questions.length})`);
  }

  console.log('\nAll catalogs created successfully!');
}

main().catch((err) => {
  console.error('Failed to create catalogs:', err);
  process.exit(1);
});
