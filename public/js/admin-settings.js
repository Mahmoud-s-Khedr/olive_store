/**
 * Admin Settings JavaScript
 * Uses Api module for backend integration
 */

document.addEventListener('DOMContentLoaded', function () {
    // Check admin authentication
    if (!AuthModule.requireAdminAuth()) {
        return;
    }

    loadSettings();

    // Event listeners
    const saveBtn = document.getElementById('save-settings-btn');
    const mobileSaveBtn = document.getElementById('save-settings-btn-mobile');

    if (saveBtn) saveBtn.addEventListener('click', saveSettings);
    if (mobileSaveBtn) mobileSaveBtn.addEventListener('click', saveSettings);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
});

const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

async function loadSettings() {
    try {
        const data = await Api.admin.settings.list();
        const settings = data.settings || data.data || data || [];

        // Convert array of settings to key-value object
        const settingsMap = {};
        if (Array.isArray(settings)) {
            settings.forEach(s => {
                settingsMap[s.key] = s.value;
            });
        } else {
            Object.assign(settingsMap, settings);
        }

        populateForm(settingsMap);
    } catch (error) {
        console.error('Error loading settings:', error);
        Utils.showToast(Utils.parseError(error, lang), 'error');
    }
}

function populateForm(settings) {
    // Helper to safely set value
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined && val !== null ? val : '';
    };
    const setCheck = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = val === true || val === 'true' || val === '1';
    };

    // General settings
    setVal('site-title', settings.store_name_ar || settings.site_title);
    setVal('site-title-en', settings.store_name_en);
    setVal('site-description', settings.site_description);
    setVal('admin-email', settings.store_email || settings.admin_email);
    setVal('admin-phone', settings.store_phone || settings.admin_phone);
    setVal('timezone', settings.timezone || 'Africa/Cairo');
    setVal('language', settings.default_language || settings.language || 'ar');

    // Store settings
    setVal('store-name', settings.store_name_ar);
    setVal('store-name-en', settings.store_name_en);
    setVal('store-address', settings.store_address_ar);
    setVal('store-address-en', settings.store_address_en);
    setVal('store-phone', settings.store_phone);
    setVal('store-email', settings.store_email);
    setVal('store-description', settings.store_description);
    setCheck('store-active', settings.store_active !== false && settings.store_active !== 'false');
    setCheck('maintenance-mode', settings.maintenance_mode);

    // Shipping settings
    setVal('free-shipping-threshold', settings.free_shipping_minimum);
    setVal('default-shipping-cost', settings.shipping_cost);
    setVal('shipping-zones', settings.shipping_zones);
    setVal('estimated-delivery', settings.estimated_delivery);

    // Payment settings
    setVal('vodafone-number', settings.vodafone_number);
    setVal('instapay-username', settings.instapay_username);
    setVal('fawry-code', settings.fawry_code);
    setVal('bank-name', settings.bank_name);
    setVal('bank-account', settings.bank_account);
    setVal('bank-iban', settings.bank_iban);
    setVal('currency', settings.currency || 'EGP');
    setVal('tax-rate', settings.tax_rate);

    // Email settings
    setVal('smtp-host', settings.smtp_host);
    setVal('smtp-port', settings.smtp_port);
    setVal('smtp-username', settings.smtp_username);
    setVal('smtp-password', settings.smtp_password);
    setCheck('email-notifications', settings.email_notifications !== false);

    // Security settings
    setVal('min-password-length', settings.min_password_length || 8);
    setCheck('two-factor-auth', settings.two_factor_auth);
    setVal('session-timeout', settings.session_timeout || 60);
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabName;

        if (isActive) {
            btn.classList.add('active', 'bg-white', 'text-slate-800', 'shadow-sm', 'border', 'border-gray-100');
            btn.classList.remove('text-slate-500', 'hover:bg-gray-100');
        } else {
            btn.classList.remove('active', 'bg-white', 'text-slate-800', 'shadow-sm', 'border', 'border-gray-100');
            btn.classList.add('text-slate-500', 'hover:bg-gray-100');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
    });

    const targetContent = document.getElementById(`${tabName}-tab`);
    if (targetContent) {
        targetContent.classList.add('active');
        targetContent.classList.remove('hidden');
    }
}

async function saveSettings() {
    // Button loading state
    const btns = [document.getElementById('save-settings-btn'), document.getElementById('save-settings-btn-mobile')];
    const originalTexts = [];

    btns.forEach((btn, index) => {
        if (btn) {
            originalTexts[index] = btn.innerHTML;
            btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> ${t('actions.saving', 'جار الحفظ...')}`;
            btn.disabled = true;
        }
    });

    // Helper to get value
    const getVal = (id) => document.getElementById(id)?.value || '';
    const getCheck = (id) => document.getElementById(id)?.checked || false;

    // Collect all settings
    const settingsToUpdate = [
        // General / Store
        { key: 'store_name_ar', value: getVal('site-title') || getVal('store-name'), type: 'string', group_name: 'general' },
        { key: 'store_name_en', value: getVal('site-title-en') || getVal('store-name-en'), type: 'string', group_name: 'general' },
        { key: 'store_email', value: getVal('store-email') || getVal('admin-email'), type: 'string', group_name: 'general' },
        { key: 'store_phone', value: getVal('store-phone') || getVal('admin-phone'), type: 'string', group_name: 'general' },
        { key: 'store_address_ar', value: getVal('store-address'), type: 'string', group_name: 'general' },
        { key: 'store_address_en', value: getVal('store-address-en'), type: 'string', group_name: 'general' },
        { key: 'currency', value: getVal('currency') || 'EGP', type: 'string', group_name: 'general' },

        // Shipping
        { key: 'shipping_cost', value: getVal('default-shipping-cost'), type: 'number', group_name: 'shipping' },
        { key: 'free_shipping_minimum', value: getVal('free-shipping-threshold'), type: 'number', group_name: 'shipping' },

        // Payment
        { key: 'vodafone_number', value: getVal('vodafone-number'), type: 'string', group_name: 'payment' },
        { key: 'instapay_username', value: getVal('instapay-username'), type: 'string', group_name: 'payment' },
        { key: 'fawry_code', value: getVal('fawry-code'), type: 'string', group_name: 'payment' },
        { key: 'bank_name', value: getVal('bank-name'), type: 'string', group_name: 'payment' },
        { key: 'bank_account', value: getVal('bank-account'), type: 'string', group_name: 'payment' },
        { key: 'bank_iban', value: getVal('bank-iban'), type: 'string', group_name: 'payment' },
    ];

    try {
        await Api.admin.settings.update(settingsToUpdate);

        // Success feedback
        btns.forEach((btn, index) => {
            if (btn) {
                btn.innerHTML = `<span class="material-symbols-outlined text-[20px]">check</span> ${t('actions.saved', 'تم الحفظ')}`;
                btn.classList.remove('bg-slate-800', 'hover:bg-slate-900');
                btn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');

                setTimeout(() => {
                    btn.innerHTML = originalTexts[index];
                    btn.disabled = false;
                    btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
                    btn.classList.add('bg-slate-800', 'hover:bg-slate-900');
                }, 2000);
            }
        });

        Utils.showToast(t('admin.settings.saved', 'تم حفظ الإعدادات بنجاح'), 'success');

    } catch (error) {
        console.error('Error saving settings:', error);
        Utils.showToast(Utils.parseError(error, lang), 'error');

        btns.forEach((btn, index) => {
            if (btn) {
                btn.innerHTML = originalTexts[index];
                btn.disabled = false;
            }
        });
    }
}
