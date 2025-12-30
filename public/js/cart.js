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
