// admin-dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    loadRecentOrders();
    loadTopProducts();
});

async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            document.getElementById('total-sales').textContent = `${stats.totalSales || 0} ج.م`;
            document.getElementById('total-orders').textContent = stats.totalOrders || 0;
            document.getElementById('total-customers').textContent = stats.totalCustomers || 0;
            document.getElementById('total-products').textContent = stats.totalProducts || 0;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentOrders() {
    try {
        const response = await fetch('/api/admin/orders?limit=5', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const orders = data.orders || [];
            const container = document.getElementById('recent-orders');

            if (orders.length === 0) {
                container.innerHTML = '<p class="text-slate-500 text-sm">لا توجد طلبات حديثة</p>';
                return;
            }

            container.innerHTML = orders.map(order => `
                <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span class="text-primary font-bold text-xs">${order.customer_name?.charAt(0) || '?'}</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-slate-900 dark:text-white">${order.customer_name || 'عميل غير معروف'}</p>
                            <p class="text-xs text-slate-500">طلب #${order.order_number}</p>
                        </div>
                    </div>
                    <div class="text-left">
                        <p class="text-sm font-bold text-slate-900 dark:text-white">${order.total} ج.م</p>
                        <p class="text-xs text-slate-500">${formatDate(order.created_at)}</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

async function loadTopProducts() {
    try {
        const response = await fetch('/api/admin/products/top-selling?limit=5', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            const products = await response.json();
            const container = document.getElementById('top-products');

            if (products.length === 0) {
                container.innerHTML = '<p class="text-slate-500 text-sm">لا توجد منتجات</p>';
                return;
            }

            container.innerHTML = products.map(product => `
                <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-cover bg-center" style="background-image: url('${product.image || '/images/placeholder.png'}')"></div>
                        <div>
                            <p class="text-sm font-medium text-slate-900 dark:text-white">${product.name}</p>
                            <p class="text-xs text-slate-500">${product.sales_count || 0} مبيعات</p>
                        </div>
                    </div>
                    <div class="text-left">
                        <p class="text-sm font-bold text-slate-900 dark:text-white">${product.price} ج.م</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading top products:', error);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}

function toggleMobileSidebar() {
    const sidebar = document.querySelector('aside');
    sidebar.classList.toggle('hidden');
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
}