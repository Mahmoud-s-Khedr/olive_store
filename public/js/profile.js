// Profile page functionality
document.addEventListener('DOMContentLoaded', async function () {
    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
    const token = localStorage.getItem('token');

    // Redirect if not logged in
    if (!token) {
        window.location.href = 'login.html?redirect=profile.html';
        return;
    }

    // Load user data
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const user = data.user || data;

            document.getElementById('name').value = user.name || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('phone').value = user.phone || '';
            document.getElementById('user-avatar').textContent = user.name ? user.name.charAt(0) : 'U';
        } else if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html?redirect=profile.html';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }

    // Profile form submission
    document.getElementById('profile-form')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const profileBtn = document.getElementById('profile-btn');
        const profileBtnText = document.getElementById('profile-btn-text');
        const profileSpinner = document.getElementById('profile-spinner');
        const profileSuccess = document.getElementById('profile-success');
        const profileError = document.getElementById('profile-error');
        const profileErrorMessage = document.getElementById('profile-error-message');

        // Hide messages using Utils
        Utils.hideError('profile-error');
        profileSuccess.classList.add('hidden');

        // Show loading
        profileBtn.disabled = true;
        profileBtnText.textContent = t('common.saving', 'جاري الحفظ...');
        profileSpinner.classList.remove('hidden');

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: document.getElementById('name').value,
                    phone: document.getElementById('phone').value
                })
            });

            const data = await response.json();

            if (response.ok) {
                profileSuccess.classList.remove('hidden');
                Utils.showToast(t('profile.personalInfo.success', 'تم تحديث المعلومات بنجاح'), 'success');
                document.getElementById('user-avatar').textContent = document.getElementById('name').value.charAt(0);
            } else {
                const error = new Error(data.message);
                error.status = response.status;
                Utils.showError('profile-error', Utils.parseError(error, 'ar'));
            }
        } catch (error) {
            Utils.showError('profile-error', Utils.parseError(error, 'ar'));
        } finally {
            profileBtn.disabled = false;
            profileBtnText.textContent = t('common.save', 'حفظ التغييرات');
            profileSpinner.classList.add('hidden');
        }
    });

    // Password form submission
    document.getElementById('password-form')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const passwordBtn = document.getElementById('password-btn');
        const passwordBtnText = document.getElementById('password-btn-text');
        const passwordSpinner = document.getElementById('password-spinner');
        const passwordSuccess = document.getElementById('password-success');
        const passwordError = document.getElementById('password-error');
        const passwordErrorMessage = document.getElementById('password-error-message');

        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;

        // Check passwords match
        if (newPassword !== confirmPassword) {
            Utils.showError('password-error', t('errors.passwordMismatch', 'كلمتا المرور الجديدة غير متطابقتين'));
            return;
        }

        // Hide messages using Utils
        Utils.hideError('password-error');
        passwordSuccess.classList.add('hidden');

        // Show loading
        passwordBtn.disabled = true;
        passwordBtnText.textContent = t('profile.changePassword.changing', 'جاري التغيير...');
        passwordSpinner.classList.remove('hidden');

        try {
            const response = await fetch('/api/auth/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: document.getElementById('current-password').value,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                passwordSuccess.classList.remove('hidden');
                Utils.showToast(t('profile.changePassword.success', 'تم تغيير كلمة المرور بنجاح'), 'success');
                document.getElementById('password-form').reset();
            } else {
                const error = new Error(data.message);
                error.status = response.status;
                Utils.showError('password-error', Utils.parseError(error, 'ar'));
            }
        } catch (error) {
            Utils.showError('password-error', Utils.parseError(error, 'ar'));
        } finally {
            passwordBtn.disabled = false;
            passwordBtnText.textContent = t('profile.changePassword.submit', 'تغيير كلمة المرور');
            passwordSpinner.classList.add('hidden');
        }
    });

    // Logout
    document.getElementById('logout-link')?.addEventListener('click', function () {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
});
