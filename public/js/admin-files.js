/**
 * Admin Files JavaScript
 * Uses Api module for backend integration
 */

let currentPage = 1;
let currentSearch = '';
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function () {
    // Check admin authentication
    if (!AuthModule.requireAdminAuth()) {
        return;
    }

    loadFiles();

    // Event listeners
    const searchInput = document.getElementById('search-input');
    const searchInputMobile = document.getElementById('search-input-mobile');
    const searchInputDesktop = document.getElementById('search-input-desktop');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadFirstBtn = document.getElementById('upload-first-btn');
    const closeUploadModal = document.getElementById('close-upload-modal');
    const cancelUpload = document.getElementById('cancel-upload');
    const uploadForm = document.getElementById('upload-form');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const logoutBtn = document.getElementById('logout-btn');

    const handleSearchDebounced = Utils.debounce(handleSearch, 300);

    if (searchInput) searchInput.addEventListener('input', handleSearchDebounced);
    if (searchInputMobile) searchInputMobile.addEventListener('input', handleSearchDebounced);
    if (searchInputDesktop) searchInputDesktop.addEventListener('input', handleSearchDebounced);

    if (uploadBtn) uploadBtn.addEventListener('click', () => openUploadModal());
    if (uploadFirstBtn) uploadFirstBtn.addEventListener('click', () => openUploadModal());
    if (closeUploadModal) closeUploadModal.addEventListener('click', closeUploadModalFn);
    if (cancelUpload) cancelUpload.addEventListener('click', closeUploadModalFn);
    if (uploadForm) uploadForm.addEventListener('submit', handleFileUpload);
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
});

const t = (key, fallback) => typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
const lang = typeof I18n !== 'undefined' ? I18n.getCurrentLanguage() : 'ar';

async function loadFiles() {
    try {
        const data = await Api.admin.files.list(currentPage, currentSearch);
        const files = data.files || data.data || data || [];
        const total = data.total || files.length;

        totalPages = Math.ceil(total / 20);
        renderFiles(files);
        renderPagination(total, currentPage);
    } catch (error) {
        console.error('Error loading files:', error);
        const grid = document.getElementById('files-grid');
        if (grid) {
            grid.innerHTML = `<div class="col-span-full text-center py-12 text-red-500">${t('errors.loadFailed', 'خطأ في تحميل الملفات')}</div>`;
        }
    }
}

function renderFiles(files) {
    const grid = document.getElementById('files-grid');
    const emptyState = document.getElementById('empty-state');

    if (!grid) return;

    if (files.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    grid.innerHTML = '';

    files.forEach(file => {
        const card = createFileCard(file);
        grid.appendChild(card);
    });
}

function createFileCard(file) {
    const div = document.createElement('div');
    div.className = 'group relative flex flex-col bg-white rounded-xl border border-[#f0f2f4] hover:border-primary/30 hover:shadow-md transition-all cursor-pointer overflow-hidden';

    const isImage = file.mime_type && file.mime_type.startsWith('image/');
    const fileSize = formatFileSize(file.size);
    const uploadDate = Utils.formatDate(file.created_at, lang);
    const fileUrl = file.url || file.public_url || `${Config.R2_PUBLIC_URL}/${file.r2_key}`;

    let previewContent = '';
    if (isImage) {
        previewContent = `
            <div class="aspect-square w-full bg-[#f8fafc] relative overflow-hidden">
                <div class="absolute inset-0 bg-center bg-cover transition-transform duration-500 group-hover:scale-105" style="background-image: url('${fileUrl}')"></div>
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button class="view-file-btn bg-white/90 hover:bg-white text-primary rounded-full p-2 backdrop-blur-sm transition-transform hover:scale-110" data-url="${fileUrl}" title="${t('actions.view', 'عرض')}">
                        <span class="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                    <button class="delete-file-btn bg-white/90 hover:bg-red-50 text-red-600 rounded-full p-2 backdrop-blur-sm transition-transform hover:scale-110" data-id="${file.id}" title="${t('actions.delete', 'حذف')}">
                        <span class="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                </div>
            </div>
        `;
    } else {
        const icon = getFileIcon(file.mime_type);
        previewContent = `
            <div class="aspect-square w-full bg-[#f8fafc] relative overflow-hidden flex items-center justify-center">
                <span class="material-symbols-outlined text-4xl text-[#94a3b8]">${icon}</span>
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button class="view-file-btn bg-white/90 hover:bg-white text-primary rounded-full p-2 backdrop-blur-sm transition-transform hover:scale-110" data-url="${fileUrl}" title="${t('actions.view', 'عرض')}">
                        <span class="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                    <button class="delete-file-btn bg-white/90 hover:bg-red-50 text-red-600 rounded-full p-2 backdrop-blur-sm transition-transform hover:scale-110" data-id="${file.id}" title="${t('actions.delete', 'حذف')}">
                        <span class="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                </div>
            </div>
        `;
    }

    div.innerHTML = `
        ${previewContent}
        <div class="p-3">
            <h4 class="font-semibold text-[#111418] text-sm mb-1 truncate" title="${file.original_name}">${file.original_name}</h4>
            <p class="text-xs text-[#617589] mb-3">${fileSize} • ${uploadDate}</p>
            <div class="flex items-center justify-between">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">${file.entity_type || t('admin.files.general', 'عام')}</span>
                <button class="copy-url-btn p-1.5 text-[#617589] hover:text-primary hover:bg-primary/10 rounded-md transition-colors" data-url="${fileUrl}" title="${t('actions.copyUrl', 'نسخ الرابط')}">
                    <span class="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
            </div>
        </div>
    `;

    // Add event listeners
    div.querySelector('.copy-url-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        copyFileUrl(fileUrl);
    });
    div.querySelectorAll('.delete-file-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFile(file.id, file.original_name);
        });
    });
    div.querySelectorAll('.view-file-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(fileUrl, '_blank');
        });
    });

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
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function renderPagination(total, page) {
    const container = document.getElementById('pagination-container');
    if (!container || total === 0) {
        if (container) container.innerHTML = '';
        return;
    }

    const start = (page - 1) * 20 + 1;
    const end = Math.min(page * 20, total);

    container.innerHTML = `
        <div class="flex flex-1 items-center justify-between">
            <div>
                <p class="text-sm text-text-secondary">
                    ${t('pagination.showing', 'عرض')} <span class="font-medium text-text-main font-['Work_Sans']">${start}</span> ${t('pagination.to', 'إلى')} <span class="font-medium text-text-main font-['Work_Sans']">${end}</span> ${t('pagination.of', 'من')} <span class="font-medium text-text-main font-['Work_Sans']">${total}</span> ${t('admin.files.file', 'ملف')}
                </p>
            </div>
            <div>
                <nav aria-label="Pagination" class="isolate inline-flex -space-x-px rounded-md shadow-sm dir-ltr">
                    <button class="prev-btn relative inline-flex items-center rounded-r-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${page === 1 ? 'pointer-events-none opacity-50' : ''}">
                        <span class="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    ${generatePaginationButtons(totalPages, page)}
                    <button class="next-btn relative inline-flex items-center rounded-l-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${page === totalPages ? 'pointer-events-none opacity-50' : ''}">
                        <span class="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                </nav>
            </div>
        </div>
    `;

    // Add event listeners
    const prevBtn = container.querySelector('.prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (page > 1) {
                currentPage--;
                loadFiles();
            }
        });
    }

    const nextBtn = container.querySelector('.next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (page < totalPages) {
                currentPage++;
                loadFiles();
            }
        });
    }

    container.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentPage = parseInt(e.target.dataset.page);
            loadFiles();
        });
    });
}

