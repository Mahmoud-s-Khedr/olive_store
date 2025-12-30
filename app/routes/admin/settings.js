const express = require('express');

const settingsController = require('../../controllers/admin/settingsController');
const validate = require('../../middleware/validate');
const { updateSettingsSchema } = require('../../utils/validationSchemas');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(settingsController.list));
router.put('/', validate(updateSettingsSchema), asyncHandler(settingsController.update));

module.exports = router;
