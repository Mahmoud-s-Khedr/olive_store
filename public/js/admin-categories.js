// admin-categories.js

document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    
    // Event listeners
    document.getElementById('search-input').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('add-category-btn').addEventListener('click', () => openModal());
    document.getElementById('add-first-category-btn').addEventListener('click', () => openModal());
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('category-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('category-image').addEventListener('change', handleImagePreview);
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
});

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

async function loadCategories() {
    try {
        const search = document.getElementById('search-input').value;
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        const response = await fetch(`/api/admin/categories${params}`);
        const categories = await response.json();
        
        renderCategories(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
        document.getElementById('categories-grid').innerHTML = '<div class="col-span-full text-center py-12 text-text-secondary">خطأ في تحميل الفئات</div>';
    }
}

function renderCategories(categories) {
    const grid = document.getElementById('categories-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (categories.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    grid.innerHTML = '';
    
    categories.forEach(category => {
        const card = createCategoryCard(category);
        grid.appendChild(card);
    });
}

function createCategoryCard(category) {
    const div = document.createElement('div');
    div.className = 'bg-white rounded-lg shadow-sm border border-border-color p-6 hover:shadow-md transition-shadow';
    
    const imageUrl = category.image_url || '';
    const productCount = category.product_count || 0;
    const statusClass = category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
    const statusText = category.is_active ? 'نشط' : 'غير نشط';
    
    div.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
                <div class="size-12 rounded-lg bg-gray-100 bg-center bg-cover border border-border-color" style="background-image: url('${imageUrl}')">
                    ${!imageUrl ? '<span class="material-symbols-outlined text-text-muted">category</span>' : ''}
                </div>
                <div>
                    <h3 class="font-bold text-text-main">${category.name}</h3>
                    <p class="text-sm text-text-secondary">${productCount} منتج</p>
                </div>
            </div>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}">
                <span class="size-1.5 rounded-full ${category.is_active ? 'bg-green-500' : 'bg-gray-400'}"></span>
                ${statusText}
            </span>
        </div>
        
        ${category.description ? `<p class="text-sm text-text-secondary mb-4 line-clamp-2">${category.description}</p>` : ''}
        
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <button class="edit-btn p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" data-id="${category.id}" title="تعديل">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button class="delete-btn p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-id="${category.id}" title="حذف">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
            </div>
            <span class="text-xs text-text-muted">ID: ${category.id}</span>
        </div>
    `;
    
    // Add event listeners
    div.querySelector('.edit-btn').addEventListener('click', () => editCategory(category));
    div.querySelector('.delete-btn').addEventListener('click', () => deleteCategory(category.id));
    
    return div;
}

function openModal(category = null) {
    const modal = document.getElementById('category-modal');
    const form = document.getElementById('category-form');
    const title = document.getElementById('modal-title');
    
    if (category) {
        title.textContent = 'تعديل الفئة';
        document.getElementById('category-id').value = category.id;
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-description').value = category.description || '';
        document.getElementById('category-active').checked = category.is_active;
        
        if (category.image_url) {
            document.getElementById('preview-img').src = category.image_url;
            document.getElementById('image-preview').classList.remove('hidden');
        }
    } else {
        title.textContent = 'إضافة فئة جديدة';
        form.reset();
        document.getElementById('image-preview').classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('category-modal').classList.add('hidden');
}

function handleImagePreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    const img = document.getElementById('preview-img');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        preview.classList.add('hidden');
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('category-name').value);
    formData.append('description', document.getElementById('category-description').value);
    formData.append('is_active', document.getElementById('category-active').checked);
    
    const imageFile = document.getElementById('category-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const categoryId = document.getElementById('category-id').value;
    const method = categoryId ? 'PUT' : 'POST';
    const url = categoryId ? `/api/admin/categories/${categoryId}` : '/api/admin/categories';
    
    try {
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        if (response.ok) {
            closeModal();
            loadCategories();
        } else {
            const error = await response.json();
            alert('خطأ: ' + (error.message || 'فشل في حفظ الفئة'));
        }
    } catch (error) {
        console.error('Error saving category:', error);
        alert('خطأ في حفظ الفئة');
    }
}

function editCategory(category) {
    openModal(category);
}

async function deleteCategory(categoryId) {
    if (confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف جميع المنتجات المرتبطة بها أيضاً.')) {
        try {
            const response = await fetch(`/api/admin/categories/${categoryId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                loadCategories();
            } else {
                alert('فشل في حذف الفئة');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('خطأ في حذف الفئة');
        }
    }
}

function handleSearch() {
    loadCategories();
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