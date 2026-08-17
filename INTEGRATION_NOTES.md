# ASTUMSJ BMS Backend/Frontend Integration

## Implemented in this integration
- Self-registration with full application data: name, email, password, confirm password, gender, department, year, GitHub, LeetCode, Codeforces, and bootcamp reason.
- Self-registered accounts are students and start as `pending` + inactive.
- Admin accepts/rejects applications and the applicant receives an email for approval/rejection.
- Admin User Management is split into All Users and Applications.
- Applicant details modal never exposes password.
- Admin-created users are active immediately and receive a generated temporary password by email.
- Admin can suspend/reactivate approved users.
- Admin can create admin, mentor, or student accounts.
- Password change from Settings for authenticated users.
- Forgot password -> email OTP -> reset password.
- OTP is hashed in MongoDB, expires after 10 minutes, and is limited to five failed attempts.
- Admin can assign a student to an active mentor.
- Mentor endpoint returns only that mentor's assigned active students.
- JWT + bcrypt + role middleware remains the authorization foundation.
- Existing login branding/colors/layout were preserved; only the forgot-password link and confirmation-password field were added where needed for functionality.

## Environment
Copy `server/.env.example` to `server/.env` and fill MongoDB, JWT, SMTP, and frontend origin values.
Copy `client/.env.example` to `client/.env` if the backend is not running on localhost:5000.

## Run
### Server
`cd server`
`npm install`
`npm run seed:admin`
`npm run dev`

### Client
`cd client`
`npm install`
`npm run dev`

## Important API endpoints
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password`
- POST `/api/auth/change-password` (protected)
- GET `/api/auth/me` (protected)
- GET `/api/users` (admin)
- GET `/api/users/:id` (admin)
- POST `/api/users` (admin; generates temporary password)
- PATCH `/api/users/:id` (admin; approval/status/active updates)
- POST `/api/users/:id/assign-mentor` (admin)
- DELETE `/api/users/:id/assign-mentor` (admin)
- GET `/api/users/mentors` (admin)
- GET `/api/users/stats` (admin)
- GET `/api/mentors/students` (mentor)

## Security note
Never commit `.env` or real SMTP credentials. The temporary password is never stored in plaintext in MongoDB; it is only included in the credential email at account creation time.

## Updates in this revision

- Admin can edit full user profile fields and switch role between Student, Mentor and Admin.
- Admin application endpoint now handles both new `status: pending` records and legacy records that used `isApproved: false`.
- Run `npm run migrate:users` from `server` once against the existing MongoDB to migrate old records. It converts legacy pending records to `status: pending` and legacy approved records to `status: approved`.
- Admin can assign an active mentor to every approved student and remove the assignment.
- Mentor dashboard now fetches only assigned students and provides database-backed attendance and progress management.
- Student dashboard now fetches the logged-in student's profile, mentor, attendance and progress from MongoDB.
- Added Attendance and Progress collections for the mentor/student workflow.
- Admin cannot change their own admin role or delete their own account.

### Existing database warning

Do not delete the old pending users just because they do not appear in the new Applications tab. Run:

`npm run migrate:users`

The migration is designed for the legacy `isApproved` field used by the earlier user-management implementation. Always back up MongoDB before running a migration in production.

## Assignment, grading, notifications and coding updates
- Added database-backed Assignments with title, description, instructions, batch, deadline and maximum score.
- Admins and mentors can create assignments. Admin-created assignments target active students; mentor-created assignments target only that mentor's assigned students.
- Assignment resources support an optional URL and optional uploaded file.
- Students can submit by GitHub URL, uploaded files/folder contents, or written answer. Re-submission is supported after a mentor/admin requests redo.
- Mentors can grade only submissions belonging to their assigned students; admins can grade all submissions.
- Grading stores score, feedback and status (`graded` or `redo`) and creates a navbar notification for the student.
- Assignment submissions create navbar notifications for the relevant mentor/admin. A resubmission creates the same submission notification again.
- Deadline notifications are created when a student loads the notifications/assignments area for assignments due within 48 hours.
- Added notification center and unread notification badge in the navbar.
- Added coding challenges: admin can assign LeetCode, Codeforces or GitHub challenges to selected students.
- Students can record completed coding activity; streaks are calculated from consecutive activity dates and mentors can see streaks for their assigned students.
- Progress tracker continues to use the SRS statuses: Not Started, In Progress, Completed and Needs Improvement, with mentor notes and an at-risk overview.

## New dependency
The assignment upload feature uses `multer`. After extracting the project run `npm install` inside `server` so the dependency is installed and the lockfile is regenerated on the user's machine.
