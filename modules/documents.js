import { showAccessDenied } from './routing.js';
import { getAccessLevel } from './auth.js';
import { getAppById } from './apps.js';
import { openApp } from './main.js';

const documentsIcons = [
    { id: 'cookieBatchLog', name: 'Cookie Batch Log', icon: '🍪' },
    { id: 'placeholder', name: 'Placeholder', icon: '📄' }
];

export function initialize(container, params = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        console.error('Invalid container provided to Documents initialize function');
        return;
    }

    console.log('Initializing Documents app with params:', params);
    setupDocumentsApp(container);
}

function setupDocumentsApp(container) {
    container.innerHTML = createDocumentsAppHTML();
    setupDocumentsEventListeners(container);
}

function createDocumentsAppHTML() {
    const userAccessLevel = getAccessLevel();
    return `
        <div class="my-documents-icons">
            ${documentsIcons.map(icon => {
                const app = getAppById(icon.id);
                const hasAccess = userAccessLevel >= app.accessLevel;
                if (hasAccess || !app.hiddenIfLocked) {
                    return `
                        <div class="desktop-icon ${hasAccess ? '' : 'locked'}" data-app-id="${icon.id}">
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

function setupDocumentsEventListeners(container) {
    const icons = container.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const appId = e.currentTarget.getAttribute('data-app-id');
            if (icon.classList.contains('locked')) {
                showAccessDenied();
            } else {
                openApp(appId);
            }
        });
    });
}