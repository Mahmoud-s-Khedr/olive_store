// Forgot Password Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Account menu toggle
    const accountBtn = document.getElementById('account-btn');
    const accountMenu = document.getElementById('account-menu');

    accountBtn?.addEventListener('click', function(e) {
        e.stopPropagation();
        accountMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', function() {
        accountMenu?.classList.add('hidden');
    });

    const form = document.getElementById('forgot-form');
    const emailInput = document.getElementById('email');
    const forgotBtn = document.getElementById('forgot-btn');
    const forgotBtnText = document.getElementById('forgot-btn-text');
    const forgotSpinner = document.getElementById('forgot-spinner');
    const forgotError = document.getElementById('forgot-error');
    const forgotErrorMessage = document.getElementById('forgot-error-message');
    const forgotSuccess = document.getElementById('forgot-success');

    form?.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Hide previous messages
        forgotError.classList.add('hidden');
        forgotSuccess.classList.add('hidden');

        // Show loading state
        forgotBtn.disabled = true;
        forgotBtnText.textContent = 'جاري الإرسال...';
        forgotSpinner.classList.remove('hidden');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                forgotSuccess.classList.remove('hidden');
                emailInput.disabled = true;
                forgotBtn.classList.add('hidden');
            } else {
                // Show error message
                forgotErrorMessage.textContent = data.message || 'حدث خطأ';
                forgotError.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            forgotErrorMessage.textContent = 'حدث خطأ في الاتصال';
            forgotError.classList.remove('hidden');
        } finally {
            // Reset button state
            forgotBtn.disabled = false;
            forgotBtnText.textContent = 'إرسال رابط إعادة التعيين';
            forgotSpinner.classList.add('hidden');
        }
    });
});