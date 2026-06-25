import { api, showToast } from './api.js';

// ==========================================
// DASHBOARD PAGE
// Description: แสดงสถิติและภาพรวมของระบบ
// ==========================================
async function renderDashboard() {
    const container = document.getElementById('pageContent');
    if (!container) {
        console.error('[Dashboard] pageContent not found');
        return;
    }
    
    container.innerHTML = `
        <div class="flex items-center justify-center py-20">
            <div class="text-center">
                <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-slate-400">Loading dashboard...</p>
            </div>
        </div>
    `;
    
    try {
        // ✅ แก้: ดึงข้อมูลทั้งหมด (unwrap .documents)
        const allData = await api.getDocuments('', 1, 10000);
        const documents = allData.documents;
        const templates = await api.getTemplates();
        
        // คำนวณ Success Rate จาก status !== 'failed'
        const successCount = documents.filter(d => d.status !== 'failed').length;
        const failedCount = documents.filter(d => d.status === 'failed').length;
        const verifiedCount = documents.filter(d => d.status === 'verified').length;
        const successRate = documents.length > 0 ? Math.round((successCount / documents.length) * 100) : 0;
        
        container.innerHTML = `
            <h2 class="text-2xl font-bold mb-6">Dashboard</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                            <i class="fas fa-file-invoice text-lg"></i>
                        </div>
                        <div>
                            <p class="text-slate-400 text-xs">Total Documents</p>
                            <p class="text-xl font-bold">${documents.length}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                            <i class="fas fa-code text-lg"></i>
                        </div>
                        <div>
                            <p class="text-slate-400 text-xs">Templates</p>
                            <p class="text-xl font-bold">${templates.length}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 bg-green-500/10 rounded-lg flex items-center justify-center text-green-400">
                            <i class="fas fa-check-circle text-lg"></i>
                        </div>
                        <div>
                            <p class="text-slate-400 text-xs">Success Rate</p>
                            <p class="text-xl font-bold text-green-400">${successRate}%</p>
                        </div>
                    </div>
                    <div class="mt-2 text-xs text-slate-500">
                        ✓ ${successCount} success · ✗ ${failedCount} failed
                    </div>
                </div>
                
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-11 h-11 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-400">
                            <i class="fas fa-user-check text-lg"></i>
                        </div>
                        <div>
                            <p class="text-slate-400 text-xs">Verified (HITL)</p>
                            <p class="text-xl font-bold">${verifiedCount}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                <h3 class="font-semibold mb-4">Quick Actions</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="extractor.html" class="bg-primary/10 border border-primary/20 p-5 rounded-lg hover:bg-primary/20 transition-colors">
                        <i class="fas fa-magic text-primary text-2xl mb-3"></i>
                        <p class="font-medium mb-1">Extract Document</p>
                        <p class="text-sm text-slate-400">Start new extraction with NuExtract3</p>
                    </a>
                    <a href="documents.html" class="bg-blue-500/10 border border-blue-500/20 p-5 rounded-lg hover:bg-blue-500/20 transition-colors">
                        <i class="fas fa-folder-open text-blue-400 text-2xl mb-3"></i>
                        <p class="font-medium mb-1">Browse Documents</p>
                        <p class="text-sm text-slate-400">View and manage extracted data</p>
                    </a>
                </div>
            </div>
            
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-semibold">Recent Activity</h3>
                    <a href="documents.html" class="text-primary text-sm hover:underline">View All →</a>
                </div>
                <div class="space-y-3">
                    ${documents.slice(0, 5).map(doc => `
                        <div class="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-file text-slate-400"></i>
                                <div>
                                    <p class="font-medium text-sm">${doc.name}</p>
                                    <p class="text-xs text-slate-500">${doc.template_name || 'Markdown'} · ${new Date(doc.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <span class="px-2 py-1 rounded text-xs ${doc.status === 'verified' ? 'bg-blue-500/10 text-blue-400' : doc.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}">
                                ${doc.status}
                            </span>
                        </div>
                    `).join('') || '<p class="text-slate-400 text-center py-4">No recent activity</p>'}
                </div>
            </div>
        `;
        
    } catch (err) {
        console.error('[Dashboard] Error:', err);
        container.innerHTML = `
            <div class="bg-red-500/10 border border-red-500 rounded-xl p-6 text-center">
                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                <h3 class="text-xl font-bold text-red-400 mb-2">Failed to Load Dashboard</h3>
                <p class="text-slate-400 mb-4">${err.message || 'Unknown error'}</p>
                <button onclick="location.reload()" class="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg">
                    <i class="fas fa-sync-alt mr-2"></i> Retry
                </button>
            </div>
        `;
    }
}

renderDashboard();