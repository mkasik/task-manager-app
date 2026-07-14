const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const { updateTask, moveTask, deleteTask } = require('../controllers/taskController');

const router = express.Router();

router.use(protect);

router.put('/:id', asyncHandler(updateTask));
router.patch('/:id/move', asyncHandler(moveTask));
router.delete('/:id', asyncHandler(deleteTask));

module.exports = router;
