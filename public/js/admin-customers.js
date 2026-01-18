/**
 * Admin Customers JavaScript
 * Uses Api module for backend integration
 */

let currentPage = 1;
let currentSearch = '';
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function () {
    // Check admin authentication
    if (!AuthModule.requireAdminAuth()) {
        return;
    }

    loadCustomers();

    // Event listeners
    const searchInput = document.getElementById('search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const exportBtn = document.getElementById('export-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const logoutBtn = document.getElementById('logout-btn');
    const closeCustomerModal = document.getElementById('close-customer-modal');

    if (searchInput) searchInput.addEventListener('input', Utils.debounce(handleSearch, 300));
    if (mobileSearchInput) mobileSearchInput.addEventListener('input', Utils.debounce(handleMobileSearch, 300));
    if (exportBtn) exportBtn.addEventListener('click', handleExport);
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (closeCustomerModal) closeCustomerModal.addEventListener('click', closeCustomerModalFn);
});

const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

async function loadCustomers() {
    try {
        const params = {
            page: currentPage,
            limit: 10
        };
        if (currentSearch) params.search = currentSearch;

        const data = await Api.admin.customers.list(params);
        const customers = data.customers || data.data || [];
        const total = data.total || data.pagination?.total || customers.length;

        totalPages = Math.ceil(total / 10);
        renderCustomers(customers);
        renderPagination(total, data.page || currentPage);
    } catch (error) {
        console.error('Error loading customers:', error);
        const tbody = document.getElementById('customers-tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-4 text-center text-red-500">${t('errors.loadFailed', 'خطأ في تحميل العملاء')}</td></tr>`;
        }
    }
}

function renderCustomers(customers) {
    const tbody = document.getElementById('customers-tbody');
    const cardsContainer = document.getElementById('customers-cards');
    const emptyState = document.getElementById('empty-state');

    if (tbody) tbody.innerHTML = '';
    if (cardsContainer) cardsContainer.innerHTML = '';

    if (customers.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (tbody) tbody.innerHTML = '';
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    customers.forEach(customer => {
        // Desktop table row
        if (tbody) {
            const row = createCustomerRow(customer);
            tbody.appendChild(row);
        }
        // Mobile card
        if (cardsContainer) {
            const card = createCustomerCard(customer);
            cardsContainer.appendChild(card);
        }
    });
}

function createCustomerRow(customer) {
    const tr = document.createElement('tr');
    tr.className = 'group hover:bg-primary/5 transition-colors';

    const statusClass = customer.email_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
    const statusText = customer.email_verified ? t('admin.customers.verified', 'مفعل') : t('admin.customers.unverified', 'غير مفعل');

    tr.innerHTML = `
        <td class="px-4 lg:px-6 py-4">
            <div class="flex items-center gap-3">
                <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-primary">person</span>
                </div>
                <div>
                    <div class="text-sm font-medium text-text-main">${customer.name}</div>
                    <div class="text-xs text-text-secondary">#${customer.id}</div>
                </div>
            </div>
        </td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-text-secondary hidden md:table-cell">${customer.email}</td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-text-secondary hidden lg:table-cell">${customer.phone || t('common.notSpecified', '—')}</td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
            <div class="flex flex-col items-center">
                <span class="text-sm font-bold text-text-main font-['Work_Sans']">${customer.order_count || 0}</span>
                <span class="text-xs text-text-secondary font-['Work_Sans']">${Utils.formatPrice(customer.total_spent || 0, lang)}</span>
            </div>
        </td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}">
                <span class="size-1.5 rounded-full ${customer.email_verified ? 'bg-green-500' : 'bg-yellow-500'}"></span>
                ${statusText}
            </span>
        </td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-text-secondary hidden xl:table-cell">${Utils.formatDate(customer.created_at, lang)}</td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-left">
            <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="view-btn p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" data-id="${customer.id}" title="${t('actions.viewDetails', 'عرض التفاصيل')}">
                    <span class="material-symbols-outlined text-[18px] lg:text-[20px]">visibility</span>
                </button>
            </div>
        </td>
    `;

    // Add event listeners
    tr.querySelector('.view-btn').addEventListener('click', () => viewCustomerDetails(customer.id));

    return tr;
}

function createCustomerCard(customer) {
    const div = document.createElement('div');
    div.className = 'p-4 hover:bg-gray-50 transition-colors bg-white dark:bg-surface-dark';

    const statusClass = customer.email_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
    const statusText = customer.email_verified ? t('admin.customers.verified', 'مفعل') : t('admin.customers.unverified', 'غير مفعل');

    div.innerHTML = `
        <div class="flex items-start gap-4">
            <div class="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-primary text-[24px]">person</span>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                    <div>
                        <h3 class="text-sm font-bold text-slate-800">${customer.name}</h3>
                        <p class="text-xs text-slate-500 mt-0.5">${customer.email}</p>
                    </div>
                     <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
                        <span class="size-1.5 rounded-full ${customer.email_verified ? 'bg-green-500' : 'bg-yellow-500'}"></span>
                        ${statusText}
                    </span>
                </div>
                
                <div class="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                    <div class="text-center px-2">
                        <span class="block text-xs text-slate-400 mb-0.5">الطلبات</span>
                        <span class="block text-sm font-bold text-slate-900 font-['Work_Sans']">${customer.order_count || 0}</span>
                    </div>
                    <div class="w-px h-8 bg-gray-100"></div>
                    <div class="text-center px-2">
                         <span class="block text-xs text-slate-400 mb-0.5">الإجمالي</span>
                        <span class="block text-sm font-bold text-slate-900 font-['Work_Sans']">${Utils.formatPrice(customer.total_spent || 0, lang)}</span>
                    </div>
                    <button class="view-btn mr-auto p-2 bg-gray-50 hover:bg-primary/10 text-slate-500 hover:text-primary rounded-lg transition-colors" data-id="${customer.id}">
                        <span class="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    div.querySelector('.view-btn').addEventListener('click', () => viewCustomerDetails(customer.id));

    return div;
}

function renderPagination(total, page) {
    const container = document.getElementById('pagination-container');
    if (!container || total === 0) {
        if (container) container.innerHTML = '';
        return;
    }

    const start = (page - 1) * 10 + 1;
    const end = Math.min(page * 10, total);

    container.innerHTML = `
        <div class="hidden sm:flex flex-1 items-center justify-between">
            <div>
                <p class="text-sm text-text-secondary">
                    ${t('pagination.showing', 'عرض')} <span class="font-medium text-text-main font-['Work_Sans']">${start}</span> ${t('pagination.to', 'إلى')} <span class="font-medium text-text-main font-['Work_Sans']">${end}</span> ${t('pagination.of', 'من')} <span class="font-medium text-text-main font-['Work_Sans']">${total}</span> ${t('admin.customers.customer', 'عميل')}
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

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            buttons += `<span aria-current="page" class="relative z-10 inline-flex items-center bg-primary px-4 py-2 text-sm font-semibold text-white">${i}</span>`;
        } else {
            buttons += `<button class="page-btn relative inline-flex items-center px-4 py-2 text-sm font-semibold text-text-main ring-1 ring-inset ring-gray-300 hover:bg-gray-50" data-page="${i}">${i}</button>`;
        }
    }
    return buttons;
}

