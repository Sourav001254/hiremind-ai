# HireMind AI

HireMind AI is a recruiting workflow demo built with React, Vite, Express, and Firebase/JSON persistence. It supports:

- Public applicant resume parsing and submission
- Authenticated recruiter review, scoring, and outreach
- Audit/event views for admin-style workflows
- Real-time recruiter presence over authenticated WebSockets

## Run locally

1. Create `.env` from `.env.example`
2. Set `JWT_SECRET`
3. Optionally set `GEMINI_API_KEY` for AI parsing/copilot
4. Optionally set `ALLOW_DEMO_AUTH=true` for local-only demo login
5. Install dependencies with `npm install`
6. Start the app with `npm run dev`

## Auth modes

- Google OAuth: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Local demo auth: only available when `ALLOW_DEMO_AUTH=true` and `NODE_ENV` is not `production`

## API shape

- Public applicant routes:
  - `POST /api/public/parse-resume`
  - `POST /api/public/candidates/upload`
  - `POST /api/public/candidates`
- Recruiter-only routes:
  - `GET /api/candidates`
  - `POST /api/candidates/update`
  - `DELETE /api/candidates/:id`
  - `POST /api/copilot`
  - `POST /api/outreach/draft`
  - `POST /api/outreach/send`

## Persistence

- Local fallback: `db.json`
- Firestore: enabled when `firebase-applet-config.json` is configured

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run clean`
