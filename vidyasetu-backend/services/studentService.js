const { database } = require('../db/connection');

const selectPurchasedSections = database.prepare(`
  SELECT
    purchases.id AS purchase_id,
    purchases.status,
    purchases.valid_until,
    purchases.amount_paise,
    purchases.max_attempts,
    purchases.payment_ref,
    catalog_sections.id AS section_id,
    catalog_sections.title AS section_title,
    catalog_sections.slug AS section_slug,
    catalog_sections.description AS section_description,
    catalog_sections.validity_days,
    catalogs.id AS catalog_id,
    catalogs.title AS catalog_title,
    catalogs.slug AS catalog_slug
  FROM purchases
  INNER JOIN catalog_sections ON catalog_sections.id = purchases.section_id
  INNER JOIN catalogs ON catalogs.id = catalog_sections.catalog_id
  WHERE purchases.user_id = ?
    AND purchases.status = 'paid'
    AND (purchases.valid_until IS NULL OR purchases.valid_until >= ?)
  ORDER BY catalogs.title ASC, catalog_sections.title ASC
`);

const selectSectionWithCatalog = database.prepare(`
  SELECT
    catalog_sections.id,
    catalog_sections.catalog_id,
    catalog_sections.title,
    catalog_sections.slug,
    catalog_sections.description,
    catalog_sections.price_paise,
    catalog_sections.validity_days,
    catalog_sections.max_attempts_per_test,
    catalog_sections.is_demo_available,
    catalogs.title AS catalog_title,
    catalogs.slug AS catalog_slug
  FROM catalog_sections
  INNER JOIN catalogs ON catalogs.id = catalog_sections.catalog_id
  WHERE catalog_sections.id = ?
    AND catalog_sections.is_active = 1
`);

const selectContentBySectionId = database.prepare(`
  SELECT id, type, title, url, description, sort_order
  FROM content_items
  WHERE section_id = ?
  ORDER BY sort_order ASC, id ASC
`);

const selectTestsBySectionId = database.prepare(`
  SELECT
    id,
    title,
    description,
    duration_minutes,
    attempt_limit,
    is_demo
  FROM tests
  WHERE section_id = ?
    AND is_active = 1
  ORDER BY id ASC
`);

const selectUserPurchaseForSection = database.prepare(`
  SELECT *
  FROM purchases
  WHERE user_id = ?
    AND section_id = ?
    AND status = 'paid'
    AND (valid_until IS NULL OR valid_until >= ?)
  ORDER BY id DESC
  LIMIT 1
`);

const selectLatestPaidPurchaseForSection = database.prepare(`
  SELECT *
  FROM purchases
  WHERE user_id = ?
    AND section_id = ?
    AND status = 'paid'
  ORDER BY id DESC
  LIMIT 1
`);

const selectAttemptsForSection = database.prepare(`
  SELECT
    test_attempts.id,
    test_attempts.test_id,
    test_attempts.attempt_number,
    test_attempts.status,
    test_attempts.score,
    test_attempts.started_at,
    test_attempts.submitted_at,
    tests.title AS test_title
  FROM test_attempts
  INNER JOIN tests ON tests.id = test_attempts.test_id
  WHERE test_attempts.user_id = ?
    AND tests.section_id = ?
  ORDER BY test_attempts.id DESC
`);

const insertPurchase = database.prepare(`
  INSERT INTO purchases (
    user_id,
    section_id,
    amount_paise,
    max_attempts,
    status,
    created_at
  )
  VALUES (?, ?, ?, ?, 'pending', ?)
`);

const updatePurchase = database.prepare(`
  UPDATE purchases
  SET status = 'paid',
      valid_from = ?,
      valid_until = ?,
      payment_ref = ?
  WHERE id = ? AND user_id = ?
`);

const selectPurchaseById = database.prepare(`
  SELECT purchases.*, catalog_sections.validity_days
  FROM purchases
  INNER JOIN catalog_sections ON catalog_sections.id = purchases.section_id
  WHERE purchases.id = ? AND purchases.user_id = ?
`);

