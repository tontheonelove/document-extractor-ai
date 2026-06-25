const API_BASE = 'http://localhost:8000';

// ==========================================
// GLOBAL STATE
// Description: ติดตามสถานะการ Extract เพื่อป้องกัน Status Indicator เปลี่ยนเป็น Offline
// ==========================================
let isExtracting = false;

// ==========================================
// API CLIENT
// Description: จัดการการเรียก API ทั้งหมด
// ==========================================
export const api = {
    async _handleResponse(res) {
        if (!res.ok) {
            let errorMsg = `HTTP ${res.status}`;
            try {
                const errorData = await res.json();
                errorMsg = errorData.detail || errorMsg;
            } catch (e) {
                errorMsg = res.statusText || errorMsg;
            }
            throw new Error(errorMsg);
        }
        return res.json();
    },

    async checkHealth() {
        if (isExtracting) {
            return { status: 'busy' };
        }
        
        try {
            const res = await fetch(`${API_BASE}/`, {
                signal: AbortSignal.timeout(5000)
            });
            if (res.ok) {
                return { status: 'online', ...(await res.json()) };
            }
            return null;
        } catch (err) {
            return null;
        }
    },

    async getDocuments(search = '', templateId = '', page = 1, perPage = 10) {
        const params = new URLSearchParams({
            search: search,
            page: page.toString(),
            per_page: perPage.toString()
        });
        
        if (templateId) {
            params.append('template_id', templateId);
        }
        
        const res = await fetch(`${API_BASE}/api/documents?${params}`);
        return this._handleResponse(res);
    },

    async getTemplates() {
        const res = await fetch(`${API_BASE}/api/templates`);
        return this._handleResponse(res);
    },

    async createTemplate(data) {
        const res = await fetch(`${API_BASE}/api/templates`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return this._handleResponse(res);
    },

    async deleteTemplate(id) {
        const res = await fetch(`${API_BASE}/api/templates/${id}`, { method: 'DELETE' });
        return this._handleResponse(res);
    },

    async deleteDocument(id) {
        const res = await fetch(`${API_BASE}/api/documents/${id}`, { method: 'DELETE' });
        return this._handleResponse(res);
    },

    getExportUrl(id, format) {
        return `${API_BASE}/api/documents/${id}/export/${format}`;
    },

    async extractDocument(file, templateId, mode = 'structured', enableThinking = false, instructions = '') {
        isExtracting = true;
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (templateId) formData.append('template_id', templateId);
            formData.append('mode', mode);
            formData.append('enable_thinking', enableThinking);
            if (instructions) formData.append('instructions', instructions);
            
            const res = await fetch(`${API_BASE}/api/extract`, { 
                method: 'POST', 
                body: formData 
            });
            
            return this._handleResponse(res);
        } finally {
            isExtracting = false;
        }
    },

    // ✅ Batch Export - ใส่ตรงนี้ (ภายใน api object)
    async exportBatchDocuments(docIds, format = 'xlsx') {
        return fetch(`${API_BASE}/api/documents/export-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doc_ids: docIds,
                format: format
            })
        });
    }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg`;
    toast.innerHTML = `<i class="fas fa-info-circle mr-2"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

export async function updateBackendStatus() {
    const indicator = document.getElementById('backendStatus');
    if (!indicator) return;
    
    const health = await api.checkHealth();
    
    if (health && health.status === 'busy') {
        indicator.innerHTML = `
            <div class="flex items-center gap-2 text-sm text-yellow-400">
                <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                Processing...
            </div>
            <div class="mt-1 text-xs text-slate-500">
                <i class="fas fa-spinner fa-spin"></i> Extracting document
            </div>
        `;
        return;
    }
    
    if (health && health.status === 'online') {
        indicator.innerHTML = `
            <div class="flex items-center gap-2 text-sm text-green-400">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Backend Online
            </div>
            <div class="mt-1 text-xs text-slate-500">
                NuExtract3 Ready
            </div>
        `;
    } else {
        indicator.innerHTML = `
            <div class="flex items-center gap-2 text-sm text-red-400">
                <div class="w-2 h-2 bg-red-400 rounded-full"></div>
                Backend Offline
            </div>
            <div class="mt-1 text-xs text-slate-500">
                Check if server is running
            </div>
        `;
    }
}

export function initStatusChecker() {
    updateBackendStatus();
    setInterval(updateBackendStatus, 10000);
}