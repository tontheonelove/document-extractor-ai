import { api, showToast } from './api.js';

// ==========================================
// DOCUMENTS PAGE
// Description: แสดงรายการเอกสารพร้อม Filter Template, Pagination, Batch Export
// ==========================================
let currentPage = 1;
const PER_PAGE = 10;
let searchQuery = '';
let selectedTemplateId = '';
let allTemplates = [];
let selectedDocIds = new Set();  // ✅ เก็บ IDs ที่เลือก

async function renderDocuments() {
    const container = document.getElementById('pageContent');
    if (!container) return;
    
    container.innerHTML = `
        <div class="flex items-center justify-center py-20">
            <div class="text-center">
                <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-slate-400">Loading documents...</p>
            </div>
        </div>
    `;
    
    try {
        if (allTemplates.length === 0) {
            allTemplates = await api.getTemplates();
        }
        
        const data = await api.getDocuments(searchQuery, selectedTemplateId, currentPage, PER_PAGE);
        renderDocumentsList(data.documents, data.pagination);
    } catch (err) {
        console.error('[Documents] Error:', err);
        container.innerHTML = `
            <div class="bg-red-500/10 border border-red-500 rounded-xl p-6 text-center">
                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                <h3 class="text-xl font-bold text-red-400 mb-2">Failed to Load</h3>
                <p class="text-slate-400 mb-4">${err.message}</p>
                <button onclick="location.reload()" class="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg">
                    <i class="fas fa-sync-alt mr-2"></i> Retry
                </button>
            </div>
        `;
    }
}

