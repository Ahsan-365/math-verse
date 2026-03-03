/**
 * Math Verse Global Operations
 * Handles dynamic navigation, toast logic, and UI mechanics globally for all 65+ tools.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Force the dark space theme globally
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');

    // 2. Inject Universal UI Elements (Nav Drawer, FAB, Toast Container)
    injectGlobalUI();
});

function injectGlobalUI() {
    // Create Toast Container
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

    // Navigation Overlay
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    // Navigation Drawer
    const drawer = document.createElement('div');
    drawer.id = 'math-verse-nav-drawer';

    // Categorical Link lists (to be expanded heavily)
    drawer.innerHTML = `
        <button class="drawer-close"><i class="fas fa-times"></i></button>
        <div class="drawer-title">Math Verse</div>
        <a href="index.html" class="drawer-link"><i class="fas fa-home text-neon-blue"></i> Main Hub</a>
        <div class="mt-4 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Algebra & Theory</div>
        <a href="eq solver.html" class="drawer-link"><i class="fas fa-equals text-blue-400"></i> Equation Solver</a>
        <a href="matrix.html" class="drawer-link"><i class="fas fa-border-all text-purple-400"></i> Matrix Calculator</a>
        <div class="mt-4 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Calculus & Geometry</div>
        <a href="calculus.html" class="drawer-link"><i class="fas fa-wave-square text-neon-pink"></i> Calculus Engine</a>
        <a href="graph.html" class="drawer-link"><i class="fas fa-chart-line text-neon-green"></i> Graph Plotter</a>
        <!-- Additional links dynamically injected later down the phases -->
        <div class="mt-auto pt-6 text-center text-xs text-gray-600">The Ultimate Equation</div>
    `;
    document.body.appendChild(drawer);

    // Floating Action Button (FAB)
    const fab = document.createElement('button');
    fab.className = 'nav-fab';
    fab.innerHTML = '<i class="fas fa-compass"></i>';
    document.body.appendChild(fab);

    // Mechanics
    const openDrawer = () => {
        drawer.classList.add('open');
        overlay.classList.add('open');
    };
    const closeDrawer = () => {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
    };

    fab.addEventListener('click', openDrawer);
    overlay.addEventListener('click', closeDrawer);
    drawer.querySelector('.drawer-close').addEventListener('click', closeDrawer);

    // Clean up hardcoded old home buttons in older pages
    const oldHomes = document.querySelectorAll('.fa-arrow-left, .fa-home');
    oldHomes.forEach(el => {
        const link = el.closest('a');
        if (link && !isIndex) {
            // we remove the absolute top-left old button since we have the FAB now
            if (link.classList.contains('absolute')) {
                link.remove();
            }
        }
    });
}

/**
 * Global Toaster Utility
 * Replaces old individual errorBox logic in every file.
 * @param {string} msg - The message to display.
 * @param {string} type - 'error', 'success', 'info'
 */
window.showToast = function (msg, type = 'error') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'info' ? 'toast-info' : ''}`;

    let icon = 'fa-exclamation-triangle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'info') icon = 'fa-info-circle';

    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards';
        setTimeout(() => toast.remove(), 400); // Wait for fade out
    }, 3500);
};

// Expose safe math evaluations globally to avoid repetitions in future files
window.safeMath = {
    round: (num, decimals = 6) => Number(Math.round(num + 'e' + decimals) + 'e-' + decimals),
    parseInput: (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return 0;
        return num;
    },
    isValid: (num) => !isNaN(num) && isFinite(num)
};
