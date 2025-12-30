const express = require('express');

const filesController = require('../controllers/filesController');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/upload-url', auth, asyncHandler(filesController.getUploadUrl));

module.exports = router;
