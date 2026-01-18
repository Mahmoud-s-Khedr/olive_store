document.addEventListener('DOMContentLoaded', function () {
    const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
    const SHIPPING_COST = 50; // Dynamic later

    // Format price using Utils
    function formatPrice(price) {
        if (typeof Utils !== 'undefined' && Utils.formatPrice) {
            return Utils.formatPrice(price, lang);
        }
        return price + ' ' + (lang === 'ar' ? 'ج.م' : 'EGP');
    }

    // Check if logged in
    const isLoggedIn = typeof AuthModule !== 'undefined' && AuthModule.isLoggedIn();
    if (!isLoggedIn) {
        window.location.href = '/login?redirect=/checkout';
        return;
    }

    // Pre-fill user data if logged in
    if (isLoggedIn) {
        AuthModule.fetchUser().then(user => {
            if (user) {
                if (user.name) document.getElementById('name').value = user.name;
                if (user.email) document.getElementById('email').value = user.email;
                if (user.phone) document.getElementById('phone').value = user.phone;
            }
        });
    }

    // Initialize
    function init() {
        const cart = Cart.getItems();
        const emptyCart = document.getElementById('empty-cart');
        const checkoutForm = document.getElementById('checkout-form');

        if (cart.length === 0) {
            emptyCart.classList.remove('hidden');
            checkoutForm.classList.add('hidden');
            return;
        }

        emptyCart.classList.add('hidden');
        checkoutForm.classList.remove('hidden');

        // Render order items
        const orderItems = document.getElementById('order-items');
        orderItems.innerHTML = cart.map(item => {
            const displayName = lang === 'ar'
                ? (item.name_ar || (item.lang === 'ar' ? item.name : '') || t('common.unknown', 'Unknown'))
                : (item.name_en || (item.lang === 'en' ? item.name : '') || t('common.unknown', 'Unknown'));
            return `
        <div class="flex gap-3">
            <div class="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                ${item.image ?
                `<img src="${item.image}" alt="${displayName}" class="w-full h-full object-cover">` :
                `<div class="w-full h-full flex items-center justify-center text-olive-light">
                        <span class="material-symbols-outlined">inventory_2</span>
                    </div>`
            }
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-olive-dark truncate">${displayName}</h4>
                <p class="text-xs text-olive-light">${t('cart.quantity', 'Quantity')}: ${lang === 'ar' && typeof Utils !== 'undefined' ? Utils.toArabicNumerals(item.quantity) : item.quantity}</p>
                <p class="text-sm font-bold text-primary">${formatPrice(item.price * item.quantity)}</p>
            </div>
        </div>
    `}).join('');

        // Calculate totals
        const subtotal = Cart.getTotal();
        const total = subtotal + SHIPPING_COST;

        document.getElementById('subtotal').textContent = formatPrice(subtotal);
        document.getElementById('shipping').textContent = formatPrice(SHIPPING_COST);
        document.getElementById('total').textContent = formatPrice(total);
    }

    // Payment method styling
    document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
        radio.addEventListener('change', function () {
            document.querySelectorAll('.payment-option').forEach(opt => {
                opt.classList.remove('border-primary', 'bg-primary/5');
                opt.classList.add('border-gray-200');
            });
            this.closest('.payment-option').classList.add('border-primary', 'bg-primary/5');
            this.closest('.payment-option').classList.remove('border-gray-200');
        });
    });

    // Form submission
    document.getElementById('checkout-form')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const btn = document.getElementById('place-order-btn');
        const btnText = document.getElementById('place-order-text');
        const spinner = document.getElementById('place-order-spinner');

        // Hide error using Utils
        Utils.hideError('checkout-error');

        // Show loading
        btn.disabled = true;
        btnText.textContent = t('checkout.processing', 'Placing order...');
        spinner.classList.remove('hidden');

        try {
            const cart = Cart.getItems();

            // Check for empty cart
            if (!cart || cart.length === 0) {
                throw { status: 400, message: t('errors.cartEmpty', lang === 'ar' ? 'السلة فارغة' : 'Cart is empty') };
            }

            const formData = new FormData(this);

            const governorate = formData.get('governorate');
            const addressLine = formData.get('address');
            const combinedAddress = governorate ? `${addressLine} - ${governorate}` : addressLine;

            const orderData = {
                customer_name: formData.get('name'),
                phone: formData.get('phone'),
                address: combinedAddress,
                city: formData.get('city'),
                notes: formData.get('notes'),
                payment_method: formData.get('payment_method'),
                shipping_cost: SHIPPING_COST,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    product_image: item.image
                }))
            };

            const data = await Api.orders.create(orderData);

            // Show success toast
            Utils.showToast(t('orderSuccess.title', 'تم الطلب بنجاح!'), 'success');

            // Clear cart
            Cart.clear();

            // Redirect to success page
            window.location.href = `/order-success?order=${data.order?.order_number || data.order_number || data.orderId || ''}`;
        } catch (error) {
            console.error('Checkout error:', error);
            // Use Utils.parseError for consistent error messages
            const errorMsg = Utils.parseError(error, lang);
            Utils.showError('checkout-error', errorMsg);
            Utils.showToast(errorMsg, 'error');
        } finally {
            btn.disabled = false;
            btnText.textContent = t('checkout.placeOrder', 'تأكيد الطلب');
            spinner.classList.add('hidden');
        }
    });

    // Initialize
    init();
});
