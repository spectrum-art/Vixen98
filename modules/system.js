import { createAppWindow } from './windowManagement.js';
import { apps } from './apps.js';

const systemConfig = {
    title: 'System',
    width: '450px',
    height: '600px',
    content: '<div id="system-app"></div>',
    features: {
        resizable: false,
        maximizable: false
    }
};

export function initialize() {
    const window = createAppWindow(systemConfig);
    setupSystemApp(window);
}

function setupSystemApp(window) {
    const container = window.querySelector('#system-app');
    if (!container) return;
    
    container.innerHTML = createSystemAppHTML();
    
    const okButton = container.querySelector('#system-ok-button');
    okButton.addEventListener('click', () => {
        const closeButton = window.querySelector('.window-close');
        if (closeButton) {
            closeButton.click();
        }
    });
}

function createSystemAppHTML() {
    return `
        <div class="system-container">
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
    (420) 846-4670

Computer:
    AuthenticVIX
    64.0GB RAM
    DMA EPIC 9900 CPU
        64 cores @ 3.1GHz
    XTR 9090 Ti GPU
        24GB VRAM
                    </pre>
                </div>
            </div>
            <div class="system-button-container">
                <button id="system-ok-button">OK</button>
            </div>
        </div>
    `;
}