// admin-customers.js

let currentPage = 1;
let currentSearch = '';
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    
    // Event listeners
    document.getElementById('search-input').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('export-btn').addEventListener('click', handleExport);
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('close-customer-modal').addEventListener('click', closeCustomerModal);
});

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

async function loadCustomers() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10,
            search: currentSearch
        });
        const response = await fetch(`/api/admin/customers?${params}`);
        const data = await response.json();
        
        totalPages = Math.ceil(data.total / 10);
        renderCustomers(data.customers);
        renderPagination(data.total, data.page);
    } catch (error) {
        console.error('Error loading customers:', error);
        document.getElementById('customers-tbody').innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-text-secondary">خطأ في تحميل العملاء</td></tr>';
    }
}

function renderCustomers(customers) {
    const tbody = document.getElementById('customers-tbody');
    const emptyState = document.getElementById('empty-state');
    
    if (customers.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    tbody.innerHTML = '';
    
    customers.forEach(customer => {
        const row = createCustomerRow(customer);
        tbody.appendChild(row);
    });
}

function createCustomerRow(customer) {
    const tr = document.createElement('tr');
    tr.className = 'group hover:bg-primary/5 transition-colors';
    
    const formattedDate = new Date(customer.created_at).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    const statusClass = customer.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
    const statusText = customer.is_active ? 'نشط' : 'غير نشط';
    
    tr.innerHTML = `
        <td class="px-6 py-4">
            <div class="flex items-center gap-3">
                <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary">person</span>
                </div>
                <div>
                    <div class="text-sm font-medium text-text-main">${customer.name}</div>
                    <div class="text-xs text-text-secondary">ID: ${customer.id}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">${customer.email}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">${customer.phone || 'غير محدد'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-text-main font-['Work_Sans']">${customer.order_count || 0}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-text-main font-['Work_Sans']">${customer.total_spent || 0} ج.م</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">${formattedDate}</td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}">
                <span class="size-1.5 rounded-full ${customer.is_active ? 'bg-green-500' : 'bg-gray-400'}"></span>
                ${statusText}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-center">
            <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="view-btn p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" data-id="${customer.id}" title="عرض التفاصيل">
                    <span class="material-symbols-outlined text-[20px]">visibility</span>
                </button>
                <button class="toggle-status-btn p-1.5 text-text-secondary hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" data-id="${customer.id}" data-active="${customer.is_active}" title="${customer.is_active ? 'إلغاء تفعيل' : 'تفعيل'}">
                    <span class="material-symbols-outlined text-[20px]">${customer.is_active ? 'block' : 'check_circle'}</span>
                </button>
            </div>
        </td>
    `;
    
    // Add event listeners
    tr.querySelector('.view-btn').addEventListener('click', () => viewCustomerDetails(customer.id));
    tr.querySelector('.toggle-status-btn').addEventListener('click', () => toggleCustomerStatus(customer.id, customer.is_active));
    
    return tr;
}

function renderPagination(total, page) {
    const container = document.getElementById('pagination-container');
    const start = (page - 1) * 10 + 1;
    const end = Math.min(page * 10, total);
    
    container.innerHTML = `
        <div class="hidden sm:flex flex-1 items-center justify-between">
            <div>
                <p class="text-sm text-text-secondary">
                    عرض <span class="font-medium text-text-main font-['Work_Sans']">${start}</span> إلى <span class="font-medium text-text-main font-['Work_Sans']">${end}</span> من <span class="font-medium text-text-main font-['Work_Sans']">${total}</span> عميل
                </p>
            </div>
            <div>
                <nav aria-label="Pagination" class="isolate inline-flex -space-x-px rounded-md shadow-sm dir-ltr">
                    <button class="prev-btn relative inline-flex items-center rounded-r-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${page === 1 ? 'pointer-events-none opacity-50' : ''}">
                        <span class="sr-only">Next</span>
                        <span class="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    ${generatePageButtons(page, totalPages)}
                    <button class="next-btn relative inline-flex items-center rounded-l-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${page === totalPages ? 'pointer-events-none opacity-50' : ''}">
                        <span class="sr-only">Previous</span>
                        <span class="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                </nav>
            </div>
        </div>
    `;
    
    // Add event listeners for pagination
    container.querySelector('.prev-btn').addEventListener('click', () => changePage(page - 1));
    container.querySelector('.next-btn').addEventListener('click', () => changePage(page + 1));
    container.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => changePage(parseInt(btn.dataset.page)));
    });
}

function generatePageButtons(currentPage, totalPages) {
    let buttons = '';
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            buttons += `<span aria-current="page" class="relative z-10 inline-flex items-center bg-primary px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">${i}</span>`;
        } else {
            buttons += `<button class="page-btn relative inline-flex items-center px-4 py-2 text-sm font-semibold text-text-main ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0" data-page="${i}">${i}</button>`;
        }
    }
    return buttons;
}

function handleSearch() {
    currentSearch = document.getElementById('search-input').value;
    currentPage = 1;
    loadCustomers();
}

function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        loadCustomers();
    }
}

async function viewCustomerDetails(customerId) {
    try {
        const response = await fetch(`/api/admin/customers/${customerId}`);
        const customer = await response.json();
        
        document.getElementById('customer-name').textContent = customer.name;
        renderCustomerDetails(customer);
        document.getElementById('customer-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading customer details:', error);
        alert('خطأ في تحميل تفاصيل العميل');
    }
}

