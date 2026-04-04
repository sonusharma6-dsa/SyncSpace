const express = require('express');
const router = express.Router();
const { createWorkspace, getWorkspaces, joinWorkspace, getWorkspace, deleteWorkspace } = require('../controllers/workspace.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, createWorkspace);
router.get('/', protect, getWorkspaces);
router.post('/join', protect, joinWorkspace);
router.get('/:id', protect, getWorkspace);
router.delete('/:id', protect, deleteWorkspace);

module.exports = router;
