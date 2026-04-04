const express = require('express');
const router = express.Router();
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/:id/tasks', protect, createTask);
router.get('/:id/tasks', protect, getTasks);
router.put('/:id/tasks/:taskId', protect, updateTask);
router.delete('/:id/tasks/:taskId', protect, deleteTask);

module.exports = router;