function renderCustomerDetails(customer) {
    const container = document.getElementById('customer-details');
    const formattedDate = new Date(customer.created_at).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const lastLogin = customer.last_login ? new Date(customer.last_login).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'لم يسجل دخول بعد';
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Customer Info -->
            <div class="bg-bg-secondary p-4 rounded-lg">
                <h4 class="font-bold text-text-main mb-3">معلومات العميل</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-text-secondary">الاسم:</span>
                        <span class="font-medium text-text-main">${customer.name}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">البريد الإلكتروني:</span>
                        <span class="font-medium text-text-main">${customer.email}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">الهاتف:</span>
                        <span class="font-medium text-text-main">${customer.phone || 'غير محدد'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">تاريخ التسجيل:</span>
                        <span class="font-medium text-text-main">${formattedDate}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">آخر دخول:</span>
                        <span class="font-medium text-text-main">${lastLogin}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">الحالة:</span>
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${customer.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
                            <span class="size-1.5 rounded-full ${customer.is_active ? 'bg-green-500' : 'bg-gray-400'}"></span>
                            ${customer.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Statistics -->
            <div class="bg-bg-secondary p-4 rounded-lg">
                <h4 class="font-bold text-text-main mb-3">الإحصائيات</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-text-secondary">عدد الطلبات:</span>
                        <span class="font-bold text-text-main font-['Work_Sans']">${customer.order_count || 0}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">إجمالي المشتريات:</span>
                        <span class="font-bold text-text-main font-['Work_Sans']">${customer.total_spent || 0} ج.م</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">متوسط قيمة الطلب:</span>
                        <span class="font-bold text-text-main font-['Work_Sans']">${customer.order_count > 0 ? (customer.total_spent / customer.order_count).toFixed(2) : 0} ج.م</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Recent Orders -->
        <div class="bg-bg-secondary p-4 rounded-lg">
            <h4 class="font-bold text-text-main mb-3">الطلبات الأخيرة</h4>
            <div id="recent-orders" class="space-y-3">
                <!-- Recent orders will be loaded here -->
            </div>
        </div>
        
        <!-- Addresses -->
        ${customer.addresses && customer.addresses.length > 0 ? `
            <div class="bg-bg-secondary p-4 rounded-lg">
                <h4 class="font-bold text-text-main mb-3">عناوين الشحن</h4>
                <div class="space-y-3">
                    ${customer.addresses.map(address => `
                        <div class="p-3 bg-white rounded-lg border border-border-color">
                            <p class="text-sm text-text-secondary">${address}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    // Load recent orders
    loadRecentOrders(customer.id);
}

async function loadRecentOrders(customerId) {
    try {
        const response = await fetch(`/api/admin/customers/${customerId}/orders?limit=5`);
        const orders = await response.json();
        
        const container = document.getElementById('recent-orders');
        if (orders.length === 0) {
            container.innerHTML = '<p class="text-sm text-text-secondary">لا توجد طلبات</p>';
            return;
        }
        
        container.innerHTML = orders.map(order => {
            const formattedDate = new Date(order.created_at).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const statusConfig = getStatusConfig(order.status);
            
            return `
                <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-border-color">
                    <div>
                        <div class="font-medium text-text-main">#${order.id}</div>
                        <div class="text-sm text-text-secondary">${formattedDate}</div>
                    </div>
                    <div class="text-left">
                        <div class="font-bold text-text-main font-['Work_Sans']">${order.total_amount} ج.م</div>
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.class}">
                            <span class="size-1.5 rounded-full ${statusConfig.dotClass}"></span>
                            ${statusConfig.text}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
        document.getElementById('recent-orders').innerHTML = '<p class="text-sm text-text-secondary">خطأ في تحميل الطلبات</p>';
    }
}

function getStatusConfig(status) {
    const configs = {
        'pending': { text: 'في الانتظار', class: 'bg-yellow-100 text-yellow-700', dotClass: 'bg-yellow-500' },
        'confirmed': { text: 'مؤكد', class: 'bg-blue-100 text-blue-700', dotClass: 'bg-blue-500' },
        'preparing': { text: 'قيد التحضير', class: 'bg-orange-100 text-orange-700', dotClass: 'bg-orange-500' },
        'shipped': { text: 'تم الشحن', class: 'bg-purple-100 text-purple-700', dotClass: 'bg-purple-500' },
        'delivered': { text: 'تم التسليم', class: 'bg-green-100 text-green-700', dotClass: 'bg-green-500' },
        'cancelled': { text: 'ملغي', class: 'bg-red-100 text-red-700', dotClass: 'bg-red-500' }
    };
    return configs[status] || configs['pending'];
}

async function toggleCustomerStatus(customerId, currentStatus) {
    const newStatus = !currentStatus;
    const action = newStatus ? 'تفعيل' : 'إلغاء تفعيل';
    
    if (confirm(`هل أنت متأكد من ${action} هذا العميل؟`)) {
        try {
            const response = await fetch(`/api/admin/customers/${customerId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_active: newStatus })
            });
            
            if (response.ok) {
                loadCustomers();
            } else {
                alert(`فشل في ${action} العميل`);
            }
        } catch (error) {
            console.error('Error updating customer status:', error);
            alert(`خطأ في ${action} العميل`);
        }
    }
}

function closeCustomerModal() {
    document.getElementById('customer-modal').classList.add('hidden');
}

function handleExport() {
    // Implement export functionality
    alert('تصدير العملاء - يمكن تنفيذ هذا لاحقاً');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('sidebar-open');
    sidebar.classList.toggle('sidebar-closed');
}

function handleLogout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('admin_token');
        window.location.href = 'admin-login.html';
    }
}