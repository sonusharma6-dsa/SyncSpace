const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Workspace = require('../models/Workspace.model');
const Notification = require('../models/Notification.model');

const connectedUsers = new Map();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
};

const createAndEmitNotifications = async (io, workspaceId, excludeUserId, type, message) => {
  try {
    const workspace = await Workspace.findById(workspaceId).select('members');
    if (!workspace) return;
    const recipients = workspace.members.filter(
      m => m.user.toString() !== excludeUserId.toString()
    );
    if (recipients.length === 0) return;
    const docs = recipients.map(m => ({ user: m.user, workspace: workspaceId, type, message }));
    const created = await Notification.insertMany(docs);
    created.forEach(notif => {
      io.to(`user:${notif.user.toString()}`).emit('notification:new', {
        _id: notif._id,
        type: notif.type,
        message: notif.message,
        workspace: workspaceId,
        read: false,
        createdAt: notif.createdAt,
      });
    });
  } catch (err) {
    console.error('Failed to create notifications:', err.message);
  }
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

    // Join personal notification room
    socket.join(`user:${socket.userId}`);

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

      // Notify other members
      await createAndEmitNotifications(
        io, workspaceId, socket.userId,
        'user_joined',
        `${socket.user.name} joined the workspace`
      );
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
