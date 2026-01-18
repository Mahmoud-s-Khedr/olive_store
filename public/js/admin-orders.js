/**
 * Admin Orders JavaScript
 * Uses Api module for backend integration
 */

let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let currentPaymentStatus = '';
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function () {
    // Check admin authentication
    if (!AuthModule.requireAdminAuth()) {
        return;
    }

    loadOrders();

    // Event listeners
    const searchInput = document.getElementById('search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const statusFilter = document.getElementById('status-filter');
    const paymentStatusFilter = document.getElementById('payment-status-filter');
    const exportBtn = document.getElementById('export-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const logoutBtn = document.getElementById('logout-btn');
    const closeOrderModal = document.getElementById('close-order-modal');

    if (searchInput) searchInput.addEventListener('input', Utils.debounce(handleSearch, 300));
    if (mobileSearchInput) mobileSearchInput.addEventListener('input', Utils.debounce(handleMobileSearch, 300));
    if (statusFilter) statusFilter.addEventListener('change', handleFilter);
    if (paymentStatusFilter) paymentStatusFilter.addEventListener('change', handleFilter);
    if (exportBtn) exportBtn.addEventListener('click', handleExport);
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (closeOrderModal) closeOrderModal.addEventListener('click', closeOrderModalFn);

    // Status tab buttons
    document.querySelectorAll('.status-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active', 'bg-primary', 'text-white'));
            tab.classList.add('active', 'bg-primary', 'text-white');
            currentStatus = tab.dataset.status || '';
            currentPage = 1;
            loadOrders();
        });
    });
});

const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

async function loadOrders() {
    try {
        const params = {
            page: currentPage,
            limit: 10
        };
        if (currentSearch) params.search = currentSearch;
        if (currentStatus) params.status = currentStatus;
        if (currentPaymentStatus) params.payment_status = currentPaymentStatus;

        const data = await Api.admin.orders.list(params);
        const orders = data.orders || data.data || [];
        const total = data.total || data.pagination?.total || orders.length;

        totalPages = Math.ceil(total / 10);
        renderOrders(orders);
        renderPagination(total, data.page || currentPage);
    } catch (error) {
        console.error('Error loading orders:', error);
        const tbody = document.getElementById('orders-tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">${t('errors.loadFailed', 'خطأ في تحميل الطلبات')}</td></tr>`;
        }
    }
}

