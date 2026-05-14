const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  listNotes,
  getNote,
  createNote,
  updateNote,
  moveToTrash,
  restoreNote,
  duplicateNote,
  createShareLink,
  disableShareLink,
  listAttachments,
  uploadMiddleware,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
  listTags,
  handleUploadError,
} = require('../controllers/note.controller');

const router = express.Router();

router.get('/notes', protect, listNotes);
router.post('/notes', protect, createNote);
router.get('/notes/:id', protect, getNote);
router.patch('/notes/:id', protect, updateNote);
router.delete('/notes/:id', protect, moveToTrash);
router.post('/notes/:id/restore', protect, restoreNote);
router.post('/notes/:id/duplicate', protect, duplicateNote);
router.post('/notes/:id/share', protect, createShareLink);
router.delete('/notes/:id/share', protect, disableShareLink);
router.get('/notes/:id/attachments', protect, listAttachments);
router.post('/notes/:id/attachments', protect, uploadMiddleware, uploadAttachment, handleUploadError);
router.get('/notes/:id/attachments/:attachmentId/download', protect, downloadAttachment);
router.delete('/notes/:id/attachments/:attachmentId', protect, deleteAttachment);
router.get('/tags', protect, listTags);

module.exports = router;
