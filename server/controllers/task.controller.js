const Task = require('../models/Task.model');
const Workspace = require('../models/Workspace.model');

const checkAccess = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return null;
  const member = workspace.members.find(m => m.user.toString() === userId.toString());
  return member ? { workspace, role: member.role } : null;
};

exports.createTask = async (req, res, next) => {
  try {
    const access = await checkAccess(req.params.id, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });
    const { title, description, status, assignee, dueDate } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title required' });
    const task = await Task.create({
      title,
      description: description || '',
      status: status || 'todo',
      assignee: assignee || null,
      workspace: req.params.id,
      createdBy: req.user._id,
      dueDate: dueDate || null,
    });
    await Workspace.findByIdAndUpdate(req.params.id, { $push: { tasks: task._id } });
    const populated = await task.populate([
      { path: 'assignee', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);
    res.status(201).json({ task: populated });
  } catch (err) {
    next(err);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const access = await checkAccess(req.params.id, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });
    const tasks = await Task.find({ workspace: req.params.id })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const access = await checkAccess(req.params.id, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });
    if (access.role === 'viewer') return res.status(403).json({ message: 'Viewers cannot edit' });
    const task = await Task.findOne({ _id: req.params.taskId, workspace: req.params.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const { title, description, status, assignee, dueDate } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (assignee !== undefined) task.assignee = assignee;
    if (dueDate !== undefined) task.dueDate = dueDate;
    await task.save();
    const populated = await task.populate([
      { path: 'assignee', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);
    res.json({ task: populated });
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const access = await checkAccess(req.params.id, req.user._id);
    if (!access) return res.status(403).json({ message: 'Access denied' });
    if (access.role === 'viewer') return res.status(403).json({ message: 'Access denied' });
    const task = await Task.findOne({ _id: req.params.taskId, workspace: req.params.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.deleteOne();
    await Workspace.findByIdAndUpdate(req.params.id, { $pull: { tasks: task._id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};
