const express = require('express');

const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resendVerificationSchema,
    updateProfileSchema,
    changePasswordSchema,
} = require('../utils/validationSchemas');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(authController.resetPassword));
router.get('/verify-email/:token', asyncHandler(authController.verifyEmail));
router.post('/resend-verification', validate(resendVerificationSchema), asyncHandler(authController.resendVerification));
router.get('/me', auth, asyncHandler(authController.me));
router.put('/profile', auth, validate(updateProfileSchema), asyncHandler(authController.updateProfile));
router.put('/password', auth, validate(changePasswordSchema), asyncHandler(authController.changePassword));

module.exports = router;
