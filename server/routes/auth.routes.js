const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  signup,
  login,
  demoLogin,
  logout,
  getMe,
  refresh,
  forgotPassword,
  updatePreferences,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many requests from this IP, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/demo', authLimiter, demoLogin);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/refresh', authLimiter, refresh);
router.post('/forgot-password', authLimiter, forgotPassword);
router.patch('/preferences', protect, updatePreferences);

module.exports = router;
