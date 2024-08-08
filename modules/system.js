export function initialize(container, params = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        console.error('Invalid container provided to System initialize function');
        return;
    }

    setupSystemApp(container);
}

function setupSystemApp(container) {
    container.innerHTML = createSystemAppHTML();
    
    const okButton = container.querySelector('#system-ok-button');
    okButton.addEventListener('click', () => {
        const windowElement = container.closest('.window');
        if (windowElement) {
            const closeButton = windowElement.querySelector('.window-close');
            if (closeButton) {
                closeButton.click();
            }
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