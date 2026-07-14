/**
 * Seeds two demo accounts + realistic project/task data so a public visitor
 * can log in and see a populated board instead of an empty account.
 * Safe to re-run — it clears out any previous demo projects/tasks first.
 *
 * CLI usage:  MONGO_URI=<connection string> node utils/seedDemo.js
 * Also exported as seedDemo() for reuse from a protected API route (see
 * api/seed-demo.js), useful when the local machine's DNS can't resolve
 * mongodb+srv:// SRV records but the deployed environment can.
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
}

async function upsertUser(name, email, password, avatarColor) {
    let user = await User.findOne({ email });
    if (user) {
        user.name = name;
        user.password = password; // triggers the pre-save hash hook
        user.avatarColor = avatarColor;
        await user.save();
    } else {
        user = await User.create({ name, email, password, avatarColor });
    }
    return user;
}

async function seedDemo() {

    const demoUser = await upsertUser('Demo User', 'demo@flowboard.app', 'DemoPass123', '#8b5cf6');
    const admin = await upsertUser('Admin', 'admin@flowboard.app', 'AdminPass123', '#f59e0b');
    console.log('Demo accounts ready: demo@flowboard.app / DemoPass123, admin@flowboard.app / AdminPass123');

    // Clean up any previously-seeded demo projects so this script is idempotent.
    const oldProjects = await Project.find({ owner: admin._id });
    await Task.deleteMany({ project: { $in: oldProjects.map((p) => p._id) } });
    await Notification.deleteMany({ recipient: { $in: [demoUser._id, admin._id] } });
    await Project.deleteMany({ owner: admin._id });

    async function createProject(name, description) {
        const project = await Project.create({
            name,
            description,
            owner: admin._id,
            members: [
                { user: admin._id, role: 'owner' },
                { user: demoUser._id, role: 'member' },
            ],
            columns: Project.defaultColumns(),
        });
        const cols = {};
        project.columns.forEach((c) => { cols[c.name] = c._id; });
        return { project, cols };
    }

    async function createTask({ project, columnId, title, description = '', assignee = null, dueDate = null, priority = 'medium', labels = [], order }) {
        return Task.create({
            project: project._id,
            columnId,
            order,
            title,
            description,
            assignee,
            dueDate,
            priority,
            labels,
            createdBy: admin._id,
        });
    }

    const { project: siteProject, cols: siteCols } = await createProject(
        'Website Redesign',
        'Redesigning the marketing site ahead of the Q3 launch.'
    );

    await createTask({ project: siteProject, columnId: siteCols['To Do'], order: 0, title: 'Design new pricing page', assignee: demoUser._id, dueDate: daysFromNow(3), priority: 'high', labels: ['design'] });
    await createTask({ project: siteProject, columnId: siteCols['To Do'], order: 1, title: 'Write blog post about launch', assignee: admin._id, priority: 'low', labels: ['content'] });
    await createTask({ project: siteProject, columnId: siteCols['To Do'], order: 2, title: 'Research competitor sites', dueDate: daysFromNow(10), priority: 'medium' });

    await createTask({ project: siteProject, columnId: siteCols['In Progress'], order: 0, title: 'Implement responsive navbar', assignee: demoUser._id, dueDate: daysFromNow(1), priority: 'high', labels: ['frontend', 'urgent'] });
    await createTask({ project: siteProject, columnId: siteCols['In Progress'], order: 1, title: 'Set up analytics tracking', assignee: admin._id, dueDate: daysFromNow(5), priority: 'medium' });

    await createTask({ project: siteProject, columnId: siteCols['Review'], order: 0, title: 'Homepage hero section', assignee: demoUser._id, dueDate: daysFromNow(-1), priority: 'high', labels: ['design', 'frontend'] });

    await createTask({ project: siteProject, columnId: siteCols['Done'], order: 0, title: 'Set up CI/CD pipeline', assignee: admin._id, priority: 'medium', labels: ['devops'] });
    await createTask({ project: siteProject, columnId: siteCols['Done'], order: 1, title: 'Domain and hosting setup', assignee: demoUser._id, priority: 'low' });

    const { project: mobileProject, cols: mobileCols } = await createProject(
        'Mobile App Sprint 12',
        'Sprint board for the mobile team.'
    );

    await createTask({ project: mobileProject, columnId: mobileCols['To Do'], order: 0, title: 'Fix login crash on Android', assignee: admin._id, dueDate: daysFromNow(2), priority: 'high', labels: ['bug'] });
    await createTask({ project: mobileProject, columnId: mobileCols['In Progress'], order: 0, title: 'Push notification integration', assignee: demoUser._id, dueDate: daysFromNow(4), priority: 'medium' });
    await createTask({ project: mobileProject, columnId: mobileCols['Done'], order: 0, title: 'Onboarding flow v2', assignee: admin._id, priority: 'medium' });

    await Notification.create([
        {
            recipient: demoUser._id,
            project: siteProject._id,
            type: 'task_assigned',
            title: 'New task assigned: "Implement responsive navbar"',
            message: 'Admin assigned you "Implement responsive navbar" in project "Website Redesign".',
            read: false,
        },
        {
            recipient: demoUser._id,
            project: siteProject._id,
            type: 'project_invite',
            title: 'You were added to "Website Redesign"',
            message: 'Admin added you to the project "Website Redesign".',
            read: true,
        },
        {
            recipient: admin._id,
            project: mobileProject._id,
            type: 'deadline_reminder',
            title: 'Deadline approaching: "Fix login crash on Android"',
            message: '"Fix login crash on Android" in project "Mobile App Sprint 12" is due soon.',
            read: false,
        },
    ]);

    return { projects: 2, tasks: 11, notifications: 3 };
}

module.exports = seedDemo;

if (require.main === module) {
    require('dotenv').config();
    mongoose
        .connect(process.env.MONGO_URI)
        .then(() => console.log('Connected to MongoDB for demo seeding.'))
        .then(seedDemo)
        .then((result) => {
            console.log(`Demo accounts ready: demo@flowboard.app / DemoPass123, admin@flowboard.app / AdminPass123`);
            console.log(`Demo data seeded: ${result.projects} projects, ${result.tasks} tasks, ${result.notifications} notifications.`);
            return mongoose.disconnect();
        })
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
