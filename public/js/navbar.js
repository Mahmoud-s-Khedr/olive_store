// Shared navbar behavior for all public pages
document.addEventListener('DOMContentLoaded', function () {
    if (window.__navbarInitialized) return;
    window.__navbarInitialized = true;

    const langMenuBtn = document.getElementById('lang-menu-btn');
    const langDropdown = document.getElementById('lang-dropdown');
    const langContainer = document.getElementById('lang-menu-container');

    langMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown?.classList.toggle('hidden');
    });

    document.querySelectorAll('.lang-option').forEach((btn) => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            if (typeof I18n !== 'undefined') {
                I18n.setLanguage(lang);
            } else {
                localStorage.setItem('lang', lang);
                location.reload();
            }
            langDropdown?.classList.add('hidden');
        });
    });

    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const userContainer = document.getElementById('user-menu-container');

    userMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (langDropdown && langContainer && !langContainer.contains(e.target)) {
            langDropdown.classList.add('hidden');
        }
        if (userDropdown && userContainer && !userContainer.contains(e.target)) {
            userDropdown.classList.add('hidden');
        }
    });

    if (typeof AuthModule !== 'undefined' && typeof AuthModule.init === 'function') {
        AuthModule.init();
    }

    const isLoggedIn = Boolean(localStorage.getItem('token'));
    document.querySelectorAll('.guest-link').forEach((el) => {
        el.classList.toggle('hidden', isLoggedIn);
    });
    document.querySelectorAll('.user-link').forEach((el) => {
        el.classList.toggle('hidden', !isLoggedIn);
    });

    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    });

    // Mobile Menu Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMobileMenuBtn = document.getElementById('close-mobile-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileSearchToggle = document.getElementById('mobile-search-toggle');
    const mobileSearchInput = document.getElementById('search-input-mobile');

    function toggleMobileMenu(show) {
        if (!mobileMenu) return;
        if (show) {
            mobileMenu.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            mobileMenu.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    mobileMenuBtn?.addEventListener('click', () => toggleMobileMenu(true));
    closeMobileMenuBtn?.addEventListener('click', () => toggleMobileMenu(false));

    // Close menu when clicking outside (on the overlay)
    mobileMenu?.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
            toggleMobileMenu(false);
        }
    });

    // Mobile Search Interaction
    mobileSearchToggle?.addEventListener('click', () => {
        toggleMobileMenu(true);
        setTimeout(() => {
            mobileSearchInput?.focus();
        }, 100);
    });

    // Mobile Language Switcher
    document.querySelectorAll('.mobile-lang-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            if (typeof I18n !== 'undefined') {
                I18n.setLanguage(lang);
            } else {
                localStorage.setItem('lang', lang);
                location.reload();
            }
        });
    });

    // Mobile Logout
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    mobileLogoutBtn?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    });

    if (typeof Cart !== 'undefined' && typeof Cart.updateBadge === 'function') {
        Cart.updateBadge();
        const badge = document.getElementById('cart-badge');
        const badgeMobile = document.getElementById('cart-badge-mobile');
        if (badge && badgeMobile) {
            const count = badge.textContent;
            badgeMobile.textContent = count;
            // Only show if count > 0 or has content
            const hasCount = count && count !== '0';
            badgeMobile.classList.toggle('hidden', !hasCount);
            badge.classList.toggle('hidden', !hasCount);
        }
    }
});
