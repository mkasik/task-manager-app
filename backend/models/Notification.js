const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
        task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
        type: { type: String, enum: ['task_assigned', 'deadline_reminder', 'project_invite'], required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
