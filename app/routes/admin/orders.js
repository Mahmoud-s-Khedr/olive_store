const express = require('express');

const ordersController = require('../../controllers/admin/ordersController');
const validate = require('../../middleware/validate');
const { updateOrderStatusSchema } = require('../../utils/validationSchemas');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(ordersController.list));
router.get('/:id', asyncHandler(ordersController.getOne));
router.put('/:id/status', validate(updateOrderStatusSchema), asyncHandler(ordersController.updateStatus));

module.exports = router;
