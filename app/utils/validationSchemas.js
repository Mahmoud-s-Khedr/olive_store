const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required().messages({
        'string.pattern.base': 'Phone number must be valid (10-15 digits)',
    }),
    password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required(),
});

const resendVerificationSchema = Joi.object({
    email: Joi.string().email().required(),
});

const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
});

const changePasswordSchema = Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(8).required(),
});

const createCategorySchema = Joi.object({
    name_ar: Joi.string().required(),
    name_en: Joi.string().required(),
    slug: Joi.string().optional(),
    description_ar: Joi.string().optional().allow('', null),
    description_en: Joi.string().optional().allow('', null),
    parent_id: Joi.number().integer().optional().allow(null),
    sort_order: Joi.number().integer().optional(),
    is_active: Joi.boolean().optional(),
});

const updateCategorySchema = createCategorySchema; // Same validation for PUT

const createProductSchema = Joi.object({
    name_ar: Joi.string().required(),
    name_en: Joi.string().required(),
    price: Joi.number().min(0).required(),
    category_id: Joi.number().integer().optional().allow(null),
    slug: Joi.string().optional(),
    description_ar: Joi.string().optional().allow('', null),
    description_en: Joi.string().optional().allow('', null),
    short_description_ar: Joi.string().optional().allow('', null),
    short_description_en: Joi.string().optional().allow('', null),
    old_price: Joi.number().min(0).optional().allow(null),
    cost_price: Joi.number().min(0).optional().allow(null),
    stock: Joi.number().integer().min(0).optional(),
    low_stock_threshold: Joi.number().integer().min(0).optional(),
    weight: Joi.string().optional().allow('', null),
    dimensions: Joi.string().optional().allow('', null),
    is_active: Joi.boolean().optional(),
    meta_title: Joi.string().optional().allow('', null),
    meta_description: Joi.string().optional().allow('', null),
    is_featured: Joi.boolean().optional(),
    sku: Joi.string().optional().allow('', null),
});

const updateProductSchema = createProductSchema;

const createOrderSchema = Joi.object({
    customer_name: Joi.string().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    postal_code: Joi.string().optional().allow('', null),
    notes: Joi.string().optional().allow('', null),
    payment_method: Joi.string().required(),
    shipping_cost: Joi.number().min(0).optional(),
    discount: Joi.number().min(0).optional(),
    items: Joi.array().items(
        Joi.object({
            product_id: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).required(),
            product_image: Joi.string().optional().allow('', null)
        })
    ).min(1).required(),
});

const uploadPaymentProofSchema = Joi.object({
    r2_key: Joi.string().required(),
    filename: Joi.string().required(),
    original_name: Joi.string().required(),
    mime_type: Joi.string().required(),
    size: Joi.number().integer().required(),
    payment_reference: Joi.string().optional().allow('', null),
});

const uploadFileSchema = Joi.object({
    r2_key: Joi.string().required(),
    filename: Joi.string().required(),
    original_name: Joi.string().required(),
    mime_type: Joi.string().required(),
    size: Joi.number().integer().required(),
    entity_type: Joi.string().optional().allow('', null),
    entity_id: Joi.number().integer().optional().allow(null),
});

const cancelOrderSchema = Joi.object({
    reason: Joi.string().optional().allow('', null),
});

const createAddressSchema = Joi.object({
    full_name: Joi.string().min(2).required(),
    phone: Joi.string().required(),
    address_line1: Joi.string().required(),
    address_line2: Joi.string().optional().allow('', null),
    city: Joi.string().required(),
    postal_code: Joi.string().optional().allow('', null),
});

const updateAddressSchema = createAddressSchema;

const updateOrderStatusSchema = Joi.object({
    status: Joi.string().optional(),
    payment_status: Joi.string().optional(),
});

const settingItemSchema = Joi.object({
    key: Joi.string().required(),
    value: Joi.string().allow('', null).optional(),
    type: Joi.string().valid('string', 'number', 'boolean', 'json').optional(),
    group_name: Joi.string().optional(),
});

const updateSettingsSchema = Joi.alternatives().try(
    Joi.array().items(settingItemSchema),
    settingItemSchema
);

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resendVerificationSchema,
    updateProfileSchema,
    changePasswordSchema,
    createCategorySchema,
    updateCategorySchema,
    createProductSchema,
    updateProductSchema,
    createOrderSchema,
    uploadPaymentProofSchema,
    uploadFileSchema,
    cancelOrderSchema,
    createAddressSchema,
    updateAddressSchema,
    updateOrderStatusSchema,
    updateSettingsSchema,
};
