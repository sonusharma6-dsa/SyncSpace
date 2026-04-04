const express = require('express');
const router = express.Router();
const { createDocument, getDocuments, getDocument, updateDocument, deleteDocument } = require('../controllers/document.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/:id/documents', protect, createDocument);
router.get('/:id/documents', protect, getDocuments);
router.get('/:id/documents/:docId', protect, getDocument);
router.put('/:id/documents/:docId', protect, updateDocument);
router.delete('/:id/documents/:docId', protect, deleteDocument);

module.exports = router;
