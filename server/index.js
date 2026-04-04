const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const documentRoutes = require('./routes/document.routes');
const taskRoutes = require('./routes/task.routes');
const fileRoutes = require('./routes/file.routes');
const notificationRoutes = require('./routes/notification.routes');
const { setupSocketHandlers } = require('./socket/socket.handler');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:3000';

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  },
});

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api/', generalLimiter);

// CSRF protection: verify that state-changing requests include the correct Origin/Referer header
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    if (origin && !origin.startsWith(allowedOrigin)) {
      return res.status(403).json({ message: 'CSRF check failed' });
    }
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces', documentRoutes);
app.use('/api/workspaces', taskRoutes);
app.use('/api/workspaces', fileRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Error handler
app.use(errorHandler);

// Socket.io setup
setupSocketHandlers(io);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/syncspace')
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = { app, io };
