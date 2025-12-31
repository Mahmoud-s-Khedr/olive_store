// Order Detail Page JavaScript
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

    const token = localStorage.getItem('token');

    // Redirect if not logged in
    if (!token) {
        window.location.href = '/pages/login.html?redirect=' + window.location.pathname;
        return;
    }

    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('id');

    // Convert to Arabic numerals
    function toArabicNum(num) {
        const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return String(num).split('').map(d => arabicNums[parseInt(d)] || d).join('');
    }

    // Format price
    function formatPrice(price) {
        return toArabicNum(parseFloat(price).toFixed(0)) + ' ج.م';
    }

    // Format date
    function formatDate(dateStr) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateStr).toLocaleDateString('ar-EG', options);
    }

    // Get status info
    function getStatusInfo(status) {
        const statuses = {
            'pending': { label: 'قيد الانتظار', class: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', icon: 'schedule' },
            'processing': { label: 'جاري التجهيز', class: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500', icon: 'inventory_2' },
            'shipped': { label: 'تم الشحن', class: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500', icon: 'local_shipping' },
            'delivered': { label: 'تم التوصيل', class: 'bg-green-100 text-green-800', dot: 'bg-green-500', icon: 'check_circle' },
            'cancelled': { label: 'ملغي', class: 'bg-red-100 text-red-800', dot: 'bg-red-500', icon: 'cancel' }
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
                window.location.href = '/pages/login.html?redirect=' + window.location.pathname;
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
            document.getElementById('breadcrumb-order').textContent = `طلب #${order.order_number || order.id}`;
            document.getElementById('order-title').textContent = `طلب #${order.order_number || order.id}`;
            document.getElementById('order-date').textContent = `تاريخ الطلب: ${formatDate(order.created_at)}`;

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
                        `<img src="${item.product_image}" alt="${item.product_name_ar || item.product_name_en || 'منتج'}" class="w-full h-full object-cover">` :
                        `<div class="w-full h-full flex items-center justify-center text-olive-light">
                                <span class="material-symbols-outlined text-2xl">inventory_2</span>
                            </div>`
                    }
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-olive-dark truncate">${item.product_name_ar || item.product_name_en || 'منتج'}</h4>
                        <p class="text-sm text-olive-light">الكمية: ${toArabicNum(item.quantity)}</p>
                    </div>
                    <div class="text-left">
                        <p class="font-bold text-primary">${formatPrice(item.price * item.quantity)}</p>
                        <p class="text-xs text-olive-light">${formatPrice(item.price)} × ${toArabicNum(item.quantity)}</p>
                    </div>
                </div>
            `).join('');
            } else {
                itemsContainer.innerHTML = '<p class="p-4 text-olive-light text-center">لا توجد منتجات</p>';
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
                'cod': { icon: 'local_shipping', label: 'الدفع عند الاستلام' },
                'card': { icon: 'credit_card', label: 'بطاقة ائتمان' }
            };
            const pm = paymentMethods[order.payment_method] || paymentMethods['cod'];
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
                { status: 'pending', title: 'تم استلام الطلب', icon: 'check_circle' },
                { status: 'processing', title: 'جاري التجهيز', icon: 'inventory_2' },
                { status: 'shipped', title: 'تم الشحن', icon: 'local_shipping' },
                { status: 'delivered', title: 'تم التوصيل', icon: 'check_circle' }
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