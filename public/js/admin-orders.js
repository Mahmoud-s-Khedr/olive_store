// admin-orders.js

let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    
    // Event listeners
    document.getElementById('search-input').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('status-filter').addEventListener('change', handleFilter);
    document.getElementById('export-btn').addEventListener('click', handleExport);
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('close-order-modal').addEventListener('click', closeOrderModal);
});

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

async function loadOrders() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10,
            search: currentSearch,
            status: currentStatus
        });
        const response = await fetch(`/api/admin/orders?${params}`);
        const data = await response.json();
        
        totalPages = Math.ceil(data.total / 10);
        renderOrders(data.orders);
        renderPagination(data.total, data.page);
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-tbody').innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-text-secondary">خطأ في تحميل الطلبات</td></tr>';
    }
}

function renderOrders(orders) {
    const tbody = document.getElementById('orders-tbody');
    const emptyState = document.getElementById('empty-state');
    
    if (orders.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    tbody.innerHTML = '';
    
    orders.forEach(order => {
        const row = createOrderRow(order);
        tbody.appendChild(row);
    });
}

function createOrderRow(order) {
    const tr = document.createElement('tr');
    tr.className = 'group hover:bg-primary/5 transition-colors';
    
    const statusConfig = getStatusConfig(order.status);
    const formattedDate = new Date(order.created_at).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-bold text-text-main">#${order.id}</div>
        </td>
        <td class="px-6 py-4">
            <div class="flex flex-col">
                <span class="text-sm font-medium text-text-main">${order.customer_name}</span>
                <span class="text-xs text-text-secondary">${order.customer_email}</span>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">${formattedDate}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-text-main font-['Work_Sans']">${order.total_amount} ج.م</td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.class}">
                <span class="size-1.5 rounded-full ${statusConfig.dotClass}"></span>
                ${statusConfig.text}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-center">
            <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="view-btn p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" data-id="${order.id}" title="عرض التفاصيل">
                    <span class="material-symbols-outlined text-[20px]">visibility</span>
                </button>
                <button class="status-btn p-1.5 text-text-secondary hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" data-id="${order.id}" title="تغيير الحالة">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
            </div>
        </td>
    `;
    
    // Add event listeners
    tr.querySelector('.view-btn').addEventListener('click', () => viewOrderDetails(order.id));
    tr.querySelector('.status-btn').addEventListener('click', () => changeOrderStatus(order.id, order.status));
    
    return tr;
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

function renderPagination(total, page) {
    const container = document.getElementById('pagination-container');
    const start = (page - 1) * 10 + 1;
    const end = Math.min(page * 10, total);
    
    container.innerHTML = `
        <div class="hidden sm:flex flex-1 items-center justify-between">
            <div>
                <p class="text-sm text-text-secondary">
                    عرض <span class="font-medium text-text-main font-['Work_Sans']">${start}</span> إلى <span class="font-medium text-text-main font-['Work_Sans']">${end}</span> من <span class="font-medium text-text-main font-['Work_Sans']">${total}</span> طلب
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
    loadOrders();
}

function handleFilter() {
    currentStatus = document.getElementById('status-filter').value;
    currentPage = 1;
    loadOrders();
}

function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        loadOrders();
    }
}

async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}`);
        const order = await response.json();
        
        document.getElementById('order-id').textContent = order.id;
        renderOrderDetails(order);
        document.getElementById('order-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('خطأ في تحميل تفاصيل الطلب');
    }
}

function renderOrderDetails(order) {
    const container = document.getElementById('order-details');
    const statusConfig = getStatusConfig(order.status);
    const formattedDate = new Date(order.created_at).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Order Info -->
            <div class="bg-bg-secondary p-4 rounded-lg">
                <h4 class="font-bold text-text-main mb-3">معلومات الطلب</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-text-secondary">رقم الطلب:</span>
                        <span class="font-medium text-text-main">#${order.id}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">التاريخ:</span>
                        <span class="font-medium text-text-main">${formattedDate}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">الحالة:</span>
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.class}">
                            <span class="size-1.5 rounded-full ${statusConfig.dotClass}"></span>
                            ${statusConfig.text}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">إجمالي المبلغ:</span>
                        <span class="font-bold text-text-main font-['Work_Sans']">${order.total_amount} ج.م</span>
                    </div>
                </div>
            </div>
            
            <!-- Customer Info -->
            <div class="bg-bg-secondary p-4 rounded-lg">
                <h4 class="font-bold text-text-main mb-3">معلومات العميل</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-text-secondary">الاسم:</span>
                        <span class="font-medium text-text-main">${order.customer_name}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">البريد الإلكتروني:</span>
                        <span class="font-medium text-text-main">${order.customer_email}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-text-secondary">الهاتف:</span>
                        <span class="font-medium text-text-main">${order.customer_phone || 'غير محدد'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Order Items -->
        <div class="bg-bg-secondary p-4 rounded-lg">
            <h4 class="font-bold text-text-main mb-3">منتجات الطلب</h4>
            <div class="space-y-3">
                ${order.items.map(item => `
                    <div class="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <div class="size-12 rounded-lg bg-gray-100 bg-center bg-cover border border-border-color" style="background-image: url('${item.product_image || ''}')"></div>
                        <div class="flex-1">
                            <h5 class="font-medium text-text-main">${item.product_name}</h5>
                            <p class="text-sm text-text-secondary">الكمية: ${item.quantity} × ${item.price} ج.م</p>
                        </div>
                        <div class="text-left">
                            <span class="font-bold text-text-main font-['Work_Sans']">${item.total} ج.م</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Shipping Address -->
        ${order.shipping_address ? `
            <div class="bg-bg-secondary p-4 rounded-lg">
                <h4 class="font-bold text-text-main mb-3">عنوان الشحن</h4>
                <p class="text-sm text-text-secondary">${order.shipping_address}</p>
            </div>
        ` : ''}
        
        <!-- Actions -->
        <div class="flex gap-3 pt-4">
            <select id="status-select" class="flex-1 px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>في الانتظار</option>
                <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>مؤكد</option>
                <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>قيد التحضير</option>
                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>تم الشحن</option>
                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
            </select>
            <button id="update-status-btn" class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                تحديث الحالة
            </button>
        </div>
    `;
    
    // Add event listener for status update
    document.getElementById('update-status-btn').addEventListener('click', () => updateOrderStatus(order.id));
}

async function updateOrderStatus(orderId) {
    const newStatus = document.getElementById('status-select').value;
    
    try {
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            closeOrderModal();
            loadOrders();
        } else {
            alert('فشل في تحديث حالة الطلب');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('خطأ في تحديث حالة الطلب');
    }
}

function changeOrderStatus(orderId, currentStatus) {
    const newStatus = prompt('أدخل الحالة الجديدة (pending, confirmed, preparing, shipped, delivered, cancelled):', currentStatus);
    if (newStatus && newStatus !== currentStatus) {
        updateOrderStatusDirect(orderId, newStatus);
    }
}

async function updateOrderStatusDirect(orderId, newStatus) {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            loadOrders();
        } else {
            alert('فشل في تحديث حالة الطلب');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('خطأ في تحديث حالة الطلب');
    }
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.add('hidden');
}

function handleExport() {
    // Implement export functionality
    alert('تصدير الطلبات - يمكن تنفيذ هذا لاحقاً');
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