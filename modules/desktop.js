import { EventBus } from './utils.js';
import { openApp } from '../main.js';
import { appAccessLevels, checkAppAccess } from './auth.js';
import { updateURL, showAccessDenied } from './routing.js';

const desktopIcons = [
    { name: 'System', icon: '💻' },
    { name: 'Trash', icon: '🗑️' },
    { name: 'Documents', icon: '📁' },
    { name: 'Encryption', icon: '🔒' },
    { name: 'Lemon List', icon: '🍋' },
    { name: 'Maps', icon: '🗺️' },
    { name: 'Propaganda', icon: '🏛️' }
];

export function initializeDesktop() {
    createDesktopIcons();
    updateClock();
    setInterval(updateClock, 1000);

    EventBus.subscribe('accessLevelChanged', updateDesktopIcons);
}

function createDesktopIcons() {
    const iconGrid = document.getElementById('icon-grid');
    desktopIcons.forEach(icon => {
        const iconElement = document.createElement('div');
        iconElement.className = 'desktop-icon';
        iconElement.setAttribute('data-name', icon.name);
        iconElement.innerHTML = `
            <div class="icon">${icon.icon}</div>
            <div class="label">${icon.name}</div>
        `;
        iconElement.addEventListener('click', () => {
            if (!iconElement.classList.contains('locked')) {
                console.log('Desktop icon clicked:', icon.name);
                openApp(icon.name);
                updateURL(icon.name);
            } else {
                showAccessDenied();
            }
        });
        iconGrid.appendChild(iconElement);
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
        const { hiddenIfLocked } = appAccessLevels[iconName] || { hiddenIfLocked: false };
        const hasAccess = checkAppAccess(iconName);
        iconElement.style.display = (hasAccess || !hiddenIfLocked) ? 'flex' : 'none';
        iconElement.classList.toggle('locked', !hasAccess);
    });
}