function renderOrders(orders) {
    const tbody = document.getElementById('orders-tbody');
    const cardsContainer = document.getElementById('orders-cards');
    const emptyState = document.getElementById('empty-state');

    if (tbody) tbody.innerHTML = '';
    if (cardsContainer) cardsContainer.innerHTML = '';

    if (orders.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        const emptyMsg = `<div class="p-8 text-center text-slate-500">${t('admin.orders.noOrders', 'لا توجد طلبات')}</div>`;
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">${t('admin.orders.noOrders', 'لا توجد طلبات')}</td></tr>`;
        if (cardsContainer) cardsContainer.innerHTML = emptyMsg;
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    orders.forEach(order => {
        // Desktop table row
        if (tbody) {
            const row = createOrderRow(order);
            tbody.appendChild(row);
        }
        // Mobile card
        if (cardsContainer) {
            const card = createOrderCard(order);
            cardsContainer.appendChild(card);
        }
    });
}

function createOrderRow(order) {
    const tr = document.createElement('tr');
    tr.className = 'group hover:bg-primary/5 transition-colors';

    const statusConfig = getStatusConfig(order.status);
    const paymentConfig = getPaymentStatusConfig(order.payment_status);

    tr.innerHTML = `
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-bold text-text-main">#${order.order_number || order.id}</div>
        </td>
        <td class="px-4 lg:px-6 py-4">
            <div class="flex flex-col">
                <span class="text-sm font-medium text-text-main">${order.customer_name || t('admin.orders.unknownCustomer', 'عميل غير معروف')}</span>
                <span class="text-xs text-text-secondary">${order.email || order.phone || ''}</span>
            </div>
        </td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-text-secondary hidden md:table-cell">${Utils.formatDateTime(order.created_at, lang)}</td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-bold text-text-main font-['Work_Sans']">${Utils.formatPrice(order.total, lang)}</td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
            <div class="flex flex-col gap-1">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.class}">
                    <span class="size-1.5 rounded-full ${statusConfig.dotClass}"></span>
                    ${statusConfig.text}
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${paymentConfig.class}">
                    ${paymentConfig.text}
                </span>
            </div>
        </td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
            <div class="flex items-center justify-center gap-1 lg:gap-2">
                <button class="view-btn p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" data-id="${order.id}" data-order-number="${order.order_number}" title="${t('actions.view', 'عرض التفاصيل')}">
                    <span class="material-symbols-outlined text-[18px] lg:text-[20px]">visibility</span>
                </button>
                <button class="status-btn p-1.5 text-text-secondary hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" data-id="${order.id}" data-order-number="${order.order_number}" title="${t('actions.changeStatus', 'تغيير الحالة')}">
                    <span class="material-symbols-outlined text-[18px] lg:text-[20px]">edit</span>
                </button>
            </div>
        </td>
    `;

    // Add event listeners
    tr.querySelector('.view-btn').addEventListener('click', () => viewOrderDetails(order.order_number || order.id));
    tr.querySelector('.status-btn').addEventListener('click', () => openStatusModal(order));

    return tr;
}

function createOrderCard(order) {
    const div = document.createElement('div');
    div.className = 'p-4 hover:bg-gray-50 transition-colors bg-white dark:bg-surface-dark';

    const statusConfig = getStatusConfig(order.status);
    const paymentConfig = getPaymentStatusConfig(order.payment_status);

    div.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div>
                <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-text-main">#${order.order_number || order.id}</span>
                    <span class="text-xs text-slate-400">${Utils.formatDate(order.created_at, lang)}</span>
                </div>
                <div class="text-sm font-medium text-text-main mt-1">${order.customer_name || t('admin.orders.unknownCustomer', 'عميل غير معروف')}</div>
            </div>
            <div class="text-left">
                <div class="text-sm font-bold text-text-main font-['Work_Sans']">${Utils.formatPrice(order.total, lang)}</div>
                <div class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] mt-1 ${paymentConfig.class}">
                    ${paymentConfig.text}
                </div>
            </div>
        </div>
        
        <div class="flex items-center justify-between pt-3 border-t border-gray-100">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.class}">
                <span class="size-1.5 rounded-full ${statusConfig.dotClass}"></span>
                ${statusConfig.text}
            </span>
            
            <div class="flex items-center gap-2">
                <button class="view-btn p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" data-id="${order.id}">
                    <span class="material-symbols-outlined text-[20px]">visibility</span>
                </button>
                <button class="status-btn p-1.5 text-text-secondary hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" data-id="${order.id}">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
            </div>
        </div>
    `;

    div.querySelector('.view-btn').addEventListener('click', () => viewOrderDetails(order.order_number || order.id));
    div.querySelector('.status-btn').addEventListener('click', () => openStatusModal(order));

    return div;
}

function getStatusConfig(status) {
    const configs = {
        'pending': { text: t('orderStatus.pending', 'في الانتظار'), class: 'bg-yellow-100 text-yellow-700', dotClass: 'bg-yellow-500' },
        'processing': { text: t('orderStatus.processing', 'قيد التجهيز'), class: 'bg-blue-100 text-blue-700', dotClass: 'bg-blue-500' },
        'confirmed': { text: t('orderStatus.confirmed', 'مؤكد'), class: 'bg-blue-100 text-blue-700', dotClass: 'bg-blue-500' },
        'preparing': { text: t('orderStatus.preparing', 'قيد التحضير'), class: 'bg-orange-100 text-orange-700', dotClass: 'bg-orange-500' },
        'shipped': { text: t('orderStatus.shipped', 'تم الشحن'), class: 'bg-purple-100 text-purple-700', dotClass: 'bg-purple-500' },
        'delivered': { text: t('orderStatus.delivered', 'تم التسليم'), class: 'bg-green-100 text-green-700', dotClass: 'bg-green-500' },
        'cancelled': { text: t('orderStatus.cancelled', 'ملغي'), class: 'bg-red-100 text-red-700', dotClass: 'bg-red-500' }
    };
    return configs[status] || configs['pending'];
}

function getPaymentStatusConfig(status) {
    const configs = {
        'pending': { text: t('paymentStatus.pending', 'في انتظار الدفع'), class: 'bg-yellow-50 text-yellow-700' },
        'paid': { text: t('paymentStatus.paid', 'مدفوع'), class: 'bg-green-50 text-green-700' },
        'refunded': { text: t('paymentStatus.refunded', 'مسترد'), class: 'bg-gray-50 text-gray-700' },
        'failed': { text: t('paymentStatus.failed', 'فشل الدفع'), class: 'bg-red-50 text-red-700' }
    };
    return configs[status] || configs['pending'];
}

function renderPagination(total, page) {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    const start = (page - 1) * 10 + 1;
    const end = Math.min(page * 10, total);

    if (total === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="hidden sm:flex flex-1 items-center justify-between">
            <div>
                <p class="text-sm text-text-secondary">
                    ${t('pagination.showing', 'عرض')} <span class="font-medium text-text-main font-['Work_Sans']">${start}</span> ${t('pagination.to', 'إلى')} <span class="font-medium text-text-main font-['Work_Sans']">${end}</span> ${t('pagination.of', 'من')} <span class="font-medium text-text-main font-['Work_Sans']">${total}</span> ${t('admin.orders.order', 'طلب')}
                </p>
            </div>
            <div>
                <nav aria-label="Pagination" class="isolate inline-flex -space-x-px rounded-md shadow-sm dir-ltr">
                    <button class="prev-btn relative inline-flex items-center rounded-r-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${page === 1 ? 'pointer-events-none opacity-50' : ''}">
                        <span class="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    ${generatePageButtons(page, totalPages)}
                    <button class="next-btn relative inline-flex items-center rounded-l-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${page === totalPages ? 'pointer-events-none opacity-50' : ''}">
                        <span class="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                </nav>
            </div>
        </div>
    `;

    container.querySelector('.prev-btn')?.addEventListener('click', () => changePage(page - 1));
    container.querySelector('.next-btn')?.addEventListener('click', () => changePage(page + 1));
    container.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => changePage(parseInt(btn.dataset.page)));
    });
}

