// Admin Product Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle functionality
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    function toggleSidebar() {
        const isOpen = !sidebar.classList.contains('translate-x-full');
        if (isOpen) {
            sidebar.classList.add('translate-x-full');
            sidebarOverlay.classList.remove('opacity-50');
            sidebarOverlay.classList.add('opacity-0', 'pointer-events-none');
        } else {
            sidebar.classList.remove('translate-x-full');
            sidebarOverlay.classList.remove('opacity-0', 'pointer-events-none');
            sidebarOverlay.classList.add('opacity-50');
        }
    }

    sidebarToggle.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    // Logout functionality
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('adminToken');
        window.location.href = '/pages/admin-login.html';
    });

    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/pages/admin-login.html';
        return;
    }

    // Check if editing
    const urlParams = new URLSearchParams(window.location.search);
    const isEdit = urlParams.has('edit') || window.location.pathname.includes('/edit/');
    const productId = urlParams.get('id') || window.location.pathname.split('/').pop();

    // Update page title for edit mode
    if (isEdit && productId) {
        document.getElementById('page-title').textContent = 'تعديل المنتج';
        document.getElementById('breadcrumb-current').textContent = 'تعديل';
        document.getElementById('product-id').value = productId;
    }

    // Auto-generate slug from Arabic name
    document.getElementById('name-ar').addEventListener('input', function() {
        const arabicName = this.value;
        if (arabicName) {
            // Simple slug generation (you might want to enhance this)
            const slug = arabicName
                .toLowerCase()
                .replace(/[^\w\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .trim();
            document.getElementById('slug').value = slug;
        }
    });

    // Load categories
    async function loadCategories() {
        try {
            const response = await fetch('/api/categories');
            if (response.ok) {
                const data = await response.json();
                const select = document.getElementById('category');
                data.categories?.forEach(cat => {
                    const name = cat.name_ar || cat.name_en || cat.name;
                    select.innerHTML += `<option value="${cat.id}">${name}</option>`;
                });
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Load product if editing
    async function loadProduct() {
        if (!productId) return;

        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const product = data.product || data;

                document.getElementById('name-ar').value = product.name_ar || '';
                document.getElementById('name-en').value = product.name_en || '';
                document.getElementById('slug').value = product.slug || '';
                document.getElementById('short-desc-ar').value = product.short_description_ar || '';
                document.getElementById('desc-ar').value = product.description_ar || '';
                document.getElementById('primary-image').value = product.image || '';
                document.getElementById('category').value = product.category_id || '';
                document.getElementById('price').value = product.price || '';
                document.getElementById('old-price').value = product.old_price || '';
                document.getElementById('stock').value = product.stock || 0;
                document.getElementById('sku').value = product.sku || '';
                document.getElementById('weight').value = product.weight || '';
                document.getElementById('dimensions').value = product.dimensions || '';
                document.getElementById('is-active').checked = product.is_active !== false;
                document.getElementById('is-featured').checked = product.is_featured === true;
                document.getElementById('is-new').checked = product.is_new === true;

                // Show image preview if image exists
                if (product.image) {
                    document.getElementById('preview-img').src = product.image;
                    document.getElementById('image-preview').classList.remove('hidden');
                }

                // Handle additional images if they exist
                if (product.images && Array.isArray(product.images)) {
                    document.getElementById('additional-images').value = product.images.join('\n');
                }
            } else if (response.status === 401) {
                localStorage.removeItem('adminToken');
                window.location.href = '/pages/admin-login.html';
            }
        } catch (error) {
            console.error('Error loading product:', error);
        }
    }

    // Image preview
    document.getElementById('primary-image').addEventListener('blur', function () {
        if (this.value) {
            document.getElementById('preview-img').src = this.value;
            document.getElementById('image-preview').classList.remove('hidden');
        } else {
            document.getElementById('image-preview').classList.add('hidden');
        }
    });

    // Form submission
    document.getElementById('product-form').addEventListener('submit', async function (e) {
        e.preventDefault();

        const formError = document.getElementById('form-error');
        const submitBtn = document.getElementById('submit-btn');
        const submitText = document.getElementById('submit-text');
        const submitSpinner = document.getElementById('submit-spinner');

        formError.classList.add('hidden');
        submitBtn.disabled = true;
        submitText.textContent = 'جاري الحفظ...';
        submitSpinner.classList.remove('hidden');

        // Prepare form data
        const formData = {
            name_ar: document.getElementById('name-ar').value.trim(),
            name_en: document.getElementById('name-en').value.trim() || undefined,
            slug: document.getElementById('slug').value.trim() || undefined,
            short_description_ar: document.getElementById('short-desc-ar').value.trim() || undefined,
            description_ar: document.getElementById('desc-ar').value.trim() || undefined,
            image: document.getElementById('primary-image').value.trim() || undefined,
            category_id: document.getElementById('category').value || null,
            price: parseFloat(document.getElementById('price').value),
            old_price: document.getElementById('old-price').value ? parseFloat(document.getElementById('old-price').value) : null,
            stock: parseInt(document.getElementById('stock').value),
            sku: document.getElementById('sku').value.trim() || undefined,
            weight: document.getElementById('weight').value.trim() || undefined,
            dimensions: document.getElementById('dimensions').value.trim() || undefined,
            is_active: document.getElementById('is-active').checked,
            is_featured: document.getElementById('is-featured').checked,
            is_new: document.getElementById('is-new').checked
        };

        // Handle additional images
        const additionalImages = document.getElementById('additional-images').value.trim();
        if (additionalImages) {
            formData.images = additionalImages.split('\n').map(url => url.trim()).filter(url => url);
        }

        try {
            const url = isEdit ? `/api/admin/products/${productId}` : '/api/admin/products';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                window.location.href = '/pages/admin-products.html';
            } else {
                const result = await response.json();
                formError.textContent = result.message || 'حدث خطأ أثناء الحفظ';
                formError.classList.remove('hidden');
                // Scroll to error
                formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } catch (error) {
            console.error('Error saving product:', error);
            formError.textContent = 'حدث خطأ في الاتصال';
            formError.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitText.textContent = 'حفظ';
            submitSpinner.classList.add('hidden');
        }
    });

    // Initialize
    loadCategories();
    if (isEdit && productId) {
        loadProduct();
    }
});