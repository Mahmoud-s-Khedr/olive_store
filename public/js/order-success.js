// Order Success Page JavaScript
const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : (localStorage.getItem('lang') || 'ar');
const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : (fallback || key);

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Get order ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');

    if (orderId) {
        loadOrderDetails(orderId);
    } else {
        // Try to get from localStorage (last order)
        const lastOrder = localStorage.getItem('lastOrder');
        if (lastOrder) {
            const orderData = JSON.parse(lastOrder);
            displayOrderDetails(orderData);
        } else {
            showError(t('orderSuccess.notFound', 'Order details not found'));
        }
    }

    // Initialize UI elements
    initializeUI();
}

function loadOrderDetails(orderId) {
    const token = localStorage.getItem('authToken');

    fetch(`/api/orders/${orderId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(t('orderSuccess.loadError', 'Failed to load order details'));
        }
        return response.json();
    })
    .then(data => {
        displayOrderDetails(data);
        // Store in localStorage for future reference
        localStorage.setItem('lastOrder', JSON.stringify(data));
    })
    .catch(error => {
        console.error('Error loading order details:', error);
        showError(t('orderSuccess.loadError', 'Failed to load order details'));
    });
}

function displayOrderDetails(order) {
    // Update order number
    const orderNumberElement = document.getElementById('order-number');
    if (orderNumberElement) {
        orderNumberElement.textContent = `#${order.id}`;
    }

    // Update order date
    const orderDateElement = document.getElementById('order-date');
    if (orderDateElement && order.created_at) {
        const date = new Date(order.created_at);
        orderDateElement.textContent = formatDate(date, lang);
    }

    // Update payment method
    const paymentMethodElement = document.getElementById('payment-method');
    if (paymentMethodElement && order.payment_method) {
        paymentMethodElement.textContent = getPaymentMethodText(order.payment_method, t);
    }
}

function formatDate(date, lang) {
    if (typeof Utils !== 'undefined') {
        return Utils.formatDateTime(date, lang);
    }
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', options);
}

function getPaymentMethodText(method, t) {
    const methods = {
        'cash_on_delivery': t('paymentMethods.cash_on_delivery', 'Cash on Delivery'),
        'card': t('paymentMethods.card', 'Credit Card'),
        'bank_transfer': t('paymentMethods.bank_transfer', 'Bank Transfer')
    };

    return methods[method] || method;
}

function showError(message) {
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6';
    errorDiv.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="material-symbols-outlined">error</span>
            <span>${message}</span>
        </div>
    `;

    // Insert before the main content
    const main = document.querySelector('main');
    main.insertBefore(errorDiv, main.firstChild);
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

        // Close menu when clicking outside
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

// Utility function to format numbers in Arabic
function formatArabicNumber(num) {
    return num.toLocaleString('ar-EG');
}

// Success animation
function playSuccessAnimation() {
    const checkIcon = document.querySelector('.success-icon');
    if (checkIcon) {
        checkIcon.style.animation = 'bounce 0.6s ease-in-out';
    }
}

// Call success animation when page loads
playSuccessAnimation();
