const Notification = require('../models/Notification');

async function listNotifications(req, res) {
    const notifications = await Notification.find({ recipient: req.user._id })
        .populate('project', 'name')
        .populate('task', 'title')
        .sort({ createdAt: -1 })
        .limit(30);

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

    res.json({ success: true, data: { notifications, unreadCount } });
}

async function markRead(req, res) {
    const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
    if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    notification.read = true;
    await notification.save();
    res.json({ success: true, message: 'Marked as read.' });
}

async function markAllRead(req, res) {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
}

module.exports = { listNotifications, markRead, markAllRead };
