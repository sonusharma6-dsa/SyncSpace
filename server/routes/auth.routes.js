const express = require('express');
const router = express.Router();
const { signup, login, logout, getMe, refresh } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/refresh', refresh);

module.exports = router;
