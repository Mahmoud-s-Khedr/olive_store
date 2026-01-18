// My Orders Page JavaScript
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
        window.location.href = '/login?redirect=/my-orders';
        return;
    }

    let currentPage = 1;

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
            return Utils.formatDate(dateStr, lang);
        }
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', options);
    }

    // Get status badge
    function getStatusBadge(status) {
        const statusKeys = {
            'pending': { label: t('orders.statuses.pending', 'Pending'), class: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
            'processing': { label: t('orders.statuses.processing', 'Processing'), class: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
            'shipped': { label: t('orders.statuses.shipped', 'Shipped'), class: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
            'delivered': { label: t('orders.statuses.delivered', 'Delivered'), class: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
            'cancelled': { label: t('orders.statuses.cancelled', 'Cancelled'), class: 'bg-red-100 text-red-800', dot: 'bg-red-500' }
        };
        const s = statusKeys[status] || statusKeys.pending;
        return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${s.class} text-xs font-bold">
        <span class="w-2 h-2 rounded-full ${s.dot}"></span>
        ${s.label}
    </span>`;
    }

    // Load orders
    async function loadOrders() {
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const ordersList = document.getElementById('orders-list');

        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        ordersList.classList.add('hidden');

        try {
            const response = await fetch(`/api/orders?page=${currentPage}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login?redirect=/my-orders';
                return;
            }

            const data = await response.json();

            loadingState.classList.add('hidden');

            if (!response.ok || !data.orders || data.orders.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }

            ordersList.classList.remove('hidden');

            ordersList.innerHTML = data.orders.map(order => {
                const orderNumber = order.order_number || order.id;
                const orderLabel = t('orders.orderNumber', 'Order #');
                return `
            <a href="/order/${orderNumber}" class="block bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all p-4 md:p-6">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary">shopping_bag</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <h3 class="font-bold text-olive-dark">${orderLabel} ${orderNumber}</h3>
                                ${getStatusBadge(order.status)}
                            </div>
                            <p class="text-sm text-olive-light mt-1">${formatDate(order.created_at)}</p>
                        </div>
                    </div>
                    <div class="text-left md:text-right">
                        <p class="text-lg font-bold text-primary">${formatPrice(order.total)}</p>
                    </div>
                </div>
                <div class="flex items-center justify-end">
                    <span class="text-primary text-sm font-medium flex items-center gap-1">
                        ${t('orders.viewDetails', 'View Details')}
                        <span class="material-symbols-outlined text-sm rtl:rotate-180">arrow_back</span>
                    </span>
                </div>
            </a>
        `;
            }).join('');

            // Update pagination
            if (data.pagination && data.pagination.totalPages > 1) {
                document.getElementById('pagination').classList.remove('hidden');
                // TODO: Implement pagination
            }

        } catch (error) {
            console.error('Error loading orders:', error);
            loadingState.classList.add('hidden');
            emptyState.classList.remove('hidden');
        }
    }

    // Initialize
    loadOrders();
});
