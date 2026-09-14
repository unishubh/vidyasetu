const { database } = require('../db/connection');

const STUDENT_LIST_QUERY = `
  SELECT
    users.id,
    users.name,
    users.email,
    users.status,
    users.created_at,
    users.last_login_at,
    users.admin_notes,
    COALESCE(attempt_metrics.total_attempts, 0) AS total_attempts,
    COALESCE(ROUND(attempt_metrics.avg_score, 2), 0) AS avg_score,
    MAX(
      COALESCE(users.last_login_at, ''),
      COALESCE(attempt_metrics.last_attempt_at, ''),
      COALESCE(purchase_metrics.last_purchase_at, ''),
      COALESCE(users.created_at, '')
    ) AS last_active_at
  FROM users
  LEFT JOIN (
    SELECT
      test_attempts.user_id,
      COUNT(*) AS total_attempts,
      AVG(test_attempts.score) AS avg_score,
      MAX(COALESCE(test_attempts.submitted_at, test_attempts.started_at)) AS last_attempt_at
    FROM test_attempts
    GROUP BY test_attempts.user_id
  ) AS attempt_metrics ON attempt_metrics.user_id = users.id
  LEFT JOIN (
    SELECT
      purchases.user_id,
      MAX(COALESCE(purchases.valid_from, purchases.created_at)) AS last_purchase_at
    FROM purchases
    WHERE purchases.status = 'paid'
    GROUP BY purchases.user_id
  ) AS purchase_metrics ON purchase_metrics.user_id = users.id
  WHERE users.role = 'student'
  ORDER BY users.name COLLATE NOCASE ASC, users.id ASC
`;

const selectCrmStudents = database.prepare(STUDENT_LIST_QUERY);

const selectStudentProfile = database.prepare(`
  SELECT
    users.id,
    users.name,
    users.email,
    users.role,
    users.status,
    users.created_at,
    users.last_login_at,
    users.admin_notes,
    COALESCE(metrics.total_attempts, 0) AS total_attempts,
    COALESCE(ROUND(metrics.avg_score, 2), 0) AS avg_score,
    COALESCE(metrics.best_score, 0) AS best_score,
    COALESCE(metrics.avg_score_last_5, 0) AS avg_score_last_5,
    COALESCE(metrics.completed_attempts, 0) AS completed_attempts,
    COALESCE(metrics.in_progress_attempts, 0) AS in_progress_attempts,
    metrics.last_attempt_at,
    MAX(
      COALESCE(users.last_login_at, ''),
      COALESCE(metrics.last_attempt_at, ''),
      COALESCE(purchases.last_purchase_at, ''),
      COALESCE(users.created_at, '')
    ) AS last_active_at
  FROM users
  LEFT JOIN (
    SELECT
      attempts.user_id,
      COUNT(*) AS total_attempts,
      AVG(attempts.score) AS avg_score,
      MAX(attempts.score) AS best_score,
      SUM(CASE WHEN attempts.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_attempts,
      SUM(CASE WHEN attempts.status != 'in_progress' THEN 1 ELSE 0 END) AS completed_attempts,
      MAX(COALESCE(attempts.submitted_at, attempts.started_at)) AS last_attempt_at,
      (
        SELECT COALESCE(ROUND(AVG(last_five.score), 2), 0)
        FROM (
          SELECT score
          FROM test_attempts
          WHERE user_id = attempts.user_id
            AND status != 'in_progress'
          ORDER BY COALESCE(submitted_at, started_at) DESC, id DESC
          LIMIT 5
        ) AS last_five
      ) AS avg_score_last_5
    FROM test_attempts AS attempts
    GROUP BY attempts.user_id
  ) AS metrics ON metrics.user_id = users.id
  LEFT JOIN (
    SELECT
      purchases.user_id,
      MAX(COALESCE(purchases.valid_from, purchases.created_at)) AS last_purchase_at
    FROM purchases
    WHERE purchases.status = 'paid'
    GROUP BY purchases.user_id
  ) AS purchases ON purchases.user_id = users.id
  WHERE users.id = ?
    AND users.role = 'student'
`);

const selectStudentPurchases = database.prepare(`
  SELECT
    purchases.id,
    purchases.section_id,
    purchases.amount_paise,
    purchases.max_attempts,
    purchases.status,
    purchases.valid_from,
    purchases.valid_until,
    purchases.payment_ref,
    purchases.created_at,
    catalog_sections.title AS section_title,
    catalog_sections.slug AS section_slug,
    catalogs.id AS catalog_id,
    catalogs.title AS catalog_title
  FROM purchases
  INNER JOIN catalog_sections ON catalog_sections.id = purchases.section_id
  INNER JOIN catalogs ON catalogs.id = catalog_sections.catalog_id
  WHERE purchases.user_id = ?
  ORDER BY COALESCE(purchases.valid_from, purchases.created_at) DESC, purchases.id DESC
`);

