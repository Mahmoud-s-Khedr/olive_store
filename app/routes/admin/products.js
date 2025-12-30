const express = require('express');

const productsController = require('../../controllers/admin/productsController');
const validate = require('../../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../../utils/validationSchemas');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(productsController.list));
router.get('/:id', asyncHandler(productsController.getOne));
router.post('/', validate(createProductSchema), asyncHandler(productsController.create));
router.put('/:id', validate(updateProductSchema), asyncHandler(productsController.update));
router.delete('/:id', asyncHandler(productsController.remove));
router.post('/:id/images', asyncHandler(productsController.addImages));
router.put('/:id/images/:imageId/primary', asyncHandler(productsController.setPrimary));
router.delete('/:id/images/:imageId', asyncHandler(productsController.removeImage));

module.exports = router;
