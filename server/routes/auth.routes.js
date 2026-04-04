const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { signup, login, logout, getMe, refresh } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/refresh', authLimiter, refresh);

module.exports = router;
