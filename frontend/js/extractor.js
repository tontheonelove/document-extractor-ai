// ==========================================
// STATIC IMPORT
// ==========================================
import { api, showToast } from './api.js';

// ==========================================
// GLOBAL STATE
// ==========================================
window._extractorState = {
    documents: [],
    templates: [],
    selectedFiles: [],
    currentMode: 'structured',
    MAX_BATCH_SIZE: 5,
    RECENT_LIMIT: 3  // ✅ เพิ่ม: แสดงแค่ 3 รายการล่าสุด
};

// ==========================================
// GLOBAL FUNCTIONS
// ==========================================
window.extractorStartExtraction = async function() {
    console.log('='.repeat(60));
    console.log('[Extractor] 🚀 START BATCH EXTRACTION');
    console.log('='.repeat(60));
    
    const state = window._extractorState;
    console.log('[Extractor] 📁 Files to process:', state.selectedFiles.length);
    state.selectedFiles.forEach((f, i) => {
        console.log(`   ${i + 1}. ${f.name}`);
    });
    console.log('[Extractor] 🎯 Mode:', state.currentMode);
    console.log('='.repeat(60));

    if (state.selectedFiles.length === 0) {
        console.warn('[Extractor] ️ No files selected');
        return;
    }

    const extractBtn = document.getElementById('extractBtn');
    const progressSection = document.getElementById('progressSection');
    const templateSelect = document.getElementById('templateSelect');
    const instructions = document.getElementById('instructions')?.value || '';
    const templateId = templateSelect?.value || '';
    const totalFiles = state.selectedFiles.length;

    extractBtn.disabled = true;
    extractBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
    progressSection.classList.remove('hidden');

    let success = 0;
    let failed = 0;

    for (let i = 0; i < totalFiles; i++) {
        const file = state.selectedFiles[i];
        const pct = Math.round(((i + 1) / totalFiles) * 100);

        console.log(`\n[Extractor] 📤 [${i + 1}/${totalFiles}] Processing: ${file.name}`);

        document.getElementById('progressText').textContent = `Processing: ${file.name}`;
        document.getElementById('progressBar').style.width = `${pct}%`;
        document.getElementById('progressPercent').textContent = `${pct}%`;

        try {
            const startTime = Date.now();
            await api.extractDocument(file, templateId, state.currentMode, false, instructions);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            
            console.log(`[Extractor] ✅ SUCCESS: ${file.name} (${duration}s)`);
            success++;
        } catch (err) {
            console.error(`[Extractor] ❌ FAILED: ${file.name}`, err.message);
            failed++;
        }

        if (i < totalFiles - 1) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`[Extractor] 🏁 DONE: ${success}/${totalFiles}`);
    console.log('='.repeat(60));

    document.getElementById('progressBar').style.width = '100%';
    document.getElementById('progressPercent').textContent = '100%';
    document.getElementById('progressText').textContent = `✅ Done! ${success} success, ${failed} failed`;

    showToast(`Batch: ${success}/${totalFiles} successful`, success > 0 ? 'success' : 'error');

    // อัปเดต Recent Documents (ดึงแค่ 3 ล่าสุด)
    console.log('[Extractor] 🔄 Refreshing recent documents...');
    await refreshRecentDocs();

    // Reset form
    extractBtn.disabled = false;
    extractBtn.innerHTML = '<i class="fas fa-magic mr-2"></i> Extract';
    progressSection.classList.add('hidden');
    state.selectedFiles = [];
    updateFileListUI();
    checkReady();
};

async function refreshRecentDocs() {
    try {
        console.log('[Extractor] 📡 Fetching documents from API...');
        // ✅ ดึงแค่ 3 รายการล่าสุด
        const docsResponse = await api.getDocuments('', '', 1, 3);
        
        console.log('[Extractor]  API Response:', docsResponse);
        console.log('[Extractor] 📄 Documents count:', docsResponse.documents?.length || 0);
        
        if (docsResponse.documents && docsResponse.documents.length > 0) {
            window._extractorState.documents = docsResponse.documents;
            
            const recentList = document.getElementById('recentDocsList');
            if (recentList) {
                recentList.innerHTML = renderRecentDocs();
                console.log('[Extractor] ✅ Recent docs updated!');
            }
        }
    } catch (err) {
        console.error('[Extractor] ❌ Failed to refresh recent docs:', err);
    }
}

window.extractorRemoveFile = function(index) {
    window._extractorState.selectedFiles.splice(index, 1);
    updateFileListUI();
    checkReady();
};

