import { EventBus } from './utils.js';
import { openApp } from '../main.js';
import { appAccessLevels, getAccessLevel } from './auth.js';
import { updateURL } from './routing.js';

const desktopIcons = [
    { name: 'System', icon: '💻' },
    { name: 'Trash', icon: '🗑️' },
    { name: 'Documents', icon: '📁' },
    { name: 'Lemon List', icon: '🍋' },
    { name: 'Encryption', icon: '🔒' },
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
        iconElement.innerHTML = `
            <div class="icon">${icon.icon}</div>
            <div class="label">${icon.name}</div>
        `;
        iconElement.addEventListener('click', () => {
            console.log('Desktop icon clicked:', icon.name);
            openApp(icon.name);
            updateURL(icon.name);
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
    const userAccessLevel = getAccessLevel();
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach((iconElement, index) => {
        const icon = desktopIcons[index];
        const { level: requiredLevel, hiddenIfLocked } = appAccessLevels[icon.name] || { level: 1, hiddenIfLocked: false };
        const hasAccess = userAccessLevel >= requiredLevel;
        iconElement.style.display = (hasAccess || !hiddenIfLocked) ? 'flex' : 'none';
        iconElement.classList.toggle('locked', !hasAccess);
    });
}