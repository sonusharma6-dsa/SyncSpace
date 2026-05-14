const Note = require('../models/Note.model');
const ShareLink = require('../models/ShareLink.model');
const Attachment = require('../models/Attachment.model');

exports.getSharedNote = async (req, res, next) => {
  try {
    const shareLink = await ShareLink.findOne({ token: req.params.token, isActive: true });

    if (!shareLink) {
      return res.status(404).json({ message: 'Share link not found.' });
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return res.status(410).json({ message: 'Share link has expired.' });
    }

    const note = await Note.findOne({ _id: shareLink.note, isDeleted: false }).populate('user', 'name');
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    const attachments = await Attachment.find({ note: note._id }).select('originalName fileType fileSize');

    res.json({
      note: {
        _id: note._id,
        title: note.title,
        content: note.content,
        excerpt: note.excerpt,
        tags: note.tags,
        updatedAt: note.updatedAt,
        lastEditedAt: note.lastEditedAt,
        owner: note.user?.name || 'Shared note',
      },
      attachments,
    });
  } catch (err) {
    next(err);
  }
};
