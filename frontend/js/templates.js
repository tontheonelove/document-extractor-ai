import { api, showToast } from './api.js';

// ==========================================
// TEMPLATES PAGE
// Description: จัดการ Templates
// ==========================================
async function renderTemplates() {
    const container = document.getElementById('pageContent');
    if (!container) {
        console.error('[Templates] pageContent not found');
        return;
    }
    
    container.innerHTML = `
        <div class="flex items-center justify-center py-20">
            <div class="text-center">
                <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-slate-400">Loading templates...</p>
            </div>
        </div>
    `;
    
    try {
        const templates = await api.getTemplates();
        renderTemplatesList(templates);
    } catch (err) {
        console.error('[Templates] Error:', err);
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

function renderTemplatesList(templates) {
    const container = document.getElementById('pageContent');
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Templates (${templates.length})</h2>
            <button onclick="createTemplate()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
                <i class="fas fa-plus mr-2"></i> New Template
            </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${templates.map(t => `
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="font-bold text-lg">${t.name}</h3>
                        <button onclick="deleteTemplate('${t.id}')" class="text-slate-400 hover:text-red-400">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <pre class="bg-slate-800 p-3 rounded-lg text-xs overflow-auto max-h-40">${JSON.stringify(t.schema, null, 2)}</pre>
                </div>
            `).join('') || '<p class="col-span-full text-center text-slate-400 py-8">No templates yet. Create your first template!</p>'}
        </div>
    `;
}

window.deleteTemplate = async function(id) {
    if (!confirm('Delete this template?')) return;
    
    try {
        await api.deleteTemplate(id);
        showToast('Template deleted', 'success');
        // Reload หน้าเดิม
        renderTemplates();
    } catch (err) {
        console.error(err);
        showToast('Failed to delete', 'error');
    }
};

window.createTemplate = function() {
    const name = prompt('Template name:');
    if (!name) return;
    
    const schemaStr = prompt('JSON schema (e.g., {"field": "string"}):');
    if (!schemaStr) return;
    
    try {
        const schema = JSON.parse(schemaStr);
        api.createTemplate({
            id: Date.now().toString(),
            name: name,
            schema: schema,
            created_at: new Date().toISOString(),
            icl_examples: []
        }).then(async () => {
            showToast('Template created', 'success');
            renderTemplates();
        });
    } catch (err) {
        showToast('Invalid JSON', 'error');
    }
};

// Auto-run
renderTemplates();