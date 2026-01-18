document.addEventListener('DOMContentLoaded', function () {
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
    const form = document.getElementById('register-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const togglePassword = document.getElementById('toggle-password');
    const passwordIcon = document.getElementById('password-icon');
    const strengthBars = document.querySelectorAll('.password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');
    const confirmStatus = document.getElementById('confirm-password-status');
    const confirmIcon = document.getElementById('confirm-password-icon');
    const confirmError = document.getElementById('confirm-password-error');
    const registerBtn = document.getElementById('register-btn');
    const registerBtnText = document.getElementById('register-btn-text');
    const registerSpinner = document.getElementById('register-spinner');
    const registerError = document.getElementById('register-error');
    const registerErrorMessage = document.getElementById('register-error-message');
    const registerSuccess = document.getElementById('register-success');

    // Toggle password visibility
    togglePassword?.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        confirmPasswordInput.setAttribute('type', type);
        passwordIcon.textContent = type === 'password' ? 'visibility' : 'visibility_off';
    });

    // Password strength checker
    function checkPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        return strength;
    }

    passwordInput?.addEventListener('input', function () {
        const strength = checkPasswordStrength(this.value);
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
        const texts = [
            t('auth.register.strength.veryWeak', 'ضعيفة جداً'),
            t('auth.register.strength.weak', 'ضعيفة'),
            t('auth.register.strength.medium', 'متوسطة'),
            t('auth.register.strength.strong', 'قوية')
        ];

        strengthBars.forEach((bar, index) => {
            bar.classList.remove('bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500');
            if (index < strength) {
                bar.classList.add(colors[strength - 1]);
            } else {
                bar.classList.add('bg-gray-200');
            }
        });

        if (this.value.length > 0) {
            strengthText.textContent = t('auth.register.passwordStrengthPrefix', 'قوة كلمة المرور: ') + (texts[strength - 1] || texts[0]);
        } else {
            strengthText.textContent = t('auth.register.passwordStrength', 'أدخل كلمة مرور قوية');
        }

        // Also check confirm password match
        checkPasswordMatch();
    });

    // Check password match
    function checkPasswordMatch() {
        if (confirmPasswordInput.value.length === 0) {
            confirmStatus.classList.add('hidden');
            confirmError.classList.add('hidden');
            confirmPasswordInput.classList.remove('border-red-300', 'border-green-300');
            return;
        }

        confirmStatus.classList.remove('hidden');

        if (passwordInput.value === confirmPasswordInput.value) {
            confirmIcon.textContent = 'check_circle';
            confirmIcon.classList.remove('text-red-500');
            confirmIcon.classList.add('text-green-500');
            confirmPasswordInput.classList.remove('border-red-300');
            confirmPasswordInput.classList.add('border-green-300');
            confirmError.classList.add('hidden');
        } else {
            confirmIcon.textContent = 'error';
            confirmIcon.classList.remove('text-green-500');
            confirmIcon.classList.add('text-red-500');
            confirmPasswordInput.classList.remove('border-green-300');
            confirmPasswordInput.classList.add('border-red-300');
            confirmError.classList.remove('hidden');
        }
    }

    confirmPasswordInput?.addEventListener('input', checkPasswordMatch);

    // Form submission
    form?.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validate passwords match
        if (passwordInput.value !== confirmPasswordInput.value) {
            Utils.showError('register-error', t('errors.passwordMismatch', 'كلمتا المرور غير متطابقتين'));
            return;
        }

        // Hide previous messages using Utils
        Utils.hideError('register-error');
        registerSuccess.classList.add('hidden');

        // Show loading state
        registerBtn.disabled = true;
        registerBtnText.textContent = t('auth.register.creating', 'جاري إنشاء الحساب...');
        registerSpinner.classList.remove('hidden');

        const emailValue = document.getElementById('email').value;

        try {
            const phone = document.getElementById('phone').value;
            const formattedPhone = phone.startsWith('0') ? phone : '0' + phone;

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: document.getElementById('name').value,
                    email: emailValue,
                    phone: formattedPhone,
                    password: passwordInput.value
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                registerSuccess.classList.remove('hidden');
                Utils.showToast(t('auth.register.success', 'تم إنشاء الحساب بنجاح!'), 'success');
                form.reset();

                // Redirect to verify email page after delay
                setTimeout(() => {
                    window.location.href = '/verify-email?email=' + encodeURIComponent(emailValue);
                }, 2000);
            } else {
                // Use Utils.parseError for consistent error messages
                const error = new Error(data.message);
                error.status = response.status;
                error.errors = data.errors; // For validation errors
                const errorMsg = Utils.parseError(error, 'ar');
                Utils.showError('register-error', errorMsg);

                // Handle field-level validation errors
                if (data.errors) {
                    Utils.handleValidationErrors(data.errors, 'register-form');
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            const errorMsg = Utils.parseError(error, 'ar');
            Utils.showError('register-error', errorMsg);
        } finally {
            // Reset button state
            registerBtn.disabled = false;
            registerBtnText.textContent = t('auth.register.submit', 'إنشاء الحساب');
            registerSpinner.classList.add('hidden');
        }
    });
});
