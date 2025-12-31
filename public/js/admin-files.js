// admin-files.js

let currentPage = 1;
let currentSearch = '';
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function() {
    loadFiles();
    
    // Event listeners
    document.getElementById('search-input').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('upload-btn').addEventListener('click', () => openUploadModal());
    document.getElementById('upload-first-btn').addEventListener('click', () => openUploadModal());
    document.getElementById('close-upload-modal').addEventListener('click', closeUploadModal);
    document.getElementById('cancel-upload').addEventListener('click', closeUploadModal);
    document.getElementById('upload-form').addEventListener('submit', handleFileUpload);
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

async function loadFiles() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 20,
            search: currentSearch
        });
        const response = await fetch(`/api/admin/files?${params}`);
        const data = await response.json();
        
        totalPages = Math.ceil(data.total / 20);
        renderFiles(data.files);
        renderPagination(data.total, data.page);
    } catch (error) {
        console.error('Error loading files:', error);
        document.getElementById('files-grid').innerHTML = '<div class="col-span-full text-center py-12 text-text-secondary">خطأ في تحميل الملفات</div>';
    }
}

function renderFiles(files) {
    const grid = document.getElementById('files-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (files.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    grid.innerHTML = '';
    
    files.forEach(file => {
        const card = createFileCard(file);
        grid.appendChild(card);
    });
}

function createFileCard(file) {
    const div = document.createElement('div');
    div.className = 'file-item';
    
    const isImage = file.mime_type && file.mime_type.startsWith('image/');
    const fileSize = formatFileSize(file.size);
    const uploadDate = new Date(file.created_at).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    let previewContent = '';
    if (isImage) {
        previewContent = `<img src="${file.url}" alt="${file.original_name}" class="file-preview">`;
    } else {
        const icon = getFileIcon(file.mime_type);
        previewContent = `
            <div class="file-preview bg-bg-secondary flex items-center justify-center">
                <span class="material-symbols-outlined text-4xl text-text-muted">${icon}</span>
            </div>
        `;
    }
    
    div.innerHTML = `
        ${previewContent}
        <div class="flex-1">
            <h4 class="font-medium text-text-main text-sm mb-1 truncate" title="${file.original_name}">${file.original_name}</h4>
            <p class="text-xs text-text-secondary mb-2">${fileSize} • ${uploadDate}</p>
            <div class="flex items-center justify-between">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">${file.category || 'عام'}</span>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="copy-url-btn p-1 text-text-secondary hover:text-primary hover:bg-primary/10 rounded" data-url="${file.url}" title="نسخ الرابط">
                        <span class="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                    <button class="delete-file-btn p-1 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded" data-id="${file.id}" title="حذف">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    div.querySelector('.copy-url-btn').addEventListener('click', () => copyFileUrl(file.url));
    div.querySelector('.delete-file-btn').addEventListener('click', () => deleteFile(file.id));
    
    return div;
}

function getFileIcon(mimeType) {
    if (!mimeType) return 'insert_drive_file';
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video_file';
    if (mimeType.startsWith('audio/')) return 'audio_file';
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'description';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table_chart';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slideshow';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
    
    return 'insert_drive_file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function renderPagination(total, page) {
    const container = document.getElementById('pagination-container');
    const start = (page - 1) * 20 + 1;
    const end = Math.min(page * 20, total);
    
    container.innerHTML = `
        <div class="hidden sm:flex flex-1 items-center justify-between">
            <div>
                <p class="text-sm text-text-secondary">
                    عرض <span class="font-medium text-text-main font-['Work_Sans']">${start}</span> إلى <span class="font-medium text-text-main font-['Work_Sans']">${end}</span> من <span class="font-medium text-text-main font-['Work_Sans']">${total}</span> ملف
                </p>
            </div>
            <div>
                <nav aria-label="Pagination" class="isolate inline-flex -space-x-px rounded-md shadow-sm dir-ltr">
                    <button class="prev-btn relative inline-flex items-center rounded-r-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${page === 1 ? 'pointer-events-none opacity-50' : ''}">
                        <span class="sr-only">Next</span>
                        <span class="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    ${generatePageButtons(page, totalPages)}
                    <button class="next-btn relative inline-flex items-center rounded-l-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${page === totalPages ? 'pointer-events-none opacity-50' : ''}">
                        <span class="sr-only">Previous</span>
                        <span class="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                </nav>
            </div>
        </div>
    `;
    
    // Add event listeners for pagination
    container.querySelector('.prev-btn').addEventListener('click', () => changePage(page - 1));
    container.querySelector('.next-btn').addEventListener('click', () => changePage(page + 1));
    container.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => changePage(parseInt(btn.dataset.page)));
    });
}

function generatePageButtons(currentPage, totalPages) {
    let buttons = '';
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            buttons += `<span aria-current="page" class="relative z-10 inline-flex items-center bg-primary px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">${i}</span>`;
        } else {
            buttons += `<button class="page-btn relative inline-flex items-center px-4 py-2 text-sm font-semibold text-text-main ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0" data-page="${i}">${i}</button>`;
        }
    }
    return buttons;
}

function handleSearch() {
    currentSearch = document.getElementById('search-input').value;
    currentPage = 1;
    loadFiles();
}

function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        loadFiles();
    }
}

function openUploadModal() {
    document.getElementById('upload-modal').classList.remove('hidden');
    document.getElementById('upload-progress').classList.add('hidden');
    document.getElementById('upload-form').reset();
}

function closeUploadModal() {
    document.getElementById('upload-modal').classList.add('hidden');
}

async function handleFileUpload(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const progressContainer = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    
    progressContainer.classList.remove('hidden');
    
    try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = percentComplete + '%';
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                closeUploadModal();
                loadFiles();
            } else {
                alert('فشل في رفع الملف');
            }
        });
        
        xhr.addEventListener('error', () => {
            alert('خطأ في رفع الملف');
        });
        
        xhr.open('POST', '/api/admin/files');
        xhr.send(formData);
        
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('خطأ في رفع الملف');
        progressContainer.classList.add('hidden');
    }
}

function copyFileUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        // Simple feedback
        const btn = event.target.closest('.copy-url-btn');
        const originalIcon = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span>';
        setTimeout(() => {
            btn.innerHTML = originalIcon;
        }, 1000);
    }).catch(() => {
        alert('فشل في نسخ الرابط');
    });
}

async function deleteFile(fileId) {
    if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
        try {
            const response = await fetch(`/api/admin/files/${fileId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                loadFiles();
            } else {
                alert('فشل في حذف الملف');
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('خطأ في حذف الملف');
        }
    }
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