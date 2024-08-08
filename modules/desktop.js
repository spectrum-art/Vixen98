import { apps } from './apps.js';
import { EventBus } from './utils.js';
import { openApp } from '../main.js';
import { checkAppAccess, checkStoredCredentials } from './auth.js';
import { updateURL, showAccessDenied } from './routing.js';

function createDesktopIcons() {
    const iconGrid = document.getElementById('icon-grid');
    Object.values(apps).forEach(app => {
        if (app.showOnDesktop) {
            const iconElement = document.createElement('div');
            iconElement.className = 'desktop-icon';
            iconElement.setAttribute('data-app-id', app.id);
            iconElement.innerHTML = `
                <div class="icon">${app.icon}</div>
                <div class="label">${app.name}</div>
            `;
            iconElement.addEventListener('click', () => {
                if (!iconElement.classList.contains('locked')) {
                    console.log('Desktop icon clicked:', app.name);
                    openApp(app.id);
                    updateURL(app.id);
                } else {
                    showAccessDenied();
                }
            });
            iconGrid.appendChild(iconElement);
        }
    });
}

function updateDesktopIcons() {
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach((iconElement) => {
        const appId = iconElement.getAttribute('data-app-id');
        const app = getAppById(appId);
        if (app) {
            const hasAccess = checkAppAccess(app.id);
            iconElement.style.display = (hasAccess || !app.hiddenIfLocked) ? 'flex' : 'none';
            iconElement.classList.toggle('locked', !hasAccess);
        }
    });
}

export function initializeDesktop() {
    createDesktopIcons();
    updateClock();
    setInterval(updateClock, 1000);

    EventBus.subscribe('accessLevelChanged', updateDesktopIcons);
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' });
    document.getElementById('clock').textContent = timeString;
}