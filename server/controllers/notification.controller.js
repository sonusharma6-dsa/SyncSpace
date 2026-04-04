const Notification = require('../models/Notification.model');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    notif.read = true;
    await notif.save();
    res.json({ notification: notif });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};
