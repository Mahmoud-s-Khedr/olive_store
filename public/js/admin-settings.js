// admin-settings.js

document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    
    // Event listeners
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
});

async function loadSettings() {
    try {
        const response = await fetch('/api/admin/settings');
        const settings = await response.json();
        
        populateForm(settings);
    } catch (error) {
        console.error('Error loading settings:', error);
        alert('خطأ في تحميل الإعدادات');
    }
}

function populateForm(settings) {
    // General settings
    document.getElementById('site-title').value = settings.site_title || '';
    document.getElementById('site-description').value = settings.site_description || '';
    document.getElementById('admin-email').value = settings.admin_email || '';
    document.getElementById('admin-phone').value = settings.admin_phone || '';
    document.getElementById('timezone').value = settings.timezone || 'Africa/Cairo';
    document.getElementById('language').value = settings.language || 'ar';
    
    // Store settings
    document.getElementById('store-name').value = settings.store_name || '';
    document.getElementById('store-address').value = settings.store_address || '';
    document.getElementById('store-phone').value = settings.store_phone || '';
    document.getElementById('store-email').value = settings.store_email || '';
    document.getElementById('store-description').value = settings.store_description || '';
    document.getElementById('store-active').checked = settings.store_active !== false;
    document.getElementById('maintenance-mode').checked = settings.maintenance_mode || false;
    
    // Shipping settings
    document.getElementById('free-shipping-threshold').value = settings.free_shipping_threshold || '';
    document.getElementById('default-shipping-cost').value = settings.default_shipping_cost || '';
    document.getElementById('shipping-zones').value = settings.shipping_zones || '';
    document.getElementById('estimated-delivery').value = settings.estimated_delivery || '';
    
    // Payment settings
    document.getElementById('payment-cash').checked = settings.payment_methods?.cash !== false;
    document.getElementById('payment-card').checked = settings.payment_methods?.card || false;
    document.getElementById('payment-bank').checked = settings.payment_methods?.bank || false;
    document.getElementById('currency').value = settings.currency || 'EGP';
    document.getElementById('tax-rate').value = settings.tax_rate || '';
    
    // Email settings
    document.getElementById('smtp-host').value = settings.smtp?.host || '';
    document.getElementById('smtp-port').value = settings.smtp?.port || '';
    document.getElementById('smtp-username').value = settings.smtp?.username || '';
    document.getElementById('smtp-password').value = settings.smtp?.password || '';
    document.getElementById('email-notifications').checked = settings.email_notifications !== false;
    
    // Security settings
    document.getElementById('min-password-length').value = settings.security?.min_password_length || 8;
    document.getElementById('password-expiry').value = settings.security?.password_expiry || '';
    document.getElementById('two-factor-auth').checked = settings.security?.two_factor_auth || false;
    document.getElementById('login-attempts').checked = settings.security?.login_attempts || false;
    document.getElementById('ip-whitelist').checked = settings.security?.ip_whitelist || false;
    document.getElementById('session-timeout').value = settings.security?.session_timeout || 60;
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-b-2', 'border-primary', 'text-primary');
        btn.classList.add('text-text-secondary');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active', 'border-b-2', 'border-primary', 'text-primary');
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('text-text-secondary');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

async function saveSettings() {
    const settings = {
        // General
        site_title: document.getElementById('site-title').value,
        site_description: document.getElementById('site-description').value,
        admin_email: document.getElementById('admin-email').value,
        admin_phone: document.getElementById('admin-phone').value,
        timezone: document.getElementById('timezone').value,
        language: document.getElementById('language').value,
        
        // Store
        store_name: document.getElementById('store-name').value,
        store_address: document.getElementById('store-address').value,
        store_phone: document.getElementById('store-phone').value,
        store_email: document.getElementById('store-email').value,
        store_description: document.getElementById('store-description').value,
        store_active: document.getElementById('store-active').checked,
        maintenance_mode: document.getElementById('maintenance-mode').checked,
        
        // Shipping
        free_shipping_threshold: parseFloat(document.getElementById('free-shipping-threshold').value) || 0,
        default_shipping_cost: parseFloat(document.getElementById('default-shipping-cost').value) || 0,
        shipping_zones: document.getElementById('shipping-zones').value,
        estimated_delivery: document.getElementById('estimated-delivery').value,
        
        // Payment
        payment_methods: {
            cash: document.getElementById('payment-cash').checked,
            card: document.getElementById('payment-card').checked,
            bank: document.getElementById('payment-bank').checked
        },
        currency: document.getElementById('currency').value,
        tax_rate: parseFloat(document.getElementById('tax-rate').value) || 0,
        
        // Email
        smtp: {
            host: document.getElementById('smtp-host').value,
            port: parseInt(document.getElementById('smtp-port').value) || 587,
            username: document.getElementById('smtp-username').value,
            password: document.getElementById('smtp-password').value
        },
        email_notifications: document.getElementById('email-notifications').checked,
        
        // Security
        security: {
            min_password_length: parseInt(document.getElementById('min-password-length').value) || 8,
            password_expiry: parseInt(document.getElementById('password-expiry').value) || 0,
            two_factor_auth: document.getElementById('two-factor-auth').checked,
            login_attempts: document.getElementById('login-attempts').checked,
            ip_whitelist: document.getElementById('ip-whitelist').checked,
            session_timeout: parseInt(document.getElementById('session-timeout').value) || 60
        }
    };
    
    try {
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            alert('تم حفظ الإعدادات بنجاح');
        } else {
            const error = await response.json();
            alert('خطأ: ' + (error.message || 'فشل في حفظ الإعدادات'));
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('خطأ في حفظ الإعدادات');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('sidebar-open');
    sidebar.classList.toggle('sidebar-closed');
}

function handleLogout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('admin_token');
        window.location.href = 'admin-login.html';
    }
}