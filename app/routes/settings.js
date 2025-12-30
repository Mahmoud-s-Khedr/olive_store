const express = require('express');

const settingsController = require('../controllers/settingsController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/public', asyncHandler(settingsController.getPublic));

module.exports = router;
