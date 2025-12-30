/**
 * Olive Store - Internationalization (i18n) Module
 * Supports Arabic (ar) and English (en)
 */

const I18n = (function () {
    // Default language
    let currentLang = localStorage.getItem('lang') || 'ar';
    let translations = {};

    // Language configurations
    const langConfig = {
        ar: { dir: 'rtl', name: 'العربية', flag: '🇪🇬' },
        en: { dir: 'ltr', name: 'English', flag: '🇬🇧' }
    };

    // Initialize
    async function init() {
        await loadTranslations(currentLang);
        applyLanguage();
        translatePage();
    }

    // Load translations from JSON file
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`/locales/${lang}.json`);
            if (response.ok) {
                translations = await response.json();
            } else {
                console.warn(`Failed to load translations for ${lang}`);
                translations = {};
            }
        } catch (error) {
            console.error('Error loading translations:', error);
            translations = {};
        }
    }

    // Apply language settings to document
    function applyLanguage() {
        const config = langConfig[currentLang];
        document.documentElement.lang = currentLang;
        document.documentElement.dir = config.dir;

        // Update body class for CSS targeting
        document.body.classList.remove('lang-ar', 'lang-en');
        document.body.classList.add(`lang-${currentLang}`);

        // Update language switcher displays
        document.querySelectorAll('[data-current-lang]').forEach(el => {
            el.textContent = config.name;
        });
        document.querySelectorAll('[data-current-flag]').forEach(el => {
            el.textContent = config.flag;
        });
    }

    // Get translation by key (supports nested keys: "nav.home")
    function t(key, fallback = '') {
        const keys = key.split('.');
        let value = translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return fallback || key;
            }
        }

        return typeof value === 'string' ? value : (fallback || key);
    }

    // Translate all elements with data-i18n attribute
    function translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = t(key);

            if (translation && translation !== key) {
                // Check if it's an input placeholder
                if (el.hasAttribute('placeholder')) {
                    el.setAttribute('placeholder', translation);
                } else if (el.hasAttribute('data-i18n-attr')) {
                    // Custom attribute translation
                    const attr = el.getAttribute('data-i18n-attr');
                    el.setAttribute(attr, translation);
                } else {
                    el.textContent = translation;
                }
            }
        });

        // Translate placeholders specifically
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = t(key);
            if (translation && translation !== key) {
                el.setAttribute('placeholder', translation);
            }
        });

        // Translate titles
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translation = t(key);
            if (translation && translation !== key) {
                el.setAttribute('title', translation);
            }
        });
    }

    // Switch language
    async function setLanguage(lang) {
        if (lang === currentLang) return;
        if (!langConfig[lang]) {
            console.error(`Unsupported language: ${lang}`);
            return;
        }

        currentLang = lang;
        localStorage.setItem('lang', lang);

        // Set cookie for server-side reading (expires in 1 year)
        document.cookie = `lang=${lang};path=/;max-age=${365 * 24 * 60 * 60}`;

        // Reload page to apply full translation
        // This is the standard approach for server-rendered pages
        window.location.reload();
    }

    // Get current language
    function getCurrentLanguage() {
        return currentLang;
    }

    // Get language config
    function getConfig(lang) {
        return langConfig[lang || currentLang];
    }

    // Get all available languages
    function getLanguages() {
        return Object.entries(langConfig).map(([code, config]) => ({
            code,
            ...config
        }));
    }

    // Format number based on language
    function formatNumber(num) {
        if (currentLang === 'ar') {
            const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
            return String(num).split('').map(d => {
                const digit = parseInt(d);
                return isNaN(digit) ? d : arabicNums[digit];
            }).join('');
        }
        return String(num);
    }

    // Format price based on language
    function formatPrice(price) {
        const num = parseFloat(price || 0).toFixed(0);
        if (currentLang === 'ar') {
            return formatNumber(num) + ' ج.م';
        }
        return 'EGP ' + num;
    }

    // Public API
    return {
        init,
        t,
        setLanguage,
        getCurrentLanguage,
        getConfig,
        getLanguages,
        formatNumber,
        formatPrice,
        translatePage
    };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    I18n.init();
});
