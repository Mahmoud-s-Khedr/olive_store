const express = require('express');

const ordersController = require('../controllers/ordersController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderSchema, uploadPaymentProofSchema, cancelOrderSchema } = require('../utils/validationSchemas');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/', auth, validate(createOrderSchema), asyncHandler(ordersController.create));
router.get('/', auth, asyncHandler(ordersController.list));
router.get('/:orderNumber', auth, asyncHandler(ordersController.getOne));
router.post('/:orderNumber/payment-proof', auth, validate(uploadPaymentProofSchema), asyncHandler(ordersController.uploadPaymentProof));
router.post('/:orderNumber/cancel', auth, validate(cancelOrderSchema), asyncHandler(ordersController.cancel));

module.exports = router;
