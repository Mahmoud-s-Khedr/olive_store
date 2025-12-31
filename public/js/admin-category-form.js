// admin-category-form.js

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const submitSpinner = document.getElementById('submit-spinner');
    const formError = document.getElementById('form-error');
    const nameArInput = document.getElementById('name-ar');
    const nameEnInput = document.getElementById('name-en');
    const slugInput = document.getElementById('slug');
    const descArInput = document.getElementById('description-ar');
    const descEnInput = document.getElementById('description-en');
    const imageInput = document.getElementById('image-url');
    const parentSelect = document.getElementById('parent-id');
    const sortInput = document.getElementById('sort-order');
    const activeInput = document.getElementById('is-active');

    // Check if we're editing
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id');
    const isEdit = Boolean(categoryId);

    if (isEdit) {
        document.getElementById('page-title').textContent = 'تعديل الفئة';
        document.getElementById('breadcrumb-current').textContent = 'تعديل الفئة';
    }

    // Event listeners
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Auto-generate slug from Arabic name
    nameArInput.addEventListener('input', function() {
        if (!isEdit || !slugInput.value.trim()) {
            const arabicName = this.value.trim();
            if (arabicName) {
                // Simple slug generation - replace spaces with hyphens and remove special chars
                const slug = arabicName.replace(/\s+/g, '-').replace(/[^\w\-]/g, '').toLowerCase();
                slugInput.value = slug;
            }
        }
    });

    async function loadParentCategories(excludeId) {
        try {
            const response = await fetch('/api/admin/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Unable to load parents');

            const data = await response.json();
            const categories = (data.categories || []).filter(c => String(c.id) !== String(excludeId));
            parentSelect.innerHTML = `<option value="">بدون فئة رئيسية</option>`;
            categories.forEach(cat => {
                const label = cat.name_ar || cat.name_en || `Category ${cat.id}`;
                parentSelect.innerHTML += `<option value="${cat.id}">${label}</option>`;
            });
        } catch (error) {
            console.error('Error loading parent categories:', error);
        }
    }

    async function loadCategory() {
        if (!isEdit) return;
        try {
            const response = await fetch(`/api/admin/categories/${categoryId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Category not found');

            const data = await response.json();
            const category = data.category || {};
            nameArInput.value = category.name_ar || '';
            nameEnInput.value = category.name_en || '';
            slugInput.value = category.slug || '';
            descArInput.value = category.description_ar || '';
            descEnInput.value = category.description_en || '';
            imageInput.value = category.image_url || '';
            sortInput.value = category.sort_order ?? 0;
            activeInput.checked = category.is_active !== false;
            parentSelect.value = category.parent_id || '';
        } catch (error) {
            console.error('Error loading category:', error);
            alert('خطأ في تحميل بيانات الفئة');
        }
    }

    async function saveCategory(payload) {
        const url = isEdit ? `/api/admin/categories/${categoryId}` : '/api/admin/categories';
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'حدث خطأ أثناء الحفظ');
        }
    }

    document.getElementById('category-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        formError.classList.add('hidden');
        submitBtn.disabled = true;
        const originalText = submitText.textContent;
        submitText.textContent = isEdit ? 'جاري التحديث...' : 'جاري الحفظ...';
        submitSpinner.classList.remove('hidden');

        const payload = {
            name_ar: nameArInput.value.trim(),
            name_en: nameEnInput.value.trim() || undefined,
            slug: slugInput.value.trim() || undefined,
            description_ar: descArInput.value.trim() || undefined,
            description_en: descEnInput.value.trim() || undefined,
            image_url: imageInput.value.trim() || undefined,
            parent_id: parentSelect.value ? Number(parentSelect.value) : null,
            sort_order: Number(sortInput.value) || 0,
            is_active: activeInput.checked,
        };

        try {
            await saveCategory(payload);
            window.location.href = 'admin-categories.html';
        } catch (error) {
            console.error('Save error:', error);
            formError.textContent = error.message || 'حدث خطأ أثناء الحفظ';
            formError.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitText.textContent = originalText;
            submitSpinner.classList.add('hidden');
        }
    });

    await loadParentCategories(categoryId);
    if (isEdit) {
        await loadCategory();
    }
});

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