const selectPaidSectionAttemptCountSince = database.prepare(`
  SELECT COUNT(*) AS count
  FROM test_attempts
  INNER JOIN tests ON tests.id = test_attempts.test_id
  WHERE test_attempts.user_id = ?
    AND tests.section_id = ?
    AND tests.is_demo = 0
    AND test_attempts.started_at >= ?
`);

const selectAttemptCountForTest = database.prepare(`
  SELECT COUNT(*) AS count
  FROM test_attempts
  WHERE user_id = ? AND test_id = ?
`);

const selectLatestAttemptForTest = database.prepare(`
  SELECT id, attempt_number, status, score, submitted_at
  FROM test_attempts
  WHERE user_id = ? AND test_id = ?
  ORDER BY id DESC
  LIMIT 1
`);

const selectTestById = database.prepare(`
  SELECT
    tests.id,
    tests.section_id,
    tests.title,
    tests.description,
    tests.duration_minutes,
    tests.attempt_limit,
    tests.is_demo,
    catalog_sections.title AS section_title,
    catalog_sections.max_attempts_per_test
  FROM tests
  INNER JOIN catalog_sections ON catalog_sections.id = tests.section_id
  WHERE tests.id = ?
    AND tests.is_active = 1
`);

const insertAttempt = database.prepare(`
  INSERT INTO test_attempts (
    user_id,
    test_id,
    attempt_number,
    status,
    started_at,
    score,
    remaining_seconds_snapshot
  )
  VALUES (?, ?, ?, 'in_progress', ?, 0, ?)
`);

const selectQuestionsByTestId = database.prepare(`
  SELECT
    questions.id,
    questions.test_id,
    questions.passage_id,
    questions.question_text,
    questions.question_type,
    questions.marks,
    questions.negative_marks,
    questions.sort_order,
    questions.solution_text,
    test_passages.title AS passage_title,
    test_passages.context_text
  FROM questions
  LEFT JOIN test_passages ON test_passages.id = questions.passage_id
  WHERE questions.test_id = ?
  ORDER BY questions.sort_order ASC, questions.id ASC
`);

const selectOptionsByQuestionId = database.prepare(`
  SELECT id, option_text, is_correct, sort_order
  FROM question_options
  WHERE question_id = ?
  ORDER BY sort_order ASC, id ASC
`);

const insertAttemptState = database.prepare(`
  INSERT INTO attempt_question_states (attempt_id, question_id, status)
  VALUES (?, ?, ?)
`);

const selectAttemptById = database.prepare(`
  SELECT
    test_attempts.*,
    tests.title AS test_title,
    tests.duration_minutes,
    tests.section_id,
    tests.is_demo,
    catalog_sections.title AS section_title
  FROM test_attempts
  INNER JOIN tests ON tests.id = test_attempts.test_id
  INNER JOIN catalog_sections ON catalog_sections.id = tests.section_id
  WHERE test_attempts.id = ?
`);

const selectAttemptStates = database.prepare(`
  SELECT question_id, status
  FROM attempt_question_states
  WHERE attempt_id = ?
`);

const selectAttemptAnswers = database.prepare(`
  SELECT question_id, option_id
  FROM attempt_answers
  WHERE attempt_id = ?
`);

const deleteAttemptAnswersForQuestion = database.prepare(`
  DELETE FROM attempt_answers
  WHERE attempt_id = ? AND question_id = ?
`);

const insertAttemptAnswer = database.prepare(`
  INSERT INTO attempt_answers (attempt_id, question_id, option_id)
  VALUES (?, ?, ?)
`);

const updateAttemptState = database.prepare(`
  UPDATE attempt_question_states
  SET status = ?
  WHERE attempt_id = ? AND question_id = ?
`);

const updateAttemptSubmission = database.prepare(`
  UPDATE test_attempts
  SET status = ?,
      submitted_at = ?,
      score = ?,
      remaining_seconds_snapshot = 0
  WHERE id = ?
`);

const updateAttemptRemainingSnapshot = database.prepare(`
  UPDATE test_attempts
  SET remaining_seconds_snapshot = ?
  WHERE id = ?
`);