function generatePageButtons(currentPage, totalPages) {
    let buttons = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            buttons += `<span aria-current="page" class="relative z-10 inline-flex items-center bg-primary px-4 py-2 text-sm font-semibold text-white">${i}</span>`;
        } else {
            buttons += `<button class="page-btn relative inline-flex items-center px-4 py-2 text-sm font-semibold text-text-main ring-1 ring-inset ring-gray-300 hover:bg-gray-50" data-page="${i}">${i}</button>`;
        }
    }
    return buttons;
}

async function viewOrderDetails(orderIdentifier) {
    try {
        const order = await Api.admin.orders.get(orderIdentifier);
        renderOrderDetailsModal(order);
        document.getElementById('order-modal')?.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading order details:', error);
        Utils.showToast(Utils.parseError(error, lang), 'error');
    }
}

function renderOrderDetailsModal(order) {
    const container = document.getElementById('order-details');
    const orderIdEl = document.getElementById('order-id');

    if (!container) return;

    if (orderIdEl) orderIdEl.textContent = order.order_number || order.id;

    const statusConfig = getStatusConfig(order.status);
    const items = order.items || order.order_items || [];

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Order Info -->
            <div class="bg-bg-secondary p-4 rounded-lg">
                <h4 class="font-bold text-text-main mb-3">${t('admin.orders.orderInfo', 'معلومات الطلب')}</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.orders.orderNumber', 'رقم الطلب')}:</span>
                        <span class="font-medium text-text-main">#${order.order_number || order.id}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.orders.date', 'التاريخ')}:</span>
                        <span class="font-medium text-text-main">${Utils.formatDateTime(order.created_at, lang)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.orders.status', 'الحالة')}:</span>
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.class}">
                            <span class="size-1.5 rounded-full ${statusConfig.dotClass}"></span>
                            ${statusConfig.text}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.orders.total', 'إجمالي المبلغ')}:</span>
                        <span class="font-bold text-text-main font-['Work_Sans']">${Utils.formatPrice(order.total, lang)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Customer Info -->
            <div class="bg-bg-secondary p-4 rounded-lg">
                <h4 class="font-bold text-text-main mb-3">${t('admin.orders.customerInfo', 'معلومات العميل')}</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.orders.customerName', 'الاسم')}:</span>
                        <span class="font-medium text-text-main">${order.customer_name}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.orders.email', 'البريد الإلكتروني')}:</span>
                        <span class="font-medium text-text-main">${order.email || '—'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.orders.phone', 'الهاتف')}:</span>
                        <span class="font-medium text-text-main">${order.phone || '—'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Order Items -->
        <div class="bg-bg-secondary p-4 rounded-lg mb-6">
            <h4 class="font-bold text-text-main mb-3">${t('admin.orders.items', 'منتجات الطلب')}</h4>
            <div class="space-y-3">
                ${items.map(item => `
                    <div class="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <div class="size-12 rounded-lg bg-gray-100 bg-center bg-cover border border-border-color" style="background-image: url('${item.product_image || Config.PLACEHOLDER_PRODUCT}')"></div>
                        <div class="flex-1">
                            <h5 class="font-medium text-text-main">${lang === 'ar' ? (item.product_name_ar || item.product_name) : (item.product_name_en || item.product_name)}</h5>
                            <p class="text-sm text-text-secondary">${t('admin.orders.quantity', 'الكمية')}: ${item.quantity} × ${Utils.formatPrice(item.price, lang)}</p>
                        </div>
                        <div class="text-left">
                            <span class="font-bold text-text-main font-['Work_Sans']">${Utils.formatPrice(item.total, lang)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Shipping Address -->
        ${order.address ? `
            <div class="bg-bg-secondary p-4 rounded-lg mb-6">
                <h4 class="font-bold text-text-main mb-3">${t('admin.orders.shippingAddress', 'عنوان الشحن')}</h4>
                <p class="text-sm text-text-secondary">${order.address}, ${order.city}</p>
            </div>
        ` : ''}
        
        <!-- Status Update -->
        <div class="flex gap-3 pt-4 border-t">
            <select id="status-select" class="flex-1 px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>${t('orderStatus.pending', 'في الانتظار')}</option>
                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>${t('orderStatus.processing', 'قيد التجهيز')}</option>
                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>${t('orderStatus.shipped', 'تم الشحن')}</option>
                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>${t('orderStatus.delivered', 'تم التسليم')}</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>${t('orderStatus.cancelled', 'ملغي')}</option>
            </select>
            <select id="payment-status-select" class="flex-1 px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                <option value="pending" ${order.payment_status === 'pending' ? 'selected' : ''}>${t('paymentStatus.pending', 'في انتظار الدفع')}</option>
                <option value="paid" ${order.payment_status === 'paid' ? 'selected' : ''}>${t('paymentStatus.paid', 'مدفوع')}</option>
                <option value="refunded" ${order.payment_status === 'refunded' ? 'selected' : ''}>${t('paymentStatus.refunded', 'مسترد')}</option>
            </select>
            <button id="update-status-btn" class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                ${t('actions.updateStatus', 'تحديث الحالة')}
            </button>
        </div>
    `;

    // Add event listener for status update
    document.getElementById('update-status-btn')?.addEventListener('click', () => updateOrderStatus(order.order_number || order.id));
}

async function updateOrderStatus(orderIdentifier) {
    const newStatus = document.getElementById('status-select')?.value;
    const newPaymentStatus = document.getElementById('payment-status-select')?.value;

    try {
        await Api.admin.orders.updateStatus(orderIdentifier, newStatus);
        if (newPaymentStatus) {
            await Api.admin.orders.updatePayment(orderIdentifier, newPaymentStatus);
        }

        Utils.showToast(t('admin.orders.statusUpdated', 'تم تحديث حالة الطلب'), 'success');
        closeOrderModalFn();
        loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        Utils.showToast(Utils.parseError(error, lang), 'error');
    }
}

function openStatusModal(order) {
    viewOrderDetails(order.order_number || order.id);
}

function closeOrderModalFn() {
    document.getElementById('order-modal')?.classList.add('hidden');
}



function handleMobileSearch(e) {
    const val = e.target.value;
    const desktopInput = document.getElementById('search-input');
    if (desktopInput && desktopInput.value !== val) {
        desktopInput.value = val;
    }
    currentSearch = val;
    currentPage = 1;
    loadOrders();
}

function handleSearch() {
    const val = document.getElementById('search-input')?.value || '';
    const mobileInput = document.getElementById('mobile-search-input');
    if (mobileInput && mobileInput.value !== val) {
        mobileInput.value = val;
    }
    currentSearch = val;
    currentPage = 1;
    loadOrders();
}

function handleFilter() {
    currentStatus = document.getElementById('status-filter')?.value || '';
    currentPaymentStatus = document.getElementById('payment-status-filter')?.value || '';
    currentPage = 1;
    loadOrders();
}

function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        loadOrders();
    }
}

function handleExport() {
    Utils.showToast(t('admin.orders.exportNotImplemented', 'تصدير الطلبات - قريباً'), 'info');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('sidebar-open');
        sidebar.classList.toggle('sidebar-closed');
    }
}

function handleLogout() {
    if (confirm(t('auth.confirmLogout', 'هل أنت متأكد من تسجيل الخروج؟'))) {
        AuthModule.adminLogout();
    }
}
