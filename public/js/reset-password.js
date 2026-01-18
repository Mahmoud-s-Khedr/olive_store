// Reset Password Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : (fallback || key);

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
        showError(t('errors.tokenInvalid', 'Invalid or expired link'));
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
        const texts = [
            t('auth.register.strength.veryWeak', 'Very Weak'),
            t('auth.register.strength.weak', 'Weak'),
            t('auth.register.strength.medium', 'Medium'),
            t('auth.register.strength.strong', 'Strong')
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
            strengthText.textContent = t('auth.register.passwordStrengthPrefix', 'Password strength: ') + (texts[strength - 1] || texts[0]);
        } else {
            strengthText.textContent = t('auth.register.passwordStrength', 'Enter a strong password');
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
            showError(t('errors.passwordMismatch', 'Passwords do not match'));
            return;
        }

        // Validate password strength
        const strength = checkPasswordStrength(passwordInput.value);
        if (strength < 2) {
            showError(t('errors.passwordWeak', 'Password is too weak'));
            return;
        }

        // Hide previous messages
        hideError();
        resetSuccess.classList.add('hidden');

        // Show loading state
        resetBtn.disabled = true;
        resetBtnText.textContent = t('common.saving', 'Saving...');
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
                showToast(t('auth.reset.successTitle', 'Password changed successfully!'), 'success');

                // Redirect to login after delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else {
                // Handle error
                const errorMsg = data.message || t('auth.reset.error', 'Failed to reset password');
                showError(errorMsg);
            }
        } catch (error) {
            console.error('Reset password error:', error);
            showError(t('errors.network', 'Connection error. Please try again.'));
        } finally {
            // Reset button state
            resetBtn.disabled = false;
            resetBtnText.textContent = t('auth.reset.submit', 'Change Password');
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
