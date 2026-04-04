const Document = require('../models/Document.model');
const Workspace = require('../models/Workspace.model');

const MAX_HISTORY_LENGTH = 50;

const checkAccess = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return null;
  const member = workspace.members.find(m => m.user.toString() === userId.toString());
  return member ? { workspace, role: member.role } : null;
};

exports.createDocument = async (req, res, next) => {
  try {
    const access = await checkAccess(req.params.id, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });
    const { title } = req.body;
    const document = await Document.create({
      title: title || 'Untitled Document',
      workspace: req.params.id,
      lastEditedBy: req.user._id,
    });
    await Workspace.findByIdAndUpdate(req.params.id, { $push: { documents: document._id } });
    res.status(201).json({ document });
  } catch (err) {
    next(err);
  }
};

exports.getDocuments = async (req, res, next) => {
  try {
    const access = await checkAccess(req.params.id, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });
    const documents = await Document.find({ workspace: req.params.id })
      .populate('lastEditedBy', 'name email')
      .sort({ updatedAt: -1 });
    res.json({ documents });
  } catch (err) {
    next(err);
  }
};

exports.getDocument = async (req, res, next) => {
  try {
    const access = await checkAccess(req.params.id, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });
    const document = await Document.findOne({ _id: req.params.docId, workspace: req.params.id })
      .populate('lastEditedBy', 'name email');
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json({ document });
  } catch (err) {
    next(err);
  }
};

exports.updateDocument = async (req, res, next) => {
  try {
    const access = await checkAccess(req.params.id, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });
    if (access.role === 'viewer') return res.status(403).json({ message: 'Viewers cannot edit' });
    const document = await Document.findOne({ _id: req.params.docId, workspace: req.params.id });
    if (!document) return res.status(404).json({ message: 'Document not found' });
    const { title, content } = req.body;
    if (content !== undefined) {
      document.history.push({ content: document.content, editedBy: document.lastEditedBy, timestamp: new Date() });
      if (document.history.length > MAX_HISTORY_LENGTH) document.history = document.history.slice(-MAX_HISTORY_LENGTH);
      document.content = content;
      document.version += 1;
    }
    if (title !== undefined) document.title = title;
    document.lastEditedBy = req.user._id;
    document.updatedAt = new Date();
    await document.save();
    res.json({ document });
  } catch (err) {
    next(err);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const access = await checkAccess(req.params.id, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });
    if (access.role === 'viewer') return res.status(403).json({ message: 'Access denied' });
    const document = await Document.findOne({ _id: req.params.docId, workspace: req.params.id });
    if (!document) return res.status(404).json({ message: 'Document not found' });
    await document.deleteOne();
    await Workspace.findByIdAndUpdate(req.params.id, { $pull: { documents: document._id } });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};
