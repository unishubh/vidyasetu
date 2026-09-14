const bcrypt = require('bcrypt');
const request = require('supertest');

const { app } = require('../server');
const { database, initDB } = require('../db/connection');

const resetData = () => {
  database.exec(`
    DELETE FROM answers;
    DELETE FROM test_attempts;
    DELETE FROM questions;
    DELETE FROM tests;
    DELETE FROM user_packages;
    DELETE FROM packages;
    DELETE FROM users;
  `);
};

const seedUsers = async () => {
  const insertUser = database.prepare(`
    INSERT INTO users (name, email, password)
    VALUES (?, ?, ?)
  `);

  const adminPassword = await bcrypt.hash('admin123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  insertUser.run('Admin User', 'admin@vidyasetu.com', adminPassword);
  insertUser.run('Student User', 'student@vidyasetu.com', studentPassword);
};

const getUserIdByEmail = database.prepare(`
  SELECT id
  FROM users
  WHERE email = ?
`);

const expect = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const run = async () => {
  initDB();
  resetData();
  await seedUsers();
  const studentUserId = getUserIdByEmail.get('student@vidyasetu.com').id;
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const api = request(server);

  try {
    const healthResponse = await api.get('/health');
  expect(healthResponse.status === 200, 'GET /health failed');
  expect(healthResponse.body.status === 'ok', 'GET /health returned unexpected body');

    const adminLogin = await api
    .post('/login')
    .send({ email: 'admin@vidyasetu.com', password: 'admin123' });
  expect(adminLogin.status === 200, 'POST /login for admin failed');
  const adminToken = adminLogin.body.token;

    const studentLogin = await api
    .post('/login')
    .send({ email: 'student@vidyasetu.com', password: 'student123' });
  expect(studentLogin.status === 200, 'POST /login for student failed');
  const studentToken = studentLogin.body.token;

    const createStudent = await api
    .post('/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Another Student',
      email: 'another.student@vidyasetu.com',
      password: 'password123',
    });
  expect(createStudent.status === 201, 'POST /admin/users failed');

    const createPackage = await api
    .post('/admin/packages')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'MVP Package',
      description: 'Smoke test package',
    });
  expect(createPackage.status === 201, 'POST /admin/packages failed');
  const packageId = createPackage.body.id;

    const assignPackage = await api
    .post('/admin/assign')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      user_id: studentUserId,
      package_id: packageId,
      expires_at: '2026-12-31T23:59:59Z',
    });
  expect(assignPackage.status === 201, 'POST /admin/assign failed');

    const createTest = await api
    .post('/admin/tests')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      package_id: packageId,
      title: 'Math Test',
      duration_minutes: 30,
    });
  expect(createTest.status === 201, 'POST /admin/tests failed');
  const testId = createTest.body.id;

    const createQuestionOne = await api
    .post('/admin/questions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      test_id: testId,
      question_text: '2 + 2 = ?',
      options: ['2', '3', '4', '5'],
      correct_answer: '4',
      marks: 1,
    });
  expect(createQuestionOne.status === 201, 'POST /admin/questions for q1 failed');
  const questionOneId = createQuestionOne.body.id;

    const createQuestionTwo = await api
    .post('/admin/questions')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      test_id: testId,
      question_text: '3 + 3 = ?',
      options: ['5', '6', '7', '8'],
      correct_answer: '6',
      marks: 2,
    });
  expect(createQuestionTwo.status === 201, 'POST /admin/questions for q2 failed');
  const questionTwoId = createQuestionTwo.body.id;

    const studentPackages = await api
    .get('/packages')
    .set('Authorization', `Bearer ${studentToken}`);
  expect(studentPackages.status === 200, 'GET /packages failed');
  expect(studentPackages.body.length === 1, 'GET /packages returned unexpected package count');

    const packageTestsBeforeStart = await api
    .get(`/packages/${packageId}/tests`)
    .set('Authorization', `Bearer ${studentToken}`);
  expect(packageTestsBeforeStart.status === 200, 'GET /packages/:id/tests before start failed');
  expect(packageTestsBeforeStart.body.unattempted.length === 1, 'Test should start as unattempted');

    const startAttempt = await api
    .post(`/tests/${testId}/start`)
    .set('Authorization', `Bearer ${studentToken}`);
  expect(startAttempt.status === 200, 'POST /tests/:id/start failed');
  const attemptId = startAttempt.body.attempt_id;

    const startAgain = await api
    .post(`/tests/${testId}/start`)
    .set('Authorization', `Bearer ${studentToken}`);
  expect(startAgain.status === 200, 'Repeated POST /tests/:id/start failed');
  expect(startAgain.body.attempt_id === attemptId, 'Repeated start should return existing attempt');

    const attemptView = await api
    .get(`/attempts/${attemptId}`)
    .set('Authorization', `Bearer ${studentToken}`);
  expect(attemptView.status === 200, 'GET /attempts/:id failed');
  expect(attemptView.body.questions.length === 2, 'GET /attempts/:id returned unexpected question count');
  expect(attemptView.body.remaining_time > 0, 'GET /attempts/:id returned invalid remaining time');

    const saveAnswerOne = await api
    .post(`/attempts/${attemptId}/answer`)
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      question_id: questionOneId,
      answer: '4',
    });
  expect(saveAnswerOne.status === 200, 'POST /attempts/:id/answer for q1 failed');

    const saveAnswerTwo = await api
    .post(`/attempts/${attemptId}/answer`)
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      question_id: questionTwoId,
      answer: '6',
    });
  expect(saveAnswerTwo.status === 200, 'POST /attempts/:id/answer for q2 failed');

    const submitAttempt = await api
    .post(`/attempts/${attemptId}/submit`)
    .set('Authorization', `Bearer ${studentToken}`);
  expect(submitAttempt.status === 200, 'POST /attempts/:id/submit failed');
  expect(submitAttempt.body.score === 3, 'POST /attempts/:id/submit returned unexpected score');

    const submitAgain = await api
    .post(`/attempts/${attemptId}/submit`)
    .set('Authorization', `Bearer ${studentToken}`);
  expect(submitAgain.status === 200, 'Repeated POST /attempts/:id/submit failed');
  expect(submitAgain.body.score === 3, 'Repeated submit should return existing score');

    const saveAfterSubmit = await api
    .post(`/attempts/${attemptId}/answer`)
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      question_id: questionOneId,
      answer: '3',
    });
  expect(saveAfterSubmit.status === 400, 'Answer save after submit should be rejected');

    const packageTestsAfterSubmit = await api
    .get(`/packages/${packageId}/tests`)
    .set('Authorization', `Bearer ${studentToken}`);
  expect(packageTestsAfterSubmit.status === 200, 'GET /packages/:id/tests after submit failed');
  expect(packageTestsAfterSubmit.body.attempted.length === 1, 'Submitted test should be grouped as attempted');

  const summary = {
    health: healthResponse.body,
    createdStudentId: createStudent.body.id,
    packageId,
    testId,
    attemptId,
    finalScore: submitAttempt.body.score,
  };

  console.log('Smoke test passed');
  console.log(JSON.stringify(summary, null, 2));
  } finally {
    server.close();
  }
};

run().catch((error) => {
  console.error('Smoke test failed:', error.message);
  process.exit(1);
});
