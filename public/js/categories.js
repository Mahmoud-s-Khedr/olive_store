// Categories Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Account menu toggle
    const accountBtn = document.getElementById('account-btn');
    const accountMenu = document.getElementById('account-menu');

    accountBtn?.addEventListener('click', function(e) {
        e.stopPropagation();
        accountMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', function() {
        accountMenu?.classList.add('hidden');
    });

    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : (localStorage.getItem('lang') || 'ar');
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : (fallback || key);

    function toLocaleNumber(num) {
        if (lang === 'ar' && typeof Utils !== 'undefined') {
            return Utils.toArabicNumerals(num);
        }
        return String(num);
    }

    // Load categories
    async function loadCategories() {
        const grid = document.getElementById('categories-grid');
        const emptyState = document.getElementById('empty-state');

        try {
            const response = await fetch('/api/categories');
            if (!response.ok) {
                throw new Error('Failed to load categories');
            }

            const data = await response.json();
            const categories = data.categories || [];

            if (categories.length === 0) {
                grid.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }

            emptyState.classList.add('hidden');

            grid.innerHTML = categories.map(cat => {
                const name = lang === 'ar'
                    ? (cat.name_ar || t('common.unknown', 'Unknown'))
                    : (cat.name_en || t('common.unknown', 'Unknown'));
                const desc = lang === 'ar'
                    ? (cat.description_ar || '')
                    : (cat.description_en || '');
                const productCount = Number(cat.product_count || cat.products_count || 0);
                const hasCount = Number.isFinite(productCount) && productCount > 0;
                const countLabel = t('categories.productUnit', 'products');
                const countDisplay = toLocaleNumber(productCount);

                return `
                <a href="/products?category=${cat.slug || cat.id}"
                   class="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 hover:shadow-xl transition-all duration-300">

                    <!-- Background Image -->
                    <div class="absolute inset-0">
                        ${cat.image_url || cat.image ?
                        `<img src="${cat.image_url || cat.image}" alt="${name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">` :
                        `<div class="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <span class="material-symbols-outlined text-8xl text-primary/30">category</span>
                        </div>`
                    }
                    </div>

                    <!-- Overlay -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                    <!-- Content -->
                    <div class="absolute inset-0 flex flex-col justify-end p-6">
                        <h3 class="text-white text-xl font-bold mb-1 group-hover:text-accent transition-colors">${name}</h3>
                        ${desc ? `<p class="text-white/80 text-sm line-clamp-2 mb-2">${desc}</p>` : ''}
                        ${hasCount ? `
                        <div class="flex items-center gap-2 mt-2">
                            <span class="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                                ${countDisplay} ${countLabel}
                            </span>
                        </div>` : ''}
                    </div>

                    <!-- Hover Arrow -->
                    <div class="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <span class="material-symbols-outlined text-white rtl:rotate-180">arrow_forward</span>
                        </div>
                    </div>
                </a>
            `}).join('');
        } catch (error) {
            console.error('Error loading categories:', error);
            grid.innerHTML = `<div class="col-span-full text-center py-8 text-olive-light">${t('common.errorLoading', 'Error loading data')}</div>`;
        }
    }

    // Initialize
    loadCategories();
});