const getNowIso = () => new Date().toISOString();

const getRemainingSeconds = (attempt) => {
  const endTimeMs = new Date(attempt.started_at).getTime() + (attempt.duration_minutes * 60 * 1000);
  return Math.max(0, Math.floor((endTimeMs - Date.now()) / 1000));
};

const enrichPurchaseUsage = (userId, sectionId, purchase) => {
  if (!purchase) {
    return null;
  }

  const activeFrom = purchase.valid_from || purchase.created_at || getNowIso();
  const attemptsUsed = Number(
    selectPaidSectionAttemptCountSince.get(userId, sectionId, activeFrom)?.count || 0
  );
  const maxAttempts = Number(purchase.max_attempts || 10);

  return {
    ...purchase,
    attempts_used: attemptsUsed,
    attempts_remaining: Math.max(0, maxAttempts - attemptsUsed),
    max_attempts: maxAttempts,
  };
};

const getActivePurchase = (userId, sectionId) => {
  const purchase = selectUserPurchaseForSection.get(userId, sectionId, getNowIso()) || null;
  const enrichedPurchase = enrichPurchaseUsage(userId, sectionId, purchase);

  if (!enrichedPurchase || enrichedPurchase.attempts_remaining <= 0) {
    return null;
  }

  return enrichedPurchase;
};

const hasSectionAccess = (userId, sectionId) => Boolean(getActivePurchase(userId, sectionId));

const groupDashboardSections = (purchases) => {
  const byCatalog = new Map();

  for (const purchase of purchases) {
    if (!byCatalog.has(purchase.catalog_id)) {
      byCatalog.set(purchase.catalog_id, {
        catalog_id: purchase.catalog_id,
        catalog_title: purchase.catalog_title,
        catalog_slug: purchase.catalog_slug,
        sections: [],
      });
    }

    byCatalog.get(purchase.catalog_id).sections.push({
      purchase_id: purchase.purchase_id,
      section_id: purchase.section_id,
      section_title: purchase.section_title,
      section_slug: purchase.section_slug,
      section_description: purchase.section_description,
      valid_until: purchase.valid_until,
      amount_paise: purchase.amount_paise,
    });
  }

  return [...byCatalog.values()];
};

const getDashboard = (userId) => {
  const purchases = selectPurchasedSections
    .all(userId, getNowIso())
    .map((purchase) => enrichPurchaseUsage(userId, purchase.section_id, purchase))
    .filter((purchase) => purchase && purchase.attempts_remaining > 0);

  return {
    purchased_catalogs: groupDashboardSections(purchases),
    purchases,
  };
};

const createPurchaseOrder = (userId, sectionId) => {
  const section = selectSectionWithCatalog.get(sectionId);

  if (!section) {
    throw new Error('Section not found');
  }

  const now = getNowIso();
  const result = insertPurchase.run(userId, sectionId, section.price_paise, 10, now);

  return {
    purchase_id: Number(result.lastInsertRowid),
    amount_paise: section.price_paise,
    section_title: section.title,
    upi_intent: `upi://pay?pa=vidyasetu@upi&pn=VidyaSetu&am=${(section.price_paise / 100).toFixed(2)}`,
  };
};

const verifyPurchase = (userId, purchaseId, upiRef) => {
  const purchase = selectPurchaseById.get(purchaseId, userId);

  if (!purchase) {
    throw new Error('Purchase not found');
  }

  const validFrom = getNowIso();
  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + 30);
  const validUntil = validUntilDate.toISOString();

  updatePurchase.run(
    validFrom,
    validUntil,
    upiRef || `upi-${Date.now()}`,
    purchaseId,
    userId
  );

  return {
    purchase_id: purchaseId,
    status: 'paid',
    valid_until: validUntil,
  };
};

