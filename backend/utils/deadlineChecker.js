const Task = require('../models/Task');
const { notifyUser } = require('./notify');

/**
 * Polls for tasks with an assignee whose due date falls within the next 24
 * hours and that haven't had a reminder sent yet, then notifies the assignee.
 * A lightweight setInterval stands in for a real job scheduler — good enough
 * for this project's scale and keeps the deployment footprint to "just Node".
 */
async function checkDeadlines() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const dueSoon = await Task.find({
        dueDate: { $gte: now, $lte: in24h },
        assignee: { $ne: null },
        reminderSentAt: null,
    }).populate('project', 'name');

    for (const task of dueSoon) {
        await notifyUser({
            recipientId: task.assignee,
            project: task.project._id,
            task: task._id,
            type: 'deadline_reminder',
            title: `Deadline approaching: "${task.title}"`,
            message: `"${task.title}" in project "${task.project.name}" is due ${task.dueDate.toLocaleString()}.`,
        });
        task.reminderSentAt = now;
        await task.save();
    }

    if (dueSoon.length > 0) {
        console.log(`Deadline checker: sent ${dueSoon.length} reminder(s).`);
    }
}

function startDeadlineChecker(intervalMs) {
    checkDeadlines().catch((err) => console.error('Deadline checker error:', err.message));
    return setInterval(() => {
        checkDeadlines().catch((err) => console.error('Deadline checker error:', err.message));
    }, intervalMs);
}

module.exports = { startDeadlineChecker, checkDeadlines };
