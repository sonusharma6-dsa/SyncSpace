const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  uploadMiddleware,
  uploadFile,
  getFiles,
  deleteFile,
  serveFile,
  handleMulterError,
} = require('../controllers/file.controller');

router.post('/:id/files', protect, uploadMiddleware, uploadFile, handleMulterError);
router.get('/:id/files', protect, getFiles);
router.delete('/:id/files/:fileId', protect, deleteFile);
router.get('/serve/:filename', protect, serveFile);

module.exports = router;