const getSectionDetails = (userId, sectionId) => {
  const section = selectSectionWithCatalog.get(sectionId);

  if (!section) {
    throw new Error('Section not found');
  }

  const purchase = getActivePurchase(userId, sectionId);
  const latestPaidPurchase = enrichPurchaseUsage(
    userId,
    sectionId,
    selectLatestPaidPurchaseForSection.get(userId, sectionId) || null
  );
  const tests = selectTestsBySectionId.all(sectionId).map((test) => {
    const attempts = selectAttemptsForSection
      .all(userId, sectionId)
      .filter((attempt) => attempt.test_id === test.id);
    const latestAttempt = attempts[0] || null;

    return {
      ...test,
      has_access: Boolean(purchase) || Boolean(test.is_demo),
      latest_attempt: latestAttempt,
      attempt_count: attempts.length,
      can_resume: latestAttempt?.status === 'in_progress',
      can_start: test.is_demo
        ? attempts.length === 0
        : Boolean(purchase) && attempts.length < Math.min(
          Number(test.attempt_limit || 1),
          Number(section.max_attempts_per_test || test.attempt_limit || 1)
        ),
    };
  });

  return {
    ...section,
    has_purchase: Boolean(purchase),
    purchase,
    latest_paid_purchase: latestPaidPurchase,
    content_items: selectContentBySectionId.all(sectionId),
    tests,
    attempts: selectAttemptsForSection.all(userId, sectionId),
  };
};

const startTest = (userId, testId) => {
  const test = selectTestById.get(testId);

  if (!test) {
    throw new Error('Test not found');
  }

  if (!test.is_demo && !hasSectionAccess(userId, test.section_id)) {
    throw new Error('Purchase required for this test');
  }

  const previousAttemptCount = selectAttemptCountForTest.get(userId, testId).count;
  const latestAttempt = selectLatestAttemptForTest.get(userId, testId);

  if (latestAttempt?.status === 'in_progress') {
    return {
      attempt_id: latestAttempt.id,
      attempt_number: latestAttempt.attempt_number,
      resumed: true,
    };
  }

  if (test.is_demo && previousAttemptCount >= 1) {
    throw new Error('Demo test can be attempted only once');
  }

  const maxAttempts = Math.min(
    Number(test.attempt_limit || 1),
    Number(test.max_attempts_per_test || test.attempt_limit || 1)
  );

  if (previousAttemptCount >= maxAttempts) {
    throw new Error('Attempt limit reached for this test');
  }

  const startedAt = getNowIso();
  const totalSeconds = Number(test.duration_minutes) * 60;
  const result = insertAttempt.run(
    userId,
    testId,
    previousAttemptCount + 1,
    startedAt,
    totalSeconds
  );
  const attemptId = Number(result.lastInsertRowid);

  selectQuestionsByTestId.all(testId).forEach((question) => {
    insertAttemptState.run(attemptId, question.id, 'not_visited');
  });

  return {
    attempt_id: attemptId,
    attempt_number: previousAttemptCount + 1,
  };
};

const getAttemptForUser = (userId, attemptId) => {
  const attempt = selectAttemptById.get(attemptId);

  if (!attempt || attempt.user_id !== userId) {
    throw new Error('Attempt not found');
  }

  if (attempt.status === 'in_progress') {
    const remainingSeconds = getRemainingSeconds(attempt);
    updateAttemptRemainingSnapshot.run(remainingSeconds, attempt.id);

    if (remainingSeconds <= 0) {
      return submitAttempt(userId, attemptId, true);
    }
  }

  const currentAttempt = selectAttemptById.get(attemptId);
  const states = new Map(
    selectAttemptStates.all(attemptId).map((item) => [item.question_id, item.status])
  );
  const answersByQuestion = new Map();

  selectAttemptAnswers.all(attemptId).forEach((item) => {
    if (!answersByQuestion.has(item.question_id)) {
      answersByQuestion.set(item.question_id, []);
    }

    answersByQuestion.get(item.question_id).push(item.option_id);
  });

  const questions = selectQuestionsByTestId.all(currentAttempt.test_id).map((question) => ({
    id: question.id,
    question_text: question.question_text,
    question_type: question.question_type,
    marks: question.marks,
    negative_marks: question.negative_marks,
    solution_text: question.solution_text,
    state: states.get(question.id) || 'not_visited',
    selected_option_ids: answersByQuestion.get(question.id) || [],
    passage: question.passage_id ? {
      id: question.passage_id,
      title: question.passage_title,
      context_text: question.context_text,
    } : null,
    options: selectOptionsByQuestionId.all(question.id).map((option) => ({
      id: option.id,
      option_text: option.option_text,
    })),
  }));

  return {
    attempt_id: currentAttempt.id,
    attempt_number: currentAttempt.attempt_number,
    status: currentAttempt.status,
    test: {
      id: currentAttempt.test_id,
      title: currentAttempt.test_title,
      section_id: currentAttempt.section_id,
      section_title: currentAttempt.section_title,
      duration_minutes: currentAttempt.duration_minutes,
      is_demo: Boolean(currentAttempt.is_demo),
    },
    remaining_time: currentAttempt.status === 'in_progress' ? getRemainingSeconds(currentAttempt) : 0,
    questions,
  };
};

