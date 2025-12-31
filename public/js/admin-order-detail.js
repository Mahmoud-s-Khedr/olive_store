// Admin Order Detail Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle functionality
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    function toggleSidebar() {
        const isOpen = !sidebar.classList.contains('translate-x-full');
        if (isOpen) {
            sidebar.classList.add('translate-x-full');
            sidebarOverlay.classList.remove('opacity-50');
            sidebarOverlay.classList.add('opacity-0', 'pointer-events-none');
        } else {
            sidebar.classList.remove('translate-x-full');
            sidebarOverlay.classList.remove('opacity-0', 'pointer-events-none');
            sidebarOverlay.classList.add('opacity-50');
        }
    }

    sidebarToggle.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    // Logout functionality
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('adminToken');
        window.location.href = '/pages/admin-login.html';
    });

    // Language and translation (simplified for static version)
    const lang = 'ar'; // Default to Arabic for admin

    // Convert to Arabic numerals
    function toArabicNum(num) {
        if (lang !== 'ar') return num;
        const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return String(num).split('').map(d => arabicNums[parseInt(d)] || d).join('');
    }

    function formatPrice(price) {
        if (lang !== 'ar') {
            return parseFloat(price || 0).toFixed(2) + ' EGP';
        }
        return toArabicNum(parseFloat(price || 0).toFixed(0)) + ' ج.م';
    }

    function formatDate(dateStr) {
        const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateStr).toLocaleDateString(locale, options);
    }

    function getStatusInfo(status) {
        const statuses = {
            'pending': { label: 'قيد الانتظار', class: 'bg-amber-100 text-amber-800' },
            'processing': { label: 'جاري التجهيز', class: 'bg-blue-100 text-blue-800' },
            'shipped': { label: 'تم الشحن', class: 'bg-purple-100 text-purple-800' },
            'delivered': { label: 'تم التوصيل', class: 'bg-green-100 text-green-800' },
            'cancelled': { label: 'ملغي', class: 'bg-red-100 text-red-800' }
        };
        return statuses[status] || statuses['pending'];
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/pages/admin-login.html';
        return;
    }

    // Get order ID from URL
    const pathParts = window.location.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1] || new URLSearchParams(window.location.search).get('id');

    if (!orderId) {
        window.location.href = '/pages/admin-orders.html';
        return;
    }

    let orderData = null;

    // Load order
    async function loadOrder() {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('adminToken');
                    window.location.href = '/pages/admin-login.html';
                    return;
                }
                window.location.href = '/pages/admin-orders.html';
                return;
            }

            const data = await response.json();
            orderData = data.order || data;

            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('order-content').classList.remove('hidden');

            // Header
            document.getElementById('breadcrumb-order').textContent = `طلب #${orderData.id}`;
            document.getElementById('order-title').textContent = `طلب #${orderData.id}`;

            const statusInfo = getStatusInfo(orderData.status);
            const statusBadge = document.getElementById('order-status');
            statusBadge.textContent = statusInfo.label;
            statusBadge.className = `px-3 py-1 rounded-full text-xs font-medium ${statusInfo.class}`;

            // Items
            const itemsContainer = document.getElementById('order-items');
            if (orderData.items && orderData.items.length > 0) {
                itemsContainer.innerHTML = orderData.items.map(item => `
                    <div class="flex items-center gap-4 p-4">
                        <div class="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            ${item.image || item.product?.image ?
                            `<img src="${item.image || item.product?.image}" alt="" class="w-full h-full object-cover">` :
                            `<div class="w-full h-full flex items-center justify-center text-slate-400">
                                    <span class="material-symbols-outlined">inventory_2</span>
                                </div>`
                        }
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-slate-900">${item.name || item.product?.name || 'منتج'}</p>
                            <p class="text-sm text-slate-500">الكمية: ${toArabicNum(item.quantity)}</p>
                        </div>
                        <div class="text-left">
                            <p class="font-bold text-slate-900">${formatPrice(item.price * item.quantity)}</p>
                            <p class="text-xs text-slate-500">${formatPrice(item.price)} × ${toArabicNum(item.quantity)}</p>
                        </div>
                    </div>
                `).join('');
            } else {
                itemsContainer.innerHTML = '<p class="text-slate-500 text-center py-8">لا توجد منتجات في هذا الطلب</p>';
            }

            // Totals
            const subtotal = orderData.subtotal || (orderData.total - (orderData.shipping_cost || 0));
            document.getElementById('subtotal').textContent = formatPrice(subtotal);
            document.getElementById('shipping').textContent = formatPrice(orderData.shipping_cost || 0);
            document.getElementById('total').textContent = formatPrice(orderData.total);

            // Customer
            const address = orderData.shipping_address || {
                name: orderData.customer_name,
                email: orderData.email,
                phone: orderData.phone,
                address: orderData.address,
                city: orderData.city,
                governorate: orderData.governorate
            };
            const cityLine = [address.city, address.governorate].filter(Boolean).join(', ');
            document.getElementById('customer-info').innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        ${(address.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-medium text-slate-900">${address.name || 'غير معروف'}</p>
                        <p class="text-xs text-slate-500" dir="ltr">${address.email || ''}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <span class="material-symbols-outlined text-slate-400 text-lg">call</span>
                    <span class="text-slate-600" dir="ltr">${address.phone || '-'}</span>
                </div>
            `;

            // Address
            document.getElementById('shipping-address').innerHTML = `
                <p>${address.address || ''}</p>
                <p>${cityLine}</p>
            `;

            // Payment
            const paymentLabels = {
                'cod': 'عند الاستلام',
                'card': 'بطاقة'
            };
            document.getElementById('payment-method').textContent = paymentLabels[orderData.payment_method] || orderData.payment_method;

            const paymentStatusEl = document.getElementById('payment-status');
            if (orderData.payment_method === 'cod') {
                paymentStatusEl.textContent = orderData.status === 'delivered' ? 'مدفوع' : 'عند الاستلام';
                paymentStatusEl.className = `px-2 py-0.5 rounded-full text-xs font-medium ${orderData.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`;
            } else {
                paymentStatusEl.textContent = 'مدفوع';
                paymentStatusEl.className = 'px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';
            }

            // Notes
            if (orderData.notes) {
                document.getElementById('notes-section').classList.remove('hidden');
                document.getElementById('order-notes').textContent = orderData.notes;
            }

            // Timeline
            document.getElementById('order-timeline').innerHTML = `
                <div class="flex gap-3">
                    <div class="w-2 h-2 rounded-full bg-primary mt-2"></div>
                    <div>
                        <p class="text-sm font-medium text-slate-900">تم إنشاء الطلب</p>
                        <p class="text-xs text-slate-500">${formatDate(orderData.created_at)}</p>
                    </div>
                </div>
            `;

            // Highlight current status button
            document.querySelectorAll('.status-btn').forEach(btn => {
                if (btn.dataset.status === orderData.status) {
                    btn.classList.add('ring-2', 'ring-offset-2', 'ring-primary');
                }
            });

        } catch (error) {
            console.error('Error loading order:', error);
            // Show error message
            document.getElementById('loading-state').innerHTML = `
                <div class="text-center">
                    <span class="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
                    <p class="text-red-600 mb-4">حدث خطأ في تحميل الطلب</p>
                    <button onclick="window.location.href='/pages/admin-orders.html'" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                        العودة للطلبات
                    </button>
                </div>
            `;
        }
    }

    // Status update
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const newStatus = this.dataset.status;
            if (newStatus === orderData.status) return;

            // Show loading state
            this.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-current mx-auto"></div>';
            this.disabled = true;

            try {
                const response = await fetch(`/api/admin/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                if (response.ok) {
                    location.reload();
                } else {
                    alert('حدث خطأ في تحديث حالة الطلب');
                    this.innerHTML = this.textContent;
                    this.disabled = false;
                }
            } catch (error) {
                console.error('Error updating status:', error);
                alert('حدث خطأ في تحديث حالة الطلب');
                this.innerHTML = this.textContent;
                this.disabled = false;
            }
        });
    });

    // Initialize
    loadOrder();
});