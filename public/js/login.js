// Login page JavaScript
document.addEventListener('DOMContentLoaded', function () {
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const passwordIcon = document.getElementById('password-icon');
    const loginBtn = document.getElementById('login-btn');
    const loginBtnText = document.getElementById('login-btn-text');
    const loginBtnIcon = document.getElementById('login-btn-icon');
    const loginSpinner = document.getElementById('login-spinner');
    const loginError = document.getElementById('login-error');
    const loginErrorMessage = document.getElementById('login-error-message');

    // Toggle password visibility
    togglePassword?.addEventListener('click', function (e) {
        e.preventDefault();
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordIcon.textContent = type === 'password' ? 'visibility' : 'visibility_off';
        passwordInput.focus();
    });

    // Form submission
    form?.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Hide previous errors
        if (typeof Utils !== 'undefined') {
            Utils.hideError('login-error');
        }

        // Show loading state
        loginBtn.disabled = true;
        loginBtnText.textContent = t('auth.login.loggingIn', 'جاري الدخول...');
        loginBtnIcon.classList.add('hidden');
        loginSpinner.classList.remove('hidden');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passwordInput.value
                })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // Store token
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Show success message
                if (typeof Utils !== 'undefined') {
                    Utils.showToast(t('auth.login.success', 'تم تسجيل الدخول بنجاح'), 'success');
                }

                // Redirect
                const redirect = new URLSearchParams(window.location.search).get('redirect') || '/';
                setTimeout(() => {
                    window.location.href = redirect;
                }, 500);
            } else {
                // Create error object with status for parseError
                const error = new Error(data.message);
                error.status = response.status;
                const errorMsg = Utils.parseError(error, lang);
                if (typeof Utils !== 'undefined') {
                    Utils.showError('login-error', errorMsg);
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMsg = Utils.parseError(error, lang);
            if (typeof Utils !== 'undefined') {
                Utils.showError('login-error', errorMsg);
            }
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            loginBtnText.textContent = t('auth.login.submit', 'دخول');
            loginBtnIcon.classList.remove('hidden');
            loginSpinner.classList.add('hidden');
        }
    });
});