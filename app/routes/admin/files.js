const express = require('express');

const filesController = require('../../controllers/admin/filesController');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate');
const { uploadFileSchema } = require('../../utils/validationSchemas');

const router = express.Router();

router.get('/', asyncHandler(filesController.list));
router.post('/', validate(uploadFileSchema), asyncHandler(filesController.upload));
router.delete('/:id', asyncHandler(filesController.remove));

module.exports = router;
