// Email Verification Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    // Get token and email from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');

    // Initialize UI elements
    initializeUI();

    // If token exists, verify it
    if (token) {
        verifyEmail(token);
    } else {
        // Show pending state and display email if available
        showPendingState();
        if (email) {
            displayEmail(email);
        }
    }

    // Setup resend functionality
    setupResendButtons(email);
}

function verifyEmail(token) {
    // Show loading state
    showLoadingState();

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessState();
        } else {
            showErrorState(data.message || 'فشل في تأكيد البريد الإلكتروني');
        }
    })
    .catch(error => {
        console.error('Verification error:', error);
        showErrorState('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى');
    });
}

function showPendingState() {
    document.getElementById('verify-pending').classList.remove('hidden');
    document.getElementById('verify-success').classList.add('hidden');
    document.getElementById('verify-error').classList.add('hidden');
}

function showSuccessState() {
    document.getElementById('verify-pending').classList.add('hidden');
    document.getElementById('verify-success').classList.remove('hidden');
    document.getElementById('verify-error').classList.add('hidden');
}

function showErrorState(message = 'الرابط غير صالح أو منتهي الصلاحية. حاول طلب رابط جديد.') {
    document.getElementById('verify-pending').classList.add('hidden');
    document.getElementById('verify-success').classList.add('hidden');
    document.getElementById('verify-error').classList.remove('hidden');

    const errorMessageEl = document.getElementById('error-message');
    if (errorMessageEl) {
        errorMessageEl.textContent = message;
    }
}

function showLoadingState() {
    // Could add a loading spinner here if needed
    showPendingState();
}

function displayEmail(email) {
    const emailDisplay = document.getElementById('email-display');
    const userEmail = document.getElementById('user-email');

    if (emailDisplay && userEmail) {
        userEmail.textContent = email;
        emailDisplay.classList.remove('hidden');
    }
}

function setupResendButtons(email) {
    const resendBtn = document.getElementById('resend-btn');
    const resendBtnError = document.getElementById('resend-btn-error');

    const handleResend = () => {
        resendVerification(email);
    };

    if (resendBtn) {
        resendBtn.addEventListener('click', handleResend);
    }

    if (resendBtnError) {
        resendBtnError.addEventListener('click', handleResend);
    }
}

async function resendVerification(email) {
    if (!email) {
        showResendError('البريد الإلكتروني غير متوفر');
        return;
    }

    // Hide previous messages
    hideResendMessages();

    // Show loading
    const resendBtn = document.getElementById('resend-btn') || document.getElementById('resend-btn-error');
    const resendBtnText = document.getElementById('resend-btn-text');
    const resendSpinner = document.getElementById('resend-spinner');

    if (resendBtn) {
        resendBtn.disabled = true;
        if (resendBtnText) resendBtnText.textContent = 'جاري الإرسال...';
        if (resendSpinner) resendSpinner.classList.remove('hidden');
    }

    try {
        const response = await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            // Show success
            showResendSuccess();
            showToast('تم إرسال رسالة جديدة بنجاح!', 'success');
        } else {
            // Handle error
            const errorMsg = data.message || 'حدث خطأ في إرسال الرسالة';
            showResendError(errorMsg);
            showToast(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Resend error:', error);
        const errorMsg = 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى';
        showResendError(errorMsg);
        showToast(errorMsg, 'error');
    } finally {
        // Reset button state
        if (resendBtn) {
            resendBtn.disabled = false;
            if (resendBtnText) resendBtnText.textContent = 'إعادة إرسال رسالة التأكيد';
            if (resendSpinner) resendSpinner.classList.add('hidden');
        }
    }
}

function showResendSuccess() {
    const successEl = document.getElementById('resend-success');
    if (successEl) {
        successEl.classList.remove('hidden');
    }
}

function showResendError(message) {
    const errorEl = document.getElementById('resend-error');
    const errorMessageEl = document.getElementById('resend-error-message');

    if (errorEl) {
        errorEl.classList.remove('hidden');
    }

    if (errorMessageEl) {
        errorMessageEl.textContent = message;
    }
}

function hideResendMessages() {
    const successEl = document.getElementById('resend-success');
    const errorEl = document.getElementById('resend-error');

    if (successEl) successEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');
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