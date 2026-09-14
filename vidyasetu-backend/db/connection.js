const path = require('path');
const Database = require('better-sqlite3');

const databasePath = path.join(__dirname, 'vidyasetu_lms.sqlite');
const database = new Database(databasePath);

const createTables = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TEXT NOT NULL,
    admin_notes TEXT,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS user_auth_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook')),
    provider_user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(provider, provider_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS catalogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS catalog_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    catalog_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price_paise INTEGER NOT NULL DEFAULT 0,
    validity_days INTEGER NOT NULL DEFAULT 30,
    max_attempts_per_test INTEGER NOT NULL DEFAULT 3,
    is_demo_available INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    UNIQUE(catalog_id, slug),
    FOREIGN KEY (catalog_id) REFERENCES catalogs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS content_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'ppt', 'doc')),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (section_id) REFERENCES catalog_sections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    attempt_limit INTEGER NOT NULL DEFAULT 3,
    is_demo INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER,
    FOREIGN KEY (section_id) REFERENCES catalog_sections(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS test_passages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    title TEXT,
    context_text TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    passage_id INTEGER,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('single_correct', 'multiple_correct')),
    marks REAL NOT NULL DEFAULT 1,
    negative_marks REAL NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    solution_text TEXT,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (passage_id) REFERENCES test_passages(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS question_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    is_correct INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    amount_paise INTEGER NOT NULL,
    max_attempts INTEGER NOT NULL DEFAULT 10,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'expired', 'failed')),
    valid_from TEXT,
    valid_until TEXT,
    payment_ref TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES catalog_sections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS test_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'submitted', 'auto_submitted')),
    started_at TEXT NOT NULL,
    submitted_at TEXT,
    score REAL NOT NULL DEFAULT 0,
    remaining_seconds_snapshot INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attempt_question_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (
      status IN (
        'not_visited',
        'not_answered',
        'answered',
        'marked_for_review',
        'answered_and_marked'
      )
    ),
    UNIQUE(attempt_id, question_id),
    FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attempt_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    UNIQUE(attempt_id, question_id, option_id),
    FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES question_options(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_login_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook')),
    logged_in_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_user_auth_user_id ON user_auth_providers(user_id);
  CREATE INDEX IF NOT EXISTS idx_sections_catalog_id ON catalog_sections(catalog_id);
  CREATE INDEX IF NOT EXISTS idx_content_section_id ON content_items(section_id);
  CREATE INDEX IF NOT EXISTS idx_tests_section_id ON tests(section_id);
  CREATE INDEX IF NOT EXISTS idx_passages_test_id ON test_passages(test_id);
  CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
  CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
  CREATE INDEX IF NOT EXISTS idx_purchases_user_section ON purchases(user_id, section_id);
  CREATE INDEX IF NOT EXISTS idx_attempts_user_test ON test_attempts(user_id, test_id);
  CREATE INDEX IF NOT EXISTS idx_attempt_states_attempt_id ON attempt_question_states(attempt_id);
  CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);
  CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON user_login_events(user_id, logged_in_at);
`;

const ensureColumn = (tableName, columnName, definition) => {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all();

  if (!columns.some((column) => column.name === columnName)) {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

const runMigrations = () => {
  ensureColumn('users', 'admin_notes', 'TEXT');
  ensureColumn('users', 'last_login_at', 'TEXT');
  ensureColumn('purchases', 'max_attempts', 'INTEGER NOT NULL DEFAULT 10');
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_login_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook')),
      logged_in_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);
    CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON user_login_events(user_id, logged_in_at);
  `);
};

const initDB = () => {
  database.exec(createTables);
  runMigrations();
};

initDB();

module.exports = {
  database,
  databasePath,
  initDB,
};