window.extractorSetMode = function(mode) {
    window._extractorState.currentMode = mode;
    const structBtn = document.getElementById('modeStructured');
    const mdBtn = document.getElementById('modeMarkdown');
    const tplSection = document.getElementById('templateSection');

    if (mode === 'structured') {
        structBtn.className = 'flex-1 py-2 rounded-lg bg-primary text-white font-medium';
        mdBtn.className = 'flex-1 py-2 rounded-lg bg-slate-800 text-slate-400';
        tplSection.classList.remove('hidden');
    } else {
        mdBtn.className = 'flex-1 py-2 rounded-lg bg-primary text-white font-medium';
        structBtn.className = 'flex-1 py-2 rounded-lg bg-slate-800 text-slate-400';
        tplSection.classList.add('hidden');
    }
    checkReady();
};

window.checkReady = function() {
    const state = window._extractorState;
    const extractBtn = document.getElementById('extractBtn');
    const templateSelect = document.getElementById('templateSelect');
    if (!extractBtn || !templateSelect) return;
    const hasFiles = state.selectedFiles.length > 0;
    const hasTemplate = state.currentMode === 'markdown' || templateSelect.value;
    extractBtn.disabled = !(hasFiles && hasTemplate);
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function renderRecentDocs() {
    const docs = window._extractorState.documents;
    
    if (docs.length === 0) {
        return '<p class="text-slate-400 text-center py-4">No documents yet</p>';
    }
    
    // ✅ เปลี่ยนจาก 5 เป็น 3 รายการล่าสุด
    return docs.slice(0, 3).map(doc => `
        <div class="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div class="flex items-center gap-3 min-w-0">
                <i class="fas ${doc.name.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf text-red-400' : 'fa-file-image text-blue-400'}"></i>
                <div class="min-w-0 flex-1">
                    <p class="font-medium truncate">${doc.name}</p>
                    <p class="text-xs text-slate-400">${doc.template_name || 'Markdown'} · ${new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
            </div>
            <span class="px-2 py-1 rounded text-xs ${doc.status === 'verified' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}">
                ${doc.status}
            </span>
        </div>
    `).join('');
}

function updateFileListUI() {
    const state = window._extractorState;
    const fileList = document.getElementById('fileList');
    const fileCount = document.getElementById('fileCount');
    if (!fileList) return;

    fileList.innerHTML = state.selectedFiles.map((f, idx) => `
        <div class="flex items-center justify-between p-2 bg-slate-800 rounded">
            <div class="flex items-center gap-2 min-w-0">
                <i class="fas ${f.name.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf text-red-400' : 'fa-file-image text-blue-400'}"></i>
                <span class="text-sm truncate">${f.name}</span>
            </div>
            <button onclick="extractorRemoveFile(${idx})" class="text-slate-400 hover:text-red-400 p-1">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    if (state.selectedFiles.length > 0) {
        fileCount.classList.remove('hidden');
        const color = state.selectedFiles.length >= state.MAX_BATCH_SIZE ? 'text-yellow-400' : 'text-slate-400';
        fileCount.innerHTML = `<span class="${color}">${state.selectedFiles.length}</span> / ${state.MAX_BATCH_SIZE} files`;
    } else {
        fileCount.classList.add('hidden');
    }
}

function handleFiles(files) {
    const state = window._extractorState;
    const newFiles = Array.from(files);
    console.log('[Extractor] Files received:', newFiles.length, newFiles.map(f => f.name));

    if (newFiles.length > state.MAX_BATCH_SIZE) {
        showToast(`Max ${state.MAX_BATCH_SIZE} files. Only first ${state.MAX_BATCH_SIZE} used.`, 'error');
        state.selectedFiles = newFiles.slice(0, state.MAX_BATCH_SIZE);
    } else {
        state.selectedFiles = newFiles;
    }

    updateFileListUI();
    checkReady();
}

// ==========================================
// BUILD UI
// ==========================================
function buildUI() {
    const state = window._extractorState;
    const container = document.getElementById('pageContent');

    // ✅ สลับตำแหน่ง: Extract (Upload + Config) อยู่บน, Recent Documents อยู่ล่าง
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">Document Extractor</h2>

        <!-- ✅ EXTRACT SECTION (ย้ายมาบน) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Upload -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-semibold">1. Upload Documents</h3>
                    <span class="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">Max ${state.MAX_BATCH_SIZE}</span>
                </div>
                <div id="dropzone" class="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-primary cursor-pointer transition-colors">
                    <i class="fas fa-cloud-upload-alt text-4xl text-slate-500 mb-3"></i>
                    <p class="text-slate-400">Click or drag files here</p>
                    <input type="file" id="fileInput" class="hidden" accept="image/*,application/pdf" multiple>
                </div>
                <div id="fileList" class="mt-4 space-y-2 max-h-60 overflow-y-auto"></div>
                <div id="fileCount" class="mt-3 text-sm text-slate-400 hidden"></div>
            </div>

            <!-- Config -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 class="font-semibold mb-4">2. Configuration</h3>
                <div class="mb-4">
                    <label class="block text-sm text-slate-400 mb-2">Mode</label>
                    <div class="flex gap-2">
                        <button id="modeStructured" onclick="extractorSetMode('structured')" class="flex-1 py-2 rounded-lg bg-primary text-white font-medium">Structured</button>
                        <button id="modeMarkdown" onclick="extractorSetMode('markdown')" class="flex-1 py-2 rounded-lg bg-slate-800 text-slate-400">Markdown</button>
                    </div>
                </div>
                <div id="templateSection" class="mb-4">
                    <label class="block text-sm text-slate-400 mb-2">Template</label>
                    <select id="templateSelect" onchange="checkReady()" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3">
                        <option value="">Select template...</option>
                        ${state.templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-sm text-slate-400 mb-2">Instructions (optional)</label>
                    <textarea id="instructions" rows="3" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3" placeholder="Custom instructions..."></textarea>
                </div>
                <button id="extractBtn" disabled class="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-magic mr-2"></i> Extract
                </button>
                <div id="progressSection" class="hidden mt-4">
                    <div class="flex justify-between text-sm mb-2">
                        <span id="progressText">Processing...</span>
                        <span id="progressPercent">0%</span>
                    </div>
                    <div class="w-full bg-slate-800 rounded-full h-2">
                        <div id="progressBar" class="bg-primary h-2 rounded-full transition-all" style="width:0%"></div>
                    </div>
                    <p id="progressDetail" class="text-xs text-slate-500 mt-2"></p>
                </div>
            </div>
        </div>

        <!-- ✅ RECENT DOCUMENTS (ย้ายมาล่าง) -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold">
                    <i class="fas fa-clock mr-2 text-primary"></i>
                    Recent Documents
                </h3>
                <a href="documents.html" class="text-primary text-sm hover:underline">
                    View All <i class="fas fa-arrow-right ml-1"></i>
                </a>
            </div>
            <div class="space-y-3" id="recentDocsList">${renderRecentDocs()}</div>
        </div>
    `;

    bindEvents();
}

function bindEvents() {
    console.log('[Extractor] Binding events...');
    
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const extractBtn = document.getElementById('extractBtn');

    dropzone.onclick = () => fileInput.click();
    dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('border-primary'); };
    dropzone.ondragleave = () => dropzone.classList.remove('border-primary');
    dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-primary');
        handleFiles(e.dataTransfer.files);
    };
    fileInput.onchange = (e) => handleFiles(e.target.files);

    if (extractBtn) {
        const newBtn = extractBtn.cloneNode(true);
        extractBtn.parentNode.replaceChild(newBtn, extractBtn);
        
        newBtn.removeAttribute('onclick');
        
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            console.log('[Extractor] ===== BUTTON CLICKED =====');
            await window.extractorStartExtraction();
        }, true);
        
        console.log('[Extractor] Extract button bound ✅');
    }
    
    console.log('[Extractor] Events bound ✅');
}

// ==========================================
// INIT
// ==========================================
(async function init() {
    const container = document.getElementById('pageContent');
    if (!container) return;

    container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="text-center"><div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div><p class="text-slate-400">Loading...</p></div></div>`;

    try {
        console.log('[Extractor] 📡 Loading initial data...');
        // ✅ ดึงแค่ 3 รายการล่าสุด
        const docsResponse = await api.getDocuments('', '', 1, 3);
        console.log('[Extractor] 📦 Initial documents:', docsResponse.documents?.length || 0);
        
        window._extractorState.documents = docsResponse.documents || [];
        window._extractorState.templates = await api.getTemplates();
        
        console.log('[Extractor] 🎨 Building UI...');
        buildUI();
        console.log('[Extractor] ✅ UI built successfully');
    } catch (err) {
        console.error('[Extractor]  Load error:', err);
        container.innerHTML = `<div class="text-red-400 text-center py-20">Failed to load: ${err.message}</div>`;
    }
})();