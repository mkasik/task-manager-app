const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { notifyUser } = require('../utils/notify');

function isMember(project, userId) {
    return project.members.some((m) => m.user.toString() === userId.toString());
}

function isOwner(project, userId) {
    return project.owner.toString() === userId.toString();
}

async function listProjects(req, res) {
    const projects = await Project.find({ 'members.user': req.user._id })
        .populate('members.user', 'name email avatarColor')
        .populate('owner', 'name email avatarColor')
        .sort({ updatedAt: -1 });

    res.json({ success: true, data: projects });
}

async function createProject(req, res) {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: 'Project name is required.' });
    }

    const project = await Project.create({
        name,
        description: description || '',
        owner: req.user._id,
        members: [{ user: req.user._id, role: 'owner' }],
        columns: Project.defaultColumns(),
    });

    const populated = await project.populate([
        { path: 'members.user', select: 'name email avatarColor' },
        { path: 'owner', select: 'name email avatarColor' },
    ]);

    res.status(201).json({ success: true, message: 'Project created.', data: populated });
}

async function getProject(req, res) {
    // Check membership on the raw (unpopulated) document first — isMember() compares
    // m.user.toString() against the requester's id, which only matches a plain
    // ObjectId. Populating members.user beforehand turns m.user into a full User
    // document, so the comparison would silently fail for every real member too.
    const raw = await Project.findById(req.params.id);
    if (!raw) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!isMember(raw, req.user._id)) {
        return res.status(403).json({ success: false, message: 'You are not a member of this project.' });
    }

    const project = await raw.populate([
        { path: 'members.user', select: 'name email avatarColor' },
        { path: 'owner', select: 'name email avatarColor' },
    ]);

    res.json({ success: true, data: project });
}

async function updateProject(req, res) {
    const project = await Project.findById(req.params.id);
    if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!isMember(project, req.user._id)) {
        return res.status(403).json({ success: false, message: 'You are not a member of this project.' });
    }

    const { name, description } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    await project.save();

    const populated = await project.populate([
        { path: 'members.user', select: 'name email avatarColor' },
        { path: 'owner', select: 'name email avatarColor' },
    ]);

    res.json({ success: true, message: 'Project updated.', data: populated });
}

async function deleteProject(req, res) {
    const project = await Project.findById(req.params.id);
    if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!isOwner(project, req.user._id)) {
        return res.status(403).json({ success: false, message: 'Only the project owner can delete it.' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted.' });
}

async function addMember(req, res) {
    const project = await Project.findById(req.params.id);
    if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!isOwner(project, req.user._id)) {
        return res.status(403).json({ success: false, message: 'Only the project owner can add members.' });
    }

    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const newMember = await User.findOne({ email: email.toLowerCase() });
    if (!newMember) {
        return res.status(404).json({ success: false, message: 'No user found with that email — they need an account first.' });
    }
    if (isMember(project, newMember._id)) {
        return res.status(409).json({ success: false, message: 'This user is already a member.' });
    }

    project.members.push({ user: newMember._id, role: 'member' });
    await project.save();

    await notifyUser({
        recipientId: newMember._id,
        project: project._id,
        type: 'project_invite',
        title: `You were added to "${project.name}"`,
        message: `${req.user.name} added you to the project "${project.name}".`,
    });

    const populated = await project.populate([
        { path: 'members.user', select: 'name email avatarColor' },
        { path: 'owner', select: 'name email avatarColor' },
    ]);

    res.json({ success: true, message: `${newMember.name} added to the project.`, data: populated });
}

async function removeMember(req, res) {
    const project = await Project.findById(req.params.id);
    if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!isOwner(project, req.user._id)) {
        return res.status(403).json({ success: false, message: 'Only the project owner can remove members.' });
    }
    if (req.params.userId === project.owner.toString()) {
        return res.status(400).json({ success: false, message: 'The owner cannot be removed.' });
    }

    project.members = project.members.filter((m) => m.user.toString() !== req.params.userId);
    await project.save();

    const populated = await project.populate([
        { path: 'members.user', select: 'name email avatarColor' },
        { path: 'owner', select: 'name email avatarColor' },
    ]);

    res.json({ success: true, message: 'Member removed.', data: populated });
}

async function addColumn(req, res) {
    const project = await Project.findById(req.params.id);
    if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!isMember(project, req.user._id)) {
        return res.status(403).json({ success: false, message: 'You are not a member of this project.' });
    }

    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: 'Column name is required.' });
    }

    const maxOrder = project.columns.reduce((max, c) => Math.max(max, c.order), -1);
    project.columns.push({ name, order: maxOrder + 1, isDoneColumn: false });
    await project.save();

    res.status(201).json({ success: true, message: 'Column added.', data: project.columns });
}

async function deleteColumn(req, res) {
    const project = await Project.findById(req.params.id);
    if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!isMember(project, req.user._id)) {
        return res.status(403).json({ success: false, message: 'You are not a member of this project.' });
    }
    if (project.columns.length <= 1) {
        return res.status(400).json({ success: false, message: 'A project needs at least one column.' });
    }

    const taskCount = await Task.countDocuments({ project: project._id, columnId: req.params.columnId });
    if (taskCount > 0) {
        return res.status(409).json({ success: false, message: 'Move or delete every task in this column first.' });
    }

    project.columns = project.columns.filter((c) => c._id.toString() !== req.params.columnId);
    await project.save();

    res.json({ success: true, message: 'Column deleted.', data: project.columns });
}

module.exports = {
    listProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    addColumn,
    deleteColumn,
    isMember,
};
