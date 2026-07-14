# Flowboard — Kanban Task Management

### 🔗 [Live Demo — flowboard-mkasik.vercel.app](https://flowboard-mkasik.vercel.app)

A kanban-style productivity app with drag-and-drop boards, team collaboration, deadline tracking, and email notifications — React + TypeScript on the frontend, Express + MongoDB on the backend.

No registration needed to look around — the landing page has one-click **"Log in as User"** / **"Log in as Admin"** buttons that drop you straight into a dashboard pre-populated with real-looking projects and tasks. (Same accounts, manually: `demo@flowboard.app` / `DemoPass123` and `admin@flowboard.app` / `AdminPass123`.)

## Features

- **Drag-and-drop kanban boards** — native HTML5 drag-and-drop (no external DnD library), with precise before/after card positioning as you drag, persisted to the backend on drop
- **Custom columns** — every project starts with To Do / In Progress / Review / Done, and members can add more
- **Team collaboration** — invite existing users to a project by email; the owner manages membership, any member can create and move tasks
- **Deadline tracking** — due dates on tasks, visually flagged as due-soon (amber) or overdue (red) on each card
- **Email notifications** — task assignment, project invites, and a background job that checks for tasks due within 24 hours and reminds the assignee once (runs on an interval locally; on Vercel it runs as a scheduled Cron Job instead — see Deployment below)
- **In-app notification bell** — every notification-worthy event is both "emailed" and shown in a live notification dropdown, kept in sync

## On email notifications

This project logs emails to the console instead of sending through real SMTP — no credentials are needed to run it. See `backend/utils/mailer.js`: every call site already passes the `{ to, subject, body }` shape a real transport (Nodemailer, SendGrid, etc.) would need, so swapping in real delivery later is a one-function change, not a rewrite.

## Tech Stack

- **Frontend:** React 18, TypeScript (strict mode), React Router, Tailwind CSS, Axios, Vite
- **Backend:** Node.js, Express, Mongoose (MongoDB), JWT, bcryptjs — deadline checks run via a lightweight `setInterval` locally/on a traditional host, or a Vercel Cron Job in serverless deployment

## Project Structure

```
├── backend/
│   ├── models/           # User, Project (members + columns), Task, Notification
│   ├── controllers/       # auth, projects (CRUD + members + columns), tasks (CRUD + move), notifications
│   ├── routes/            # REST endpoints
│   ├── utils/mailer.js         # mock email transport (console log)
│   ├── utils/notify.js         # creates a Notification + fires the mock email together
│   ├── utils/deadlineChecker.js # polls for tasks due within 24h and reminds the assignee once
│   ├── app.js              # Express app (routes, middleware) — no .listen(), reused by both entry points below
│   ├── server.js            # traditional entry point: app.listen() + starts the setInterval deadline checker
│   ├── api/index.js         # Vercel serverless entry point — same app.js, no .listen()
│   ├── api/cron/check-deadlines.js  # Vercel Cron target — runs the same deadline check on a schedule
│   └── vercel.json
├── frontend/
│   ├── src/pages/          # Login, Register, Projects, Board
│   ├── src/components/     # Column, TaskCard, TaskModal, AddMemberModal, NotificationBell
│   ├── src/context/        # AuthContext (JWT session)
│   └── src/api/client.ts   # Axios instance with auth interceptor
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env    # edit MONGO_URI if not using local default
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env    # points at the backend API, defaults to localhost:5002
npm run dev
```

The app runs at `http://localhost:5176` and expects the API at `http://localhost:5002/api` by default. Create an account, make a project, invite a second account (by email) to test team collaboration and notifications.

## Deployment (Vercel)

Backend and frontend deploy as **two separate Vercel projects** from this one repository, each with a different Root Directory setting.

### 1. Database — MongoDB Atlas

Create a free M0 cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas), add a database user, allow access from anywhere (`0.0.0.0/0`, since Vercel's outbound IPs aren't static on the free tier), and copy the connection string — that's your `MONGO_URI`.

### 2. Backend project

In Vercel, "Add New Project" → import this repo → set **Root Directory** to `backend`. Environment variables:

| Key | Value |
|---|---|
| `MONGO_URI` | your Atlas connection string |
| `JWT_SECRET` | any long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | your frontend's Vercel URL (set after step 3, then redeploy) |
| `CRON_SECRET` | any long random string — protects the cron endpoint from being called by anyone else |

Deploy. The API will be live at `https://<backend-project>.vercel.app/api/*`. The `crons` entry in `vercel.json` runs the deadline-reminder check once a day (Vercel's Hobby/free plan limits Cron Jobs to a daily schedule — the `setInterval` version used for local/traditional hosting checks far more often).

### 3. Frontend project

"Add New Project" again, same repo, **Root Directory** set to `frontend`. Vercel auto-detects the Vite build. Environment variable:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://<backend-project>.vercel.app/api` |

Deploy, then go back to the backend project's env vars and set `CLIENT_URL` to this frontend URL (needed for CORS), and redeploy the backend once more.

### Gotcha: Vercel Deployment Protection

New Vercel projects can default to protecting **every** `*.vercel.app` URL — including your own custom aliases — behind a Vercel login wall (`ssoProtection: { deploymentType: "all_except_custom_domains" }`). Since this API and frontend are meant to be publicly reachable (not just by you), turn this off for both projects: **Project Settings → Deployment Protection → Vercel Authentication → Disabled**. If it's left on, requests to the API return a `302` redirect to `vercel.com/sso-api` instead of your JSON response.

### Seeding demo data

`backend/utils/seedDemo.js` creates two demo accounts (`demo@flowboard.app` / `DemoPass123` and `admin@flowboard.app` / `AdminPass123`) plus a couple of realistic projects and tasks, so the live demo isn't empty. Run it locally against your `MONGO_URI` with `node utils/seedDemo.js`, or — if your machine's DNS can't resolve `mongodb+srv://` SRV records but your Vercel deployment can — temporarily add a POST route in `app.js` that calls `seedDemo()` behind a secret check, hit it once from the deployed URL, then remove the route again. It's safe to re-run; it clears out any previously-seeded demo projects first.
