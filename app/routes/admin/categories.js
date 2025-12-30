const express = require('express');

const categoriesController = require('../../controllers/admin/categoriesController');
const validate = require('../../middleware/validate');
const { createCategorySchema, updateCategorySchema } = require('../../utils/validationSchemas');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(categoriesController.list));
router.get('/:id', asyncHandler(categoriesController.getOne));
router.post('/', validate(createCategorySchema), asyncHandler(categoriesController.create));
router.put('/:id', validate(updateCategorySchema), asyncHandler(categoriesController.update));
router.delete('/:id', asyncHandler(categoriesController.remove));

module.exports = router;
