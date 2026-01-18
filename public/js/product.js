// Product Detail Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : (localStorage.getItem('lang') || 'ar');
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : (fallback || key);

    // Get product slug from URL
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2]; // Handle different URL formats

    let quantity = 1;
    let productData = null;

    function formatNumber(num) {
        if (lang === 'ar' && typeof Utils !== 'undefined') {
            return Utils.toArabicNumerals(num);
        }
        return String(num);
    }

    function formatPrice(value) {
        if (typeof Utils !== 'undefined' && Utils.formatPrice) {
            return Utils.formatPrice(value, lang);
        }
        if (typeof I18n !== 'undefined' && I18n.formatPrice) {
            return I18n.formatPrice(value);
        }
        return lang === 'ar' ? `${value || 0} ج.م` : `EGP ${value || 0}`;
    }

    function getImageUrl(image) {
        if (!image) return '';
        if (typeof image === 'string') return image;
        if (image.publicUrl) return image.publicUrl;
        if (image.url) return image.url;
        if (image.r2_key) {
            return `https://pub-123456789.s3.amazonaws.com/${image.r2_key}`; // Placeholder URL
        }
        return '';
    }

    function showToast(message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Load product
    async function loadProduct() {
        try {
            const response = await fetch(`/api/products/${slug}`);

            if (!response.ok) {
                document.getElementById('loading-state').classList.add('hidden');
                document.getElementById('not-found').classList.remove('hidden');
                return;
            }

            const data = await response.json();
            productData = data.product || data;

            // Hide loading, show content
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('product-content').classList.remove('hidden');

            // Populate data
            const nameAr = productData.name_ar || '';
            const nameEn = productData.name_en || '';
            const displayName = lang === 'ar'
                ? (nameAr || t('common.unknown', 'Unknown'))
                : (nameEn || t('common.unknown', 'Unknown'));
            document.getElementById('breadcrumb-product').textContent = displayName;
            const nameArEl = document.getElementById('product-name-ar');
            const nameEnEl = document.getElementById('product-name-en');
            if (lang === 'ar') {
                if (nameArEl) nameArEl.textContent = nameAr || t('common.unknown', 'Unknown');
                if (nameEnEl) {
                    nameEnEl.textContent = '';
                    nameEnEl.classList.add('hidden');
                }
            } else {
                if (nameEnEl) nameEnEl.textContent = nameEn || t('common.unknown', 'Unknown');
                if (nameArEl) {
                    nameArEl.textContent = '';
                    nameArEl.classList.add('hidden');
                }
            }
            document.getElementById('product-price').textContent = formatPrice(productData.price);

            if (productData.old_price) {
                const oldPriceEl = document.getElementById('product-old-price');
                oldPriceEl.textContent = formatPrice(productData.old_price);
                oldPriceEl.classList.remove('hidden');
            }

            const shortDescription = lang === 'ar'
                ? (productData.short_description_ar || productData.description_ar || '')
                : (productData.short_description_en || productData.description_en || '');
            const fullDescription = lang === 'ar'
                ? (productData.description_ar || productData.short_description_ar || '')
                : (productData.description_en || productData.short_description_en || '');
            document.getElementById('product-description').textContent = shortDescription;
            document.getElementById('full-description').innerHTML = fullDescription || t('product.noDescription', 'No description available');

            // Main image
            const mainImage = document.getElementById('main-image');
            const images = Array.isArray(productData.images) ? productData.images : [];
            const primaryImage = getImageUrl(productData.primary_image) || getImageUrl(images.find((img) => img.is_primary)) || getImageUrl(images[0]);
            if (primaryImage) {
                mainImage.src = primaryImage;
                mainImage.alt = displayName;
            } else {
                mainImage.src = '/images/placeholder-product.png'; // Placeholder
            }

            // Thumbnails
            if (images.length > 0) {
                const thumbsContainer = document.getElementById('thumbnails');
                thumbsContainer.innerHTML = images.slice(0, 4).map((img, index) => {
                    const imgUrl = getImageUrl(img);
                    if (!imgUrl) return '';
                    return `
                        <button class="thumb-btn aspect-square rounded-lg overflow-hidden border-2 ${index === 0 ? 'border-primary' : 'border-transparent hover:border-olive-light'} p-0.5 bg-white transition-all" data-url="${imgUrl}">
                            <img src="${imgUrl}" alt="" class="w-full h-full object-cover rounded-md">
                        </button>
                    `;
                }).join('');

                // Thumbnail clicks
                document.querySelectorAll('.thumb-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        mainImage.src = this.dataset.url;
                        document.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('border-primary'));
                        this.classList.add('border-primary');
                    });
                });
            }

            // Stock status
            const stockStatus = document.getElementById('stock-status');
            if (productData.stock <= 0) {
                stockStatus.innerHTML = `
                    <span class="relative flex h-3 w-3">
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span class="text-red-700 font-medium text-sm">${t('products.stock.out', 'Out of stock')}</span>
                `;
                document.getElementById('add-to-cart-btn').disabled = true;
                document.getElementById('add-to-cart-btn').classList.add('opacity-50', 'cursor-not-allowed');
            } else if (productData.stock <= 5) {
                const lowStockTemplate = t('product.stock.lowWithCount', 'Low stock - {count} left');
                const lowStockText = lowStockTemplate.replace('{count}', formatNumber(productData.stock));
                stockStatus.innerHTML = `
                    <span class="relative flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    <span class="text-amber-700 font-medium text-sm">${lowStockText}</span>
                `;
            }

            // Specs
            const specsTable = document.getElementById('specs-table');
            specsTable.innerHTML = `
                <tr class="hover:bg-gray-50">
                    <td class="py-3 text-olive-light font-medium">${t('product.specs.weight', 'Weight')}</td>
                    <td class="py-3 text-olive-dark">${productData.weight || t('common.unknown', 'Unknown')}</td>
                </tr>
                <tr class="hover:bg-gray-50">
                    <td class="py-3 text-olive-light font-medium">${t('product.specs.dimensions', 'Dimensions')}</td>
                    <td class="py-3 text-olive-dark">${productData.dimensions || t('common.unknown', 'Unknown')}</td>
                </tr>
                <tr class="hover:bg-gray-50">
                    <td class="py-3 text-olive-light font-medium">${t('product.specs.sku', 'SKU')}</td>
                    <td class="py-3 text-olive-dark" dir="ltr">${productData.sku || productData.id}</td>
                </tr>
            `;

            // Load related products
            loadRelatedProducts();

        } catch (error) {
            console.error('Error loading product:', error);
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('not-found').classList.remove('hidden');
            showToast(t('product.errorLoading', 'Error loading product'), 'error');
        }
    }

    // Load related products
    async function loadRelatedProducts() {
        try {
            const params = new URLSearchParams();
            params.set('limit', 4);
            if (productData.category_slug) params.set('category', productData.category_slug);

            const response = await fetch(`/api/products?${params.toString()}`);
            const data = await response.json();

            if (response.ok && data.products) {
                const related = data.products.filter(p => p.id !== productData.id).slice(0, 4);
                const container = document.getElementById('related-products');

                if (related.length > 0) {
                    container.innerHTML = related.map(product => `
                        <a href="/products/${product.slug || product.id}" class="group flex flex-col gap-3">
                            <div class="w-full aspect-[4/5] bg-white rounded-xl overflow-hidden relative shadow-sm hover:shadow-md transition-all">
                                ${product.primary_image ?
                                    `<img src="${getImageUrl(product.primary_image)}" alt="${lang === 'ar' ? (product.name_ar || t('common.unknown', 'Unknown')) : (product.name_en || t('common.unknown', 'Unknown'))}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">` :
                                    `<div class="w-full h-full flex items-center justify-center text-olive-light bg-gray-50">
                                        <span class="material-symbols-outlined text-4xl">inventory_2</span>
                                    </div>`
                                }
                            </div>
                            <div>
                                <h3 class="font-bold text-olive-dark text-sm hover:text-primary cursor-pointer truncate">${lang === 'ar' ? (product.name_ar || t('common.unknown', 'Unknown')) : (product.name_en || t('common.unknown', 'Unknown'))}</h3>
                                <div class="flex justify-between items-center mt-1">
                                    <span class="text-primary font-bold text-sm">${formatPrice(product.price)}</span>
                                </div>
                            </div>
                        </a>
                    `).join('');
                } else {
                    container.innerHTML = `<p class="col-span-full text-center text-olive-light">${t('product.relatedEmpty', 'No related products')}</p>`;
                }
            }
        } catch (error) {
            console.error('Error loading related products:', error);
        }
    }

    // Cart management
    function getCart() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    }

    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
    }

    function addToCart(item, qty = 1) {
        const cart = getCart();
        const existingItem = cart.find(cartItem => cartItem.id === item.id);

        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                name_ar: item.name_ar,
                name_en: item.name_en,
                slug: item.slug,
                price: item.price,
                image: item.image,
                quantity: qty,
                lang: lang
            });
        }

        saveCart(cart);
        showToast(t('products.addedToCart', 'Added to cart'), 'success');
    }

    function updateCartBadge() {
        const cart = getCart();
        const badge = document.getElementById('cart-badge');
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);

        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // Quantity controls
    document.getElementById('qty-increase').addEventListener('click', function () {
        if (productData && quantity < (productData.stock || 999)) {
            quantity++;
            document.getElementById('quantity').value = formatNumber(quantity);
        }
    });

    document.getElementById('qty-decrease').addEventListener('click', function () {
        if (quantity > 1) {
            quantity--;
            document.getElementById('quantity').value = formatNumber(quantity);
        }
    });

    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.value = formatNumber(quantity);
    }

    // Add to cart
    document.getElementById('add-to-cart-btn').addEventListener('click', function () {
        if (!productData || productData.stock <= 0) return;

        const name = lang === 'ar'
            ? (productData.name_ar || t('common.unknown', 'Unknown'))
            : (productData.name_en || t('common.unknown', 'Unknown'));
        const imageUrl = getImageUrl(productData.primary_image) || (Array.isArray(productData.images) ? getImageUrl(productData.images[0]) : '');

        addToCart({
            id: productData.id,
            name,
            name_ar: productData.name_ar || '',
            name_en: productData.name_en || '',
            slug: productData.slug,
            price: productData.price,
            image: imageUrl || '/images/placeholder-product.png'
        }, quantity);
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            // Update button states
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active', 'border-primary', 'text-primary', 'font-bold');
                b.classList.add('border-transparent', 'text-olive-light', 'font-medium');
            });
            this.classList.add('active', 'border-primary', 'text-primary', 'font-bold');
            this.classList.remove('border-transparent', 'text-olive-light', 'font-medium');

            // Show corresponding content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${this.dataset.tab}`).classList.remove('hidden');
        });
    });

    // Account menu toggle
    const accountBtn = document.getElementById('account-btn');
    const accountMenu = document.getElementById('account-menu');

    if (accountBtn && accountMenu) {
        accountBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            accountMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', function() {
            accountMenu.classList.add('hidden');
        });
    }

    // Initialize cart badge
    updateCartBadge();

    // Load product data
    loadProduct();
});
