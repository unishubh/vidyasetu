const path = require('path');
const Database = require('better-sqlite3');

const databasePath = path.join(__dirname, 'vidyasetu_lms.sqlite');

const seed = () => {
  const db = new Database(databasePath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

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
        status IN ('not_visited', 'not_answered', 'answered', 'marked_for_review', 'answered_and_marked')
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
  `);
  db.exec(`
    DELETE FROM user_login_events;
    DELETE FROM attempt_answers;
    DELETE FROM attempt_question_states;
    DELETE FROM test_attempts;
    DELETE FROM purchases;
    DELETE FROM question_options;
    DELETE FROM questions;
    DELETE FROM test_passages;
    DELETE FROM tests;
    DELETE FROM content_items;
    DELETE FROM catalog_sections;
    DELETE FROM catalogs;
    DELETE FROM user_auth_providers;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);
  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, role, status, created_at)
    VALUES (?, ?, ?, 'active', ?)
  `);
  const insertProvider = db.prepare(`
    INSERT INTO user_auth_providers (user_id, provider, provider_user_id, created_at)
    VALUES (?, ?, ?, ?)
  `);
  const insertCatalog = db.prepare(`
    INSERT INTO catalogs (title, slug, description, is_active)
    VALUES (?, ?, ?, 1)
  `);
  const insertSection = db.prepare(`
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
  const insertContent = db.prepare(`
    INSERT INTO content_items (section_id, type, title, url, description, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertTest = db.prepare(`
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
  const insertPassage = db.prepare(`
    INSERT INTO test_passages (test_id, title, context_text, sort_order)
    VALUES (?, ?, ?, ?)
  `);
  const insertQuestion = db.prepare(`
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
  const insertOption = db.prepare(`
    INSERT INTO question_options (question_id, option_text, is_correct, sort_order)
    VALUES (?, ?, ?, ?)
  `);
  const users = [
    { name: 'Admin User', email: 'admin@vidyasetu.com', role: 'admin' },
    { name: 'Teacher One', email: 'teacher1@vidyasetu.com', role: 'teacher' },
    { name: 'Student User', email: 'student@vidyasetu.com', role: 'student' },
    { name: 'Another Student', email: 'another.student@vidyasetu.com', role: 'student' },
    { name: 'Student Three', email: 'student3@vidyasetu.com', role: 'student' },
  ];

  const userIds = new Map();

  users.forEach((user) => {
    const result = insertUser.run(user.name, user.email, user.role, now);
    const userId = Number(result.lastInsertRowid);
    userIds.set(user.email, userId);
    insertProvider.run(userId, 'google', `google:${user.email}`, now);
    insertProvider.run(userId, 'facebook', `facebook:${user.email}`, now);
  });

  const teacherId = userIds.get('teacher1@vidyasetu.com');

  const createQuestionBundle = (testId, bundle) => {
    let passageId = null;

    if (bundle.passage_text) {
      passageId = Number(insertPassage.run(
        testId,
        bundle.passage_title || null,
        bundle.passage_text,
        bundle.sort_order || 0
      ).lastInsertRowid);
    }

    bundle.questions.forEach((question, index) => {
      const questionId = Number(insertQuestion.run(
        testId,
        passageId,
        question.question_text,
        question.question_type,
        question.marks,
        question.negative_marks,
        index,
        question.solution_text
      ).lastInsertRowid);

      question.options.forEach((option, optionIndex) => {
        insertOption.run(
          questionId,
          option.text,
          option.is_correct ? 1 : 0,
          optionIndex
        );
      });
    });
  };

  const singleCorrect = ({
    passage_title = '',
    passage_text = '',
    question_text,
    options,
    correct,
    marks = 1,
    negative_marks = 0.25,
    solution_text,
  }) => ({
    passage_title,
    passage_text,
    question_text,
    question_type: 'single_correct',
    marks,
    negative_marks,
    solution_text,
    options: options.map((text) => ({ text, is_correct: text === correct })),
  });

  const multipleCorrect = ({
    passage_title = '',
    passage_text = '',
    question_text,
    options,
    correct,
    marks = 2,
    negative_marks = 0.5,
    solution_text,
  }) => ({
    passage_title,
    passage_text,
    question_text,
    question_type: 'multiple_correct',
    marks,
    negative_marks,
    solution_text,
    options: options.map((text) => ({ text, is_correct: correct.includes(text) })),
  });

  const createTest = ({
    title,
    description,
    duration_minutes,
    attempt_limit,
    is_demo,
    questions,
  }) => ({
    title,
    description,
    duration_minutes,
    attempt_limit,
    is_demo,
    bundles: [
      {
        questions,
      },
    ],
  });

  const quantDemoQuestions = [
    singleCorrect({
      question_text: 'What is 18% of 250?',
      options: ['35', '40', '45', '50'],
      correct: '45',
      solution_text: '18% of 250 is 45.',
    }),
    multipleCorrect({
      question_text: 'Select all prime numbers.',
      options: ['2', '5', '9', '15'],
      correct: ['2', '5'],
      solution_text: '2 and 5 are prime numbers.',
    }),
    singleCorrect({
      question_text: 'What is 25% of 320?',
      options: ['60', '70', '80', '90'],
      correct: '80',
      solution_text: '25% of 320 is one-fourth of 320, which is 80.',
    }),
  ];

  const quantPaidQuestions = [
    singleCorrect({ question_text: 'What is 12% of 450?', options: ['48', '50', '54', '58'], correct: '54', solution_text: '12% of 450 is 54.' }),
    singleCorrect({ question_text: 'A number increases from 80 to 100. What is the percentage increase?', options: ['20%', '22%', '25%', '30%'], correct: '25%', solution_text: 'Increase is 20 on base 80, so 25%.' }),
    singleCorrect({ question_text: 'What is the average of 24, 28, 32, 36 and 40?', options: ['30', '31', '32', '33'], correct: '32', solution_text: 'The sum is 160 and the average is 32.' }),
    singleCorrect({ question_text: 'If CP = 500 and SP = 575, what is the profit percent?', options: ['10%', '12%', '15%', '18%'], correct: '15%', solution_text: 'Profit is 75, and 75/500 x 100 is 15%.' }),
    singleCorrect({ question_text: 'Solve: 3/5 of 200', options: ['100', '110', '120', '140'], correct: '120', solution_text: 'Three-fifths of 200 equals 120.' }),
    singleCorrect({ question_text: 'What is the simple interest on 1000 at 10% for 2 years?', options: ['100', '150', '200', '250'], correct: '200', solution_text: 'SI = PRT/100 = 200.' }),
    singleCorrect({ question_text: 'A train covers 120 km in 2 hours. Find speed.', options: ['50 km/h', '55 km/h', '60 km/h', '65 km/h'], correct: '60 km/h', solution_text: 'Speed = distance/time = 60 km/h.' }),
    singleCorrect({ question_text: 'What is the ratio of 45 to 60?', options: ['2:3', '3:4', '4:5', '5:6'], correct: '3:4', solution_text: '45:60 reduces to 3:4.' }),
    singleCorrect({ question_text: 'If 8 workers do a job in 12 days, how many days will 6 workers take?', options: ['14', '16', '18', '20'], correct: '16', solution_text: 'Workers and days are inversely proportional, so 8 x 12 = 6 x d.' }),
    singleCorrect({ question_text: 'What is 15 squared?', options: ['205', '215', '225', '235'], correct: '225', solution_text: '15 x 15 = 225.' }),
    singleCorrect({ question_text: 'A bag contains 5 red and 3 blue balls. Probability of drawing a blue ball?', options: ['1/4', '3/8', '5/8', '2/3'], correct: '3/8', solution_text: 'There are 3 blue balls out of 8 total.' }),
    singleCorrect({ question_text: 'Find the HCF of 18 and 24.', options: ['4', '6', '8', '12'], correct: '6', solution_text: '6 is the highest common factor.' }),
    singleCorrect({ question_text: 'What is the next term: 5, 10, 20, 40, ?', options: ['45', '60', '70', '80'], correct: '80', solution_text: 'Each term is doubled.' }),
    multipleCorrect({ question_text: 'Which of the following fractions are equal to 1/2?', options: ['2/4', '3/6', '4/10', '5/8'], correct: ['2/4', '3/6'], solution_text: '2/4 and 3/6 both simplify to 1/2.' }),
    singleCorrect({ question_text: 'If x + 7 = 19, find x.', options: ['10', '11', '12', '13'], correct: '12', solution_text: 'Subtract 7 from 19 to get 12.' }),
  ];

  const englishDemoQuestions = [
    singleCorrect({
      question_text: 'Choose the correctly spelled word.',
      options: ['Acommodation', 'Accommodation', 'Acomodation', 'Accomodation'],
      correct: 'Accommodation',
      negative_marks: 0,
      solution_text: 'Accommodation is the correct spelling.',
    }),
    singleCorrect({
      question_text: 'Choose the synonym of "brief".',
      options: ['Long', 'Short', 'Weak', 'Late'],
      correct: 'Short',
      negative_marks: 0,
      solution_text: 'Brief means short.',
    }),
    singleCorrect({
      question_text: 'Identify the noun in the sentence: "The boy ran fast."',
      options: ['The', 'boy', 'ran', 'fast'],
      correct: 'boy',
      negative_marks: 0,
      solution_text: 'Boy is the naming word and hence the noun.',
    }),
  ];

  const englishPaidQuestions = [
    singleCorrect({ question_text: 'Choose the antonym of "ancient".', options: ['Old', 'Modern', 'Brave', 'Silent'], correct: 'Modern', negative_marks: 0.25, solution_text: 'Modern is the opposite of ancient.' }),
    singleCorrect({ question_text: 'Select the correct passive voice: "She wrote a letter."', options: ['A letter is written by her.', 'A letter was written by her.', 'A letter has written by her.', 'A letter wrote by her.'], correct: 'A letter was written by her.', negative_marks: 0.25, solution_text: 'The simple past passive form is "was written".' }),
    singleCorrect({ question_text: 'Choose the correctly punctuated sentence.', options: ['Lets eat, Grandma.', 'Let’s eat, Grandma.', 'Lets eat Grandma.', 'Let’s eat Grandma'], correct: 'Let’s eat, Grandma.', negative_marks: 0.25, solution_text: 'The apostrophe and comma make the sentence correct.' }),
    singleCorrect({ question_text: 'Identify the adjective in: "It was a bright morning."', options: ['It', 'was', 'bright', 'morning'], correct: 'bright', negative_marks: 0.25, solution_text: 'Bright describes the noun morning.' }),
    singleCorrect({ question_text: 'Choose the synonym of "rapid".', options: ['Slow', 'Fast', 'Heavy', 'Calm'], correct: 'Fast', negative_marks: 0.25, solution_text: 'Rapid means fast.' }),
    singleCorrect({ question_text: 'Fill in the blank: He has been waiting ___ two hours.', options: ['since', 'for', 'from', 'by'], correct: 'for', negative_marks: 0.25, solution_text: 'Duration takes "for".' }),
    singleCorrect({ question_text: 'Select the correct direct speech conversion.', options: ['He said that he was busy.', 'He said, "I am busy."', 'He says he is busy.', 'He was saying busy.'], correct: 'He said, "I am busy."', negative_marks: 0.25, solution_text: 'This is the original direct speech form.' }),
    singleCorrect({ question_text: 'Choose the one-word substitution for "One who speaks many languages".', options: ['Linguist', 'Polyglot', 'Monarch', 'Novice'], correct: 'Polyglot', negative_marks: 0.25, solution_text: 'A polyglot speaks many languages.' }),
    singleCorrect({ question_text: 'Pick the correctly spelt word.', options: ['Definately', 'Definitely', 'Definetly', 'Definitly'], correct: 'Definitely', negative_marks: 0.25, solution_text: 'Definitely is the correct spelling.' }),
    singleCorrect({ question_text: 'Choose the correct article: "___ honest man"', options: ['A', 'An', 'The', 'No article'], correct: 'An', negative_marks: 0.25, solution_text: 'Honest begins with a vowel sound.' }),
    singleCorrect({ question_text: 'Identify the verb in: "Students prepare daily."', options: ['Students', 'prepare', 'daily', 'the'], correct: 'prepare', negative_marks: 0.25, solution_text: 'Prepare is the action word.' }),
    singleCorrect({ question_text: 'Choose the correct plural form of "criterion".', options: ['criterions', 'criteria', 'criteriones', 'criterias'], correct: 'criteria', negative_marks: 0.25, solution_text: 'Criteria is the standard plural form.' }),
    multipleCorrect({ question_text: 'Which of the following are parts of speech?', options: ['Noun', 'Verb', 'Triangle', 'Adjective'], correct: ['Noun', 'Verb', 'Adjective'], solution_text: 'Noun, verb, and adjective are parts of speech.' }),
    singleCorrect({ question_text: 'Choose the sentence with correct subject-verb agreement.', options: ['The boys plays cricket.', 'The boy play cricket.', 'The boys play cricket.', 'The boys playing cricket.'], correct: 'The boys play cricket.', negative_marks: 0.25, solution_text: 'Plural subject takes plural verb here.' }),
    singleCorrect({ question_text: 'Fill in the blank: Neither Ravi nor his friends ___ present.', options: ['is', 'are', 'was', 'be'], correct: 'are', negative_marks: 0.25, solution_text: 'The verb agrees with the nearer plural subject friends.' }),
  ];

  const reasoningDemoQuestions = [
    singleCorrect({
      question_text: 'Choose the odd one out.',
      options: ['Square', 'Triangle', 'Circle', 'Blue'],
      correct: 'Blue',
      solution_text: 'Blue is a color while the others are shapes.',
    }),
    singleCorrect({
      question_text: 'What comes next: 2, 4, 8, 16, ?',
      options: ['18', '24', '32', '36'],
      correct: '32',
      solution_text: 'The pattern is doubling.',
    }),
    singleCorrect({
      question_text: 'If NORTH is coded as OQTVI, then EAST is coded as?',
      options: ['FBTU', 'GBTU', 'FCTU', 'FBUU'],
      correct: 'FBTU',
      solution_text: 'Each letter shifts by one position.',
    }),
  ];

  const reasoningPaidQuestions = [
    singleCorrect({ question_text: 'Find the next term: 2, 6, 12, 20, 30, ?', options: ['36', '40', '42', '44'], correct: '42', solution_text: 'Differences are 4, 6, 8, 10, so the next is 12.' }),
    singleCorrect({ question_text: 'Aman walks 3 km north and 4 km east. How far is he from the start?', options: ['4 km', '5 km', '6 km', '7 km'], correct: '5 km', solution_text: 'By Pythagoras, the distance is 5 km.' }),
    singleCorrect({ question_text: 'Choose the odd pair.', options: ['Book : Read', 'Pen : Write', 'Knife : Cut', 'Ball : Sleep'], correct: 'Ball : Sleep', solution_text: 'The relation is not logical in the last pair.' }),
    singleCorrect({ question_text: 'If all roses are flowers and some flowers fade quickly, which conclusion is valid?', options: ['All flowers are roses', 'Some roses may fade quickly', 'No rose fades quickly', 'All fading things are roses'], correct: 'Some roses may fade quickly', solution_text: 'That is the only possible conclusion.' }),
    singleCorrect({ question_text: 'Mirror image of LEFT is best represented by?', options: ['TFEL', 'LEFT', 'L E F T', 'T F E L'], correct: 'TFEL', solution_text: 'A plain mirror reversal gives TFEL.' }),
    singleCorrect({ question_text: 'If A=1, B=2, C=3, what is CAB?', options: ['312', '123', '321', '231'], correct: '312', solution_text: 'C=3, A=1, B=2.' }),
    singleCorrect({ question_text: 'What comes next: AZ, BY, CX, ?', options: ['DW', 'DX', 'EV', 'CV'], correct: 'DW', solution_text: 'First letters move forward, second letters move backward.' }),
    singleCorrect({ question_text: 'Pointing to a photo, Rita says, "He is the son of my grandfather’s only son." Who is he?', options: ['Brother', 'Father', 'Son', 'Cousin'], correct: 'Brother', solution_text: 'Grandfather’s only son is Rita’s father, whose son is Rita’s brother.' }),
    singleCorrect({ question_text: 'Find the missing number: 5, 11, 23, 47, ?', options: ['88', '90', '95', '96'], correct: '95', solution_text: 'Each term is previous term x 2 + 1.' }),
    singleCorrect({ question_text: 'Which word does not belong?', options: ['Apple', 'Mango', 'Carrot', 'Banana'], correct: 'Carrot', solution_text: 'Carrot is a vegetable.' }),
    singleCorrect({ question_text: 'How many sides do two triangles and one square have in total?', options: ['8', '9', '10', '12'], correct: '10', solution_text: '3 + 3 + 4 = 10.' }),
    singleCorrect({ question_text: 'Complete the analogy: Teacher : School :: Doctor : ?', options: ['Patient', 'Hospital', 'Medicine', 'Ward'], correct: 'Hospital', solution_text: 'A teacher works in a school and a doctor in a hospital.' }),
    multipleCorrect({ question_text: 'Which of these are geometric shapes?', options: ['Circle', 'Rectangle', 'Honesty', 'Triangle'], correct: ['Circle', 'Rectangle', 'Triangle'], solution_text: 'Circle, rectangle, and triangle are shapes.' }),
    singleCorrect({ question_text: 'If MONDAY is coded as 123456, what is DAY?', options: ['456', '345', '236', '156'], correct: '456', solution_text: 'D, A, Y correspond to 4, 5, 6 in the code.' }),
    singleCorrect({ question_text: 'How many letters are there between A and H in the alphabet?', options: ['5', '6', '7', '8'], correct: '6', solution_text: 'B, C, D, E, F, G are six letters.' }),
  ];

  const railwayDemoQuestions = [
    singleCorrect({
      question_text: 'Which city is the capital of Rajasthan?',
      options: ['Lucknow', 'Bhopal', 'Jaipur', 'Patna'],
      correct: 'Jaipur',
      negative_marks: 0,
      solution_text: 'Jaipur is the capital of Rajasthan.',
    }),
    singleCorrect({
      question_text: 'Water boils at what temperature at standard atmospheric pressure?',
      options: ['90 C', '95 C', '100 C', '110 C'],
      correct: '100 C',
      negative_marks: 0,
      solution_text: 'Water boils at 100 degrees Celsius.',
    }),
    multipleCorrect({
      question_text: 'Which of the following are Indian states?',
      options: ['Maharashtra', 'Nepal', 'Gujarat', 'Bhutan'],
      correct: ['Maharashtra', 'Gujarat'],
      negative_marks: 0,
      solution_text: 'Maharashtra and Gujarat are Indian states.',
    }),
  ];

  const railwayPaidQuestions = [
    singleCorrect({ question_text: 'Who is known as the Father of the Nation in India?', options: ['Jawaharlal Nehru', 'Mahatma Gandhi', 'Subhas Bose', 'B. R. Ambedkar'], correct: 'Mahatma Gandhi', solution_text: 'Mahatma Gandhi is widely referred to as the Father of the Nation.' }),
    singleCorrect({ question_text: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'], correct: 'Mars', solution_text: 'Mars is called the Red Planet.' }),
    singleCorrect({ question_text: 'What is the national animal of India?', options: ['Elephant', 'Lion', 'Tiger', 'Leopard'], correct: 'Tiger', solution_text: 'Tiger is India’s national animal.' }),
    singleCorrect({ question_text: 'The currency of Japan is?', options: ['Won', 'Yuan', 'Yen', 'Dollar'], correct: 'Yen', solution_text: 'Japan uses the Yen.' }),
    singleCorrect({ question_text: 'Who wrote the Indian national anthem?', options: ['Bankim Chandra', 'Rabindranath Tagore', 'Sarojini Naidu', 'Premchand'], correct: 'Rabindranath Tagore', solution_text: 'Rabindranath Tagore wrote Jana Gana Mana.' }),
    singleCorrect({ question_text: 'How many continents are there?', options: ['5', '6', '7', '8'], correct: '7', solution_text: 'There are seven continents.' }),
    singleCorrect({ question_text: 'Which gas do plants absorb?', options: ['Oxygen', 'Hydrogen', 'Carbon dioxide', 'Nitrogen'], correct: 'Carbon dioxide', solution_text: 'Plants absorb carbon dioxide during photosynthesis.' }),
    singleCorrect({ question_text: 'Which river is called the Ganga of the South?', options: ['Godavari', 'Krishna', 'Kaveri', 'Narmada'], correct: 'Godavari', solution_text: 'Godavari is often called the Ganga of the South.' }),
    singleCorrect({ question_text: 'What is H2O commonly known as?', options: ['Salt', 'Hydrogen', 'Water', 'Oxygen'], correct: 'Water', solution_text: 'H2O is water.' }),
    singleCorrect({ question_text: 'Which day is celebrated as Independence Day in India?', options: ['26 January', '15 August', '2 October', '14 November'], correct: '15 August', solution_text: 'India celebrates Independence Day on 15 August.' }),
    singleCorrect({ question_text: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correct: 'Pacific', solution_text: 'The Pacific Ocean is the largest.' }),
    singleCorrect({ question_text: 'Which metal is liquid at room temperature?', options: ['Iron', 'Mercury', 'Copper', 'Silver'], correct: 'Mercury', solution_text: 'Mercury is liquid at room temperature.' }),
    singleCorrect({ question_text: 'Who was the first Prime Minister of India?', options: ['Sardar Patel', 'Jawaharlal Nehru', 'Rajendra Prasad', 'Lal Bahadur Shastri'], correct: 'Jawaharlal Nehru', solution_text: 'Jawaharlal Nehru was the first Prime Minister.' }),
    multipleCorrect({ question_text: 'Which of the following are neighboring countries of India?', options: ['Nepal', 'Sri Lanka', 'Brazil', 'Bhutan'], correct: ['Nepal', 'Sri Lanka', 'Bhutan'], solution_text: 'Nepal, Sri Lanka, and Bhutan are neighboring countries.' }),
    singleCorrect({ question_text: 'Which instrument measures temperature?', options: ['Barometer', 'Thermometer', 'Hygrometer', 'Altimeter'], correct: 'Thermometer', solution_text: 'A thermometer measures temperature.' }),
  ];

  const data = [
    {
      title: 'SSC Preparation',
      slug: 'ssc-preparation',
      description: 'Mock exams, reading material, and short concept videos for SSC aspirants.',
      sections: [
        {
          title: 'SSC CGL Quant',
          slug: 'ssc-cgl-quant',
          description: 'Quantitative aptitude practice with demo and paid mocks.',
          price_paise: 29900,
          validity_days: 60,
          max_attempts_per_test: 3,
          is_demo_available: 1,
          contents: [
            { type: 'pdf', title: 'Quant Formula Sheet', url: 'https://example.com/quant-formula-sheet.pdf', description: 'Revision-ready formula sheet.', sort_order: 0 },
            { type: 'video', title: 'Speed Maths Tricks', url: 'https://example.com/speed-maths', description: 'Short video lesson for faster calculations.', sort_order: 1 },
          ],
          tests: [
            createTest({
              title: 'Demo Quant Drill',
              description: 'Free demo for logged-in users.',
              duration_minutes: 15,
              attempt_limit: 1,
              is_demo: 1,
              questions: quantDemoQuestions,
            }),
            createTest({
              title: 'Quant Full Mock 1',
              description: 'Paid full quant mock with 15 scored questions.',
              duration_minutes: 45,
              attempt_limit: 10,
              is_demo: 0,
              questions: quantPaidQuestions,
            }),
          ],
        },
        {
          title: 'SSC English',
          slug: 'ssc-english',
          description: 'Reading practice, grammar notes, and sectional mocks.',
          price_paise: 24900,
          validity_days: 45,
          max_attempts_per_test: 2,
          is_demo_available: 1,
          contents: [
            { type: 'doc', title: 'Vocabulary List', url: 'https://example.com/vocabulary-list.doc', description: 'High-frequency words.', sort_order: 0 },
            { type: 'ppt', title: 'Error Detection Deck', url: 'https://example.com/error-detection.ppt', description: 'Slides for revision.', sort_order: 1 },
          ],
          tests: [
            createTest({
              title: 'English Demo',
              description: 'Demo grammar test.',
              duration_minutes: 10,
              attempt_limit: 1,
              is_demo: 1,
              questions: englishDemoQuestions,
            }),
            createTest({
              title: 'English Section Mock 1',
              description: 'Paid English mock with vocabulary, grammar, and usage questions.',
              duration_minutes: 35,
              attempt_limit: 10,
              is_demo: 0,
              questions: englishPaidQuestions,
            }),
          ],
        },
      ],
    },
    {
      title: 'Banking Exams',
      slug: 'banking-exams',
      description: 'Section-wise paid packs for banking prelims with demo drills and revision media.',
      sections: [
        {
          title: 'Banking Reasoning',
          slug: 'banking-reasoning',
          description: 'Puzzles, seating arrangement, and syllogism practice.',
          price_paise: 34900,
          validity_days: 75,
          max_attempts_per_test: 3,
          is_demo_available: 1,
          contents: [
            { type: 'video', title: 'Puzzle Solving Framework', url: 'https://example.com/puzzle-framework', description: 'Teacher-led walkthrough.', sort_order: 0 },
          ],
          tests: [
            createTest({
              title: 'Reasoning Demo Sprint',
              description: 'Quick starter demo.',
              duration_minutes: 12,
              attempt_limit: 1,
              is_demo: 1,
              questions: reasoningDemoQuestions,
            }),
            createTest({
              title: 'Reasoning Full Mock 1',
              description: 'Paid reasoning mock with 15 questions.',
              duration_minutes: 40,
              attempt_limit: 10,
              is_demo: 0,
              questions: reasoningPaidQuestions,
            }),
          ],
        },
      ],
    },
    {
      title: 'Railway Exams',
      slug: 'railway-exams',
      description: 'Foundational railway preparation packs with starter demos and revision notes.',
      sections: [
        {
          title: 'Railway General Awareness',
          slug: 'railway-general-awareness',
          description: 'Static GK and current affairs warm-up for railway aspirants.',
          price_paise: 19900,
          validity_days: 45,
          max_attempts_per_test: 2,
          is_demo_available: 1,
          contents: [
            { type: 'pdf', title: 'Railway GK Notes', url: 'https://example.com/railway-gk-notes.pdf', description: 'Short revision notes for general awareness.', sort_order: 0 },
          ],
          tests: [
            createTest({
              title: 'Railway GA Demo',
              description: 'Starter demo for railway awareness practice.',
              duration_minutes: 10,
              attempt_limit: 1,
              is_demo: 1,
              questions: railwayDemoQuestions,
            }),
            createTest({
              title: 'Railway GA Full Mock 1',
              description: 'Paid railway mock with 15 general awareness questions.',
              duration_minutes: 35,
              attempt_limit: 10,
              is_demo: 0,
              questions: railwayPaidQuestions,
            }),
          ],
        },
      ],
    },
  ];

  data.forEach((catalog) => {
    const catalogId = Number(insertCatalog.run(
      catalog.title,
      catalog.slug,
      catalog.description
    ).lastInsertRowid);

    catalog.sections.forEach((section) => {
      const sectionId = Number(insertSection.run(
        catalogId,
        section.title,
        section.slug,
        section.description,
        section.price_paise,
        section.validity_days,
        section.max_attempts_per_test,
        section.is_demo_available
      ).lastInsertRowid);

      section.contents.forEach((content) => {
        insertContent.run(
          sectionId,
          content.type,
          content.title,
          content.url,
          content.description,
          content.sort_order
        );
      });

      section.tests.forEach((test) => {
        const testId = Number(insertTest.run(
          sectionId,
          test.title,
          test.description,
          test.duration_minutes,
          test.attempt_limit,
          test.is_demo,
          teacherId
        ).lastInsertRowid);

        test.bundles.forEach((bundle) => createQuestionBundle(testId, bundle));
      });
    });
  });

  db.close();
  console.log(`Seeded LMS database at ${path.basename(databasePath)}`);
};

seed();
