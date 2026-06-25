// ==========================================
// THEME MANAGER
// Description: จัดการ Dark/Light mode พร้อม localStorage
// ==========================================

const THEME_KEY = 'nuextract-theme';

export function loadTheme() {
    // Description: อ่าน theme ที่บันทึกไว้ (inline script ทำไปแล้วตอนแรก)
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    updateThemeIcon(savedTheme);
    return savedTheme;
}

export function toggleTheme() {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
}

function applyTheme(theme) {
    const html = document.documentElement;
    
    if (theme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
    } else {
        html.classList.add('light');
        html.classList.remove('dark');
    }
    
    updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
    
    if (theme === 'dark') {
        toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        toggleBtn.title = 'Switch to Light Mode';
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        toggleBtn.title = 'Switch to Dark Mode';
    }
}

export function initTheme() {
    // Description: แค่โหลด icon ให้ตรงกับ theme ปัจจุบัน
    // (theme ถูก set แล้วโดย inline script ใน <head>)
    loadTheme();
    
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
}