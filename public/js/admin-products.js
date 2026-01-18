/**
 * Admin Products JavaScript
 * Uses Api module for backend integration
 */

let currentPage = 1;
let currentSearch = '';
let currentCategory = '';
let currentStatus = '';
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function () {
    // Check admin authentication
    if (!AuthModule.requireAdminAuth()) {
        return;
    }

    loadCategories();
    loadProducts();

    // Event listeners
    const searchInput = document.getElementById('search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');
    const exportBtn = document.getElementById('export-btn');

    if (searchInput) searchInput.addEventListener('input', Utils.debounce(handleSearch, 300));
    if (mobileSearchInput) mobileSearchInput.addEventListener('input', Utils.debounce(handleMobileSearch, 300));
    if (categoryFilter) categoryFilter.addEventListener('change', handleFilter);
    if (statusFilter) statusFilter.addEventListener('change', handleFilter);
    if (exportBtn) exportBtn.addEventListener('click', handleExport);
});

const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

async function loadCategories() {
    try {
        const data = await Api.categories.list();
        const categories = data.categories || data.data || data || [];
        const select = document.getElementById('category-filter');

        if (!select) return;

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = lang === 'ar' ? (cat.name_ar || cat.name) : (cat.name_en || cat.name);
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadProducts() {
    try {
        const params = {
            page: currentPage,
            limit: 10
        };
        if (currentSearch) params.search = currentSearch;
        if (currentCategory) params.category = currentCategory;
        if (currentStatus) params.is_active = currentStatus === 'active';

        const data = await Api.admin.products.list(params);
        const products = data.products || data.data || [];
        const total = data.total || data.pagination?.total || products.length;

        totalPages = Math.ceil(total / 10);
        renderProducts(products);
        renderPagination(total, data.page || currentPage);
    } catch (error) {
        console.error('Error loading products:', error);
        const tbody = document.getElementById('products-tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-red-500">${t('errors.loadFailed', 'خطأ في تحميل المنتجات')}</td></tr>`;
        }
    }
}

function renderProducts(products) {
    const tbody = document.getElementById('products-tbody');
    const cardsContainer = document.getElementById('products-cards');
    const emptyState = document.getElementById('empty-state');

    if (tbody) tbody.innerHTML = '';
    if (cardsContainer) cardsContainer.innerHTML = '';

    if (products.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        const emptyHtml = `<div class="p-8 text-center text-slate-500">${t('admin.products.noProducts', 'لا توجد منتجات')}</div>`;
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-text-secondary">${t('admin.products.noProducts', 'لا توجد منتجات')}</td></tr>`;
        if (cardsContainer) cardsContainer.innerHTML = emptyHtml;
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    products.forEach(product => {
        // Create table row for desktop
        if (tbody) {
            const row = createProductRow(product);
            tbody.appendChild(row);
        }
        // Create card for mobile
        if (cardsContainer) {
            const card = createProductCard(product);
            cardsContainer.appendChild(card);
        }
    });
}

function createProductRow(product) {
    const tr = document.createElement('tr');
    tr.className = 'group hover:bg-primary/5 transition-colors';

    const productName = lang === 'ar' ? (product.name_ar || product.name) : (product.name_en || product.name);
    const imageUrl = product.images && product.images.length > 0
        ? (product.images.find(img => img.is_primary)?.url || product.images[0]?.url)
        : Config.PLACEHOLDER_PRODUCT;
    const categoryName = product.category
        ? (lang === 'ar' ? (product.category.name_ar || product.category.name) : (product.category.name_en || product.category.name))
        : '';
    const statusClass = product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
    const statusText = product.is_active ? t('admin.products.active', 'نشط') : t('admin.products.inactive', 'غير نشط');
    const stockQty = product.stock ?? product.stock_quantity ?? 0;
    const stockWarning = stockQty <= (product.low_stock_threshold || 10)
        ? `<span class="material-symbols-outlined text-[16px] text-red-500" title="${t('admin.products.lowStock', 'مخزون منخفض')}">warning</span>`
        : '';
    const stockClass = stockQty <= (product.low_stock_threshold || 10) ? 'text-red-600 font-bold' : '';

    tr.innerHTML = `
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
            <div class="size-10 lg:size-12 rounded-lg bg-gray-100 bg-center bg-cover border border-border-color" style="background-image: url('${Utils.getImageUrl(imageUrl)}')"></div>
        </td>
        <td class="px-4 lg:px-6 py-4">
            <div class="flex flex-col">
                <span class="text-sm font-bold text-text-main">${productName}</span>
                <span class="text-xs text-text-secondary">${product.sku || ''}</span>
            </div>
        </td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap hidden md:table-cell">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-100">
                ${categoryName || t('admin.products.noCategory', 'بدون تصنيف')}
            </span>
        </td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-bold text-text-main font-['Work_Sans']">${Utils.formatPrice(product.price, lang)}</td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
            <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium ${stockClass} font-['Work_Sans']">${stockQty}</span>
                ${stockWarning}
            </div>
        </td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}">
                <span class="size-1.5 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-gray-400'}"></span>
                ${statusText}
            </span>
        </td>
        <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
            <div class="flex items-center justify-center gap-1 lg:gap-2">
                <button class="edit-btn p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" data-id="${product.id}" title="${t('actions.edit', 'تعديل')}">
                    <span class="material-symbols-outlined text-[18px] lg:text-[20px]">edit</span>
                </button>
                <button class="delete-btn p-1.5 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-id="${product.id}" title="${t('actions.delete', 'حذف')}">
                    <span class="material-symbols-outlined text-[18px] lg:text-[20px]">delete</span>
                </button>
            </div>
        </td>
    `;

    // Add event listeners for edit and delete
    tr.querySelector('.edit-btn').addEventListener('click', () => handleEdit(product.id));
    tr.querySelector('.delete-btn').addEventListener('click', () => handleDelete(product.id, productName));

    return tr;
}

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'p-4 hover:bg-gray-50 transition-colors';

    const productName = lang === 'ar' ? (product.name_ar || product.name) : (product.name_en || product.name);
    const imageUrl = product.images && product.images.length > 0
        ? (product.images.find(img => img.is_primary)?.url || product.images[0]?.url)
        : Config.PLACEHOLDER_PRODUCT;
    const categoryName = product.category
        ? (lang === 'ar' ? (product.category.name_ar || product.category.name) : (product.category.name_en || product.category.name))
        : '';
    const statusClass = product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
    const statusText = product.is_active ? t('admin.products.active', 'نشط') : t('admin.products.inactive', 'غير نشط');
    const stockQty = product.stock ?? product.stock_quantity ?? 0;

    div.innerHTML = `
        <div class="flex gap-3">
            <div class="size-16 rounded-lg bg-gray-100 bg-center bg-cover border border-gray-200 flex-shrink-0" style="background-image: url('${Utils.getImageUrl(imageUrl)}')"></div>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                        <h3 class="text-sm font-bold text-slate-800 truncate">${productName}</h3>
                        <p class="text-xs text-slate-500 mt-0.5">${product.sku || ''}</p>
                    </div>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${statusClass} flex-shrink-0">
                        <span class="size-1.5 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-gray-400'}"></span>
                        ${statusText}
                    </span>
                </div>
                <div class="flex items-center gap-3 mt-2 text-xs">
                    ${categoryName ? `<span class="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-100">${categoryName}</span>` : ''}
                    <span class="font-bold text-slate-800">${Utils.formatPrice(product.price, lang)}</span>
                    <span class="text-slate-500">${t('admin.products.stock', 'المخزون')}: ${stockQty}</span>
                </div>
            </div>
        </div>
        <div class="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
            <button class="edit-btn flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors" data-id="${product.id}">
                <span class="material-symbols-outlined text-[18px]">edit</span>
                <span>${t('actions.edit', 'تعديل')}</span>
            </button>
            <button class="delete-btn flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" data-id="${product.id}">
                <span class="material-symbols-outlined text-[18px]">delete</span>
                <span>${t('actions.delete', 'حذف')}</span>
            </button>
        </div>
    `;

    // Add event listeners for edit and delete
    div.querySelector('.edit-btn').addEventListener('click', () => handleEdit(product.id));
    div.querySelector('.delete-btn').addEventListener('click', () => handleDelete(product.id, productName));

    return div;
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
                    ${t('pagination.showing', 'عرض')} <span class="font-medium text-text-main font-['Work_Sans']">${start}</span> ${t('pagination.to', 'إلى')} <span class="font-medium text-text-main font-['Work_Sans']">${end}</span> ${t('pagination.of', 'من')} <span class="font-medium text-text-main font-['Work_Sans']">${total}</span> ${t('admin.products.product', 'منتج')}
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
            buttons += `<span aria-current="page" class="relative z-10 inline-flex items-center bg-primary px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">${i}</span>`;
        } else {
            buttons += `<button class="page-btn relative inline-flex items-center px-4 py-2 text-sm font-semibold text-text-main ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0" data-page="${i}">${i}</button>`;
        }
    }
    return buttons;
}

