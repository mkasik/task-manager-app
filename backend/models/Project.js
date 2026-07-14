const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        order: { type: Number, required: true },
        isDoneColumn: { type: Boolean, default: false },
    },
    { timestamps: false }
);

const memberSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'member'], default: 'member' },
        addedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const projectSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        members: { type: [memberSchema], required: true, validate: (v) => v.length >= 1 },
        columns: { type: [columnSchema], required: true },
    },
    { timestamps: true }
);

projectSchema.statics.defaultColumns = function () {
    return [
        { name: 'To Do', order: 0, isDoneColumn: false },
        { name: 'In Progress', order: 1, isDoneColumn: false },
        { name: 'Review', order: 2, isDoneColumn: false },
        { name: 'Done', order: 3, isDoneColumn: true },
    ];
};

module.exports = mongoose.model('Project', projectSchema);
