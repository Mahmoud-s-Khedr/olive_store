const express = require('express');

const customersController = require('../../controllers/admin/customersController');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(customersController.list));
router.get('/:id/orders', asyncHandler(customersController.getOrders));

module.exports = router;
