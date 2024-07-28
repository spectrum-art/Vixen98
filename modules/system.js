import { createAppWindow } from './windowManagement.js';

const systemConfig = {
    title: 'System',
    width: '40%',
    height: '55%',
    content: '<div id="system-app"></div>',
};

export function initializeSystem() {
    const window = createAppWindow(systemConfig);
    setupSystemApp(window);
}

function setupSystemApp(window) {
    const container = window.querySelector('#system-app');
    if (!container) return;
    
    container.innerHTML = createSystemAppHTML();
}

function createSystemAppHTML() {
    return `
        <div class="system-content">
            <div class="system-image">
                <img src="images/vixensystem.png" alt="Vixen System">
            </div>
            <div class="system-info">
                <pre>
System:
    Vixen 98
    0.500

Registered to:
    █████████  █████
    24796-OEM-0014736-66386

Computer:
    AuthenticVIX
    64.0GB RAM
    XTR 9090 Ti GPU
                </pre>
            </div>
        </div>
    `;
}