async function viewCustomerDetails(customerId) {
    try {
        const customer = await Api.admin.customers.get(customerId);

        const customerNameEl = document.getElementById('customer-name');
        if (customerNameEl) customerNameEl.textContent = customer.name;

        renderCustomerDetails(customer);
        document.getElementById('customer-modal')?.classList.remove('hidden');

        // Load customer orders
        loadCustomerOrders(customerId);
    } catch (error) {
        console.error('Error loading customer details:', error);
        Utils.showToast(Utils.parseError(error, lang), 'error');
    }
}

function renderCustomerDetails(customer) {
    const container = document.getElementById('customer-details');
    if (!container) return;

    const lastLogin = customer.last_login
        ? Utils.formatDateTime(customer.last_login, lang)
        : t('admin.customers.neverLoggedIn', 'لم يسجل دخول بعد');

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Customer Info -->
            <div class="bg-bg-secondary p-4 rounded-lg">
                <h4 class="font-bold text-text-main mb-3">${t('admin.customers.customerInfo', 'معلومات العميل')}</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.customers.name', 'الاسم')}:</span>
                        <span class="font-medium text-text-main">${customer.name}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.customers.email', 'البريد الإلكتروني')}:</span>
                        <span class="font-medium text-text-main">${customer.email}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.customers.phone', 'الهاتف')}:</span>
                        <span class="font-medium text-text-main">${customer.phone || t('common.notSpecified', 'غير محدد')}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.customers.registeredAt', 'تاريخ التسجيل')}:</span>
                        <span class="font-medium text-text-main">${Utils.formatDateTime(customer.created_at, lang)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.customers.lastLogin', 'آخر دخول')}:</span>
                        <span class="font-medium text-text-main">${lastLogin}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.customers.status', 'الحالة')}:</span>
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${customer.email_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                            <span class="size-1.5 rounded-full ${customer.email_verified ? 'bg-green-500' : 'bg-yellow-500'}"></span>
                            ${customer.email_verified ? t('admin.customers.verified', 'مفعل') : t('admin.customers.unverified', 'غير مفعل')}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Statistics -->
            <div class="bg-bg-secondary p-4 rounded-lg">
                <h4 class="font-bold text-text-main mb-3">${t('admin.customers.statistics', 'الإحصائيات')}</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.customers.ordersCount', 'عدد الطلبات')}:</span>
                        <span class="font-bold text-text-main font-['Work_Sans']">${customer.order_count || 0}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.customers.totalSpent', 'إجمالي المشتريات')}:</span>
                        <span class="font-bold text-text-main font-['Work_Sans']">${Utils.formatPrice(customer.total_spent || 0, lang)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">${t('admin.customers.avgOrderValue', 'متوسط قيمة الطلب')}:</span>
                        <span class="font-bold text-text-main font-['Work_Sans']">${Utils.formatPrice(customer.order_count > 0 ? ((customer.total_spent || 0) / customer.order_count) : 0, lang)}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Recent Orders -->
        <div class="bg-bg-secondary p-4 rounded-lg">
            <h4 class="font-bold text-text-main mb-3">${t('admin.customers.recentOrders', 'الطلبات الأخيرة')}</h4>
            <div id="customer-recent-orders" class="space-y-3">
                <div class="animate-pulse">
                    <div class="h-16 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
        
        <!-- Addresses -->
        ${customer.addresses && customer.addresses.length > 0 ? `
            <div class="bg-bg-secondary p-4 rounded-lg mt-6">
                <h4 class="font-bold text-text-main mb-3">${t('admin.customers.addresses', 'عناوين الشحن')}</h4>
                <div class="space-y-3">
                    ${customer.addresses.map(address => `
                        <div class="p-3 bg-white rounded-lg border border-border-color">
                            <p class="text-sm font-medium text-text-main">${address.full_name}</p>
                            <p class="text-sm text-text-secondary">${address.address_line1}, ${address.city}</p>
                            <p class="text-xs text-text-secondary">${address.phone}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

async function loadCustomerOrders(customerId) {
    try {
        const data = await Api.admin.customers.orders(customerId);
        const orders = data.orders || data.data || data || [];

        const container = document.getElementById('customer-recent-orders');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `<p class="text-sm text-text-secondary">${t('admin.customers.noOrders', 'لا توجد طلبات')}</p>`;
            return;
        }

        container.innerHTML = orders.slice(0, 5).map(order => {
            const statusConfig = getStatusConfig(order.status);

            return `
                <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-border-color">
                    <div>
                        <div class="font-medium text-text-main">#${order.order_number || order.id}</div>
                        <div class="text-sm text-text-secondary">${Utils.formatDate(order.created_at, lang)}</div>
                    </div>
                    <div class="text-left">
                        <div class="font-bold text-text-main font-['Work_Sans']">${Utils.formatPrice(order.total, lang)}</div>
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.class}">
                            <span class="size-1.5 rounded-full ${statusConfig.dotClass}"></span>
                            ${statusConfig.text}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading customer orders:', error);
        const container = document.getElementById('customer-recent-orders');
        if (container) {
            container.innerHTML = `<p class="text-sm text-red-500">${t('errors.loadFailed', 'خطأ في تحميل الطلبات')}</p>`;
        }
    }
}

function getStatusConfig(status) {
    const configs = {
        'pending': { text: t('orderStatus.pending', 'في الانتظار'), class: 'bg-yellow-100 text-yellow-700', dotClass: 'bg-yellow-500' },
        'processing': { text: t('orderStatus.processing', 'قيد التجهيز'), class: 'bg-blue-100 text-blue-700', dotClass: 'bg-blue-500' },
        'shipped': { text: t('orderStatus.shipped', 'تم الشحن'), class: 'bg-purple-100 text-purple-700', dotClass: 'bg-purple-500' },
        'delivered': { text: t('orderStatus.delivered', 'تم التسليم'), class: 'bg-green-100 text-green-700', dotClass: 'bg-green-500' },
        'cancelled': { text: t('orderStatus.cancelled', 'ملغي'), class: 'bg-red-100 text-red-700', dotClass: 'bg-red-500' }
    };
    return configs[status] || configs['pending'];
}

const mobileSearchInput = document.getElementById('mobile-search-input');
if (mobileSearchInput) mobileSearchInput.addEventListener('input', Utils.debounce(handleMobileSearch, 300));
// ... existing code ...

function handleMobileSearch(e) {
    const val = e.target.value;
    const desktopInput = document.getElementById('search-input');
    if (desktopInput && desktopInput.value !== val) {
        desktopInput.value = val;
    }
    currentSearch = val;
    currentPage = 1;
    loadCustomers();
}

function handleSearch() {
    const val = document.getElementById('search-input')?.value || '';
    const mobileInput = document.getElementById('mobile-search-input');
    if (mobileInput && mobileInput.value !== val) {
        mobileInput.value = val;
    }
    currentSearch = val;
    currentPage = 1;
    loadCustomers();
}

function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        loadCustomers();
    }
}

function closeCustomerModalFn() {
    document.getElementById('customer-modal')?.classList.add('hidden');
}

function handleExport() {
    Utils.showToast(t('admin.customers.exportNotImplemented', 'تصدير العملاء - قريباً'), 'info');
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
