const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const noteRoutes = require('./routes/note.routes');
const shareRoutes = require('./routes/share.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:3000';

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use('/api', generalLimiter);

app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    if (origin && !origin.startsWith(allowedOrigin)) {
      return res.status(403).json({ message: 'CSRF check failed.' });
    }
  }
  return next();
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'NoteMesh' }));
app.use('/api/auth', authRoutes);
app.use('/api', noteRoutes);
app.use('/api/shares', shareRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/notemesh';

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = { app, server };
