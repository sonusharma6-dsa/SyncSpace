const express = require('express');
const { getSharedNote } = require('../controllers/share.controller');

const router = express.Router();

router.get('/:token', getSharedNote);

module.exports = router;
