// admin-products.js

let currentPage = 1;
let currentSearch = '';
let currentCategory = '';
let currentStatus = '';
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadProducts();
    
    // Event listeners
    document.getElementById('search-input').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('category-filter').addEventListener('change', handleFilter);
    document.getElementById('status-filter').addEventListener('change', handleFilter);
    document.getElementById('add-product-btn').addEventListener('click', handleAddProduct);
    document.getElementById('export-btn').addEventListener('click', handleExport);
});

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        const select = document.getElementById('category-filter');
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadProducts() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10,
            search: currentSearch,
            category: currentCategory,
            status: currentStatus
        });
        const response = await fetch(`/api/admin/products?${params}`);
        const data = await response.json();
        
        totalPages = Math.ceil(data.total / 10);
        renderProducts(data.products);
        renderPagination(data.total, data.page);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-tbody').innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-text-secondary">خطأ في تحميل المنتجات</td></tr>';
    }
}

function renderProducts(products) {
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-text-secondary">لا توجد منتجات</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const row = createProductRow(product);
        tbody.appendChild(row);
    });
}

function createProductRow(product) {
    const tr = document.createElement('tr');
    tr.className = 'group hover:bg-primary/5 transition-colors';
    
    const imageUrl = product.images && product.images.length > 0 ? product.images[0].url : '';
    const categoryName = product.category ? product.category.name : '';
    const statusClass = product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
    const statusText = product.is_active ? 'نشط' : 'غير نشط';
    const stockWarning = product.stock_quantity <= 10 ? '<span class="material-symbols-outlined text-[16px] text-red-500" title="مخزون منخفض">warning</span>' : '';
    const stockClass = product.stock_quantity <= 10 ? 'text-red-600 font-bold' : '';
    
    tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="size-12 rounded-lg bg-gray-100 bg-center bg-cover border border-border-color" style="background-image: url('${imageUrl}')"></div>
        </td>
        <td class="px-6 py-4">
            <div class="flex flex-col">
                <span class="text-sm font-bold text-text-main">${product.name}</span>
                <span class="text-xs text-text-secondary">${product.sku || ''}</span>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-100">
                ${categoryName}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-text-main font-['Work_Sans']">${product.price} ج.م</td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium ${stockClass} font-['Work_Sans']">${product.stock_quantity}</span>
                ${stockWarning}
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}">
                <span class="size-1.5 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-gray-400'}"></span>
                ${statusText}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-center">
            <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="edit-btn p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" data-id="${product.id}" title="تعديل">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button class="delete-btn p-1.5 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-id="${product.id}" title="حذف">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
            </div>
        </td>
    `;
    
    // Add event listeners for edit and delete
    tr.querySelector('.edit-btn').addEventListener('click', () => handleEdit(product.id));
    tr.querySelector('.delete-btn').addEventListener('click', () => handleDelete(product.id));
    
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
                    عرض <span class="font-medium text-text-main font-['Work_Sans']">${start}</span> إلى <span class="font-medium text-text-main font-['Work_Sans']">${end}</span> من <span class="font-medium text-text-main font-['Work_Sans']">${total}</span> منتج
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
    loadProducts();
}

function handleFilter() {
    currentCategory = document.getElementById('category-filter').value;
    currentStatus = document.getElementById('status-filter').value;
    currentPage = 1;
    loadProducts();
}

function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        loadProducts();
    }
}

function handleAddProduct() {
    // Navigate to add product page or open modal
    alert('إضافة منتج جديد - يمكن تنفيذ هذا لاحقاً');
}

function handleEdit(productId) {
    // Navigate to edit product page or open modal
    alert(`تعديل المنتج ${productId} - يمكن تنفيذ هذا لاحقاً`);
}

async function handleDelete(productId) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadProducts(); // Reload the list
            } else {
                alert('فشل في حذف المنتج');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('خطأ في حذف المنتج');
        }
    }
}

function handleExport() {
    // Implement export functionality
    alert('تصدير المنتجات - يمكن تنفيذ هذا لاحقاً');
}