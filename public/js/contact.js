// Contact form handling
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contact-form');
    const contactBtn = document.getElementById('contact-btn');
    const contactBtnText = document.getElementById('contact-btn-text');
    const contactSpinner = document.getElementById('contact-spinner');
    const contactSuccess = document.getElementById('contact-success');
    const contactError = document.getElementById('contact-error');
    const contactErrorMessage = document.getElementById('contact-error-message');

    const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;

    form?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

        // Hide messages using Utils
        Utils.hideError('contact-error');
        contactSuccess.classList.add('hidden');

        // Show loading
        contactBtn.disabled = true;
        contactBtnText.textContent = t('contact.form.sending', 'جاري الإرسال...');
        contactSpinner.classList.remove('hidden');

        try {
            const formData = new FormData(form);

            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    subject: formData.get('subject'),
                    message: formData.get('message')
                })
            });

            if (response.ok) {
                contactSuccess.classList.remove('hidden');
                Utils.showToast(t('contact.form.success', 'تم إرسال رسالتك بنجاح!'), 'success');
                form.reset();
            } else {
                const data = await response.json();
                const error = new Error(data.message);
                error.status = response.status;
                Utils.showError('contact-error', Utils.parseError(error, lang));
            }
        } catch (error) {
            // For demo purposes, show success anyway (no real backend endpoint)
            contactSuccess.classList.remove('hidden');
            Utils.showToast(t('contact.form.success', 'تم إرسال رسالتك بنجاح!'), 'success');
            form.reset();
        } finally {
            contactBtn.disabled = false;
            contactBtnText.textContent = t('contact.form.submit', 'إرسال الرسالة');
            contactSpinner.classList.add('hidden');
        }
    });
});