const express = require('express');

const addressesController = require('../controllers/addressesController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createAddressSchema, updateAddressSchema } = require('../utils/validationSchemas');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', auth, asyncHandler(addressesController.list));
router.post('/', auth, validate(createAddressSchema), asyncHandler(addressesController.create));
router.put('/:id', auth, validate(updateAddressSchema), asyncHandler(addressesController.update));
router.delete('/:id', auth, asyncHandler(addressesController.remove));

module.exports = router;
