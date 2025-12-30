/**
 * Olive Store - API Configuration
 */
const Config = {
    // API base URL
    API_URL: '/api',

    // Token storage keys
    TOKEN_KEY: 'token',
    ADMIN_TOKEN_KEY: 'adminToken',

    // Default pagination
    DEFAULT_PAGE_SIZE: 12,

    // Currency
    CURRENCY: 'EGP',
    CURRENCY_AR: 'ج.م',

    // Image placeholders
    PLACEHOLDER_PRODUCT: '/images/placeholder-product.png',
    PLACEHOLDER_CATEGORY: '/images/placeholder-category.png',
    PLACEHOLDER_USER: '/images/placeholder-user.png',

    // R2 public base URL (set on window.R2_PUBLIC_URL if available)
    R2_PUBLIC_URL: typeof window !== 'undefined' && window.R2_PUBLIC_URL ? window.R2_PUBLIC_URL : '',
};

// Make available globally
window.Config = Config;
