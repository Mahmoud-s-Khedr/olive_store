// Order Detail Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : (localStorage.getItem('lang') || 'ar');
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : (fallback || key);

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

    const token = localStorage.getItem('token');

    // Redirect if not logged in
    if (!token) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }

    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    let orderNumber = urlParams.get('id');
    if (!orderNumber) {
        const parts = window.location.pathname.split('/').filter(Boolean);
        orderNumber = parts[1] || '';
    }
    if (!orderNumber) {
        document.getElementById('loading-state')?.classList.add('hidden');
        document.getElementById('not-found')?.classList.remove('hidden');
        return;
    }

    // Format price
    function formatPrice(price) {
        if (typeof Utils !== 'undefined') {
            return Utils.formatPrice(price, lang);
        }
        return lang === 'ar' ? `${price} ج.م` : `EGP ${price}`;
    }

    // Format date
    function formatDate(dateStr) {
        if (typeof Utils !== 'undefined') {
            return Utils.formatDateTime(dateStr, lang);
        }
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', options);
    }

    // Get status info
    function getStatusInfo(status) {
        const statuses = {
            'pending': { label: t('orders.statuses.pending', 'Pending'), class: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', icon: 'schedule' },
            'processing': { label: t('orders.statuses.processing', 'Processing'), class: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500', icon: 'inventory_2' },
            'shipped': { label: t('orders.statuses.shipped', 'Shipped'), class: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500', icon: 'local_shipping' },
            'delivered': { label: t('orders.statuses.delivered', 'Delivered'), class: 'bg-green-100 text-green-800', dot: 'bg-green-500', icon: 'check_circle' },
            'cancelled': { label: t('orders.statuses.cancelled', 'Cancelled'), class: 'bg-red-100 text-red-800', dot: 'bg-red-500', icon: 'cancel' }
        };
        return statuses[status] || statuses['pending'];
    }

    // Load order
    async function loadOrder() {
        const loadingState = document.getElementById('loading-state');
        const notFound = document.getElementById('not-found');
        const orderContent = document.getElementById('order-content');

        try {
            const response = await fetch(`/api/orders/${orderNumber}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                return;
            }

            if (!response.ok) {
                loadingState.classList.add('hidden');
                notFound.classList.remove('hidden');
                return;
            }

            const data = await response.json();
            const order = data.order || data;
            const items = data.items || order.items || [];

            loadingState.classList.add('hidden');
            orderContent.classList.remove('hidden');

            // Populate order info
            const orderLabel = t('orders.orderNumber', 'Order #');
            document.getElementById('breadcrumb-order').textContent = `${orderLabel} ${order.order_number || order.id}`;
            document.getElementById('order-title').textContent = `${orderLabel} ${order.order_number || order.id}`;
            document.getElementById('order-date').textContent = `${t('orderDetail.dateLabel', 'Order date')}: ${formatDate(order.created_at)}`;

            // Status badge
            const statusInfo = getStatusInfo(order.status);
            document.getElementById('order-status').innerHTML = `
            <span class="w-2 h-2 rounded-full ${statusInfo.dot}"></span>
            ${statusInfo.label}
        `;
            document.getElementById('order-status').className = `inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusInfo.class} text-xs font-bold`;

            // Order items
            const itemsContainer = document.getElementById('order-items');
            if (items.length > 0) {
                itemsContainer.innerHTML = items.map(item => `
                <div class="flex items-center gap-4 p-4">
                    <div class="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                        ${item.product_image ?
                        `<img src="${item.product_image}" alt="${lang === 'ar' ? (item.product_name_ar || t('common.unknown', 'Unknown')) : (item.product_name_en || t('common.unknown', 'Unknown'))}" class="w-full h-full object-cover">` :
                        `<div class="w-full h-full flex items-center justify-center text-olive-light">
                                <span class="material-symbols-outlined text-2xl">inventory_2</span>
                            </div>`
                    }
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-olive-dark truncate">${lang === 'ar' ? (item.product_name_ar || t('common.unknown', 'Unknown')) : (item.product_name_en || t('common.unknown', 'Unknown'))}</h4>
                        <p class="text-sm text-olive-light">${t('cart.quantity', 'Quantity')}: ${lang === 'ar' && typeof Utils !== 'undefined' ? Utils.toArabicNumerals(item.quantity) : item.quantity}</p>
                    </div>
                    <div class="text-left">
                        <p class="font-bold text-primary">${formatPrice(item.price * item.quantity)}</p>
                        <p class="text-xs text-olive-light">${formatPrice(item.price)} × ${lang === 'ar' && typeof Utils !== 'undefined' ? Utils.toArabicNumerals(item.quantity) : item.quantity}</p>
                    </div>
                </div>
            `).join('');
            } else {
                itemsContainer.innerHTML = `<p class="p-4 text-olive-light text-center">${t('orderDetail.noItems', 'No items found')}</p>`;
            }

            // Order summary
            const subtotal = order.subtotal || (order.total - (order.shipping_cost || 0));
            document.getElementById('subtotal').textContent = formatPrice(subtotal);
            document.getElementById('shipping').textContent = formatPrice(order.shipping_cost || 0);
            document.getElementById('total').textContent = formatPrice(order.total);

            if (order.discount && order.discount > 0) {
                document.getElementById('discount-row').classList.remove('hidden');
                document.getElementById('discount').textContent = '-' + formatPrice(order.discount);
            }

            // Payment method
            const paymentMethods = {
                'cod': { icon: 'local_shipping', label: t('paymentMethods.cash_on_delivery', 'Cash on Delivery') },
                'cash_on_delivery': { icon: 'local_shipping', label: t('paymentMethods.cash_on_delivery', 'Cash on Delivery') },
                'card': { icon: 'credit_card', label: t('paymentMethods.card', 'Credit Card') },
                'bank_transfer': { icon: 'account_balance', label: t('paymentMethods.bank_transfer', 'Bank Transfer') }
            };
            const pm = paymentMethods[order.payment_method] || paymentMethods.cod;
            document.getElementById('payment-method').innerHTML = `
            <span class="material-symbols-outlined text-primary text-2xl">${pm.icon}</span>
            <span class="text-olive-dark">${pm.label}</span>
        `;

            // Shipping address
            const address = order.shipping_address || {
                name: order.customer_name,
                address: order.address,
                city: order.city,
                governorate: order.governorate,
                phone: order.phone
            };
            const cityLine = [address.city, address.governorate].filter(Boolean).join(', ');
            document.getElementById('shipping-address').innerHTML = `
            <p class="font-medium">${address.name || ''}</p>
            <p>${address.address || ''}</p>
            <p>${cityLine}</p>
            <p dir="ltr" class="text-olive-light">${address.phone || ''}</p>
        `;

            // Timeline
            const timeline = document.getElementById('order-timeline');
            const timelineSteps = [
                { status: 'pending', title: t('orderDetail.timelineSteps.received', 'Order received'), icon: 'check_circle' },
                { status: 'processing', title: t('orderDetail.timelineSteps.processing', 'Processing'), icon: 'inventory_2' },
                { status: 'shipped', title: t('orderDetail.timelineSteps.shipped', 'Shipped'), icon: 'local_shipping' },
                { status: 'delivered', title: t('orderDetail.timelineSteps.delivered', 'Delivered'), icon: 'check_circle' }
            ];

            const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
            const currentIndex = statusOrder.indexOf(order.status);

            timeline.innerHTML = timelineSteps.map((step, index) => {
                const isActive = index <= currentIndex && order.status !== 'cancelled';
                const isCurrent = index === currentIndex;

                return `
                <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                        <div class="w-10 h-10 rounded-full ${isActive ? 'bg-primary text-white' : 'bg-gray-100 text-olive-light'} flex items-center justify-center">
                            <span class="material-symbols-outlined">${isActive ? 'check' : step.icon}</span>
                        </div>
                        ${index < timelineSteps.length - 1 ? `<div class="w-0.5 h-full ${isActive ? 'bg-primary' : 'bg-gray-200'} my-2"></div>` : ''}
                    </div>
                    <div class="pb-6">
                        <h4 class="font-medium ${isActive ? 'text-olive-dark' : 'text-olive-light'}">${step.title}</h4>
                        ${isCurrent && order.updated_at ? `<p class="text-xs text-olive-light mt-1">${formatDate(order.updated_at)}</p>` : ''}
                    </div>
                </div>
            `;
            }).join('');

        } catch (error) {
            console.error('Error loading order:', error);
            loadingState.classList.add('hidden');
            notFound.classList.remove('hidden');
        }
    }

    // Initialize
    loadOrder();
});
