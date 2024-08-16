import { initialize as initializeParticleBezier } from './particleBezier.js';

export function initialize(container, params = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        console.error('Invalid container provided to Placeholder initialize function');
        return;
    }

    console.log('Initializing Placeholder app with params:', params);
    setupPlaceholderApp(container);
}

function setupPlaceholderApp(container) {
    container.innerHTML = '<div id="placeholder-canvas-container" style="width:100%;height:100%;"></div>';
    const canvasContainer = container.querySelector('#placeholder-canvas-container');
    initializeParticleBezier(canvasContainer);
}