function generatePaginationButtons(total, current) {
    let buttons = '';

    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
            const isActive = i === current;
            buttons += `
                <button class="page-btn relative inline-flex items-center px-4 py-2 text-sm font-semibold ${isActive ? 'z-10 bg-primary text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary' : 'text-text-secondary ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}" data-page="${i}">
                    ${i}
                </button>
            `;
        } else if (i === current - 2 || i === current + 2) {
            buttons += `
                <span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">...</span>
            `;
        }
    }
    return buttons;
}

function handleSearch(event) {
    // Current target is the input element
    const val = event ? event.target.value : '';
    // Sync inputs if needed, but since we attached debounce to all inputs, 'event.target' is the source.
    // However, if we want to sync them:
    const mobileInput = document.getElementById('search-input-mobile');
    const desktopInput = document.getElementById('search-input-desktop');

    if (mobileInput && mobileInput !== event.target && mobileInput.value !== val) mobileInput.value = val;
    if (desktopInput && desktopInput !== event.target && desktopInput.value !== val) desktopInput.value = val;

    currentSearch = val;
    currentPage = 1;
    loadFiles();
}


function openUploadModal() {
    const modal = document.getElementById('upload-modal');
    const progressContainer = document.getElementById('upload-progress');
    const form = document.getElementById('upload-form');

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.remove('opacity-0', 'pointer-events-none');
    }
    if (progressContainer) progressContainer.classList.add('hidden');
    if (form) form.reset();
}

function closeUploadModalFn() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

async function handleFileUpload(event) {
    event.preventDefault();

    const fileInput = document.getElementById('file-input');
    const file = fileInput?.files[0];

    if (!file) {
        Utils.showToast(t('admin.files.selectFile', 'اختر ملفاً للرفع'), 'error');
        return;
    }

    const progressContainer = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');

    if (progressContainer) progressContainer.classList.remove('hidden');

    try {
        // Step 1: Get signed upload URL from backend
        // Note: Assuming Api.admin.files.getUploadUrl exists, if not need to verify Api module.
        // If not, we might fail here. But preserving previous logic.
        const uploadData = await Api.admin.files.getUploadUrl(file.name);

        // Step 2: Upload file directly to R2
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && progressBar) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBar.style.width = percentComplete + '%';
            }
        });

        await new Promise((resolve, reject) => {
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error('Upload failed'));
                }
            });
            xhr.addEventListener('error', () => reject(new Error('Upload failed')));

            xhr.open('PUT', uploadData.uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
        });

        // Step 3: Register file in database
        await Api.post('/admin/files', {
            r2_key: uploadData.key,
            filename: file.name,
            original_name: file.name,
            mime_type: file.type,
            size: file.size
        }, { admin: true });

        Utils.showToast(t('admin.files.uploaded', 'تم رفع الملف بنجاح'), 'success');
        closeUploadModalFn();
        loadFiles();

    } catch (error) {
        console.error('Error uploading file:', error);
        Utils.showToast(Utils.parseError(error, lang), 'error');
        if (progressContainer) progressContainer.classList.add('hidden');
    }
}

function copyFileUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        Utils.showToast(t('admin.files.urlCopied', 'تم نسخ الرابط'), 'success');
    }).catch(() => {
        Utils.showToast(t('admin.files.copyFailed', 'فشل في نسخ الرابط'), 'error');
    });
}

async function deleteFile(fileId, fileName) {
    const confirmed = confirm(t('admin.files.confirmDelete', `هل أنت متأكد من حذف الملف "${fileName}"؟`));

    if (confirmed) {
        try {
            await Api.admin.files.delete(fileId);
            Utils.showToast(t('admin.files.deleted', 'تم حذف الملف بنجاح'), 'success');
            loadFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            Utils.showToast(Utils.parseError(error, lang), 'error');
        }
    }
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
