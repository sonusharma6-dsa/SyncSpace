const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Workspace = require('../models/Workspace.model');

const connectedUsers = new Map();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
};

const setupSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || (() => {
        const raw = socket.handshake.headers.cookie || '';
        const match = raw.match(/(?:^|;\s*)token=([^;]+)/);
        return match ? match[1] : undefined;
      })();
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, getJwtSecret());
      socket.userId = decoded.id;
      const user = await User.findById(decoded.id).select('name email');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.id})`);

    socket.on('join:workspace', async ({ workspaceId }) => {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        socket.emit('error', { message: 'Workspace not found' });
        return;
      }
      const isMember = workspace.members.some(m => m.user.toString() === socket.userId.toString());
      if (!isMember) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }
      socket.join(workspaceId);
      connectedUsers.set(socket.id, { userId: socket.userId, name: socket.user.name, workspaceId });
      socket.to(workspaceId).emit('user:joined', { userId: socket.userId, name: socket.user.name });
      console.log(`${socket.user.name} joined workspace ${workspaceId}`);
    });

    socket.on('document:edit', ({ docId, content, workspaceId, timestamp }) => {
      socket.to(workspaceId).emit('document:updated', { docId, content, editedBy: socket.userId, timestamp });
    });

    socket.on('task:update', ({ taskId, status, workspaceId, task }) => {
      socket.to(workspaceId).emit('task:updated', { taskId, newStatus: status, updatedBy: socket.userId, task });
    });

    socket.on('cursor:move', ({ docId, position, workspaceId }) => {
      socket.to(workspaceId).emit('cursor:updated', { userId: socket.userId, position, name: socket.user.name });
    });

    socket.on('disconnect', () => {
      const userData = connectedUsers.get(socket.id);
      if (userData) {
        socket.to(userData.workspaceId).emit('user:left', { userId: userData.userId, name: userData.name });
        connectedUsers.delete(socket.id);
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupSocketHandlers };
