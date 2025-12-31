document.addEventListener('DOMContentLoaded', async function () {
    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;

    let currentPage = 1;
    let currentCategory = '';
    let currentSearch = '';
    let currentSort = 'newest';
    let minPrice = '';
    let maxPrice = '';

    // Get initial params from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentCategory = urlParams.get('category') || '';
    currentSearch = urlParams.get('search') || '';
    currentPage = parseInt(urlParams.get('page')) || 1;

    // Load categories for filter
    async function loadCategories() {
        try {
            const data = await Api.categories.list();

            if (data.categories) {
                const container = document.getElementById('categories-filter');

                container.innerHTML = `
                <button class="category-btn ${!currentCategory ? 'active bg-primary text-white' : 'bg-white border border-gray-200 text-olive-dark hover:border-primary hover:text-primary'} px-4 py-2 rounded-lg text-sm font-medium transition-colors" data-slug="">
                    ${t('products.filter.all', 'الكل')}
                </button>
            `;

                data.categories.forEach(cat => {
                    const isActive = currentCategory === cat.slug;
                    const name = lang === 'ar' ? cat.name_ar : (cat.name_en || cat.name_ar);
                    container.innerHTML += `
                    <button class="category-btn ${isActive ? 'active bg-primary text-white' : 'bg-white border border-gray-200 text-olive-dark hover:border-primary hover:text-primary'} px-4 py-2 rounded-lg text-sm font-medium transition-colors" data-slug="${cat.slug}">
                        ${name}
                    </button>
                `;
                });

                // Add click handlers
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        currentCategory = this.dataset.slug;
                        currentPage = 1;
                        loadProducts();

                        // Update active state
                        document.querySelectorAll('.category-btn').forEach(b => {
                            b.classList.remove('active', 'bg-primary', 'text-white');
                            b.classList.add('bg-white', 'border', 'border-gray-200', 'text-olive-dark');
                        });
                        this.classList.add('active', 'bg-primary', 'text-white');
                        this.classList.remove('bg-white', 'border', 'border-gray-200', 'text-olive-dark');
                    });
                });

                // Update page title if category selected
                if (currentCategory) {
                    const cat = data.categories.find(c => c.slug === currentCategory);
                    if (cat) {
                        const name = lang === 'ar' ? cat.name_ar : (cat.name_en || cat.name_ar);
                        const titleEl = document.getElementById('page-title');
                        const breadEl = document.getElementById('breadcrumb-title');
                        if (titleEl) titleEl.textContent = name;
                        if (breadEl) breadEl.textContent = name;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Load products
    async function loadProducts() {
        const grid = document.getElementById('products-grid');
        const emptyState = document.getElementById('empty-state');

        // Show loading
        grid.innerHTML = `
        <div class="skeleton rounded-xl h-[350px]"></div>
        <div class="skeleton rounded-xl h-[350px]"></div>
        <div class="skeleton rounded-xl h-[350px]"></div>
        <div class="skeleton rounded-xl h-[350px]"></div>
    `;
        emptyState.classList.add('hidden');

        try {
            // Build query params
            const params = {
                page: currentPage,
                limit: 12,
                sort: currentSort,
            };
            if (currentCategory) params.category = currentCategory;
            if (currentSearch) params.search = currentSearch;
            if (minPrice) params.min_price = minPrice;
            if (maxPrice) params.max_price = maxPrice;

            const data = await Api.products.list(params);

            if (data) {
                const products = data.products || [];
                const total = Number.isFinite(data.total) ? data.total : products.length;
                const page = Number.isFinite(data.page) ? data.page : currentPage;
                const limit = Number.isFinite(data.limit) ? data.limit : 12;
                const totalPages = Math.max(1, Math.ceil(total / limit));
                const pagination = { total, page, limit, totalPages };

                if (products.length === 0) {
                    grid.innerHTML = '';
                    emptyState.classList.remove('hidden');
                    document.getElementById('pagination').classList.add('hidden');
                } else {
                    emptyState.classList.add('hidden');
                    document.getElementById('pagination').classList.remove('hidden');

                    grid.innerHTML = products.map(product => {
                        const name = lang === 'ar' ? product.name_ar : (product.name_en || product.name_ar);
                        const price = Utils.formatPrice(product.price, lang);
                        const oldPrice = product.old_price ? Utils.formatPrice(product.old_price, lang) : null;
                        const imageUrl = product.primary_image || product.image_url || product.image || '';

                        return `
                    <div class="group relative flex flex-col rounded-xl bg-white border border-transparent hover:border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <a href="product.html?id=${product.id}" class="block">
                            <div class="relative aspect-square w-full overflow-hidden bg-gray-50">
                                ${imageUrl ?
                                `<img src="${imageUrl}" alt="${name}" class="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500">` :
                                `<div class="h-full w-full flex items-center justify-center text-olive-light">
                                        <span class="material-symbols-outlined text-6xl">inventory_2</span>
                                    </div>`
                            }
                                ${product.is_new ? `<div class="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded">${t('products.badge.new', 'جديد')}</div>` : ''}
                            </div>
                            <div class="flex flex-col flex-1 p-4">
                                <div class="flex items-center gap-1.5 mb-2">
                                    <div class="h-2 w-2 rounded-full ${product.stock > 0 ? (product.stock <= 5 ? 'bg-amber-500' : 'bg-green-500') : 'bg-red-500'}"></div>
                                    <span class="text-xs ${product.stock > 0 ? (product.stock <= 5 ? 'text-amber-600' : 'text-green-600') : 'text-red-600'} font-medium">
                                        ${product.stock > 0 ? (product.stock <= 5 ? t('products.stock.low', 'كمية محدودة') : t('products.stock.in', 'متوفر')) : t('products.stock.out', 'نفذت الكمية')}
                                    </span>
                                </div>
                                <h3 class="text-lg font-bold text-olive-dark leading-tight mb-1 group-hover:text-primary transition-colors">${name}</h3>
                            </div>
                        </a>
                        <div class="mt-auto flex items-end justify-between gap-2 p-4 pt-0">
                            <div class="flex flex-col">
                                ${oldPrice ? `<span class="text-xs text-gray-400 line-through">${oldPrice}</span>` : ''}
                                <span class="text-lg font-bold text-primary">${price}</span>
                            </div>
                            <button
                                onclick="event.preventDefault(); addToCart(${product.id}, '${name}', ${product.price}, '${imageUrl}')"
                                class="flex h-9 w-9 items-center justify-center rounded-full ${product.stock > 0 ? 'bg-accent text-white shadow-md hover:bg-accent-dark hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'} transition-all focus:outline-none"
                                ${product.stock <= 0 ? 'disabled' : ''}
                            >
                                <span class="material-symbols-outlined text-xl">${product.stock > 0 ? 'add_shopping_cart' : 'block'}</span>
                            </button>
                        </div>
                    </div>
                `}).join('');

                    // Update counts
                    const from = (pagination.page - 1) * pagination.limit + 1;
                    const to = Math.min(from + products.length - 1, pagination.total);

                    const totalEl = document.getElementById('total-products');
                    const fromEl = document.getElementById('showing-from');
                    const toEl = document.getElementById('showing-to');

                    if (totalEl) totalEl.textContent = typeof Utils !== 'undefined' && lang === 'ar' ? Utils.toArabicNumerals(pagination.total) : pagination.total;
                    if (fromEl) fromEl.textContent = typeof Utils !== 'undefined' && lang === 'ar' ? Utils.toArabicNumerals(from) : from;
                    if (toEl) toEl.textContent = typeof Utils !== 'undefined' && lang === 'ar' ? Utils.toArabicNumerals(to) : to;

                    // Update pagination
                    updatePagination(pagination);
                }
            }
        } catch (error) {
            console.error('Error loading products:', error);
            grid.innerHTML = `<div class="col-span-full text-center py-8 text-olive-light">${t('common.errorLoading', 'حدث خطأ في تحميل المنتجات')}</div>`;

            // Show error toast for network/server errors
            if (typeof Utils !== 'undefined') {
                Utils.showToast(Utils.parseError(error, lang), 'error');
            }
        }
    }

    // Update pagination
    function updatePagination(pagination) {
        const totalPages = pagination.totalPages || 1;
        const page = pagination.page || 1;
        const pageNumbers = document.getElementById('page-numbers');
        const paginationWrapper = document.getElementById('pagination');

        if (totalPages <= 1) {
            if (paginationWrapper) paginationWrapper.classList.add('hidden');
            pageNumbers.innerHTML = '';
            return;
        }

        if (paginationWrapper) paginationWrapper.classList.remove('hidden');

        let html = '';
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            const displayNum = typeof Utils !== 'undefined' && lang === 'ar' ? Utils.toArabicNumerals(i) : i;
            if (i === page) {
                html += `<button class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm shadow-md">${displayNum}</button>`;
            } else {
                html += `<button class="page-num flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-olive-dark font-medium text-sm hover:border-primary hover:text-primary transition-colors" data-page="${i}">${displayNum}</button>`;
            }
        }
        pageNumbers.innerHTML = html;

        // Page number clicks
        document.querySelectorAll('.page-num').forEach(btn => {
            btn.addEventListener('click', function () {
                currentPage = parseInt(this.dataset.page);
                loadProducts();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // Prev/Next buttons
        document.getElementById('prev-page').disabled = page <= 1;
        document.getElementById('next-page').disabled = page >= totalPages;
    }

    // Event listeners
    document.getElementById('sort').addEventListener('change', function () {
        currentSort = this.value;
        currentPage = 1;
        loadProducts();
    });

    document.getElementById('search-input').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            currentSearch = this.value;
            currentPage = 1;
            loadProducts();
        }
    });

    document.getElementById('apply-price').addEventListener('click', function () {
        minPrice = document.getElementById('min-price').value;
        maxPrice = document.getElementById('max-price').value;
        currentPage = 1;
        loadProducts();
    });

    document.getElementById('prev-page').addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            loadProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.getElementById('next-page').addEventListener('click', function () {
        currentPage++;
        loadProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Initialize
    await loadCategories();
    await loadProducts();
});

// Add to cart function
function addToCart(product) {
    if (typeof product === 'object') {
        Cart.addItem(product);
    } else {
        // Legacy: addToCart(id, name, price, image)
        Cart.addItem({ id: arguments[0], name: arguments[1], price: arguments[2], image: arguments[3] });
    }

    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';
    const msg = typeof I18n !== 'undefined' ? I18n.t('products.addedToCart', 'تمت الإضافة للسلة') : 'Added to cart';
    if (typeof Utils !== 'undefined') {
        Utils.showToast(msg, 'success');
    } else {
        alert(msg);
    }
}