function renderDocumentsList(documents, pagination) {
    const container = document.getElementById('pageContent');
    
    const filterLabel = selectedTemplateId 
        ? allTemplates.find(t => t.id === selectedTemplateId)?.name || 'Unknown' 
        : 'All Templates';

    // ✅ คำนวณว่า Select All ควร checked ไหม
    const allSelected = documents.length > 0 && documents.every(d => selectedDocIds.has(d.id));
    const someSelected = documents.some(d => selectedDocIds.has(d.id));

    container.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h2 class="text-2xl font-bold">Documents</h2>
                <p class="text-sm text-slate-400 mt-1">
                    Showing ${documents.length} of ${pagination.total} documents
                    ${searchQuery ? ` · Search: "${searchQuery}"` : ''}
                    ${selectedTemplateId ? ` · Template: ${filterLabel}` : ''}
                </p>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div class="relative flex-1 sm:flex-none">
                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                    <input 
                        type="text" 
                        id="searchInput"
                        value="${searchQuery}"
                        placeholder="Search by name..." 
                        class="bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 w-full sm:w-64 focus:outline-none focus:border-primary"
                    >
                </div>
                
                <div class="relative flex-1 sm:flex-none">
                    <i class="fas fa-filter absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                    <select 
                        id="templateFilter"
                        class="bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-8 w-full sm:w-48 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                        <option value="">All Templates</option>
                        ${allTemplates.map(t => `
                            <option value="${t.id}" ${selectedTemplateId === t.id ? 'selected' : ''}>
                                ${t.name}
                            </option>
                        `).join('')}
                    </select>
                    <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"></i>
                </div>
                
                <a href="extractor.html" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 text-center whitespace-nowrap">
                    <i class="fas fa-plus mr-2"></i> New Extraction
                </a>
            </div>
        </div>
        
        <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-4">
            <table class="w-full">
                <thead class="bg-slate-800 border-b border-slate-700">
                    <tr>
                        <!-- ✅ Select All Checkbox -->
                        <th class="p-4 w-12">
                            <input 
                                type="checkbox" 
                                id="selectAllCheckbox"
                                ${allSelected ? 'checked' : ''}
                                ${documents.length === 0 ? 'disabled' : ''}
                                class="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary focus:ring-primary focus:ring-offset-slate-800 cursor-pointer"
                            >
                        </th>
                        <th class="text-left p-4 text-sm">Document</th>
                        <th class="text-left p-4 text-sm">Template</th>
                        <th class="text-left p-4 text-sm">Status</th>
                        <th class="text-left p-4 text-sm">Date</th>
                        <th class="text-right p-4 text-sm">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${documents.map(doc => {
                        const isSelected = selectedDocIds.has(doc.id);
                        const tplName = doc.template_name || 'Markdown';
                        const isMarkdown = !doc.template_id;
                        const badgeColor = isMarkdown 
                            ? 'bg-slate-700/50 text-slate-300 border-slate-600' 
                            : 'bg-primary/10 text-primary border-primary/20';

                        return `
                        <tr class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}">
                            <!-- ✅ Row Checkbox -->
                            <td class="p-4">
                                <input 
                                    type="checkbox" 
                                    data-doc-id="${doc.id}"
                                    ${isSelected ? 'checked' : ''}
                                    class="doc-checkbox w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary focus:ring-primary focus:ring-offset-slate-800 cursor-pointer"
                                >
                            </td>
                            <td class="p-4">
                                <div class="flex items-center gap-3">
                                    <i class="fas ${doc.name.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf text-red-400' : 'fa-file-image text-blue-400'}"></i>
                                    <span class="font-medium truncate max-w-[200px]" title="${doc.name}">${doc.name}</span>
                                </div>
                            </td>
                            <td class="p-4">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}">
                                    <i class="fas ${isMarkdown ? 'fa-file-alt' : 'fa-code'} mr-1.5"></i>
                                    ${tplName}
                                </span>
                            </td>
                            <td class="p-4">
                                <span class="px-2 py-1 rounded text-xs ${
                                    doc.status === 'verified' ? 'bg-blue-500/10 text-blue-400' : 
                                    doc.status === 'failed' ? 'bg-red-500/10 text-red-400' : 
                                    'bg-green-500/10 text-green-400'
                                }">
                                    ${doc.status}
                                </span>
                            </td>
                            <td class="p-4 text-slate-400 text-sm">${new Date(doc.created_at).toLocaleString()}</td>
                            <td class="p-4 text-right">
                                <div class="flex items-center justify-end gap-1">
                                    <button onclick="viewDocument('${doc.id}')" class="text-blue-400 hover:text-white p-2 hover:bg-slate-800 rounded" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button onclick="editDocument('${doc.id}')" class="text-yellow-400 hover:text-white p-2 hover:bg-slate-800 rounded" title="Edit JSON">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteDocument('${doc.id}')" class="text-red-400 hover:text-white p-2 hover:bg-slate-800 rounded" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('') || `
                        <tr>
                            <td colspan="6" class="p-12 text-center">
                                <i class="fas fa-inbox text-4xl text-slate-600 mb-3"></i>
                                <p class="text-slate-400">No documents found</p>
                                ${selectedTemplateId ? '<p class="text-xs text-slate-500 mt-2">Try changing the template filter</p>' : ''}
                            </td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>
        
        ${pagination.total_pages > 1 ? renderPagination(pagination) : ''}
        
        <!-- ✅ Floating Action Bar (แสดงเมื่อมีการเลือก) -->
        ${selectedDocIds.size > 0 ? renderFloatingBar() : ''}
    `;
    
    setupEventListeners();
}

// ✅ Floating Action Bar สำหรับ Batch Export
function renderFloatingBar() {
    const count = selectedDocIds.size;
    return `
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
            <div class="bg-slate-900 border border-primary/30 rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <i class="fas fa-check text-primary"></i>
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-white">${count} document${count > 1 ? 's' : ''} selected</p>
                        <p class="text-xs text-slate-400">Ready to export</p>
                    </div>
                </div>
                
                <div class="h-8 w-px bg-slate-700"></div>
                
                <div class="flex items-center gap-2">
                    <button onclick="exportSelectedDocs('csv')" class="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 text-sm font-medium transition-colors">
                        <i class="fas fa-file-csv mr-1.5"></i> CSV
                    </button>
                    <button onclick="exportSelectedDocs('xlsx')" class="px-3 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 text-sm font-medium transition-colors">
                        <i class="fas fa-file-excel mr-1.5"></i> Excel
                    </button>
                </div>
                
                <div class="h-8 w-px bg-slate-700"></div>
                
                <button onclick="clearSelection()" class="px-3 py-2 text-slate-400 hover:text-white text-sm transition-colors" title="Clear selection">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
}

function setupEventListeners() {
    // Search Input (Debounce 500ms)
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value;
            currentPage = 1;
            renderDocuments();
        }, 500);
    });

    // Template Filter Dropdown
    const templateFilter = document.getElementById('templateFilter');
    templateFilter?.addEventListener('change', (e) => {
        selectedTemplateId = e.target.value;
        currentPage = 1;
        renderDocuments();
    });

    // ✅ Select All Checkbox
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    selectAllCheckbox?.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.doc-checkbox');
        checkboxes.forEach(cb => {
            const docId = cb.dataset.docId;
            if (e.target.checked) {
                selectedDocIds.add(docId);
            } else {
                selectedDocIds.delete(docId);
            }
        });
        renderDocuments();  // Re-render เพื่ออัปเดต UI
    });

    // ✅ Individual Checkboxes (Event Delegation)
    document.querySelectorAll('.doc-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const docId = e.target.dataset.docId;
            if (e.target.checked) {
                selectedDocIds.add(docId);
            } else {
                selectedDocIds.delete(docId);
            }
            renderDocuments();  // Re-render เพื่ออัปเดต Select All state + Floating Bar
        });
    });
}

