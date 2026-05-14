const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  return secret;
};

const generateToken = (id) => jwt.sign({ id }, getSecret(), {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
});

const generateRefreshToken = (id) => jwt.sign({ id }, getRefreshSecret(), {
  expiresIn: '30d',
});

const setCookies = (res, token, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseConfig = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  };

  res.cookie('token', token, {
    ...baseConfig,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    ...baseConfig,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const finalizeAuth = async (res, user) => {
  user.lastLoginAt = new Date();
  await user.save();
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  setCookies(res, token, refreshToken);
  return { user: user.toJSON() };
};

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const trimmedName = String(name).trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const user = await User.create({
      name: trimmedName,
      email: sanitizedEmail,
      password: String(password),
    });

    res.status(201).json(await finalizeAuth(res, user));
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: sanitizedEmail });

    if (!user || !(await user.comparePassword(String(password)))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json(await finalizeAuth(res, user));
  } catch (err) {
    next(err);
  }
};

exports.demoLogin = async (_req, res, next) => {
  try {
    const email = (process.env.DEMO_USER_EMAIL || 'demo@notemesh.local').toLowerCase().trim();
    const password = process.env.DEMO_USER_PASSWORD || 'demopass123';
    const name = process.env.DEMO_USER_NAME || 'Demo User';

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, password });
    }

    res.json(await finalizeAuth(res, user));
  } catch (err) {
    next(err);
  }
};

exports.logout = (_req, res) => {
  res.clearCookie('token', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out successfully.' });
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token.' });
    }

    const decoded = jwt.verify(refreshToken, getRefreshSecret());
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    res.json(await finalizeAuth(res, user));
  } catch (_err) {
    res.status(401).json({ message: 'Invalid refresh token.' });
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const sanitizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: sanitizedEmail }).select('_id');

    res.json({
      message: user
        ? 'If that email exists, a reset link would be sent in a production deployment.'
        : 'If that email exists, a reset link would be sent in a production deployment.',
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const { themePreference } = req.body;
    const allowedThemes = new Set(['light', 'dark', 'system']);

    if (themePreference && !allowedThemes.has(themePreference)) {
      return res.status(400).json({ message: 'Invalid theme preference.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(themePreference ? { themePreference } : {}) },
      { new: true }
    ).select('-password');

    res.json({ user });
  } catch (err) {
    next(err);
  }
};