const saveAnswer = (userId, attemptId, questionId, optionIds) => {
  const attempt = selectAttemptById.get(attemptId);

  if (!attempt || attempt.user_id !== userId) {
    throw new Error('Attempt not found');
  }

  if (attempt.status !== 'in_progress') {
    throw new Error('Attempt already submitted');
  }

  const question = selectQuestionsByTestId.all(attempt.test_id).find((item) => item.id === questionId);

  if (!question) {
    throw new Error('Question not found');
  }

  const allowedOptionIds = new Set(selectOptionsByQuestionId.all(questionId).map((option) => option.id));
  const normalizedOptionIds = [...new Set((optionIds || []).map(Number))]
    .filter((optionId) => allowedOptionIds.has(optionId));

  database.transaction(() => {
    deleteAttemptAnswersForQuestion.run(attemptId, questionId);
    normalizedOptionIds.forEach((optionId) => {
      insertAttemptAnswer.run(attemptId, questionId, optionId);
    });

    const currentState = (selectAttemptStates.all(attemptId).find((state) => state.question_id === questionId) || {}).status;
    const nextState = normalizedOptionIds.length
      ? (currentState === 'marked_for_review' || currentState === 'answered_and_marked'
        ? 'answered_and_marked'
        : 'answered')
      : (currentState === 'marked_for_review' || currentState === 'answered_and_marked'
        ? 'marked_for_review'
        : 'not_answered');

    updateAttemptState.run(nextState, attemptId, questionId);
  })();

  return {
    attempt_id: attemptId,
    question_id: questionId,
    option_ids: normalizedOptionIds,
  };
};

const setQuestionState = (userId, attemptId, questionId, status) => {
  const attempt = selectAttemptById.get(attemptId);

  if (!attempt || attempt.user_id !== userId) {
    throw new Error('Attempt not found');
  }

  if (attempt.status !== 'in_progress') {
    throw new Error('Attempt already submitted');
  }

  const validStatuses = new Set([
    'not_visited',
    'not_answered',
    'answered',
    'marked_for_review',
    'answered_and_marked',
  ]);

  if (!validStatuses.has(status)) {
    throw new Error('Invalid question state');
  }

  updateAttemptState.run(status, attemptId, questionId);

  return {
    attempt_id: attemptId,
    question_id: questionId,
    status,
  };
};

const finalizeAttempt = (attempt, autoSubmitted = false) => {
  const questions = selectQuestionsByTestId.all(attempt.test_id);
  const answersByQuestion = new Map();

  selectAttemptAnswers.all(attempt.id).forEach((item) => {
    if (!answersByQuestion.has(item.question_id)) {
      answersByQuestion.set(item.question_id, []);
    }

    answersByQuestion.get(item.question_id).push(item.option_id);
  });

  let score = 0;

  questions.forEach((question) => {
    const selectedIds = new Set(answersByQuestion.get(question.id) || []);
    const correctIds = new Set(
      selectOptionsByQuestionId.all(question.id)
        .filter((option) => option.is_correct)
        .map((option) => option.id)
    );

    const exactMatch = selectedIds.size === correctIds.size
      && [...selectedIds].every((id) => correctIds.has(id));

    if (exactMatch) {
      score += Number(question.marks);
    } else if (selectedIds.size > 0) {
      score -= Number(question.negative_marks || 0);
    }
  });

  const submittedAt = getNowIso();
  updateAttemptSubmission.run(autoSubmitted ? 'auto_submitted' : 'submitted', submittedAt, score, attempt.id);

  return {
    attempt_id: attempt.id,
    status: autoSubmitted ? 'auto_submitted' : 'submitted',
    submitted_at: submittedAt,
    score,
    remaining_time: 0,
  };
};

