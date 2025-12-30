const express = require('express');

const categoriesController = require('../controllers/categoriesController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(categoriesController.list));
router.get('/:slug', asyncHandler(categoriesController.getOne));
router.get('/:slug/products', asyncHandler(categoriesController.productsByCategory));

module.exports = router;
