import { EventBus } from './utils.js';
import { openApp } from '../main.js';

const desktopIcons = [
    { name: 'System', icon: '💻', accessLevel: 1 },
    { name: 'Trash', icon: '🗑️', accessLevel: 1 },
    { name: 'Documents', icon: '📁', accessLevel: 2 },
    { name: 'Lemon List', icon: '🍋', accessLevel: 1 },
    { name: 'Encryption', icon: '🔒', accessLevel: 1 }
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
        });
        iconGrid.appendChild(iconElement);
    });
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' });
    document.getElementById('clock').textContent = timeString;
}