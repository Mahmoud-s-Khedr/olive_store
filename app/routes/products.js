const express = require('express');

const productsController = require('../controllers/productsController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(productsController.list));
router.get('/:slug', asyncHandler(productsController.getOne));

module.exports = router;
