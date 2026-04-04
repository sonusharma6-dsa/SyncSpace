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

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    const decoded = jwt.verify(token, getSecret());
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
