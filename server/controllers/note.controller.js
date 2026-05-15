const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Note = require('../models/Note.model');
const Tag = require('../models/Tag.model');
const Attachment = require('../models/Attachment.model');
const ShareLink = require('../models/ShareLink.model');

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024;
const uploadsDir = path.join(__dirname, '..', process.env.UPLOADS_DIR || 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const TAG_COLORS = ['#7c6cf2', '#3b82f6', '#14b8a6', '#f97316', '#ef4444', '#f59e0b'];
const ALLOWED_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/zip',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIMETYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripMarkdown = (value = '') => value
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/`[^`]*`/g, ' ')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/[>#*_~\-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const buildExcerpt = (content = '') => stripMarkdown(content).slice(0, 180);
const toSlug = (title = 'untitled-note') => {
  const input = String(title).trim().toLowerCase();
  let slug = '';
  let lastWasDash = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const code = input.charCodeAt(index);
    const isAlphaNumeric = (code >= 48 && code <= 57) || (code >= 97 && code <= 122);

    if (isAlphaNumeric) {
      slug += char;
      lastWasDash = false;
    } else if (!lastWasDash && slug) {
      slug += '-';
      lastWasDash = true;
    }
  }

  if (slug.endsWith('-')) {
    slug = slug.slice(0, -1);
  }

  return slug || 'untitled-note';
};

const normalizeTags = (input) => {
  const values = Array.isArray(input)
    ? input
    : String(input || '')
      .split(',')
      .map((item) => item.trim());

  return [...new Set(values
    .map((item) => String(item || '').trim().toLowerCase().replace(/[^a-z0-9- ]/g, ''))
    .map((item) => item.replace(/\s+/g, '-'))
    .filter(Boolean))].slice(0, 8);
};

const getTagColor = (name) => {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TAG_COLORS[hash % TAG_COLORS.length];
};

const getSort = (sort = 'updated') => {
  switch (sort) {
    case 'created':
      return { createdAt: -1 };
    case 'title':
      return { title: 1 };
    default:
      return { isPinned: -1, lastEditedAt: -1, updatedAt: -1 };
  }
};

const findOwnedNote = (noteId, userId) => Note.findOne({ _id: noteId, user: userId });

const syncUserTags = async (userId) => {
  const aggregates = await Note.aggregate([
    { $match: { user: userId, isDeleted: false } },
    { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
    { $group: { _id: '$tags', noteCount: { $sum: 1 } } },
  ]);

  const activeNames = new Set();
  await Promise.all(aggregates.map(async ({ _id, noteCount }) => {
    activeNames.add(_id);
    await Tag.findOneAndUpdate(
      { user: userId, name: _id },
      { $set: { color: getTagColor(_id), noteCount } },
      { upsert: true, new: true }
    );
  }));

  const existingTags = await Tag.find({ user: userId }).select('name');
  const staleIds = existingTags.filter((tag) => !activeNames.has(tag.name)).map((tag) => tag._id);
  if (staleIds.length) {
    await Tag.deleteMany({ _id: { $in: staleIds } });
  }
};

const getCounts = async (userId) => {
  const counts = await Note.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        active: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$isDeleted', false] }, { $eq: ['$isArchived', false] }] }, 1, 0],
          },
        },
        archived: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$isDeleted', false] }, { $eq: ['$isArchived', true] }] }, 1, 0],
          },
        },
        trash: { $sum: { $cond: [{ $eq: ['$isDeleted', true] }, 1, 0] } },
        pinned: { $sum: { $cond: [{ $eq: ['$isPinned', true] }, 1, 0] } },
      },
    },
  ]);

  return counts[0] || { active: 0, archived: 0, trash: 0, pinned: 0 };
};

exports.uploadMiddleware = upload.single('file');

exports.listNotes = async (req, res, next) => {
  try {
    const status = req.query.status || 'active';
    const tag = req.query.tag ? String(req.query.tag).toLowerCase() : '';
    const search = String(req.query.q || '').trim();
    const sort = String(req.query.sort || 'updated');

    const query = { user: req.user._id };

    if (status === 'trash') {
      query.isDeleted = true;
    } else if (status === 'archived') {
      query.isDeleted = false;
      query.isArchived = true;
    } else {
      query.isDeleted = false;
      query.isArchived = false;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      query.$or = [{ title: regex }, { content: regex }, { tags: regex }];
    }

    const notes = await Note.find(query).sort(getSort(sort));
    const tags = await Tag.find({ user: req.user._id }).sort({ noteCount: -1, name: 1 });
    const recentNotes = await Note.find({ user: req.user._id, isDeleted: false })
      .sort({ lastEditedAt: -1 })
      .limit(5)
      .select('title lastEditedAt isArchived');

    res.json({
      notes,
      tags,
      counts: await getCounts(req.user._id),
      recentNotes,
    });
  } catch (err) {
    next(err);
  }
};

exports.getNote = async (req, res, next) => {
  try {
    const note = await findOwnedNote(req.params.id, req.user._id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    const attachments = await Attachment.find({ note: note._id }).sort({ createdAt: -1 });
    const shareLink = await ShareLink.findOne({ note: note._id, isActive: true });

    res.json({ note, attachments, shareLink });
  } catch (err) {
    next(err);
  }
};

exports.createNote = async (req, res, next) => {
  try {
    const title = String(req.body.title || 'Untitled note').trim() || 'Untitled note';
    const content = String(req.body.content || '');
    const tags = normalizeTags(req.body.tags);

    const note = await Note.create({
      user: req.user._id,
      title,
      slug: toSlug(title),
      content,
      excerpt: buildExcerpt(content),
      tags,
      isPinned: Boolean(req.body.isPinned),
      isArchived: Boolean(req.body.isArchived),
      isFavorite: Boolean(req.body.isFavorite),
      lastEditedAt: new Date(),
    });

    await syncUserTags(req.user._id);

    res.status(201).json({ note });
  } catch (err) {
    next(err);
  }
};

exports.updateNote = async (req, res, next) => {
  try {
    const note = await findOwnedNote(req.params.id, req.user._id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    const nextTitle = req.body.title !== undefined ? String(req.body.title).trim() || 'Untitled note' : note.title;
    const nextContent = req.body.content !== undefined ? String(req.body.content) : note.content;
    const nextTags = req.body.tags !== undefined ? normalizeTags(req.body.tags) : note.tags;

    note.title = nextTitle;
    note.slug = toSlug(nextTitle);
    note.content = nextContent;
    note.excerpt = buildExcerpt(nextContent);
    note.tags = nextTags;

    ['isPinned', 'isArchived', 'isFavorite', 'isDeleted'].forEach((field) => {
      if (req.body[field] !== undefined) {
        note[field] = Boolean(req.body[field]);
      }
    });

    if (note.isDeleted) {
      note.deletedAt = note.deletedAt || new Date();
      note.isArchived = false;
    } else if (req.body.isDeleted !== undefined && !req.body.isDeleted) {
      note.deletedAt = null;
    }

    note.lastEditedAt = new Date();
    await note.save();
    await syncUserTags(req.user._id);

    res.json({ note });
  } catch (err) {
    next(err);
  }
};

exports.moveToTrash = async (req, res, next) => {
  try {
    const note = await findOwnedNote(req.params.id, req.user._id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    note.isDeleted = true;
    note.isArchived = false;
    note.deletedAt = new Date();
    await note.save();
    await syncUserTags(req.user._id);

    res.json({ note, message: 'Note moved to trash.' });
  } catch (err) {
    next(err);
  }
};

exports.restoreNote = async (req, res, next) => {
  try {
    const note = await findOwnedNote(req.params.id, req.user._id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    note.isDeleted = false;
    note.deletedAt = null;
    note.lastEditedAt = new Date();
    await note.save();
    await syncUserTags(req.user._id);

    res.json({ note, message: 'Note restored.' });
  } catch (err) {
    next(err);
  }
};

exports.duplicateNote = async (req, res, next) => {
  try {
    const note = await findOwnedNote(req.params.id, req.user._id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    const duplicate = await Note.create({
      user: req.user._id,
      title: `${note.title} (copy)`,
      slug: toSlug(`${note.title} copy`),
      content: note.content,
      excerpt: note.excerpt,
      tags: note.tags,
      isPinned: false,
      isArchived: note.isArchived,
      isFavorite: note.isFavorite,
      lastEditedAt: new Date(),
    });

    await syncUserTags(req.user._id);

    res.status(201).json({ note: duplicate, message: 'Note duplicated.' });
  } catch (err) {
    next(err);
  }
};

exports.createShareLink = async (req, res, next) => {
  try {
    const note = await findOwnedNote(req.params.id, req.user._id);
    if (!note || note.isDeleted) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    let shareLink = await ShareLink.findOne({ note: note._id });
    if (!shareLink) {
      shareLink = await ShareLink.create({
        note: note._id,
        token: crypto.randomBytes(18).toString('hex'),
      });
    }

    shareLink.isActive = true;
    shareLink.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    await shareLink.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.json({
      shareLink,
      shareUrl: `${clientUrl}/share/${shareLink.token}`,
    });
  } catch (err) {
    next(err);
  }
};

exports.disableShareLink = async (req, res, next) => {
  try {
    const note = await findOwnedNote(req.params.id, req.user._id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    await ShareLink.findOneAndUpdate({ note: note._id }, { isActive: false });
    res.json({ message: 'Share link disabled.' });
  } catch (err) {
    next(err);
  }
};

exports.listAttachments = async (req, res, next) => {
  try {
    const note = await findOwnedNote(req.params.id, req.user._id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    const attachments = await Attachment.find({ note: note._id }).sort({ createdAt: -1 });
    res.json({ attachments });
  } catch (err) {
    next(err);
  }
};

exports.uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided.' });
    }

    const note = await findOwnedNote(req.params.id, req.user._id);
    if (!note || note.isDeleted) {
      fs.unlink(path.join(uploadsDir, path.basename(req.file.filename)), () => {});
      return res.status(404).json({ message: 'Note not found.' });
    }

    const attachment = await Attachment.create({
      note: note._id,
      user: req.user._id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: '',
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    attachment.fileUrl = `/api/notes/${note._id}/attachments/${attachment._id}/download`;
    await attachment.save();

    res.status(201).json({ attachment });
  } catch (err) {
    if (req.file) {
      fs.unlink(path.join(uploadsDir, path.basename(req.file.filename)), () => {});
    }
    next(err);
  }
};

exports.downloadAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findOne({
      _id: req.params.attachmentId,
      note: req.params.id,
      user: req.user._id,
    });

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found.' });
    }

    const filePath = path.join(uploadsDir, path.basename(attachment.fileName));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Attachment file missing.' });
    }

    res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.fileType);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
};

exports.deleteAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findOne({
      _id: req.params.attachmentId,
      note: req.params.id,
      user: req.user._id,
    });

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found.' });
    }

    const filePath = path.join(uploadsDir, path.basename(attachment.fileName));
    fs.unlink(filePath, () => {});
    await attachment.deleteOne();

    res.json({ message: 'Attachment removed.' });
  } catch (err) {
    next(err);
  }
};

exports.listTags = async (req, res, next) => {
  try {
    const tags = await Tag.find({ user: req.user._id }).sort({ noteCount: -1, name: 1 });
    res.json({ tags });
  } catch (err) {
    next(err);
  }
};

exports.handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: `File too large. Max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'This file type is not supported.' });
    }
    return res.status(400).json({ message: err.message });
  }

  return next(err);
};
