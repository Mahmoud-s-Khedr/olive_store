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

    // ========== ERROR HANDLING UTILITIES ==========

    /**
     * Parse API error response into user-friendly message
     */
    parseError(error, lang = 'ar') {
        const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;

        // Network/connection error
        if (error.status === 0 || error.message === 'Failed to fetch' || !navigator.onLine) {
            return t('errors.network', lang === 'ar' ? 'خطأ في الاتصال. تحقق من اتصالك بالإنترنت.' : 'Connection error. Please check your internet.');
        }

        // HTTP status code errors
        if (error.status) {
            switch (error.status) {
                case 400:
                    return error.message || t('errors.badRequest', lang === 'ar' ? 'البيانات المدخلة غير صحيحة' : 'Invalid input data');
                case 401:
                    return t('errors.unauthorized', lang === 'ar' ? 'يرجى تسجيل الدخول للمتابعة' : 'Please login to continue');
                case 403:
                    return t('errors.forbidden', lang === 'ar' ? 'غير مصرح لك بهذا الإجراء' : 'You are not authorized');
                case 404:
                    return t('errors.notFound', lang === 'ar' ? 'العنصر غير موجود' : 'Item not found');
                case 409:
                    return error.message || t('errors.conflict', lang === 'ar' ? 'البيانات موجودة بالفعل' : 'Data already exists');
                case 422:
                    return error.message || t('errors.validation', lang === 'ar' ? 'يرجى التحقق من البيانات المدخلة' : 'Please check your input');
                case 429:
                    return t('errors.tooMany', lang === 'ar' ? 'محاولات كثيرة. انتظر قليلاً.' : 'Too many attempts. Please wait.');
                case 500:
                case 502:
                case 503:
                    return t('errors.server', lang === 'ar' ? 'خطأ في الخادم. حاول لاحقاً.' : 'Server error. Try again later.');
                default:
                    break;
            }
        }

        // Return message from error or default
        return error.message || t('errors.unknown', lang === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    },

    /**
     * Display error in a specific container element
     */
    showError(containerId, message, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Error container not found:', containerId);
            return;
        }

        const { icon = 'error', dismissible = true, duration = 0 } = options;

        container.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-lg flex-shrink-0">${icon}</span>
                <span class="flex-1">${message}</span>
                ${dismissible ? `<button type="button" class="error-dismiss text-current opacity-70 hover:opacity-100" onclick="this.closest('[id]').classList.add('hidden')">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>` : ''}
            </div>
        `;
        container.classList.remove('hidden');

        if (duration > 0) {
            setTimeout(() => container.classList.add('hidden'), duration);
        }
    },

    /**
     * Hide error container
     */
    hideError(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add('hidden');
        }
    },

    /**
     * Show inline field error
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Add error styling to field
        field.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        field.classList.remove('border-gray-200', 'focus:border-primary', 'focus:ring-primary');

        // Find or create error message element
        let errorEl = field.parentElement.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('p');
            errorEl.className = 'field-error text-red-600 text-xs mt-1';
            field.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    },

    /**
     * Clear field error
     */
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Remove error styling
        field.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        field.classList.add('border-gray-200', 'focus:border-primary', 'focus:ring-primary');

        // Remove error message
        const errorEl = field.parentElement.querySelector('.field-error');
        if (errorEl) errorEl.remove();
    },

    /**
     * Clear all field errors in a form
     */
    clearAllFieldErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.querySelectorAll('.field-error').forEach(el => el.remove());
        form.querySelectorAll('.border-red-500').forEach(el => {
            el.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
            el.classList.add('border-gray-200', 'focus:border-primary', 'focus:ring-primary');
        });
    },

    /**
     * Handle validation errors from API (array of field errors)
     */
    handleValidationErrors(errors, formId) {
        if (!Array.isArray(errors)) return false;

        errors.forEach(err => {
            if (err.field || err.path) {
                Utils.showFieldError(err.field || err.path, err.message || err.msg);
            }
        });
        return true;
    },

    /**
     * Retry an async function with exponential backoff
     */
    async retry(asyncFn, options = {}) {
        const { maxRetries = 3, baseDelay = 1000, onRetry } = options;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await asyncFn();
            } catch (error) {
                lastError = error;

                // Don't retry on client errors (4xx) except 429
                if (error.status >= 400 && error.status < 500 && error.status !== 429) {
                    throw error;
                }

                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    if (onRetry) onRetry(attempt, delay);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    },

    /**
     * Wrap an async form handler with error handling
     */
    withErrorHandling(asyncHandler, options = {}) {
        const {
            errorContainerId,
            loadingButtonId,
            loadingText,
            originalText,
            formId,
            onError
        } = options;

        return async function (event) {
            if (event) event.preventDefault();

            const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';
            const btn = loadingButtonId ? document.getElementById(loadingButtonId) : null;
            const btnTextEl = btn?.querySelector('[id$="-text"]') || btn?.querySelector('span:first-child');
            const spinnerEl = btn?.querySelector('.spinner');

            // Clear previous errors
            if (errorContainerId) Utils.hideError(errorContainerId);
            if (formId) Utils.clearAllFieldErrors(formId);

            // Show loading
            if (btn) btn.disabled = true;
            if (btnTextEl && loadingText) btnTextEl.textContent = loadingText;
            if (spinnerEl) spinnerEl.classList.remove('hidden');

            try {
                return await asyncHandler.call(this, event);
            } catch (error) {
                console.error('Error:', error);

                // Handle validation errors
                if (error.errors && formId) {
                    Utils.handleValidationErrors(error.errors, formId);
                }

                // Show error message
                const message = Utils.parseError(error, lang);
                if (errorContainerId) {
                    Utils.showError(errorContainerId, message);
                } else {
                    Utils.showToast(message, 'error');
                }

                // Call custom error handler
                if (onError) onError(error);

                // Handle 401 - redirect to login
                if (error.status === 401) {
                    localStorage.removeItem('token');
                    setTimeout(() => {
                        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                    }, 1500);
                }
            } finally {
                // Reset loading state
                if (btn) btn.disabled = false;
                if (btnTextEl && originalText) btnTextEl.textContent = originalText;
                if (spinnerEl) spinnerEl.classList.add('hidden');
            }
        };
    },

    /**
     * Create error alert HTML
     */
    createErrorAlert(message, options = {}) {
        const { type = 'error', icon = 'error', dismissible = true } = options;
        const colors = {
            error: 'bg-red-50 border-red-200 text-red-700',
            warning: 'bg-amber-50 border-amber-200 text-amber-700',
            info: 'bg-blue-50 border-blue-200 text-blue-700',
        };

        return `
            <div class="${colors[type] || colors.error} border px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <span class="material-symbols-outlined text-lg flex-shrink-0">${icon}</span>
                <span class="flex-1">${message}</span>
                ${dismissible ? `<button type="button" onclick="this.parentElement.remove()" class="opacity-70 hover:opacity-100">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>` : ''}
            </div>
        `;
    },
};

// Make available globally
window.Utils = Utils;

