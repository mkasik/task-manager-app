const Task = require('../models/Task');
const Project = require('../models/Project');
const { isMember } = require('./projectController');
const { notifyUser } = require('../utils/notify');

async function requireProjectMembership(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) return { error: 'Project not found.', status: 404 };
    if (!isMember(project, userId)) return { error: 'You are not a member of this project.', status: 403 };
    return { project };
}

async function listTasks(req, res) {
    const { error, status, project } = await requireProjectMembership(req.params.projectId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const tasks = await Task.find({ project: project._id })
        .populate('assignee', 'name email avatarColor')
        .populate('createdBy', 'name email avatarColor')
        .sort({ order: 1 });

    res.json({ success: true, data: tasks });
}

async function createTask(req, res) {
    const { error, status, project } = await requireProjectMembership(req.params.projectId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const { title, description, columnId, assignee, dueDate, priority, labels } = req.body;
    if (!title) {
        return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const targetColumnId = columnId || project.columns.sort((a, b) => a.order - b.order)[0]._id;
    if (!project.columns.some((c) => c._id.toString() === targetColumnId.toString())) {
        return res.status(400).json({ success: false, message: 'Invalid column.' });
    }

    if (assignee && !isMember(project, assignee)) {
        return res.status(400).json({ success: false, message: 'Assignee must be a project member.' });
    }

    const siblingCount = await Task.countDocuments({ project: project._id, columnId: targetColumnId });

    const task = await Task.create({
        project: project._id,
        columnId: targetColumnId,
        order: siblingCount,
        title,
        description: description || '',
        assignee: assignee || null,
        dueDate: dueDate || null,
        priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
        labels: Array.isArray(labels) ? labels : [],
        createdBy: req.user._id,
    });

    if (assignee && assignee !== req.user._id.toString()) {
        await notifyUser({
            recipientId: assignee,
            project: project._id,
            task: task._id,
            type: 'task_assigned',
            title: `New task assigned: "${task.title}"`,
            message: `${req.user.name} assigned you "${task.title}" in project "${project.name}".`,
        });
    }

    const populated = await task.populate([
        { path: 'assignee', select: 'name email avatarColor' },
        { path: 'createdBy', select: 'name email avatarColor' },
    ]);

    res.status(201).json({ success: true, message: 'Task created.', data: populated });
}

async function updateTask(req, res) {
    const task = await Task.findById(req.params.id);
    if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { error, status, project } = await requireProjectMembership(task.project, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const { title, description, assignee, dueDate, priority, labels } = req.body;
    const previousAssignee = task.assignee ? task.assignee.toString() : null;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) {
        task.dueDate = dueDate || null;
        task.reminderSentAt = null; // due date changed, allow a fresh reminder
    }
    if (priority !== undefined && ['low', 'medium', 'high'].includes(priority)) task.priority = priority;
    if (labels !== undefined && Array.isArray(labels)) task.labels = labels;

    if (assignee !== undefined) {
        if (assignee && !isMember(project, assignee)) {
            return res.status(400).json({ success: false, message: 'Assignee must be a project member.' });
        }
        task.assignee = assignee || null;
    }

    await task.save();

    if (assignee && assignee !== previousAssignee && assignee !== req.user._id.toString()) {
        await notifyUser({
            recipientId: assignee,
            project: project._id,
            task: task._id,
            type: 'task_assigned',
            title: `New task assigned: "${task.title}"`,
            message: `${req.user.name} assigned you "${task.title}" in project "${project.name}".`,
        });
    }

    const populated = await task.populate([
        { path: 'assignee', select: 'name email avatarColor' },
        { path: 'createdBy', select: 'name email avatarColor' },
    ]);

    res.json({ success: true, message: 'Task updated.', data: populated });
}

async function moveTask(req, res) {
    const task = await Task.findById(req.params.id);
    if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { error, status, project } = await requireProjectMembership(task.project, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const { toColumnId, toIndex } = req.body;
    if (!toColumnId || toIndex === undefined) {
        return res.status(400).json({ success: false, message: 'toColumnId and toIndex are required.' });
    }
    if (!project.columns.some((c) => c._id.toString() === toColumnId)) {
        return res.status(400).json({ success: false, message: 'Invalid target column.' });
    }
    const targetIndex = Number.isInteger(toIndex) ? toIndex : parseInt(toIndex, 10) || 0;

    const fromColumnId = task.columnId.toString();

    if (fromColumnId !== toColumnId) {
        const oldSiblings = await Task.find({ project: project._id, columnId: fromColumnId, _id: { $ne: task._id } }).sort({ order: 1 });
        await Promise.all(oldSiblings.map((t, i) => Task.updateOne({ _id: t._id }, { order: i })));
    }

    const newSiblings = await Task.find({ project: project._id, columnId: toColumnId, _id: { $ne: task._id } }).sort({ order: 1 });
    newSiblings.splice(Math.max(0, Math.min(targetIndex, newSiblings.length)), 0, task);

    await Promise.all(
        newSiblings.map((t, i) =>
            t._id.equals(task._id)
                ? Task.updateOne({ _id: task._id }, { columnId: toColumnId, order: i })
                : Task.updateOne({ _id: t._id }, { order: i })
        )
    );

    const updated = await Task.findById(task._id)
        .populate('assignee', 'name email avatarColor')
        .populate('createdBy', 'name email avatarColor');

    res.json({ success: true, message: 'Task moved.', data: updated });
}

async function deleteTask(req, res) {
    const task = await Task.findById(req.params.id);
    if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { error, status, project } = await requireProjectMembership(task.project, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const canDelete = task.createdBy.toString() === req.user._id.toString() || project.owner.toString() === req.user._id.toString();
    if (!canDelete) {
        return res.status(403).json({ success: false, message: 'Only the task creator or project owner can delete this task.' });
    }

    await task.deleteOne();

    const siblings = await Task.find({ project: project._id, columnId: task.columnId }).sort({ order: 1 });
    await Promise.all(siblings.map((t, i) => Task.updateOne({ _id: t._id }, { order: i })));

    res.json({ success: true, message: 'Task deleted.' });
}

module.exports = { listTasks, createTask, updateTask, moveTask, deleteTask };
