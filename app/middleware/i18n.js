/**
 * i18n Middleware - Server-side internationalization
 * Reads language from cookie/localStorage header and provides translations to templates
 */
const fs = require('fs');
const path = require('path');

// Cache translations in memory
let translationsCache = {};

// Check if in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Load translations
function loadTranslations(lang) {
    // In development, always reload to pick up changes
    if (!isDevelopment && translationsCache[lang]) {
        return translationsCache[lang];
    }

    try {
        const filePath = path.join(__dirname, '..', '..', 'public', 'locales', `${lang}.json`);
        const content = fs.readFileSync(filePath, 'utf-8');
        translationsCache[lang] = JSON.parse(content);
        return translationsCache[lang];
    } catch (error) {
        console.warn(`Failed to load translations for ${lang}:`, error.message);
        return {};
    }
}

// Get nested translation value
function getTranslation(translations, key, fallback = '') {
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

// Language config
const langConfig = {
    ar: { dir: 'rtl', name: 'العربية', flag: '🇪🇬' },
    en: { dir: 'ltr', name: 'English', flag: '🇬🇧' }
};

// Middleware
function i18nMiddleware(req, res, next) {
    // Get language from query param, cookie, or default to 'ar'
    const lang = req.query.lang || req.cookies?.lang || 'ar';
    const validLang = langConfig[lang] ? lang : 'ar';

    const translations = loadTranslations(validLang);
    const config = langConfig[validLang];

    // Translation function
    const t = (key, fallback) => getTranslation(translations, key, fallback);

    // Make available to templates
    res.locals.lang = validLang;
    res.locals.dir = config.dir;
    res.locals.langName = config.name;
    res.locals.langFlag = config.flag;
    res.locals.t = t;
    res.locals.translations = translations;
    res.locals.isRTL = validLang === 'ar';
    res.locals.isEnglish = validLang === 'en';

    next();
}

module.exports = i18nMiddleware;
