import { apps } from './apps.js';
import { EventBus } from './utils.js';
import { openApp } from '../main.js';
import { checkAppAccess } from './auth.js';
import { updateURL, showAccessDenied } from './routing.js';

export function initializeDesktop() {
    createDesktopIcons();
    updateClock();
    setInterval(updateClock, 1000);

    EventBus.subscribe('accessLevelChanged', updateDesktopIcons);
}

function createDesktopIcons() {
    const iconGrid = document.getElementById('icon-grid');
    Object.values(apps).forEach(app => {
        if (app.showOnDesktop) {
            const iconElement = document.createElement('div');
            iconElement.className = 'desktop-icon';
            iconElement.setAttribute('data-name', app.name);
            iconElement.innerHTML = `
                <div class="icon">${app.icon}</div>
                <div class="label">${app.name}</div>
            `;
            iconElement.addEventListener('click', () => {
                if (!iconElement.classList.contains('locked')) {
                    console.log('Desktop icon clicked:', app.name);
                    openApp(app.name);
                    updateURL(app.name);
                } else {
                    showAccessDenied();
                }
            });
            iconGrid.appendChild(iconElement);
        }
    });
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' });
    document.getElementById('clock').textContent = timeString;
}

function updateDesktopIcons() {
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach((iconElement) => {
        const iconName = iconElement.getAttribute('data-name');
        const app = Object.values(apps).find(app => app.name === iconName);
        if (app) {
            const hasAccess = checkAppAccess(app.name);
            iconElement.style.display = (hasAccess || !app.hiddenIfLocked) ? 'flex' : 'none';
            iconElement.classList.toggle('locked', !hasAccess);
        }
    });
}