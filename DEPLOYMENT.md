# ASTUMSJ Bootcamp Deployment

## MongoDB

Create a MongoDB Atlas cluster and database user. Add the connection string to the server environment as `MONGO_URI`. Restrict Atlas network access to the deployed server where possible.

## Backend on Render

Create a Node web service rooted at `server`.

- Build command: `npm install`
- Start command: `npm start`
- Required environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`
- Email variables: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `FROM_NAME`, `FROM_EMAIL`
- Optional seed variables: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`

Set `CLIENT_URL` to the exact deployed frontend origin. Do not commit `.env` files or credentials.

## Frontend on Vercel

Create a Vercel project rooted at `client`.

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://YOUR-BACKEND.onrender.com/api`

Configure SPA rewrites so client-side routes such as `/sessions`, `/insights`, and `/alumni` serve `index.html`.

## Local development

1. Copy `server/.env.example` to `server/.env` and fill in values.
2. Set `client/.env` with `VITE_API_URL=http://localhost:5000/api`.
3. Run `npm install` in both `server` and `client`.
4. Start the backend with `npm run dev` and frontend with `npm run dev`.
5. Run backend checks with `npm test` and `npm run check:syntax`.

## Security checklist

- Use a long random `JWT_SECRET`.
- Use an email provider app password, never a normal mailbox password.
- Enable HTTPS in production.
- Confirm CORS allows only the deployed frontend origin.
- Verify student and mentor scope tests before release.
