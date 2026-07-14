const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const { listNotifications, markRead, markAllRead } = require('../controllers/notificationController');

const router = express.Router();

router.use(protect);

router.get('/', asyncHandler(listNotifications));
router.put('/:id/read', asyncHandler(markRead));
router.put('/read-all', asyncHandler(markAllRead));

module.exports = router;