const selectStudentAttemptTrend = database.prepare(`
  SELECT
    test_attempts.id,
    test_attempts.test_id,
    test_attempts.attempt_number,
    test_attempts.status,
    test_attempts.score,
    test_attempts.started_at,
    test_attempts.submitted_at,
    tests.title AS test_title,
    catalog_sections.id AS section_id,
    catalog_sections.title AS section_title
  FROM test_attempts
  INNER JOIN tests ON tests.id = test_attempts.test_id
  INNER JOIN catalog_sections ON catalog_sections.id = tests.section_id
  WHERE test_attempts.user_id = ?
  ORDER BY COALESCE(test_attempts.submitted_at, test_attempts.started_at) DESC, test_attempts.id DESC
  LIMIT 12
`);

const selectStudentSections = database.prepare(`
  SELECT
    catalog_sections.id,
    catalog_sections.title,
    catalog_sections.slug,
    catalogs.title AS catalog_title
  FROM catalog_sections
  INNER JOIN catalogs ON catalogs.id = catalog_sections.catalog_id
  WHERE catalog_sections.is_active = 1
  ORDER BY catalogs.title COLLATE NOCASE ASC, catalog_sections.title COLLATE NOCASE ASC
`);

const selectActiveSectionPurchases = database.prepare(`
  SELECT
    purchases.id,
    purchases.section_id,
    purchases.max_attempts,
    purchases.status,
    purchases.valid_until,
    purchases.created_at,
    catalog_sections.title AS section_title,
    catalogs.title AS catalog_title
  FROM purchases
  INNER JOIN catalog_sections ON catalog_sections.id = purchases.section_id
  INNER JOIN catalogs ON catalogs.id = catalog_sections.catalog_id
  WHERE purchases.user_id = ?
    AND purchases.status = 'paid'
    AND (purchases.valid_until IS NULL OR purchases.valid_until >= ?)
  ORDER BY purchases.id DESC
`);

const selectStudentById = database.prepare(`
  SELECT id, name, email, role, status, admin_notes, last_login_at, created_at
  FROM users
  WHERE id = ?
    AND role = 'student'
`);

const selectLoginActivities = database.prepare(`
  SELECT
    id,
    'login' AS type,
    provider AS actor,
    logged_in_at AS occurred_at,
    NULL AS secondary_at,
    'Signed in via ' || provider AS summary
  FROM user_login_events
  WHERE user_id = ?
  ORDER BY logged_in_at DESC, id DESC
  LIMIT 10
`);

const selectAttemptActivities = database.prepare(`
  SELECT
    test_attempts.id,
    'attempt' AS type,
    tests.title AS actor,
    test_attempts.started_at AS occurred_at,
    test_attempts.submitted_at AS secondary_at,
    CASE
      WHEN test_attempts.status = 'in_progress' THEN 'Started attempt #' || test_attempts.attempt_number || ' for ' || tests.title
      ELSE 'Submitted attempt #' || test_attempts.attempt_number || ' for ' || tests.title
    END AS summary,
    test_attempts.status,
    test_attempts.score,
    test_attempts.attempt_number,
    tests.id AS test_id
  FROM test_attempts
  INNER JOIN tests ON tests.id = test_attempts.test_id
  WHERE test_attempts.user_id = ?
  ORDER BY COALESCE(test_attempts.submitted_at, test_attempts.started_at) DESC, test_attempts.id DESC
  LIMIT 10
`);

const updateStudentNotesStmt = database.prepare(`
  UPDATE users
  SET admin_notes = ?
  WHERE id = ?
    AND role = 'student'
`);

const selectSectionForAccess = database.prepare(`
  SELECT id, price_paise, validity_days
  FROM catalog_sections
  WHERE id = ?
    AND is_active = 1
`);

