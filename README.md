# VidyaSetu LMS

VidyaSetu is a local LMS and mock test platform for students, teachers, and admins.

It currently includes:
- A Next.js frontend for catalog browsing, purchases, attempts, and review
- An Express + SQLite backend for auth, content, access control, and test state
- Seeded demo users, catalogs, sections, tests, and CSV templates for content creation

## Roles

### Student
- Browse the public exam catalog
- Open a subsection after login
- View demo tests and preview learning resources
- Buy a subsection to unlock paid tests
- Attempt tests with timer, autosave, and review flow
- See previous attempts, score, mistakes, and solutions

### Teacher
- Open Content Studio
- Create a new catalog or add a subsection to an existing catalog
- Add linked resources such as PDF, PPT, DOC, and video URLs
- Upload CSV files to create multiple tests quickly

### Admin
- Everything available to teachers
- Assign subsection access directly to students

## Implemented Product Flow

### 1. Public Catalog
- Home page shows all active catalogs
- Each catalog page shows its subsections
- Each subsection card shows pricing, test count, demo availability, and linked resources

### 2. Login
- Login is social-login styled
- Current local setup uses seeded emails with a mock `Google` or `Facebook` button
- On successful login, the frontend stores the JWT in `localStorage`

This is a demo-friendly local implementation, not a production OAuth integration yet.

### 3. Purchases
- Students buy individual subsections, not the entire catalog
- Purchase validity is tracked per subsection
- For now, clicking `Buy now` completes the purchase immediately
- Real payment flow is deferred; this shortcut exists to unblock product testing

### 4. Section Experience
- Students can see linked resources
- Demo tests are visible after login
- Paid tests unlock after purchase
- Previous attempt information is shown inline on each test card

### 5. Test Attempt Experience
- Questions support:
  - `single_correct`
  - `multiple_correct`
- Passage or case-study based questions are supported
- Students can:
  - answer questions
  - move between questions
  - mark for review
  - filter question states
- A question map shows:
  - answered
  - not answered
  - marked for review
  - not visited

### 6. Timer Behavior
- Attempt starts from backend `remaining_time`
- Countdown runs locally in the browser
- Attempt data is refreshed every 30 seconds from backend
- If time reaches zero, the test auto-submits

### 7. Submission and Review
- Before final submit, the student sees a summary modal
- After submission, the student sees:
  - score
  - correct count
  - wrong count
  - not attempted count
  - common mistakes
  - per-question solution text

### 8. Demo Attempt Rules
- Demo tests are single-use
- If a demo is already completed, it cannot be started again
- If a test is in progress, the student resumes the same attempt instead of creating a new one

## Teacher/Admin Content Studio

The Content Studio is available at `/admin/package-builder`.

It supports:
- Creating a new catalog
- Adding a subsection to an existing catalog
- Setting:
  - subsection title
  - description
  - price
  - validity
  - max attempts
- Adding linked content items
- Creating multiple tests in one go
- Uploading CSV files per test

## CSV Import

CSV import is the easiest way to create tests quickly.

Each CSV row represents one question.

Supported columns:

```csv
passage_title,passage_text,question_text,question_type,option_a,option_b,option_c,option_d,correct_answers,marks,negative_marks,solution_text
```

Supported features:
- Questions with or without passage context
- Single-correct questions
- Multiple-correct questions
- Configurable marks and negative marks
- Per-question solution text

`correct_answers` can use:
- option letters like `A` or `C|D`
- exact option text values

Sample CSV templates are available in:
- [vidyasetu-frontend/public/csv-templates](/Users/shubham.shukla/Documents/vidyaSetu/vidyasetu-frontend/public/csv-templates)

Included templates:
- `ssc-quant-demo.csv`
- `ssc-english-demo.csv`
- `banking-reasoning-demo.csv`
- `railway-ga-demo.csv`

## Admin Assignment Flow

The admin assignment page is available at `/admin/assign-package`.

Admin can:
- choose a student
- choose a subsection
- grant paid access directly without using the purchase flow

This is useful for internal testing, manual onboarding, and support operations.

## Local Setup

### Run both frontend and backend

From the repo root:

```bash
npm run dev
```

This starts:
- Backend on `http://localhost:4000`
- Frontend on `http://localhost:3001`

The root script also clears the frontend `.next` cache before starting, which helps avoid stale Next.js dev build issues after route changes.

### Reseed the database

From the backend folder:

```bash
cd vidyasetu-backend
npm run seed
```

Current seed state:
- 3 catalogs
- 4 subsections
- 5 tests
- 3 student users
- 1 teacher user
- 1 admin user
- no purchases
- no test attempts

## Seeded Accounts

### Admin
- `admin@vidyasetu.com`

### Teacher
- `teacher1@vidyasetu.com`

### Students
- `student@vidyasetu.com`
- `another.student@vidyasetu.com`
- `student3@vidyasetu.com`

Use any of these emails on the login page and click either social button.

## Current Technical Stack

### Frontend
- Next.js App Router
- React
- Tailwind CSS
- Axios

### Backend
- Express
- SQLite via `better-sqlite3`
- JWT authentication

## Current Limitations / Intentional Shortcuts

- Social login is mocked with seeded users; real OAuth is not wired yet
- Buy-now currently auto-completes instead of going through real UPI verification
- Resource links currently open external URLs as configured
- Backend is SQLite-based and intended for MVP/local testing, not production scale

## Good Demo Flow

For a clean demo:

1. Seed the backend
2. Run `npm run dev` from the repo root
3. Login as a student
4. Open a catalog and subsection
5. Start a demo test
6. Submit and review solutions
7. Buy a subsection
8. Attempt a paid test
9. Login as teacher or admin and open Content Studio
10. Upload a CSV to create a new test pack

