const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendMail } = require('./mailer');

/**
 * Creates an in-app notification AND fires the corresponding (mock) email —
 * the two are always kept in sync so "email notifications" and the in-app
 * bell never drift apart.
 */
async function notifyUser({ recipientId, project = null, task = null, type, title, message }) {
    const recipient = await User.findById(recipientId).select('email');
    if (!recipient) return null;

    const notification = await Notification.create({
        recipient: recipientId,
        project,
        task,
        type,
        title,
        message,
    });

    await sendMail({ to: recipient.email, subject: title, body: message });

    return notification;
}

module.exports = { notifyUser };
