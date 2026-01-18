/**
 * Admin Product Form JavaScript
 * Uses Api module for backend integration
 */

let productId = null;
let isEdit = false;
let uploadedImages = [];

document.addEventListener('DOMContentLoaded', function () {
    // Check admin authentication
    if (!AuthModule.requireAdminAuth()) {
        return;
    }

    // Check if editing
    const urlParams = new URLSearchParams(window.location.search);
    productId = urlParams.get('id');
    isEdit = !!productId;

    // Update page title and breadcrumb for edit mode
    if (isEdit) {
        const pageTitle = document.getElementById('page-title');
        const breadcrumbCurrent = document.getElementById('breadcrumb-current');
        const submitBtnText = document.getElementById('submit-btn-text');

        if (pageTitle) pageTitle.textContent = 'تعديل المنتج';
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'تعديل';
        if (submitBtnText) submitBtnText.textContent = 'تحديث المنتج';
    }

    // Initialize
    loadCategories();
    if (isEdit && productId) {
        loadProduct();
    }

    // Event listeners
    setupEventListeners();
});

const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

function setupEventListeners() {
    const form = document.getElementById('product-form');
    const nameArInput = document.getElementById('name-ar');
    const imagesInput = document.getElementById('images-input');

    // Auto-generate slug from Arabic name
    if (nameArInput) {
        nameArInput.addEventListener('input', function () {
            const arabicName = this.value;
            const slugInput = document.getElementById('slug');
            if (arabicName && slugInput) {
                // Generate URL-safe slug
                const slug = arabicName
                    .toLowerCase()
                    .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic characters for URL
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim() || `product-${Date.now()}`;
                slugInput.value = slug;
            }
        });
    }

    // Image upload handling
    if (imagesInput) {
        imagesInput.addEventListener('change', handleImageUpload);
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

async function loadCategories() {
    try {
        const data = await Api.categories.list();
        const categories = data.categories || data.data || data || [];
        const select = document.getElementById('category');

        if (!select) return;

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = lang === 'ar' ? (cat.name_ar || cat.name) : (cat.name_en || cat.name);
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadProduct() {
    if (!productId) return;

    showLoading(true);

    try {
        const data = await Api.admin.products.get(productId);
        const product = data.product || data;

        // Populate form fields
        setInputValue('name-ar', product.name_ar || product.name || '');
        setInputValue('name-en', product.name_en || '');
        setInputValue('slug', product.slug || '');
        setInputValue('short-desc', product.short_description_ar || product.short_description || '');
        setInputValue('description', product.description_ar || product.description || '');
        setInputValue('category', product.category_id || '');
        setInputValue('price', product.price || '');
        setInputValue('discount-price', product.discount_price || product.old_price || '');
        setInputValue('stock', product.stock ?? product.stock_quantity ?? 0);
        setInputValue('sku', product.sku || '');

        // Status toggles
        const statusCheckbox = document.getElementById('status');
        const featuredCheckbox = document.getElementById('featured');
        if (statusCheckbox) statusCheckbox.checked = product.is_active !== false;
        if (featuredCheckbox) featuredCheckbox.checked = product.is_featured === true;

        // Load existing images
        if (product.images && Array.isArray(product.images)) {
            uploadedImages = product.images.map(img => ({
                url: img.url || img,
                id: img.id,
                is_primary: img.is_primary
            }));
            renderImagePreviews();
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showFormError(t('errors.loadFailed', 'خطأ في تحميل المنتج'));
    } finally {
        showLoading(false);
    }
}

function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

async function handleImageUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const previewContainer = document.getElementById('images-preview');

    for (const file of files) {
        // Create preview immediately
        const reader = new FileReader();
        reader.onload = function (event) {
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            uploadedImages.push({
                url: event.target.result,
                tempId: tempId,
                file: file,
                uploading: true
            });
            renderImagePreviews();

            // Upload the file
            uploadImageFile(file, tempId);
        };
        reader.readAsDataURL(file);
    }

    // Clear input
    e.target.value = '';
}

async function uploadImageFile(file, tempId) {
    try {
        // Get signed URL for upload
        const signedUrlData = await Api.admin.files.getUploadUrl(file.name);

        // Upload directly to R2
        await fetch(signedUrlData.uploadUrl || signedUrlData.upload_url, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });

        // Update the image with the final URL
        const imageIndex = uploadedImages.findIndex(img => img.tempId === tempId);
        if (imageIndex !== -1) {
            uploadedImages[imageIndex] = {
                url: signedUrlData.url || signedUrlData.publicUrl || signedUrlData.public_url,
                is_primary: uploadedImages.length === 1 && imageIndex === 0
            };
            delete uploadedImages[imageIndex].tempId;
            delete uploadedImages[imageIndex].file;
            delete uploadedImages[imageIndex].uploading;
        }

        renderImagePreviews();
    } catch (error) {
        console.error('Error uploading image:', error);
        // Remove failed upload
        uploadedImages = uploadedImages.filter(img => img.tempId !== tempId);
        renderImagePreviews();
        Utils.showToast(t('errors.uploadFailed', 'فشل رفع الصورة'), 'error');
    }
}

function renderImagePreviews() {
    const container = document.getElementById('images-preview');
    if (!container) return;

    container.innerHTML = '';

    uploadedImages.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'relative group aspect-square bg-gray-100 rounded-xl overflow-hidden';

        const imgUrl = img.url.startsWith('data:') ? img.url : Utils.getImageUrl(img.url);

        div.innerHTML = `
            <img src="${imgUrl}" class="w-full h-full object-cover ${img.uploading ? 'opacity-50' : ''}">
            ${img.uploading ? `
                <div class="absolute inset-0 flex items-center justify-center">
                    <span class="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                </div>
            ` : `
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" onclick="setAsPrimary(${index})" class="p-2 rounded-full ${img.is_primary ? 'bg-yellow-500' : 'bg-white/20 hover:bg-white/30'} text-white transition-colors" title="${img.is_primary ? 'الصورة الرئيسية' : 'تعيين كصورة رئيسية'}">
                        <span class="material-symbols-outlined ${img.is_primary ? 'fill' : ''} text-[18px]">star</span>
                    </button>
                    <button type="button" onclick="removeImage(${index})" class="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors" title="حذف">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            `}
            ${img.is_primary ? '<span class="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">رئيسية</span>' : ''}
        `;

        container.appendChild(div);
    });
}

window.setAsPrimary = function (index) {
    uploadedImages = uploadedImages.map((img, i) => ({
        ...img,
        is_primary: i === index
    }));
    renderImagePreviews();
};

window.removeImage = function (index) {
    uploadedImages.splice(index, 1);
    // Ensure at least one image is primary if we have images
    if (uploadedImages.length > 0 && !uploadedImages.some(img => img.is_primary)) {
        uploadedImages[0].is_primary = true;
    }
    renderImagePreviews();
};

async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate form
    const nameAr = document.getElementById('name-ar')?.value?.trim();
    const price = document.getElementById('price')?.value;

    if (!nameAr) {
        showFormError(t('errors.nameRequired', 'اسم المنتج مطلوب'));
        return;
    }

    if (!price || parseFloat(price) <= 0) {
        showFormError(t('errors.priceRequired', 'السعر مطلوب'));
        return;
    }

    // Check if any images are still uploading
    if (uploadedImages.some(img => img.uploading)) {
        showFormError(t('errors.imagesUploading', 'انتظر حتى انتهاء رفع الصور'));
        return;
    }

    setSubmitLoading(true);
    hideFormError();

    // Prepare form data - field names must match backend validation schema
    const formData = {
        name_ar: nameAr,
        name_en: document.getElementById('name-en')?.value?.trim() || nameAr, // Required, fallback to Arabic name
        slug: document.getElementById('slug')?.value?.trim() || undefined,
        short_description_ar: document.getElementById('short-desc')?.value?.trim() || undefined,
        description_ar: document.getElementById('description')?.value?.trim() || undefined,
        category_id: document.getElementById('category')?.value ? parseInt(document.getElementById('category').value) : null,
        price: parseFloat(price),
        old_price: document.getElementById('discount-price')?.value ? parseFloat(document.getElementById('discount-price').value) : null,
        stock: parseInt(document.getElementById('stock')?.value) || 0,
        sku: document.getElementById('sku')?.value?.trim() || undefined,
        is_active: document.getElementById('status')?.checked ?? true,
        is_featured: document.getElementById('featured')?.checked ?? false
    };

    // Note: Images are handled via separate API call after product is created
    // The images array is NOT part of the product schema

    try {
        let savedProductId = productId;

        if (isEdit) {
            await Api.admin.products.update(productId, formData);
            Utils.showToast(t('admin.products.updated', 'تم تحديث المنتج بنجاح'), 'success');
        } else {
            const result = await Api.admin.products.create(formData);
            savedProductId = result.product?.id || result.id;
            Utils.showToast(t('admin.products.created', 'تم إضافة المنتج بنجاح'), 'success');
        }

        // TODO: Handle image uploads via separate API call
        // POST /api/admin/products/:id/images with files array
        // For now, images will need to be added via the files library

        // Redirect to products list
        setTimeout(() => {
            window.location.href = '/admin/products';
        }, 500);
    } catch (error) {
        console.error('Error saving product:', error);
        showFormError(Utils.parseError(error, lang));
        setSubmitLoading(false);
    }
}

function showFormError(message) {
    const errorEl = document.getElementById('form-error');
    const errorMsgEl = document.getElementById('form-error-message');

    if (errorEl && errorMsgEl) {
        errorMsgEl.textContent = message;
        errorEl.classList.remove('hidden');
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        Utils.showToast(message, 'error');
    }
}

function hideFormError() {
    const errorEl = document.getElementById('form-error');
    if (errorEl) errorEl.classList.add('hidden');
}

function setSubmitLoading(loading) {
    const submitBtn = document.querySelector('button[type="submit"]');
    const submitBtnText = document.getElementById('submit-btn-text');
    const submitSpinner = document.getElementById('submit-spinner');

    if (submitBtn) submitBtn.disabled = loading;
    if (submitBtnText) submitBtnText.textContent = loading ? t('common.saving', 'جاري الحفظ...') : (isEdit ? 'تحديث المنتج' : 'حفظ المنتج');
    if (submitSpinner) submitSpinner.classList.toggle('hidden', !loading);
}

function showLoading(show) {
    const form = document.getElementById('product-form');
    if (form) {
        form.style.opacity = show ? '0.5' : '1';
        form.style.pointerEvents = show ? 'none' : 'auto';
    }
}
