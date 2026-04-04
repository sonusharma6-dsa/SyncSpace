const Workspace = require('../models/Workspace.model');
const User = require('../models/User.model');

const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

exports.createWorkspace = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Workspace name required' });
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existing = await Workspace.findOne({ inviteCode });
      if (!existing) isUnique = true;
    }
    const workspace = await Workspace.create({
      name,
      inviteCode,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });
    await User.findByIdAndUpdate(req.user._id, { $push: { workspaces: workspace._id } });
    res.status(201).json({ workspace });
  } catch (err) {
    next(err);
  }
};

exports.getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.user._id })
      .populate('owner', 'name email')
      .populate('members.user', 'name email');
    res.json({ workspaces });
  } catch (err) {
    next(err);
  }
};

exports.joinWorkspace = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Invite code required' });
    const workspace = await Workspace.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    const isMember = workspace.members.some(m => m.user.toString() === req.user._id.toString());
    if (isMember) return res.status(400).json({ message: 'Already a member' });
    workspace.members.push({ user: req.user._id, role: 'editor' });
    await workspace.save();
    await User.findByIdAndUpdate(req.user._id, { $push: { workspaces: workspace._id } });
    res.json({ workspace });
  } catch (err) {
    next(err);
  }
};

exports.getWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('documents')
      .populate({ path: 'tasks', populate: { path: 'assignee', select: 'name email' } });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    const isMember = workspace.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });
    res.json({ workspace });
  } catch (err) {
    next(err);
  }
};

exports.deleteWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can delete workspace' });
    }
    await workspace.deleteOne();
    await User.updateMany({ workspaces: workspace._id }, { $pull: { workspaces: workspace._id } });
    res.json({ message: 'Workspace deleted' });
  } catch (err) {
    next(err);
  }
};