function handleSearch() {
    currentSearch = document.getElementById('search-input')?.value || '';
    // Sync with mobile search
    const mobileInput = document.getElementById('mobile-search-input');
    if (mobileInput && mobileInput.value !== currentSearch) {
        mobileInput.value = currentSearch;
    }
    currentPage = 1;
    loadProducts();
}

function handleMobileSearch() {
    currentSearch = document.getElementById('mobile-search-input')?.value || '';
    // Sync with desktop search
    const desktopInput = document.getElementById('search-input');
    if (desktopInput && desktopInput.value !== currentSearch) {
        desktopInput.value = currentSearch;
    }
    currentPage = 1;
    loadProducts();
}

function handleFilter() {
    currentCategory = document.getElementById('category-filter')?.value || '';
    currentStatus = document.getElementById('status-filter')?.value || '';
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
    window.location.href = '/pages/admin-product-form.html';
}

function handleEdit(productId) {
    window.location.href = `/pages/admin-product-form.html?id=${productId}`;
}

async function handleDelete(productId, productName) {
    const confirmed = confirm(t('admin.products.confirmDelete', `هل أنت متأكد من حذف المنتج "${productName}"؟`));

    if (confirmed) {
        try {
            await Api.admin.products.delete(productId);
            Utils.showToast(t('admin.products.deleted', 'تم حذف المنتج بنجاح'), 'success');
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            Utils.showToast(Utils.parseError(error, lang), 'error');
        }
    }
}

function handleExport() {
    Utils.showToast(t('admin.products.exportNotImplemented', 'تصدير المنتجات - قريباً'), 'info');
}