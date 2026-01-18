/**
 * Admin Categories JavaScript
 * Uses Api module for backend integration
 */

let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', function () {
    // Check admin authentication
    if (!AuthModule.requireAdminAuth()) {
        return;
    }

    loadCategories();
    loadParentCategories();

    // Event listeners
    const searchInput = document.getElementById('search-input');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const addFirstCategoryBtn = document.getElementById('add-first-category-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const categoryForm = document.getElementById('category-form');
    const imageInput = document.getElementById('category-image');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const logoutBtn = document.getElementById('logout-btn');

    if (searchInput) searchInput.addEventListener('input', Utils.debounce(handleSearch, 300));
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => openModal());
    if (addFirstCategoryBtn) addFirstCategoryBtn.addEventListener('click', () => openModal());
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (categoryForm) categoryForm.addEventListener('submit', handleFormSubmit);
    if (imageInput) imageInput.addEventListener('change', handleImagePreview);
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
});

const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

async function loadCategories() {
    try {
        const search = document.getElementById('search-input')?.value || '';
        const params = search ? { search } : {};
        const data = await Api.admin.categories.list(params);
        const categories = data.categories || data.data || data || [];

        renderCategories(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
        const grid = document.getElementById('categories-grid');
        if (grid) {
            grid.innerHTML = `<div class="col-span-full text-center py-12 text-red-500">${t('errors.loadFailed', 'خطأ في تحميل الفئات')}</div>`;
        }
    }
}

async function loadParentCategories() {
    try {
        const data = await Api.admin.categories.list();
        const categories = data.categories || data.data || data || [];
        const select = document.getElementById('parent-category');

        if (!select) return;

        // Clear existing options except first
        while (select.options.length > 1) {
            select.remove(1);
        }

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = lang === 'ar' ? (cat.name_ar || cat.name) : (cat.name_en || cat.name);
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading parent categories:', error);
    }
}

function renderCategories(categories) {
    const tbody = document.getElementById('categories-tbody');
    const cardsContainer = document.getElementById('categories-cards');
    const emptyState = document.getElementById('empty-state');

    if (tbody) tbody.innerHTML = '';
    if (cardsContainer) cardsContainer.innerHTML = '';

    if (categories.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        const emptyMsg = `<div class="p-8 text-center text-slate-500">${t('admin.categories.noCategories', 'لا توجد فئات')}</div>`;
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">${t('admin.categories.noCategories', 'لا توجد فئات')}</td></tr>`;
        if (cardsContainer) cardsContainer.innerHTML = emptyMsg;
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    categories.forEach(category => {
        // Desktop table row
        if (tbody) {
            const row = createCategoryRow(category);
            tbody.appendChild(row);
        }
        // Mobile card
        if (cardsContainer) {
            const card = createCategoryCard(category);
            cardsContainer.appendChild(card);
        }
    });
}

function createCategoryRow(category) {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#fbfcf9] transition-colors group';

    const nameAr = category.name_ar || category.name || '—';
    const nameEn = category.name_en || '';
    const parentName = category.parent
        ? (lang === 'ar' ? (category.parent.name_ar || category.parent.name) : (category.parent.name_en || category.parent.name))
        : (category.parent_name || '—');
    const statusClass = category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
    const statusText = category.is_active ? t('admin.categories.active', 'نشط') : t('admin.categories.inactive', 'غير نشط');

    tr.innerHTML = `
        <td class="px-4 lg:px-6 py-4">
            <div class="flex items-center gap-3">
                <div class="size-10 rounded-lg bg-gray-100 bg-center bg-cover border border-gray-200 flex items-center justify-center" style="${category.image_url ? `background-image: url('${category.image_url}')` : ''}">
                    ${!category.image_url ? '<span class="material-symbols-outlined text-text-secondary">category</span>' : ''}
                </div>
                <div class="flex flex-col">
                    <span class="font-bold text-text-main">${nameAr}</span>
                    ${nameEn ? `<span class="text-xs text-text-secondary">${nameEn}</span>` : ''}
                </div>
            </div>
        </td>
        <td class="px-4 lg:px-6 py-4 text-sm text-text-secondary hidden md:table-cell" dir="ltr">${category.slug || '—'}</td>
        <td class="px-4 lg:px-6 py-4 text-sm text-text-secondary hidden lg:table-cell">${parentName}</td>
        <td class="px-4 lg:px-6 py-4">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}">
                <span class="size-1.5 rounded-full ${category.is_active ? 'bg-green-500' : 'bg-gray-400'}"></span>
                ${statusText}
            </span>
        </td>
        <td class="px-4 lg:px-6 py-4 text-center">
            <div class="flex items-center gap-1 lg:gap-2 justify-center">
                <button class="edit-btn p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" data-id="${category.id}" title="${t('actions.edit', 'تعديل')}">
                    <span class="material-symbols-outlined text-[18px] lg:text-[20px]">edit</span>
                </button>
                <button class="delete-btn p-1.5 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-id="${category.id}" title="${t('actions.delete', 'حذف')}">
                    <span class="material-symbols-outlined text-[18px] lg:text-[20px]">delete</span>
                </button>
            </div>
        </td>
    `;

    tr.querySelector('.edit-btn').addEventListener('click', () => editCategory(category));
    tr.querySelector('.delete-btn').addEventListener('click', () => deleteCategory(category.id, nameAr));

    return tr;
}

function createCategoryCard(category) {
    const div = document.createElement('div');
    div.className = 'p-4 hover:bg-gray-50 transition-colors';

    const nameAr = category.name_ar || category.name || '—';
    const nameEn = category.name_en || '';
    const statusClass = category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
    const statusText = category.is_active ? t('admin.categories.active', 'نشط') : t('admin.categories.inactive', 'غير نشط');

    div.innerHTML = `
        <div class="flex gap-3">
            <div class="size-12 rounded-lg bg-gray-100 bg-center bg-cover border border-gray-200 flex items-center justify-center flex-shrink-0" style="${category.image_url ? `background-image: url('${category.image_url}')` : ''}">
                ${!category.image_url ? '<span class="material-symbols-outlined text-slate-400">category</span>' : ''}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                        <h3 class="text-sm font-bold text-slate-800 truncate">${nameAr}</h3>
                        ${nameEn ? `<p class="text-xs text-slate-500 mt-0.5">${nameEn}</p>` : ''}
                    </div>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${statusClass} flex-shrink-0">
                        <span class="size-1.5 rounded-full ${category.is_active ? 'bg-green-500' : 'bg-gray-400'}"></span>
                        ${statusText}
                    </span>
                </div>
                ${category.slug ? `<p class="text-xs text-slate-400 mt-1" dir="ltr">${category.slug}</p>` : ''}
            </div>
        </div>
        <div class="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
            <button class="edit-btn flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors" data-id="${category.id}">
                <span class="material-symbols-outlined text-[18px]">edit</span>
                <span>${t('actions.edit', 'تعديل')}</span>
            </button>
            <button class="delete-btn flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" data-id="${category.id}">
                <span class="material-symbols-outlined text-[18px]">delete</span>
                <span>${t('actions.delete', 'حذف')}</span>
            </button>
        </div>
    `;

    div.querySelector('.edit-btn').addEventListener('click', () => editCategory(category));
    div.querySelector('.delete-btn').addEventListener('click', () => deleteCategory(category.id, nameAr));

    return div;
}

function openModal(category = null) {
    const modal = document.getElementById('category-modal');
    const form = document.getElementById('category-form');
    const title = document.getElementById('modal-title');
    const imagePreview = document.getElementById('image-preview');

    if (!modal || !form) return;

    if (category) {
        editingCategoryId = category.id;
        if (title) title.textContent = t('admin.categories.editCategory', 'تعديل الفئة');

        // Fill form fields
        const nameArInput = document.getElementById('category-name-ar');
        const nameEnInput = document.getElementById('category-name-en');
        const slugInput = document.getElementById('category-slug');
        const descArInput = document.getElementById('category-description-ar');
        const descEnInput = document.getElementById('category-description-en');
        const parentInput = document.getElementById('parent-category');
        const sortOrderInput = document.getElementById('sort-order');
        const activeInput = document.getElementById('category-active');

        if (nameArInput) nameArInput.value = category.name_ar || '';
        if (nameEnInput) nameEnInput.value = category.name_en || '';
        if (slugInput) slugInput.value = category.slug || '';
        if (descArInput) descArInput.value = category.description_ar || '';
        if (descEnInput) descEnInput.value = category.description_en || '';
        if (parentInput) parentInput.value = category.parent_id || '';
        if (sortOrderInput) sortOrderInput.value = category.sort_order || 0;
        if (activeInput) activeInput.checked = category.is_active !== false;

        if (category.image_url && imagePreview) {
            const previewImg = document.getElementById('preview-img');
            if (previewImg) previewImg.src = category.image_url;
            imagePreview.classList.remove('hidden');
        }
    } else {
        editingCategoryId = null;
        if (title) title.textContent = t('admin.categories.addCategory', 'إضافة فئة جديدة');
        form.reset();
        if (imagePreview) imagePreview.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('category-modal');
    if (modal) modal.classList.add('hidden');
    editingCategoryId = null;
}

function handleImagePreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    const img = document.getElementById('preview-img');

    if (file && preview && img) {
        const reader = new FileReader();
        reader.onload = function (e) {
            img.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else if (preview) {
        preview.classList.add('hidden');
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = t('actions.saving', 'جار الحفظ...');
    }

    try {
        // Collect form data
        const categoryData = {
            name_ar: document.getElementById('category-name-ar')?.value || document.getElementById('category-name')?.value,
            name_en: document.getElementById('category-name-en')?.value || '',
            slug: document.getElementById('category-slug')?.value || '',
            description_ar: document.getElementById('category-description-ar')?.value || document.getElementById('category-description')?.value || '',
            description_en: document.getElementById('category-description-en')?.value || '',
            parent_id: document.getElementById('parent-category')?.value || null,
            sort_order: parseInt(document.getElementById('sort-order')?.value) || 0,
            is_active: document.getElementById('category-active')?.checked ?? true
        };

        // Handle image upload if there's a new image
        const imageFile = document.getElementById('category-image')?.files[0];
        if (imageFile) {
            // TODO: Implement image upload via Api.admin.files.getUploadUrl
            console.log('Image upload not yet implemented');
        }

        if (editingCategoryId) {
            await Api.admin.categories.update(editingCategoryId, categoryData);
            Utils.showToast(t('admin.categories.updated', 'تم تحديث الفئة بنجاح'), 'success');
        } else {
            await Api.admin.categories.create(categoryData);
            Utils.showToast(t('admin.categories.created', 'تم إضافة الفئة بنجاح'), 'success');
        }

        closeModal();
        loadCategories();
        loadParentCategories();

    } catch (error) {
        console.error('Error saving category:', error);
        Utils.showToast(Utils.parseError(error, lang), 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

function editCategory(category) {
    openModal(category);
}

async function deleteCategory(categoryId, categoryName) {
    const confirmed = confirm(t('admin.categories.confirmDelete', `هل أنت متأكد من حذف الفئة "${categoryName}"؟ سيتم حذف جميع المنتجات المرتبطة بها أيضاً.`));

    if (confirmed) {
        try {
            await Api.admin.categories.delete(categoryId);
            Utils.showToast(t('admin.categories.deleted', 'تم حذف الفئة بنجاح'), 'success');
            loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            Utils.showToast(Utils.parseError(error, lang), 'error');
        }
    }
}

function handleSearch() {
    loadCategories();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('sidebar-open');
        sidebar.classList.toggle('sidebar-closed');
    }
}

function handleLogout() {
    if (confirm(t('auth.confirmLogout', 'هل أنت متأكد من تسجيل الخروج؟'))) {
        AuthModule.adminLogout();
    }
}
