import { api } from './api.js';

// ฟังก์ชันร่วมกันสำหรับทุกหน้า
export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// ฟังก์ชันสำหรับหน้า Documents
export function deleteDocument(id, currentPage) {
    if (!confirm('Delete this document?')) return;
    
    api.deleteDocument(id)
        .then(() => {
            // รีโหลดหน้าปัจจุบัน
            window.location.reload();
        })
        .catch(err => {
            console.error(err);
            showToast('Failed to delete', 'error');
        });
}

// ฟังก์ชันสำหรับหน้า Templates
export function deleteTemplate(id) {
    if (!confirm('Delete this template?')) return;
    
    api.deleteTemplate(id)
        .then(() => {
            // รีโหลดหน้าปัจจุบัน
            window.location.reload();
        })
        .catch(err => {
            console.error(err);
            showToast('Failed to delete', 'error');
        });
}

// ฟังก์ชันสำหรับหน้า Extractor
export function handleExtractorSubmit() {
    // โค้ดการส่งฟอร์ม
    // ...
    
    // เมื่อเสร็จ ให้รีดิเรกท์ไปยังหน้า Documents
    window.location.href = 'documents.html';
}