// Home page JavaScript
document.addEventListener('DOMContentLoaded', async function () {
    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;

    // Load categories
    async function loadCategories() {
        try {
            const data = await Api.categories.list();

            if (data.categories) {
                const grid = document.getElementById('categories-grid');
                const categories = data.categories.slice(0, 4); // Show only 4

                grid.innerHTML = categories.map(cat => `
                    <a href="/pages/products.html?category=${cat.slug}" class="group flex flex-col gap-4 cursor-pointer">
                        <div class="w-full aspect-[3/4] rounded-xl overflow-hidden relative shadow-sm bg-gray-100">
                            <div class="absolute inset-0 bg-[#f9f7f2] transition-transform duration-500 group-hover:scale-105">
                                ${cat.image_url ?
                            `<img src="${cat.image_url}" alt="${lang === 'ar' ? cat.name_ar : cat.name_en}" class="w-full h-full object-cover">` :
                            `<div class="w-full h-full flex items-center justify-center text-primary">
                                        <span class="material-symbols-outlined text-6xl">category</span>
                                    </div>`
                        }
                            </div>
                            <div class="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                        </div>
                        <div class="text-center">
                            <p class="text-olive-dark text-lg font-bold group-hover:text-primary transition-colors">${lang === 'ar' ? cat.name_ar : cat.name_en}</p>
                        </div>
                    </a>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            if (typeof Utils !== 'undefined') {
                Utils.showToast(Utils.parseError(error, lang), 'error');
            }
        }
    }

    // Load featured products
    async function loadProducts() {
        try {
            const data = await Api.products.list({ limit: 8 });

            if (data.products) {
                const container = document.getElementById('featured-products');

                container.innerHTML = data.products.map(product => {
                    const name = lang === 'ar' ? product.name_ar : (product.name_en || product.name_ar);
                    const desc = lang === 'ar' ? product.short_description_ar : (product.short_description_en || '');
                    const price = Utils.formatPrice(product.price, lang);
                    const oldPrice = product.old_price ? Utils.formatPrice(product.old_price, lang) : '';

                    const newBadge = t('products.badge.new', 'جديد');
                    const saleBadge = t('products.badge.sale', 'خصم');

                    return `
                        <div class="min-w-[280px] md:min-w-[300px] snap-center bg-white rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-300 group flex-shrink-0">
                            <a href="/pages/product.html?slug=${product.slug}" class="block">
                                <div class="relative aspect-square rounded-lg bg-gray-50 mb-4 overflow-hidden">
                                    ${product.is_new ? `<div class="absolute top-3 ${lang === 'ar' ? 'right-3' : 'left-3'} bg-primary/90 backdrop-blur rounded px-2 py-1 text-xs font-bold text-white">${newBadge}</div>` : ''}
                                    ${product.old_price ? `<div class="absolute top-3 ${lang === 'ar' ? 'right-3' : 'left-3'} bg-red-500 rounded px-2 py-1 text-xs font-bold text-white">${saleBadge}</div>` : ''}
                                    ${product.primary_image ?
                                `<img src="${product.primary_image}" alt="${name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">` :
                                `<div class="w-full h-full flex items-center justify-center text-olive-light">
                                        <span class="material-symbols-outlined text-6xl">inventory_2</span>
                                    </div>`
                            }
                                </div>
                                <div class="flex flex-col gap-2">
                                    <h3 class="font-bold text-lg text-olive-dark group-hover:text-primary transition-colors">${name}</h3>
                                    <p class="text-olive-light text-sm">${desc}</p>
                                </div>
                            </a>
                            <div class="flex items-center justify-between mt-3">
                                <div class="flex flex-col">
                                    ${oldPrice ? `<span class="text-xs text-gray-400 line-through">${oldPrice}</span>` : ''}
                                    <span class="text-xl font-bold text-primary">${price}</span>
                                </div>
                                <button
                                    onclick="addToCart(${JSON.stringify({ id: product.id, name: product.name_ar, slug: product.slug, price: product.price, image: product.primary_image || '' }).replace(/"/g, '&quot;')})"
                                    class="w-10 h-10 rounded-full bg-gray-100 text-olive-dark flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                                    ${product.stock <= 0 ? 'disabled' : ''}
                                >
                                    <span class="material-symbols-outlined">${product.stock <= 0 ? 'block' : 'add_shopping_cart'}</span>
                                </button>
                            </div>
                        </div>
                    `}).join('');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            if (typeof Utils !== 'undefined') {
                Utils.showToast(Utils.parseError(error, lang), 'error');
            }
        }
    }

    // Initialize
    loadCategories();
    loadProducts();

    // Carousel navigation
    const container = document.getElementById('featured-products');
    document.getElementById('products-prev')?.addEventListener('click', () => {
        container.scrollBy({ left: lang === 'ar' ? 320 : -320, behavior: 'smooth' });
    });
    document.getElementById('products-next')?.addEventListener('click', () => {
        container.scrollBy({ left: lang === 'ar' ? -320 : 320, behavior: 'smooth' });
    });
});

// Add to cart function
function addToCart(product) {
    if (typeof Cart !== 'undefined') {
        Cart.addItem(product);
        const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
        const msg = t('products.addedToCart', 'تمت الإضافة للسلة');
        if (typeof Utils !== 'undefined') {
            Utils.showToast(msg, 'success');
        }
    }
}