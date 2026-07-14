const app = require('./app');
const { startDeadlineChecker } = require('./utils/deadlineChecker');

// setInterval-based polling only makes sense on a long-running process (local dev,
// a VPS, Render, etc.) — on Vercel's serverless functions this file never runs at
// all; api/cron/check-deadlines.js + a Vercel Cron Job trigger the same check instead.
const intervalMs = parseInt(process.env.DEADLINE_CHECK_INTERVAL_MS, 10) || 5 * 60 * 1000;
startDeadlineChecker(intervalMs);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
