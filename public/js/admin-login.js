/**
 * Admin Login Page JavaScript
 * Uses AuthModule for authentication
 */
document.addEventListener('DOMContentLoaded', function () {
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

    // Check if already logged in
    if (AuthModule.isAdminLoggedIn()) {
        window.location.href = '/pages/admin-dashboard.html';
        return;
    }

    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const loginBtn = document.getElementById('login-btn');
    const loginBtnText = document.getElementById('login-btn-text');
    const loginBtnIcon = document.getElementById('login-btn-icon');
    const loginBtnSpinner = document.getElementById('login-btn-spinner');

    // Toggle password visibility
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const icon = this.querySelector('span');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                if (icon) icon.textContent = 'visibility_off';
            } else {
                passwordInput.type = 'password';
                if (icon) icon.textContent = 'visibility';
            }

            passwordInput.focus();
        });
    }

    // Form validation
    function validateForm() {
        let isValid = true;
        Utils.clearAllFieldErrors('login-form');

        if (!emailInput.value.trim()) {
            Utils.showFieldError('email', t('validation.required', 'هذا الحقل مطلوب'));
            isValid = false;
        } else if (!Utils.isValidEmail(emailInput.value.trim())) {
            Utils.showFieldError('email', t('validation.email', 'البريد الإلكتروني غير صحيح'));
            isValid = false;
        }

        if (!passwordInput.value.trim()) {
            Utils.showFieldError('password', t('validation.required', 'هذا الحقل مطلوب'));
            isValid = false;
        }

        return isValid;
    }

    // Set loading state
    function setLoading(loading) {
        if (loginBtn) loginBtn.disabled = loading;
        if (loginBtnText) loginBtnText.textContent = loading ? t('auth.login.loggingIn', 'جاري الدخول...') : t('auth.login.submit', 'دخول');
        if (loginBtnIcon) loginBtnIcon.classList.toggle('hidden', loading);
        if (loginBtnSpinner) loginBtnSpinner.classList.toggle('hidden', !loading);
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Client-side validation
            if (!validateForm()) {
                return;
            }

            // Hide previous errors
            Utils.hideError('admin-login-error');

            // Show loading state
            setLoading(true);

            try {
                // Use AuthModule for admin login
                await AuthModule.adminLogin(emailInput.value.trim(), passwordInput.value);

                // Show success message
                Utils.showToast(t('auth.login.success', 'تم تسجيل الدخول بنجاح'), 'success');

                // Redirect to admin dashboard
                setTimeout(() => {
                    window.location.href = '/pages/admin-dashboard.html';
                }, 500);

            } catch (error) {
                console.error('Admin login error:', error);
                const errorMsg = Utils.parseError(error, lang);
                Utils.showError('admin-login-error', errorMsg);

                // Reset button state on error
                setLoading(false);
            }
        });
    }
});