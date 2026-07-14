const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
        columnId: { type: mongoose.Schema.Types.ObjectId, required: true },
        order: { type: Number, required: true, default: 0 },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        dueDate: { type: Date, default: null },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        labels: { type: [String], default: [] },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reminderSentAt: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