const insertPurchaseAccess = database.prepare(`
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

const revokePurchaseAccess = database.prepare(`
  UPDATE purchases
  SET status = 'expired',
      valid_until = ?
  WHERE user_id = ?
    AND section_id = ?
    AND status = 'paid'
    AND (valid_until IS NULL OR valid_until >= ?)
`);

const getNowIso = () => new Date().toISOString();

const deriveCrmStatus = (student) => {
  const lastActiveAt = student.last_active_at ? new Date(student.last_active_at).getTime() : 0;
  const daysSinceActive = lastActiveAt
    ? Math.floor((Date.now() - lastActiveAt) / (1000 * 60 * 60 * 24))
    : null;

  if (Number(student.avg_score) >= 70 && Number(student.total_attempts) >= 2) {
    return 'high_performer';
  }

  if (daysSinceActive === null || daysSinceActive > 14) {
    return 'at_risk';
  }

  return 'active';
};

const mapStudentSummary = (student) => ({
  ...student,
  avg_score: Number(student.avg_score || 0),
  total_attempts: Number(student.total_attempts || 0),
  crm_status: deriveCrmStatus(student),
});

const getCrmStudents = () => {
  return selectCrmStudents.all().map(mapStudentSummary);
};

const getStudentActivityLog = (studentId) => {
  if (!selectStudentById.get(studentId)) {
    throw new Error('Student not found');
  }

  const activities = [
    ...selectLoginActivities.all(studentId).map((item) => ({
      id: `login-${item.id}`,
      type: item.type,
      occurred_at: item.occurred_at,
      summary: item.summary,
      provider: item.actor,
    })),
    ...selectAttemptActivities.all(studentId).map((item) => ({
      id: `attempt-${item.id}`,
      type: item.type,
      occurred_at: item.secondary_at || item.occurred_at,
      started_at: item.occurred_at,
      summary: item.summary,
      status: item.status,
      score: Number(item.score || 0),
      attempt_number: item.attempt_number,
      test_id: item.test_id,
      test_title: item.actor,
    })),
  ];

  return activities
    .sort((left, right) => {
      const leftTime = new Date(left.occurred_at || 0).getTime();
      const rightTime = new Date(right.occurred_at || 0).getTime();
      return rightTime - leftTime;
    })
    .slice(0, 10);
};

const getStudentDetails = (studentId) => {
  const student = selectStudentProfile.get(studentId);

  if (!student) {
    throw new Error('Student not found');
  }

  const purchases = selectStudentPurchases.all(studentId).map((purchase) => ({
    ...purchase,
    amount_paise: Number(purchase.amount_paise || 0),
  }));
  const recentAttempts = selectStudentAttemptTrend.all(studentId).map((attempt) => ({
    ...attempt,
    score: Number(attempt.score || 0),
  }));
  const activity = getStudentActivityLog(studentId);
  const accessSections = selectActiveSectionPurchases.all(studentId, getNowIso());

  return {
    student: mapStudentSummary(student),
    purchases,
    activity,
    performance: {
      recent_attempts: recentAttempts,
      total_attempts: Number(student.total_attempts || 0),
      avg_score: Number(student.avg_score || 0),
      best_score: Number(student.best_score || 0),
      avg_score_last_5: Number(student.avg_score_last_5 || 0),
      completed_attempts: Number(student.completed_attempts || 0),
      in_progress_attempts: Number(student.in_progress_attempts || 0),
    },
    access: {
      active_sections: accessSections,
      available_sections: selectStudentSections.all(),
    },
  };
};

const updateStudentNotes = (studentId, adminNotes) => {
  const student = selectStudentById.get(studentId);

  if (!student) {
    throw new Error('Student not found');
  }

  updateStudentNotesStmt.run(adminNotes?.trim() || null, studentId);

  return {
    id: studentId,
    admin_notes: adminNotes?.trim() || null,
  };
};

const grantStudentSectionAccess = (studentId, sectionId, validUntil) => {
  const student = selectStudentById.get(studentId);
  const section = selectSectionForAccess.get(sectionId);

  if (!student) {
    throw new Error('Student not found');
  }

  if (!section) {
    throw new Error('Section not found');
  }

  const now = getNowIso();
  const result = insertPurchaseAccess.run(
    studentId,
    sectionId,
    0,
    10,
    now,
    validUntil || null,
    `crm-manual-${Date.now()}`,
    now
  );

  return {
    id: Number(result.lastInsertRowid),
    user_id: studentId,
    section_id: sectionId,
  };
};

const revokeStudentSectionAccess = (studentId, sectionId) => {
  const student = selectStudentById.get(studentId);

  if (!student) {
    throw new Error('Student not found');
  }

  const now = getNowIso();
  const result = revokePurchaseAccess.run(now, studentId, sectionId, now);

  return {
    user_id: studentId,
    section_id: sectionId,
    revoked: result.changes > 0,
  };
};

module.exports = {
  getCrmStudents,
  getStudentActivityLog,
  getStudentDetails,
  grantStudentSectionAccess,
  revokeStudentSectionAccess,
  updateStudentNotes,
};
