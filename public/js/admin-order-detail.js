// Admin Order Detail Page JavaScript
document.addEventListener('DOMContentLoaded', function () {
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
    document.getElementById('logout-btn').addEventListener('click', function () {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
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
        window.location.href = '/admin/login';
        return;
    }

    // Get order ID from URL
    const pathParts = window.location.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1] || new URLSearchParams(window.location.search).get('id');

    if (!orderId) {
        window.location.href = '/admin/orders';
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
                    window.location.href = '/admin/login';
                    return;
                }
                window.location.href = '/admin/orders';
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
                    <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 py-4 px-2 sm:px-4 items-center group hover:bg-gray-50 transition-colors rounded-xl">
                        <div class="sm:col-span-6 flex items-center gap-3">
                            <div class="size-12 sm:size-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                ${item.image || item.product?.image ?
                        `<img src="${item.image || item.product?.image}" alt="" class="w-full h-full object-cover">` :
                        `<div class="w-full h-full flex items-center justify-center text-slate-400">
                                        <span class="material-symbols-outlined">inventory_2</span>
                                    </div>`
                    }
                            </div>
                            <div class="min-w-0">
                                <p class="font-bold text-slate-900 text-sm sm:text-base truncate">${item.name || item.product?.name || 'منتج'}</p>
                                <p class="text-xs text-slate-500 sm:hidden mt-0.5">الكمية: ${toArabicNum(item.quantity)} × ${formatPrice(item.price)}</p>
                            </div>
                        </div>
                        <div class="hidden sm:block sm:col-span-3 text-center font-medium text-slate-700 font-['Work_Sans']">
                            ${toArabicNum(item.quantity)}
                        </div>
                        <div class="sm:col-span-3 flex justify-between sm:justify-end items-center sm:text-left">
                            <span class="text-sm text-slate-500 sm:hidden">الإجمالي:</span>
                            <span class="font-bold text-slate-900 font-['Work_Sans']">${formatPrice(item.price * item.quantity)}</span>
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

            // ... (keep customer info, address, payment rendering)

            // Status Select
            const statusSelect = document.getElementById('status-select');
            if (statusSelect) {
                statusSelect.value = orderData.status;
            }

        } catch (error) {
            console.error('Error loading order:', error);
            // ... (keep error handling)
        }
    }

    // Status update
    const saveStatusBtn = document.getElementById('save-status-btn');
    if (saveStatusBtn) {
        saveStatusBtn.addEventListener('click', async function () {
            const statusSelect = document.getElementById('status-select');
            const newStatus = statusSelect.value;

            if (!newStatus || newStatus === orderData.status) return;

            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>';
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
                    const data = await response.json();
                    alert(data.message || 'حدث خطأ في تحديث حالة الطلب');
                    this.innerHTML = originalText;
                    this.disabled = false;
                }
            } catch (error) {
                console.error('Error updating status:', error);
                alert('حدث خطأ في تحديث حالة الطلب');
                this.innerHTML = originalText;
                this.disabled = false;
            }
        });
    }

    // Initialize
    loadOrder();
});
