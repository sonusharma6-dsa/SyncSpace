const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getNotifications, markRead, markAllRead } = require('../controllers/notification.controller');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markRead);
router.put('/read-all', protect, markAllRead);

module.exports = router;
