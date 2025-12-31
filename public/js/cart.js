/**
 * Olive Store - Cart Module
 * Manages shopping cart with localStorage persistence
 */
const Cart = (function () {
    const CART_KEY = 'cart';

    // Get cart from storage
    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY)) || [];
        } catch {
            return [];
        }
    }

    // Save cart to storage
    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateBadge();
        dispatchEvent();
    }

    // Get all items
    function getItems() {
        return getCart();
    }

    // Get item count
    function getCount() {
        return getCart().reduce((sum, item) => sum + item.quantity, 0);
    }

    // Get total price
    function getTotal() {
        return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Add item to cart
    function addItem(product, quantity = 1) {
        const cart = getCart();
        const existingIndex = cart.findIndex(item => item.id === product.id);

        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: parseFloat(product.price),
                image: product.image || product.images?.[0]?.url || Config.PLACEHOLDER_PRODUCT,
                quantity: quantity,
            });
        }

        saveCart(cart);
        return cart;
    }

    // Update item quantity
    function updateQuantity(productId, quantity) {
        const cart = getCart();
        const index = cart.findIndex(item => item.id === productId);

        if (index > -1) {
            if (quantity <= 0) {
                cart.splice(index, 1);
            } else {
                cart[index].quantity = quantity;
            }
            saveCart(cart);
        }

        return cart;
    }

    // Remove item
    function removeItem(productId) {
        const cart = getCart().filter(item => item.id !== productId);
        saveCart(cart);
        return cart;
    }

    // Clear cart
    function clear() {
        localStorage.removeItem(CART_KEY);
        updateBadge();
        dispatchEvent();
    }

    // Update cart badge in header
    function updateBadge() {
        const badge = document.getElementById('cart-badge');
        if (badge) {
            const count = getCount();
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    // Dispatch cart changed event
    function dispatchEvent() {
        window.dispatchEvent(new CustomEvent('cartChanged', {
            detail: { items: getCart(), count: getCount(), total: getTotal() }
        }));
    }

    // Initialize - update badge
    function init() {
        updateBadge();
    }

    return {
        getItems,
        getCount,
        getTotal,
        addItem,
        updateQuantity,
        removeItem,
        clear,
        updateBadge,
        init,
    };
})();

// Make available globally
window.Cart = Cart;

// Initialize on load
document.addEventListener('DOMContentLoaded', Cart.init);

