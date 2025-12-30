const express = require('express');

const dashboardController = require('../../controllers/admin/dashboardController');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(dashboardController.summary));

module.exports = router;