const submitAttempt = (userId, attemptId, autoSubmitted = false) => {
  const attempt = selectAttemptById.get(attemptId);

  if (!attempt || attempt.user_id !== userId) {
    throw new Error('Attempt not found');
  }

  if (attempt.status !== 'in_progress') {
    return {
      attempt_id: attempt.id,
      status: attempt.status,
      submitted_at: attempt.submitted_at,
      score: attempt.score,
      remaining_time: 0,
    };
  }

  return finalizeAttempt(attempt, autoSubmitted);
};

const getAttemptReview = (userId, attemptId) => {
  const attempt = selectAttemptById.get(attemptId);

  if (!attempt || attempt.user_id !== userId) {
    throw new Error('Attempt not found');
  }

  if (attempt.status === 'in_progress') {
    throw new Error('Attempt review is available only after submission');
  }

  const questions = selectQuestionsByTestId.all(attempt.test_id);
  const answersByQuestion = new Map();

  selectAttemptAnswers.all(attemptId).forEach((item) => {
    if (!answersByQuestion.has(item.question_id)) {
      answersByQuestion.set(item.question_id, []);
    }

    answersByQuestion.get(item.question_id).push(item.option_id);
  });

  let correctCount = 0;
  let wrongCount = 0;
  let notAttemptedCount = 0;

  const reviewQuestions = questions.map((question) => {
    const options = selectOptionsByQuestionId.all(question.id).map((option) => ({
      id: option.id,
      option_text: option.option_text,
      is_correct: Boolean(option.is_correct),
    }));
    const selectedIds = new Set(answersByQuestion.get(question.id) || []);
    const correctIds = new Set(options.filter((option) => option.is_correct).map((option) => option.id));
    const exactMatch = selectedIds.size === correctIds.size
      && [...selectedIds].every((id) => correctIds.has(id));

    if (selectedIds.size === 0) {
      notAttemptedCount += 1;
    } else if (exactMatch) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }

    return {
      id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      marks: question.marks,
      negative_marks: question.negative_marks,
      solution_text: question.solution_text,
      passage: question.passage_id ? {
        id: question.passage_id,
        title: question.passage_title,
        context_text: question.context_text,
      } : null,
      options,
      selected_option_ids: [...selectedIds],
      is_correct: exactMatch,
    };
  });

  return {
    attempt_id: attempt.id,
    attempt_number: attempt.attempt_number,
    status: attempt.status,
    score: attempt.score,
    summary: {
      correct_count: correctCount,
      wrong_count: wrongCount,
      not_attempted_count: notAttemptedCount,
      common_mistakes: reviewQuestions
        .filter((question) => !question.is_correct && question.selected_option_ids.length > 0)
        .slice(0, 5)
        .map((question) => ({
          question_id: question.id,
          question_text: question.question_text,
          solution_text: question.solution_text,
        })),
    },
    test: {
      id: attempt.test_id,
      title: attempt.test_title,
      section_id: attempt.section_id,
      section_title: attempt.section_title,
    },
    questions: reviewQuestions,
  };
};

const getPurchases = (userId) => {
  return selectPurchasedSections.all(userId, getNowIso());
};

module.exports = {
  createPurchaseOrder,
  getAttemptForUser,
  getAttemptReview,
  getDashboard,
  getPurchases,
  getSectionDetails,
  saveAnswer,
  setQuestionState,
  startTest,
  submitAttempt,
  verifyPurchase,
};
