const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const {
    listProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    addColumn,
    deleteColumn,
} = require('../controllers/projectController');
const { listTasks, createTask } = require('../controllers/taskController');

const router = express.Router();

router.use(protect);

router.get('/', asyncHandler(listProjects));
router.post('/', asyncHandler(createProject));
router.get('/:id', asyncHandler(getProject));
router.put('/:id', asyncHandler(updateProject));
router.delete('/:id', asyncHandler(deleteProject));

router.post('/:id/members', asyncHandler(addMember));
router.delete('/:id/members/:userId', asyncHandler(removeMember));

router.post('/:id/columns', asyncHandler(addColumn));
router.delete('/:id/columns/:columnId', asyncHandler(deleteColumn));

router.get('/:projectId/tasks', asyncHandler(listTasks));
router.post('/:projectId/tasks', asyncHandler(createTask));

module.exports = router;
