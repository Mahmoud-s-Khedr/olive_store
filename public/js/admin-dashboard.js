/**
 * Admin Dashboard JavaScript
 * Uses Api module for backend integration
 */

document.addEventListener('DOMContentLoaded', function () {
    // Check admin authentication
    if (!AuthModule.requireAdminAuth()) {
        return;
    }

    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

    loadDashboardStats();
    loadRecentOrders();
});

async function loadDashboardStats() {
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

    try {
        const stats = await Api.admin.dashboard.getStats();

        // Update stat cards
        const totalSalesEl = document.getElementById('total-sales');
        const totalOrdersEl = document.getElementById('total-orders');
        const totalCustomersEl = document.getElementById('total-customers');
        const totalProductsEl = document.getElementById('total-products');

        if (totalSalesEl) {
            const salesValue = stats.total_revenue || stats.totalSales || 0;
            totalSalesEl.textContent = Utils.formatPrice(salesValue, lang);
        }
        if (totalOrdersEl) {
            totalOrdersEl.textContent = stats.total_orders || stats.totalOrders || 0;
        }
        if (totalCustomersEl) {
            totalCustomersEl.textContent = stats.total_customers || stats.totalCustomers || 0;
        }
        if (totalProductsEl) {
            totalProductsEl.textContent = stats.total_products || stats.totalProducts || 0;
        }

        // Update order status counts if available
        if (stats.orders_by_status) {
            updateOrderStatusCounts(stats.orders_by_status);
        }

        // Show low stock alerts if available
        if (stats.low_stock_products && stats.low_stock_products.length > 0) {
            showLowStockAlert(stats.low_stock_products);
        }

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        Utils.showToast(t('errors.loadFailed', 'خطأ في تحميل الإحصائيات'), 'error');
    }
}

function updateOrderStatusCounts(ordersByStatus) {
    const pendingEl = document.getElementById('pending-orders-count');
    const processingEl = document.getElementById('processing-orders-count');
    const shippedEl = document.getElementById('shipped-orders-count');
    const deliveredEl = document.getElementById('delivered-orders-count');

    if (pendingEl) pendingEl.textContent = ordersByStatus.pending || 0;
    if (processingEl) processingEl.textContent = ordersByStatus.processing || 0;
    if (shippedEl) shippedEl.textContent = ordersByStatus.shipped || 0;
    if (deliveredEl) deliveredEl.textContent = ordersByStatus.delivered || 0;
}

function showLowStockAlert(products) {
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
    const alertContainer = document.getElementById('low-stock-alert');

    if (alertContainer && products.length > 0) {
        alertContainer.innerHTML = `
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <span class="material-symbols-outlined text-amber-600">warning</span>
                    <div>
                        <h4 class="font-bold text-amber-800">${t('admin.dashboard.lowStock', 'تنبيه المخزون المنخفض')}</h4>
                        <p class="text-sm text-amber-700 mt-1">${products.length} ${t('admin.dashboard.productsLowStock', 'منتجات بحاجة لإعادة التخزين')}</p>
                    </div>
                </div>
            </div>
        `;
        alertContainer.classList.remove('hidden');
    }
}

async function loadRecentOrders() {
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

    try {
        const data = await Api.admin.orders.list({ limit: 5 });
        const orders = data.orders || data.data || [];
        const tableContainer = document.getElementById('recent-orders');
        const mobileContainer = document.getElementById('recent-orders-mobile');

        if (orders.length === 0) {
            const emptyMsg = `<p class="p-4 text-slate-500 text-sm text-center">${t('admin.dashboard.noRecentOrders', 'لا توجد طلبات حديثة')}</p>`;
            if (tableContainer) tableContainer.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">${t('admin.dashboard.noRecentOrders', 'لا توجد طلبات حديثة')}</td></tr>`;
            if (mobileContainer) mobileContainer.innerHTML = emptyMsg;
            return;
        }

        // Render desktop table rows
        if (tableContainer) {
            tableContainer.innerHTML = orders.map(order => {
                const statusClass = getStatusClass(order.status);
                const statusText = getStatusText(order.status, t);
                return `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-4 lg:px-6 py-3">
                            <span class="font-bold text-slate-900">#${order.order_number || order.id}</span>
                        </td>
                        <td class="px-4 lg:px-6 py-3 text-slate-700">${order.customer_name || t('admin.dashboard.unknownCustomer', 'عميل غير معروف')}</td>
                        <td class="px-4 lg:px-6 py-3 hidden md:table-cell">
                            <span class="px-2 py-1 rounded-full text-xs font-bold ${statusClass}">${statusText}</span>
                        </td>
                        <td class="px-4 lg:px-6 py-3 font-bold text-slate-900">${Utils.formatPrice(order.total, lang)}</td>
                    </tr>
                `;
            }).join('');
        }

        // Render mobile cards
        if (mobileContainer) {
            mobileContainer.innerHTML = orders.map(order => {
                const statusClass = getStatusClass(order.status);
                const statusText = getStatusText(order.status, t);
                return `
                    <div class="p-3 hover:bg-gray-50 transition-colors">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span class="text-primary font-bold text-xs">${(order.customer_name || '?').charAt(0)}</span>
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-slate-900">${order.customer_name || t('admin.dashboard.unknownCustomer', 'عميل غير معروف')}</p>
                                    <p class="text-xs text-slate-500">#${order.order_number || order.id}</p>
                                </div>
                            </div>
                            <div class="text-left">
                                <p class="text-sm font-bold text-slate-900">${Utils.formatPrice(order.total, lang)}</p>
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">${statusText}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading recent orders:', error);
        const tableContainer = document.getElementById('recent-orders');
        const mobileContainer = document.getElementById('recent-orders-mobile');
        const errorMsg = t('errors.loadFailed', 'خطأ في تحميل الطلبات');
        if (tableContainer) tableContainer.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">${errorMsg}</td></tr>`;
        if (mobileContainer) mobileContainer.innerHTML = `<p class="p-4 text-red-500 text-sm">${errorMsg}</p>`;
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'processing': return 'bg-blue-100 text-blue-800';
        case 'shipped': return 'bg-purple-100 text-purple-800';
        case 'delivered': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusText(status, t) {
    switch (status) {
        case 'pending': return t('admin.orders.status.pending', 'قيد الانتظار');
        case 'processing': return t('admin.orders.status.processing', 'قيد التجهيز');
        case 'shipped': return t('admin.orders.status.shipped', 'تم الشحن');
        case 'delivered': return t('admin.orders.status.delivered', 'تم التسليم');
        case 'cancelled': return t('admin.orders.status.cancelled', 'ملغي');
        default: return status || t('admin.orders.status.unknown', 'غير معروف');
    }
}

function toggleMobileSidebar() {
    const sidebar = document.querySelector('aside');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

function logout() {
    AuthModule.adminLogout();
}