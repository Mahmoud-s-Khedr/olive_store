// Admin login page JavaScript
document.addEventListener('DOMContentLoaded', function () {
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

    const form = document.querySelector('form'); // Assuming the form is the only form on the page
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('button[type="button"]'); // The toggle button
    const passwordIcon = togglePassword ? togglePassword.querySelector('span') : null;
    const loginBtn = document.querySelector('button[type="submit"]'); // The submit button
    const loginBtnText = loginBtn ? loginBtn.querySelector('span:first-child') : null;
    const loginBtnIcon = loginBtn ? loginBtn.querySelector('span:last-child') : null;
    // Assuming no spinner in HTML, but can add if needed
    const loginError = document.createElement('div'); // Or find an existing error div
    loginError.id = 'admin-login-error';
    loginError.className = 'hidden'; // Assuming CSS class for hidden
    form.appendChild(loginError); // Append to form or appropriate place

    // Toggle password visibility
    togglePassword?.addEventListener('click', function (e) {
        e.preventDefault();
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        if (passwordIcon) {
            passwordIcon.textContent = type === 'password' ? 'visibility_off' : 'visibility';
        }
        passwordInput.focus();
    });

    // Form validation
    function validateForm() {
        let isValid = true;
        if (!emailInput.value.trim()) {
            isValid = false;
            // Show error for email
        }
        if (!passwordInput.value.trim()) {
            isValid = false;
            // Show error for password
        }
        return isValid;
    }

    // Form submission
    form?.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Client-side validation
        if (!validateForm()) {
            if (typeof Utils !== 'undefined') {
                Utils.showError('admin-login-error', t('auth.login.fillFields', 'يرجى ملء جميع الحقول'));
            }
            return;
        }

        // Hide previous errors
        if (typeof Utils !== 'undefined') {
            Utils.hideError('admin-login-error');
        }

        // Show loading state
        if (loginBtn) {
            loginBtn.disabled = true;
            if (loginBtnText) loginBtnText.textContent = t('auth.login.loggingIn', 'جاري الدخول...');
            if (loginBtnIcon) loginBtnIcon.classList.add('hidden');
            // Add spinner if needed
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value.trim(),
                    password: passwordInput.value
                })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // Check if user is admin
                if (!data.user.is_admin) {
                    throw new Error(t('auth.login.notAdmin', 'غير مصرح لك بالدخول كمسؤول'));
                }

                // Store token
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Show success message
                if (typeof Utils !== 'undefined') {
                    Utils.showToast(t('auth.login.success', 'تم تسجيل الدخول بنجاح'), 'success');
                }

                // Redirect to admin dashboard
                setTimeout(() => {
                    window.location.href = '/admin';
                }, 500);
            } else {
                // Create error object with status for parseError
                const error = new Error(data.message);
                error.status = response.status;
                const errorMsg = Utils.parseError(error, lang);
                if (typeof Utils !== 'undefined') {
                    Utils.showError('admin-login-error', errorMsg);
                }
            }
        } catch (error) {
            console.error('Admin login error:', error);
            const errorMsg = Utils.parseError(error, lang);
            if (typeof Utils !== 'undefined') {
                Utils.showError('admin-login-error', errorMsg);
            }
        } finally {
            // Reset button state
            if (loginBtn) {
                loginBtn.disabled = false;
                if (loginBtnText) loginBtnText.textContent = t('auth.login.submit', 'دخول');
                if (loginBtnIcon) loginBtnIcon.classList.remove('hidden');
                // Hide spinner
            }
        }
    });
});