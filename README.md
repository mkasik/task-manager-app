# Flowboard — Kanban Task Management

A kanban-style productivity app with drag-and-drop boards, team collaboration, deadline tracking, and email notifications — React + TypeScript on the frontend, Express + MongoDB on the backend.

## Features

- **Drag-and-drop kanban boards** — native HTML5 drag-and-drop (no external DnD library), with precise before/after card positioning as you drag, persisted to the backend on drop
- **Custom columns** — every project starts with To Do / In Progress / Review / Done, and members can add more
- **Team collaboration** — invite existing users to a project by email; the owner manages membership, any member can create and move tasks
- **Deadline tracking** — due dates on tasks, visually flagged as due-soon (amber) or overdue (red) on each card
- **Email notifications** — task assignment, project invites, and a background job that checks every few minutes for tasks due within 24 hours and reminds the assignee once
- **In-app notification bell** — every notification-worthy event is both "emailed" and shown in a live notification dropdown, kept in sync

## On email notifications

This project logs emails to the console instead of sending through real SMTP — no credentials are needed to run it. See `backend/utils/mailer.js`: every call site already passes the `{ to, subject, body }` shape a real transport (Nodemailer, SendGrid, etc.) would need, so swapping in real delivery later is a one-function change, not a rewrite.

## Tech Stack

- **Frontend:** React 18, TypeScript (strict mode), React Router, Tailwind CSS, Axios, Vite
- **Backend:** Node.js, Express, Mongoose (MongoDB), JWT, bcryptjs — a lightweight `setInterval`-based job checks upcoming deadlines instead of a separate queue/scheduler service

## Project Structure

```
├── backend/
│   ├── models/           # User, Project (members + columns), Task, Notification
│   ├── controllers/       # auth, projects (CRUD + members + columns), tasks (CRUD + move), notifications
│   ├── routes/            # REST endpoints
│   ├── utils/mailer.js         # mock email transport (console log)
│   ├── utils/notify.js         # creates a Notification + fires the mock email together
│   ├── utils/deadlineChecker.js # polls for tasks due within 24h and reminds the assignee once
│   └── server.js
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
