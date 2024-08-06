import { createAppWindow, getWindowContent } from './windowManagement.js';
import { showAccessDenied } from './routing.js';
import { initialize as initializeUndergroundMap } from './undergroundMap.js';
import { initialize as initializeDeliveryMap } from './windowManagement.js';
import { appAccessLevels, getAccessLevel } from './auth.js';

const mapsConfig = {
    title: 'Maps',
    width: '50%',
    height: '40%',
    content: '<div id="maps-app"></div>',
};

const mapsIcons = [
    { name: 'Cookie Deliveries', icon: '🍪' },
    { name: 'Underground', icon: '🐀' },
];

export function initialize(params = {}) {
    console.log('Initializing Maps app with params:', params);
    const existingWindow = getWindowContent('Maps');
    if (existingWindow) {
        console.log('Maps window already exists, updating content');
        setupMapsApp(existingWindow.closest('.window'));
    } else {
        const window = createAppWindow(mapsConfig);
        if (window) {
            setupMapsApp(window);
        } else {
            console.error('Failed to create Maps window');
        }
    }
}

function setupMapsApp(window) {
    const container = window.querySelector('#maps-app');
    if (!container) {
        console.error('Maps app container not found');
        return;
    }
    
    container.innerHTML = createMapsAppHTML();
    setupMapsEventListeners(container);
}

function createMapsAppHTML() {
    const userAccessLevel = getAccessLevel();
    return `
        <div class="maps-icons">
            ${mapsIcons.map(icon => {
                const { level: requiredLevel, hiddenIfLocked } = appAccessLevels[icon.name] || { level: 1, hiddenIfLocked: false };
                const hasAccess = userAccessLevel >= requiredLevel;
                if (hasAccess || !hiddenIfLocked) {
                    return `
                        <div class="desktop-icon ${hasAccess ? '' : 'locked'}" data-name="${icon.name}">
                            <div class="icon">${icon.icon}</div>
                            <div class="label">${icon.name}</div>
                        </div>
                    `;
                }
                return '';
            }).join('')}
        </div>
    `;
}

function setupMapsEventListeners(content) {
    const icons = content.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const iconName = e.currentTarget.getAttribute('data-name');
            if (icon.classList.contains('locked')) {
                showAccessDenied();
            } else {
                if (iconName === 'Cookie Deliveries') {
                    initializeDeliveryMap();
                } else if (iconName === 'Underground') {
                    const mapContainer = document.getElementById('underground-map');
                    initializeUndergroundMap(mapContainer);
                }
            }
        });
    });
}