// Reset Password Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    const form = document.getElementById('reset-form');
    const tokenInput = document.getElementById('token');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const togglePassword = document.getElementById('toggle-password');
    const passwordIcon = document.getElementById('password-icon');
    const strengthBars = document.querySelectorAll('.password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');
    const confirmError = document.getElementById('confirm-password-error');
    const resetBtn = document.getElementById('reset-btn');
    const resetBtnText = document.getElementById('reset-btn-text');
    const resetSpinner = document.getElementById('reset-spinner');
    const resetError = document.getElementById('reset-error');
    const resetErrorMessage = document.getElementById('reset-error-message');
    const resetSuccess = document.getElementById('reset-success');

    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    tokenInput.value = urlParams.get('token') || '';

    // If no token, show error
    if (!tokenInput.value) {
        showError('رابط إعادة التعيين غير صالح أو منتهي الصلاحية');
        return;
    }

    // Toggle password visibility
    togglePassword?.addEventListener('click', function() {
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

    passwordInput?.addEventListener('input', function() {
        const strength = checkPasswordStrength(this.value);
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
        const texts = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'قوية'];

        strengthBars.forEach((bar, index) => {
            bar.classList.remove('bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500');
            if (index < strength) {
                bar.classList.add(colors[strength - 1]);
            } else {
                bar.classList.add('bg-gray-200');
            }
        });

        if (this.value.length > 0) {
            strengthText.textContent = 'قوة كلمة المرور: ' + (texts[strength - 1] || 'ضعيفة جداً');
        } else {
            strengthText.textContent = 'أدخل كلمة مرور قوية';
        }
    });

    // Check password match
    confirmPasswordInput?.addEventListener('input', function() {
        if (passwordInput.value !== this.value && this.value.length > 0) {
            confirmError.classList.remove('hidden');
            this.classList.add('border-red-300');
        } else {
            confirmError.classList.add('hidden');
            this.classList.remove('border-red-300');
        }
    });

    // Form submission
    form?.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate passwords match
        if (passwordInput.value !== confirmPasswordInput.value) {
            showError('كلمتا المرور غير متطابقتين');
            return;
        }

        // Validate password strength
        const strength = checkPasswordStrength(passwordInput.value);
        if (strength < 2) {
            showError('كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى');
            return;
        }

        // Hide previous messages
        hideError();
        resetSuccess.classList.add('hidden');

        // Show loading state
        resetBtn.disabled = true;
        resetBtnText.textContent = 'جاري الحفظ...';
        resetSpinner.classList.remove('hidden');

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: tokenInput.value,
                    password: passwordInput.value
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                resetSuccess.classList.remove('hidden');
                form.querySelectorAll('input').forEach(input => input.disabled = true);
                resetBtn.classList.add('hidden');
                showToast('تم تغيير كلمة المرور بنجاح!', 'success');

                // Redirect to login after delay
                setTimeout(() => {
                    window.location.href = '/pages/login.html';
                }, 3000);
            } else {
                // Handle error
                const errorMsg = data.message || 'حدث خطأ في إعادة تعيين كلمة المرور';
                showError(errorMsg);
            }
        } catch (error) {
            console.error('Reset password error:', error);
            showError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى');
        } finally {
            // Reset button state
            resetBtn.disabled = false;
            resetBtnText.textContent = 'حفظ كلمة المرور الجديدة';
            resetSpinner.classList.add('hidden');
        }
    });

    // Initialize UI elements
    initializeUI();
}

function showError(message) {
    const resetError = document.getElementById('reset-error');
    const resetErrorMessage = document.getElementById('reset-error-message');

    resetErrorMessage.textContent = message;
    resetError.classList.remove('hidden');
}

function hideError() {
    const resetError = document.getElementById('reset-error');
    resetError.classList.add('hidden');
}

function showToast(message, type = 'info') {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function initializeUI() {
    // Account menu toggle
    const accountBtn = document.getElementById('account-btn');
    const accountMenu = document.getElementById('account-menu');

    if (accountBtn && accountMenu) {
        accountBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            accountMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', function() {
            accountMenu.classList.add('hidden');
        });
    }

    // Update cart badge
    updateCartBadge();
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const badge = document.getElementById('cart-badge');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}