// Cart page specific functionality
document.addEventListener('DOMContentLoaded', () => {
    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;

    // Update formatPrice to use Utils or I18n
    function formatPrice(amount) {
        if (typeof Utils !== 'undefined' && Utils.formatPrice) {
            return Utils.formatPrice(amount, lang);
        }
        return amount + ' ' + (lang === 'ar' ? 'ج.م' : 'EGP');
    }

    renderCart();

    // Listen for cart updates - if your Cart system emits events
    // window.addEventListener('cart-updated', () => { renderCart(); });

    function renderCart() {
        const cart = Cart.getItems(); // Assuming Cart.getItems() exists based on previous file content
        const container = document.getElementById('cart-items');
        const emptyState = document.getElementById('empty-cart');
        const cartContent = document.getElementById('cart-content');
        const summary = document.getElementById('order-summary');
        const itemsCount = document.getElementById('items-count');

        // Update header count
        if (itemsCount) {
            const count = Cart.getCount();
            const countLabel = t('cart.itemUnit', 'منتج');
            itemsCount.textContent = `${typeof Utils !== 'undefined' ? Utils.toArabicNumerals(count, lang) : count} ${countLabel}`;
        }

        if (cart.length === 0) {
            cartContent.classList.add('hidden');
            summary.classList.add('hidden');
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
            return;
        }

        // Show items
        cartContent.classList.remove('hidden');
        summary.classList.remove('hidden');
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');

        let subtotal = 0;

        container.innerHTML = cart.map((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            return `
                <div class="p-4 md:p-6 flex flex-col md:grid md:grid-cols-12 gap-4 items-center group hover:bg-gray-50/50 transition-colors">
                    <!-- Product Info -->
                    <div class="w-full md:col-span-6 flex items-center gap-4">
                        <div class="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                             ${item.image ?
                        `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">` :
                        `<div class="w-full h-full flex items-center justify-center text-gray-300">
                                        <span class="material-symbols-outlined text-3xl">image</span>
                                     </div>`
                    }
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-bold text-olive-dark text-lg truncate mb-1">
                                <a href="product.html?id=${item.id}" class="hover:text-primary transition-colors">${item.name}</a>
                            </h3>
                            <div class="text-sm text-olive-light mb-2 flex items-center gap-2">
                                <span class="md:hidden font-medium">${t('cart.price', 'السعر')}:</span>
                                ${formatPrice(item.price)}
                            </div>
                            <button onclick="removeItem('${item.id}')" class="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 transition-colors">
                                <span class="material-symbols-outlined text-base">delete</span>
                                ${t('cart.remove', 'حذف')}
                            </button>
                        </div>
                    </div>

                    <!-- Price (Desktop) -->
                    <div class="hidden md:block col-span-2 text-center font-bold text-olive-dark">
                        ${formatPrice(item.price)}
                    </div>

                    <!-- Quantity -->
                    <div class="w-full md:col-span-2 flex justify-center">
                        <div class="flex items-center border border-gray-200 rounded-lg bg-white h-10 w-32 shadow-sm">
                            <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})" 
                                class="w-10 h-full flex items-center justify-center text-olive-light hover:bg-gray-50 hover:text-primary transition-colors rounded-r-lg">
                                <span class="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <input type="text" value="${typeof Utils !== 'undefined' ? Utils.toArabicNumerals(item.quantity, lang) : item.quantity}" readonly 
                                class="w-12 h-full border-none text-center font-bold text-olive-dark focus:ring-0 p-0 text-sm bg-transparent">
                            <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})"
                                class="w-10 h-full flex items-center justify-center text-olive-light hover:bg-gray-50 hover:text-primary transition-colors rounded-l-lg">
                                <span class="material-symbols-outlined text-sm">add</span>
                            </button>
                        </div>
                    </div>

                    <!-- Total -->
                    <div class="w-full md:col-span-2 text-center flex justify-between md:justify-center items-center md:items-start text-lg">
                        <span class="md:hidden font-bold text-olive-light text-sm">${t('cart.total', 'الإجمالي')}:</span>
                        <span class="font-bold text-primary">${formatPrice(itemTotal)}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Update Summary
        const subtotalEl = document.getElementById('summary-subtotal');
        const totalEl = document.getElementById('summary-total');
        if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
        if (totalEl) totalEl.textContent = formatPrice(subtotal);

        // Shipping logic placeholder
        const shippingEl = document.getElementById('shipping');
        if (shippingEl) {
            // Keep "Calculated later" or similar for now
        }
    }

    window.updateQuantity = function (id, newQty) {
        if (newQty < 1) return;
        Cart.updateQuantity(id, newQty);
        renderCart();
    }

    window.removeItem = function (id) {
        Cart.removeItem(id);
        renderCart();
        Utils.showToast(t('cart.removed', 'تم حذف المنتج من السلة'), 'info');
    }

    document.getElementById('clear-cart-btn')?.addEventListener('click', function () {
        if (confirm(t('cart.confirmClear', 'هل أنت متأكد من إفراغ السلة؟'))) {
            Cart.clear();
            renderCart();
            Utils.showToast(t('cart.cleared', 'تم إفراغ السلة'), 'success');
        }
    });

    // Apply coupon
    document.getElementById('apply-coupon')?.addEventListener('click', function () {
        const code = document.getElementById('coupon-code').value.trim();
        const message = document.getElementById('coupon-message');

        if (!code) {
            message.textContent = t('cart.enterCoupon', 'الرجاء إدخال كود الخصم');
            message.classList.remove('hidden', 'text-green-600');
            message.classList.add('text-red-600');
            return;
        }

        // Mock validation
        message.textContent = t('cart.couponInvalid', 'كود الخصم غير صالح');
        message.classList.remove('hidden', 'text-green-600');
        message.classList.add('text-red-600');
    });
});
