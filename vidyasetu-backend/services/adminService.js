const { database } = require('../db/connection');

const insertCatalog = database.prepare(`
  INSERT INTO catalogs (title, slug, description, is_active)
  VALUES (?, ?, ?, 1)
`);

const insertSection = database.prepare(`
  INSERT INTO catalog_sections (
    catalog_id,
    title,
    slug,
    description,
    price_paise,
    validity_days,
    max_attempts_per_test,
    is_demo_available,
    is_active
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
`);

const insertContentItem = database.prepare(`
  INSERT INTO content_items (section_id, type, title, url, description, sort_order)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertTest = database.prepare(`
  INSERT INTO tests (
    section_id,
    title,
    description,
    duration_minutes,
    attempt_limit,
    is_demo,
    is_active,
    created_by
  )
  VALUES (?, ?, ?, ?, ?, ?, 1, ?)
`);

const insertPassage = database.prepare(`
  INSERT INTO test_passages (test_id, title, context_text, sort_order)
  VALUES (?, ?, ?, ?)
`);

const insertQuestion = database.prepare(`
  INSERT INTO questions (
    test_id,
    passage_id,
    question_text,
    question_type,
    marks,
    negative_marks,
    sort_order,
    solution_text
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertOption = database.prepare(`
  INSERT INTO question_options (question_id, option_text, is_correct, sort_order)
  VALUES (?, ?, ?, ?)
`);

const insertPurchase = database.prepare(`
  INSERT INTO purchases (
    user_id,
    section_id,
    amount_paise,
    max_attempts,
    status,
    valid_from,
    valid_until,
    payment_ref,
    created_at
  )
  VALUES (?, ?, ?, ?, 'paid', ?, ?, ?, ?)
`);

const selectCatalogs = database.prepare(`
  SELECT id, title, slug, description
  FROM catalogs
  WHERE is_active = 1
  ORDER BY id ASC
`);

const selectSections = database.prepare(`
  SELECT
    catalog_sections.id,
    catalog_sections.title,
    catalog_sections.slug,
    catalog_sections.description,
    catalog_sections.catalog_id,
    catalogs.title AS catalog_title
  FROM catalog_sections
  INNER JOIN catalogs ON catalogs.id = catalog_sections.catalog_id
  WHERE catalog_sections.is_active = 1
  ORDER BY catalog_sections.id ASC
`);

const selectUsersByRole = database.prepare(`
  SELECT id, name, email, role
  FROM users
  WHERE role = ?
  ORDER BY id ASC
`);

const selectUserById = database.prepare(`
  SELECT id
  FROM users
  WHERE id = ?
`);

const selectCatalogById = database.prepare(`
  SELECT id
  FROM catalogs
  WHERE id = ? AND is_active = 1
`);

const selectSectionById = database.prepare(`
  SELECT id, price_paise, validity_days
  FROM catalog_sections
  WHERE id = ? AND is_active = 1
`);

const createSlug = (value) => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const createCatalog = ({ title, slug, description }) => {
  if (!title) {
    throw new Error('Catalog title is required');
  }

  const result = insertCatalog.run(
    title.trim(),
    createSlug(slug || title),
    description?.trim() || null
  );

  return {
    id: Number(result.lastInsertRowid),
    title: title.trim(),
    slug: createSlug(slug || title),
    description: description?.trim() || null,
  };
};

const createSection = ({
  catalog_id,
  title,
  slug,
  description,
  price_paise,
  validity_days,
  max_attempts_per_test,
  is_demo_available,
}) => {
  if (!selectCatalogById.get(catalog_id)) {
    throw new Error('Catalog not found');
  }

  const normalizedSlug = createSlug(slug || title);
  const result = insertSection.run(
    catalog_id,
    title.trim(),
    normalizedSlug,
    description?.trim() || null,
    Number(price_paise || 0),
    Number(validity_days || 30),
    Number(max_attempts_per_test || 3),
    is_demo_available ? 1 : 0
  );

  return {
    id: Number(result.lastInsertRowid),
    catalog_id,
    title: title.trim(),
    slug: normalizedSlug,
  };
};

const addContentItem = ({
  section_id,
  type,
  title,
  url,
  description,
  sort_order,
}) => {
  if (!selectSectionById.get(section_id)) {
    throw new Error('Section not found');
  }

  const result = insertContentItem.run(
    section_id,
    type,
    title.trim(),
    url.trim(),
    description?.trim() || null,
    Number(sort_order || 0)
  );

  return {
    id: Number(result.lastInsertRowid),
    section_id,
  };
};

const createTestWithQuestions = ({
  user_id,
  section_id,
  title,
  description,
  duration_minutes,
  attempt_limit,
  is_demo,
  questions,
}) => {
  const section = selectSectionById.get(section_id);

  if (!section) {
    throw new Error('Section not found');
  }

  if (!Array.isArray(questions) || !questions.length) {
    throw new Error('At least one question is required');
  }

  return database.transaction(() => {
    const testResult = insertTest.run(
      section_id,
      title.trim(),
      description?.trim() || null,
      Number(duration_minutes),
      Number(attempt_limit || 3),
      is_demo ? 1 : 0,
      user_id || null
    );
    const testId = Number(testResult.lastInsertRowid);
    const passageCache = new Map();

    questions.forEach((question, questionIndex) => {
      let passageId = null;
      const passageKey = `${question.passage_title || ''}::${question.passage_text || ''}`;

      if (question.passage_text) {
        if (!passageCache.has(passageKey)) {
          const passageResult = insertPassage.run(
            testId,
            question.passage_title?.trim() || null,
            question.passage_text.trim(),
            passageCache.size
          );
          passageCache.set(passageKey, Number(passageResult.lastInsertRowid));
        }

        passageId = passageCache.get(passageKey);
      }

      const questionResult = insertQuestion.run(
        testId,
        passageId,
        question.question_text.trim(),
        question.question_type,
        Number(question.marks || 1),
        Number(question.negative_marks || 0),
        questionIndex,
        question.solution_text?.trim() || null
      );
      const questionId = Number(questionResult.lastInsertRowid);
      const normalizedCorrectAnswers = new Set(
        question.correct_answers.map((answer) => answer.trim().toLowerCase())
      );

      question.options.forEach((optionText, optionIndex) => {
        insertOption.run(
          questionId,
          optionText,
          normalizedCorrectAnswers.has(optionText.trim().toLowerCase()) ? 1 : 0,
          optionIndex
        );
      });
    });

    return { id: testId, section_id };
  })();
};

const grantSectionAccess = ({ user_id, section_id, valid_until }) => {
  if (!selectUserById.get(user_id)) {
    throw new Error('User not found');
  }

  const section = selectSectionById.get(section_id);

  if (!section) {
    throw new Error('Section not found');
  }

  const now = new Date().toISOString();
  const result = insertPurchase.run(
    user_id,
    section_id,
    0,
    10,
    now,
    valid_until,
    `manual-${Date.now()}`,
    now
  );

  return {
    id: Number(result.lastInsertRowid),
    user_id,
    section_id,
  };
};

module.exports = {
  addContentItem,
  createCatalog,
  createSection,
  createTestWithQuestions,
  getCatalogs: () => selectCatalogs.all(),
  getSections: () => selectSections.all(),
  getStudents: () => selectUsersByRole.all('student'),
  getTeachers: () => selectUsersByRole.all('teacher'),
  grantSectionAccess,
};
