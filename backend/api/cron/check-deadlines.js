const connectDB = require('../../config/db');
const { checkDeadlines } = require('../../utils/deadlineChecker');

// Triggered by the Vercel Cron Job defined in vercel.json (see the "crons" key).
// Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on cron-triggered
// requests once CRON_SECRET is set as an environment variable, so this rejects any
// other caller trying to hit the endpoint directly.
module.exports = async function handler(req, res) {
    const auth = req.headers.authorization;
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    try {
        await connectDB();
        await checkDeadlines();
        res.status(200).json({ success: true, message: 'Deadline check complete.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