// ✅ Batch Export Function
window.exportSelectedDocs = async function(format) {
    const docIds = Array.from(selectedDocIds);
    
    if (docIds.length === 0) {
        showToast('Please select at least 1 document', 'error');
        return;
    }
    
    showToast(`Exporting ${docIds.length} document${docIds.length > 1 ? 's' : ''}...`, 'info');
    
    try {
        const response = await api.exportBatchDocuments(docIds, format);
        
        // ✅ แก้ไขส่วนนี้: แสดง Error จาก Backend ให้ชัดเจน
        if (!response.ok) {
            const err = await response.json();
            // FastAPI มักจะ return { "detail": "..." } หรือ Array ของ error
            const errorMsg = Array.isArray(err.detail) 
                ? err.detail.map(e => e.msg).join(', ') 
                : (err.detail || 'Export failed');
            throw new Error(errorMsg);
        }
        
        // ดาวน์โหลดไฟล์
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
        a.download = `batch_export_${timestamp}.${format}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast(`Exported ${docIds.length} document${docIds.length > 1 ? 's' : ''} successfully!`, 'success');
        clearSelection();
        
    } catch (err) {
        console.error('[Documents] Export error:', err);
        showToast(err.message || 'Export failed', 'error');
    }
};

// ✅ Clear Selection
window.clearSelection = function() {
    selectedDocIds.clear();
    renderDocuments();
};

function renderPagination(pagination) {
    const { page, total_pages, has_prev, has_next } = pagination;
    
    let pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(total_pages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    
    return `
        <div class="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div class="text-sm text-slate-400">
                Page ${page} of ${total_pages}
            </div>
            
            <div class="flex items-center gap-2">
                <button 
                    onclick="goToPage(1)" 
                    ${!has_prev ? 'disabled' : ''}
                    class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <i class="fas fa-angle-double-left"></i>
                </button>
                <button 
                    onclick="goToPage(${page - 1})" 
                    ${!has_prev ? 'disabled' : ''}
                    class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <i class="fas fa-angle-left"></i>
                </button>
                
                ${pages.map(p => `
                    <button 
                        onclick="goToPage(${p})" 
                        class="px-4 py-2 rounded-lg ${p === page ? 'bg-primary text-white' : 'bg-slate-800 hover:bg-slate-700'} transition-colors min-w-[40px]"
                    >
                        ${p}
                    </button>
                `).join('')}
                
                <button 
                    onclick="goToPage(${page + 1})" 
                    ${!has_next ? 'disabled' : ''}
                    class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <i class="fas fa-angle-right"></i>
                </button>
                <button 
                    onclick="goToPage(${total_pages})" 
                    ${!has_next ? 'disabled' : ''}
                    class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
        </div>
    `;
}

// ==========================================
// GLOBAL FUNCTIONS
// ==========================================
window.goToPage = function(page) {
    currentPage = page;
    renderDocuments();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.viewDocument = async function(id) {
    try {
        const data = await api.getDocuments('', selectedTemplateId, 1, 10000);
        const doc = data.documents.find(d => d.id === id);
        if (!doc) return;
        
        const modal = document.getElementById('modalContainer');
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onclick="if(event.target === this) document.getElementById('modalContainer').innerHTML=''">
                <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
                    <div class="p-6 border-b border-slate-800 flex justify-between items-center">
                        <div>
                            <h3 class="text-xl font-bold">${doc.name}</h3>
                            <p class="text-sm text-slate-400 mt-1">
                                <i class="fas fa-code mr-1"></i> ${doc.template_name || 'Markdown'} 
                                <span class="mx-2">·</span> 
                                <span class="${doc.status === 'verified' ? 'text-blue-400' : 'text-green-400'}">${doc.status}</span>
                            </p>
                        </div>
                        <button onclick="document.getElementById('modalContainer').innerHTML=''" class="text-slate-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded hover:bg-slate-800">
                            &times;
                        </button>
                    </div>
                    <div class="p-6 overflow-auto flex-1">
                        <pre class="bg-slate-800 p-4 rounded-lg text-sm overflow-auto">${JSON.stringify(doc.result, null, 2)}</pre>
                    </div>
                    <div class="p-4 border-t border-slate-800 flex gap-2 justify-end">
                        <a href="${api.getExportUrl(doc.id, 'json')}" class="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-sm">
                            <i class="fas fa-code mr-2 text-yellow-400"></i> JSON
                        </a>
                        <a href="${api.getExportUrl(doc.id, 'csv')}" class="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-sm">
                            <i class="fas fa-file-csv mr-2 text-green-400"></i> CSV
                        </a>
                        <a href="${api.getExportUrl(doc.id, 'xlsx')}" class="px-4 py-2 bg-primary rounded-lg hover:bg-primary/90 text-sm">
                            <i class="fas fa-file-excel mr-2"></i> Excel
                        </a>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error(err);
        showToast('Failed to view document', 'error');
    }
};

window.editDocument = async function(id) {
    try {
        const data = await api.getDocuments('', selectedTemplateId, 1, 10000);
        const doc = data.documents.find(d => d.id === id);
        if (!doc) return;
        
        const modal = document.getElementById('modalContainer');
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-5xl w-full max-h-[85vh] flex flex-col">
                    <div class="p-6 border-b border-slate-800 flex justify-between items-center">
                        <div>
                            <h3 class="text-xl font-bold flex items-center gap-2">
                                <i class="fas fa-edit text-yellow-400"></i>
                                Edit: ${doc.name}
                            </h3>
                            <p class="text-sm text-slate-400 mt-1">${doc.template_name || 'Markdown'} · แก้ไข JSON ได้ตามต้องการ</p>
                        </div>
                        <button onclick="document.getElementById('modalContainer').innerHTML=''" class="text-slate-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded hover:bg-slate-800">
                            &times;
                        </button>
                    </div>
                    
                    <div class="px-6 py-3 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                        <div class="text-sm text-slate-400">
                            <i class="fas fa-info-circle mr-1"></i>
                            แก้ไข JSON แล้วกด Save เพื่อบันทึก
                        </div>
                        <div class="flex gap-2">
                            <button onclick="formatJson()" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm">
                                <i class="fas fa-align-left mr-1"></i> Format
                            </button>
                            <button onclick="resetJson()" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm">
                                <i class="fas fa-undo mr-1"></i> Reset
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex-1 p-6 overflow-hidden">
                        <textarea 
                            id="jsonEditor" 
                            class="w-full h-full bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm text-green-400 focus:outline-none focus:border-primary resize-none"
                            spellcheck="false"
                        >${JSON.stringify(doc.result, null, 2)}</textarea>
                    </div>
                    
                    <div class="p-4 border-t border-slate-800 flex justify-between items-center">
                        <div class="text-xs text-slate-500" id="jsonStatus">
                            <i class="fas fa-check-circle text-green-400 mr-1"></i> Valid JSON
                        </div>
                        <div class="flex gap-2">
                            <button onclick="document.getElementById('modalContainer').innerHTML=''" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm">
                                Cancel
                            </button>
                            <button onclick="saveEditedDocument('${doc.id}')" class="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm font-medium">
                                <i class="fas fa-save mr-2"></i> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        window._originalJson = JSON.stringify(doc.result, null, 2);
        
        const editor = document.getElementById('jsonEditor');
        const status = document.getElementById('jsonStatus');
        editor.addEventListener('input', () => {
            try {
                JSON.parse(editor.value);
                status.innerHTML = '<i class="fas fa-check-circle text-green-400 mr-1"></i> Valid JSON';
                status.className = 'text-xs text-slate-500';
            } catch (e) {
                status.innerHTML = `<i class="fas fa-exclamation-triangle text-red-400 mr-1"></i> Invalid: ${e.message}`;
                status.className = 'text-xs text-red-400';
            }
        });
        
    } catch (err) {
        console.error(err);
        showToast('Failed to load document', 'error');
    }
};

window.formatJson = function() {
    const editor = document.getElementById('jsonEditor');
    try {
        const parsed = JSON.parse(editor.value);
        editor.value = JSON.stringify(parsed, null, 2);
        showToast('JSON formatted', 'success');
    } catch (e) {
        showToast('Cannot format - Invalid JSON', 'error');
    }
};

window.resetJson = function() {
    if (confirm('Reset to original JSON?')) {
        document.getElementById('jsonEditor').value = window._originalJson;
        showToast('Reset to original', 'info');
    }
};

window.saveEditedDocument = async function(id) {
    const editor = document.getElementById('jsonEditor');
    
    try {
        const newResult = JSON.parse(editor.value);
        
        const response = await fetch(`http://localhost:8000/api/documents/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                result: newResult, 
                status: 'verified' 
            })
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to save');
        }
        
        showToast('Document saved and verified!', 'success');
        document.getElementById('modalContainer').innerHTML = '';
        renderDocuments();
        
    } catch (e) {
        if (e instanceof SyntaxError) {
            showToast('Invalid JSON - please check syntax', 'error');
        } else {
            console.error(e);
            showToast(e.message || 'Failed to save', 'error');
        }
    }
};

window.deleteDocument = async function(id) {
    if (!confirm('Delete this document?')) return;
    
    try {
        await api.deleteDocument(id);
        // ✅ ลบออกจาก selection ด้วย
        selectedDocIds.delete(id);
        showToast('Document deleted', 'success');
        renderDocuments();
    } catch (err) {
        console.error(err);
        showToast('Failed to delete', 'error');
    }
};

// ==========================================
// AUTO-RUN
// ==========================================
renderDocuments();