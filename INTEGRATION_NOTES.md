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
