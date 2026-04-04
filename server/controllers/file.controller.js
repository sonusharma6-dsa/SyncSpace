const path = require('path');
const fs = require('fs');
const multer = require('multer');
const File = require('../models/File.model');
const Workspace = require('../models/Workspace.model');
const Notification = require('../models/Notification.model');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIMETYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
]);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIMETYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

const checkAccess = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return null;
  const member = workspace.members.find(m => m.user.toString() === userId.toString());
  return member ? { workspace, role: member.role } : null;
};

exports.uploadMiddleware = upload.single('file');

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const access = await checkAccess(req.params.id, req.user._id);
    if (!access) {
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ message: 'Access denied' });
    }
    if (access.role === 'viewer') {
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ message: 'Viewers cannot upload files' });
    }

    const fileDoc = await File.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      workspace: req.params.id,
      uploadedBy: req.user._id,
    });

    await Workspace.findByIdAndUpdate(req.params.id, { $push: { files: fileDoc._id } });

    const populated = await fileDoc.populate('uploadedBy', 'name email');

    // Create notifications for all other workspace members
    const workspace = access.workspace;
    const otherMembers = workspace.members.filter(
      m => m.user.toString() !== req.user._id.toString()
    );
    if (otherMembers.length > 0) {
      const notifications = otherMembers.map(m => ({
        user: m.user,
        workspace: req.params.id,
        type: 'file_uploaded',
        message: `${req.user.name} uploaded "${req.file.originalname}"`,
      }));
      const created = await Notification.insertMany(notifications);

      // Emit via socket if io is available
      const { io } = require('../index');
      if (io) {
        created.forEach(notif => {
          io.to(`user:${notif.user.toString()}`).emit('notification:new', {
            _id: notif._id,
            type: notif.type,
            message: notif.message,
            workspace: req.params.id,
            read: false,
            createdAt: notif.createdAt,
          });
        });
        // Broadcast file upload to workspace room
        io.to(req.params.id).emit('file:uploaded', { file: populated });
      }
    }

    res.status(201).json({ file: populated });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

exports.getFiles = async (req, res, next) => {
  try {
    const access = await checkAccess(req.params.id, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });
    const files = await File.find({ workspace: req.params.id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ files });
  } catch (err) {
    next(err);
  }
};

exports.deleteFile = async (req, res, next) => {
  try {
    const access = await checkAccess(req.params.id, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });

    const file = await File.findOne({ _id: req.params.fileId, workspace: req.params.id });
    if (!file) return res.status(404).json({ message: 'File not found' });

    const isOwnerOrUploader =
      access.role === 'owner' ||
      file.uploadedBy.toString() === req.user._id.toString();
    if (!isOwnerOrUploader) return res.status(403).json({ message: 'Not authorized to delete this file' });

    // Remove from disk
    const filePath = path.join(uploadsDir, file.filename);
    fs.unlink(filePath, () => {});

    await file.deleteOne();
    await Workspace.findByIdAndUpdate(req.params.id, { $pull: { files: file._id } });

    res.json({ message: 'File deleted' });
  } catch (err) {
    next(err);
  }
};

exports.serveFile = async (req, res, next) => {
  try {
    // Validate filename to prevent path traversal
    const filename = path.basename(req.params.filename);
    if (filename !== req.params.filename) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    const file = await File.findOne({ filename });
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Check workspace membership
    const access = await checkAccess(file.workspace.toString(), req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });

    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found on disk' });

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimetype);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
};

// Handle multer errors
exports.handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10 MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'File type not allowed.' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
};
