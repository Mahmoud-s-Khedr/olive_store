/**
 * Olive Store - Utility Functions
 */
const Utils = {
    // Format price based on language
    formatPrice(price, lang = 'ar') {
        const num = parseFloat(price || 0).toFixed(0);
        if (lang === 'ar' || (typeof I18n !== 'undefined' && I18n.getCurrentLanguage() === 'ar')) {
            return Utils.toArabicNumerals(num) + ' ' + Config.CURRENCY_AR;
        }
        return Config.CURRENCY + ' ' + num;
    },

    // Convert to Arabic numerals
    toArabicNumerals(num) {
        const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return String(num).split('').map(d => {
            const digit = parseInt(d);
            return isNaN(digit) ? d : arabicNums[digit];
        }).join('');
    },

    // Format date
    formatDate(date, lang = 'ar') {
        const d = new Date(date);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', options);
    },

    // Format date time
    formatDateTime(date, lang = 'ar') {
        const d = new Date(date);
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', options);
    },

    // Truncate text
    truncate(text, length = 100) {
        if (!text || text.length <= length) return text;
        return text.substring(0, length) + '...';
    },

    // Show toast notification
    showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
        toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in`;

        const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
        toast.innerHTML = `
            <span class="material-symbols-outlined text-lg">${icon}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('animate-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Debounce function
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Parse query string
    parseQuery() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    },

    // Get image URL with fallback
    getImageUrl(url, fallback = Config.PLACEHOLDER_PRODUCT) {
        return url || fallback;
    },

    // Create skeleton loader HTML
    skeleton(type = 'text', count = 1) {
        const skeletons = {
            text: '<div class="h-4 bg-gray-200 rounded animate-pulse"></div>',
            card: `<div class="bg-white rounded-xl p-4 animate-pulse">
                <div class="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div class="h-4 bg-gray-200 rounded mb-2"></div>
                <div class="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>`,
            row: `<div class="flex gap-4 p-4 animate-pulse">
                <div class="w-12 h-12 bg-gray-200 rounded"></div>
                <div class="flex-1 space-y-2">
                    <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>`,
        };

        return Array(count).fill(skeletons[type] || skeletons.text).join('');
    },

    // Validate email
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Validate phone (Egyptian format)
    isValidPhone(phone) {
        return /^(\+20|0)?1[0-2,5]\d{8}$/.test(phone.replace(/\s/g, ''));
    },

    // Get order status badge
    getStatusBadge(status, lang = 'ar') {
        const statuses = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', ar: 'قيد الانتظار', en: 'Pending' },
            processing: { bg: 'bg-blue-100', text: 'text-blue-800', ar: 'جاري التجهيز', en: 'Processing' },
            shipped: { bg: 'bg-purple-100', text: 'text-purple-800', ar: 'تم الشحن', en: 'Shipped' },
            delivered: { bg: 'bg-green-100', text: 'text-green-800', ar: 'تم التوصيل', en: 'Delivered' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', ar: 'ملغي', en: 'Cancelled' },
        };

        const s = statuses[status] || statuses.pending;
        const label = lang === 'ar' ? s.ar : s.en;
        return `<span class="${s.bg} ${s.text} text-xs font-medium px-2.5 py-0.5 rounded-full">${label}</span>`;
    },
};

// Make available globally
window.Utils = Utils;
