/**
 * Olive Store - Authentication Module
 */
const AuthModule = (function () {
    let currentUser = null;

    // Check if user is logged in
    function isLoggedIn() {
        return !!localStorage.getItem(Config.TOKEN_KEY);
    }

    // Check if admin is logged in
    function isAdminLoggedIn() {
        return !!localStorage.getItem(Config.ADMIN_TOKEN_KEY);
    }

    // Get current user
    function getUser() {
        return currentUser;
    }

    // Set user data
    function setUser(user) {
        currentUser = user;
    }

    // Login
    async function login(email, password) {
        const response = await Api.auth.login(email, password);
        if (response.token) {
            localStorage.setItem(Config.TOKEN_KEY, response.token);
            currentUser = response.user;
        }
        return response;
    }

    // Admin login
    async function adminLogin(email, password) {
        const response = await Api.admin.login(email, password);
        if (!response.user || !response.user.is_admin) {
            throw { status: 403, message: 'Access denied' };
        }
        if (response.token) {
            localStorage.setItem(Config.ADMIN_TOKEN_KEY, response.token);
            // Store admin user info for sidebar display
            localStorage.setItem('adminUser', JSON.stringify({
                name: response.user.name,
                email: response.user.email
            }));
        }
        return response;
    }

    // Register
    async function register(data) {
        return await Api.auth.register(data);
    }

    // Logout
    function logout() {
        localStorage.removeItem(Config.TOKEN_KEY);
        currentUser = null;
        window.location.href = '/login';
    }

    // Admin logout
    function adminLogout() {
        localStorage.removeItem(Config.ADMIN_TOKEN_KEY);
        localStorage.removeItem('adminUser');
        window.location.href = '/pages/admin-login.html';
    }

    // Fetch current user data
    async function fetchUser() {
        if (!isLoggedIn()) return null;

        try {
            const response = await Api.auth.me();
            currentUser = response.user || response;
            return currentUser;
        } catch (error) {
            if (error.status === 401) {
                localStorage.removeItem(Config.TOKEN_KEY);
                currentUser = null;
            }
            return null;
        }
    }

    // Initialize - update UI based on auth state
    function init() {
        updateUI();

        // Try to fetch user if logged in
        if (isLoggedIn()) {
            fetchUser().then(updateUI);
        }
    }

    // Update UI based on auth state
    function updateUI() {
        const loggedInMenu = document.getElementById('logged-in-menu');
        const loggedOutMenu = document.getElementById('logged-out-menu');

        if (isLoggedIn()) {
            if (loggedInMenu) loggedInMenu.classList.remove('hidden');
            if (loggedOutMenu) loggedOutMenu.classList.add('hidden');
        } else {
            if (loggedInMenu) loggedInMenu.classList.add('hidden');
            if (loggedOutMenu) loggedOutMenu.classList.remove('hidden');
        }

        // Setup logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }

    // Require auth - redirect if not logged in
    function requireAuth() {
        if (!isLoggedIn()) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            return false;
        }
        return true;
    }

    // Require admin auth
    function requireAdminAuth() {
        if (!isAdminLoggedIn()) {
            window.location.href = '/admin/login';
            return false;
        }
        return true;
    }

    return {
        isLoggedIn,
        isAdminLoggedIn,
        getUser,
        setUser,
        login,
        adminLogin,
        register,
        logout,
        adminLogout,
        fetchUser,
        init,
        updateUI,
        requireAuth,
        requireAdminAuth,
    };
})();

// Make available globally
window.AuthModule = AuthModule;
