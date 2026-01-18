/**
 * Admin Layout Helper
 * Handles sidebar active states, mobile menu toggling, and theme management.
 */

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initMobileMenu();
    initThemeToggle();
    updatePageTitle();
    loadAdminUserInfo();
    initLogoutButton();
});

function initSidebar() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('aside nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Check if current path starts with the link href (for sub-pages)
        // Exact match for dashboard root '/admin' or '/admin/'
        const isMatch = (href === '/admin' && (currentPath === '/admin' || currentPath === '/admin/')) ||
            (href !== '/admin' && currentPath.startsWith(href));

        if (isMatch) {
            // Remove default text/hover classes
            link.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-gray-50', 'dark:hover:bg-white/5');

            // Add active state classes based on section theme
            // Default to primary (emerald) if no specific theme data found
            const theme = document.body.dataset.theme || 'primary';

            let activeBg, activeText, iconColor;

            switch (theme) {
                case 'orange': // Products
                    activeBg = 'bg-orange-50 dark:bg-orange-900/20';
                    activeText = 'text-orange-800 dark:text-orange-300';
                    iconColor = 'text-orange-600 dark:text-orange-500';
                    break;
                case 'green': // Categories
                    activeBg = 'bg-emerald-50 dark:bg-emerald-900/20';
                    activeText = 'text-emerald-800 dark:text-emerald-300';
                    iconColor = 'text-emerald-600 dark:text-emerald-500';
                    break;
                case 'blue': // Orders
                    activeBg = 'bg-blue-50 dark:bg-blue-900/20';
                    activeText = 'text-blue-800 dark:text-blue-300';
                    iconColor = 'text-blue-600 dark:text-blue-500';
                    break;
                case 'purple': // Customers
                    activeBg = 'bg-purple-50 dark:bg-purple-900/20';
                    activeText = 'text-purple-800 dark:text-purple-300';
                    iconColor = 'text-purple-600 dark:text-purple-500';
                    break;
                default: // Dashboard / Settings / Files
                    activeBg = 'bg-emerald-50 dark:bg-emerald-900/20';
                    activeText = 'text-emerald-800 dark:text-emerald-300';
                    iconColor = 'text-emerald-600 dark:text-primary';
            }

            // Apply classes
            link.className = `flex items-center gap-3 px-4 py-3 rounded-lg ${activeBg} ${activeText}`;

            // Update icon style
            const icon = link.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.classList.add('fill');
                icon.classList.remove('text-slate-600', 'dark:text-slate-400');
                // Remove any existing color classes and add the new one
                icon.className = icon.className.replace(/text-\w+-\d+/, '');
                icon.classList.add(...iconColor.split(' '));
            }
        }
    });
}

function initMobileMenu() {
    window.toggleMobileSidebar = function () {
        const sidebar = document.querySelector('aside');
        const overlay = document.getElementById('sidebar-overlay');

        if (sidebar) {
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('fixed');
            sidebar.classList.toggle('inset-0');
            sidebar.classList.toggle('z-50');
            sidebar.classList.toggle('w-full'); // Full width on mobile if needed, or stick to w-72
            // Better mobile style:
            if (sidebar.classList.contains('fixed')) {
                sidebar.classList.remove('hidden');
                // Add overlay if not exists
                if (!overlay) {
                    const newOverlay = document.createElement('div');
                    newOverlay.id = 'sidebar-overlay';
                    newOverlay.className = 'fixed inset-0 bg-black/50 z-40 lg:hidden';
                    newOverlay.onclick = toggleMobileSidebar;
                    document.body.appendChild(newOverlay);
                }
            } else {
                sidebar.classList.add('hidden');
                if (overlay) overlay.remove();
            }
        }
    };
}

function initThemeToggle() {
    // Check if dark mode is preferred
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function updatePageTitle() {
    // Update document title based on page content if needed
}

/**
 * Load admin user info from stored data or API
 */
function loadAdminUserInfo() {
    const adminNameEl = document.getElementById('admin-name');

    // Try to get user info from localStorage first
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (adminNameEl && user.name) {
                adminNameEl.textContent = user.name;
            }
            return;
        } catch (e) {
            console.error('Error parsing stored admin user:', e);
        }
    }

    // Try to decode from JWT token
    const token = localStorage.getItem(Config?.ADMIN_TOKEN_KEY || 'adminToken');
    if (token && adminNameEl) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.name) {
                adminNameEl.textContent = payload.name;
                // Store for future use
                localStorage.setItem('adminUser', JSON.stringify({ name: payload.name, email: payload.email }));
            }
        } catch (e) {
            console.error('Error decoding admin token:', e);
        }
    }
}

/**
 * Initialize logout button
 */
function initLogoutButton() {
    const logoutBtn = document.getElementById('sidebar-logout-btn');
    const logoutBtnAlt = document.getElementById('logout-btn');

    const handleLogout = () => {
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            if (typeof AuthModule !== 'undefined' && AuthModule.adminLogout) {
                AuthModule.adminLogout();
            } else {
                localStorage.removeItem(Config?.ADMIN_TOKEN_KEY || 'adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = '/pages/admin-login.html';
            }
        }
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutBtnAlt) logoutBtnAlt.addEventListener('click', handleLogout);

    // Global function for inline onclick handlers
    window.logout = handleLogout;
}

