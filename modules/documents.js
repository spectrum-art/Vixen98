import { EventBus } from './utils.js';
import { getWindowContent } from './windowManagement.js';

const myDocumentsIcons = [
    { name: 'Cookie Delivery Map', icon: '🗺️' },
    { name: 'Cookie Batch Log', icon: '🍪' },
    { name: 'Underground Map', icon: '🐀' },
    { name: 'Placeholder', icon: '📄' }
];

export function initializeDocuments() {
    EventBus.subscribe('windowOpened', (appName) => {
        if (appName === 'Documents') {
            setupDocumentsApp();
        }
    });
}

function setupDocumentsApp() {
    const content = getWindowContent('Documents');
    if (!content) return;

    content.innerHTML = createDocumentsAppHTML();
    setupDocumentsEventListeners(content);
}

function createDocumentsAppHTML() {
    return `
        <div class="my-documents-icons">
            ${myDocumentsIcons.map(icon => `
                <div class="desktop-icon" data-name="${icon.name}">
                    <div class="icon">${icon.icon}</div>
                    <div class="label">${icon.name}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function setupDocumentsEventListeners(content) {
    const icons = content.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const iconName = e.currentTarget.getAttribute('data-name');
            if (iconName === 'Cookie Delivery Map') {
                openCookieDeliveryMap();
            }
            // Add more conditions here for other icons if needed
        });
    });
}

function openCookieDeliveryMap() {
    const mapWindow = document.createElement('div');
    mapWindow.className = 'window map-window';
    mapWindow.innerHTML = `
        <div class="window-header">
            <span class="window-title">Cookie Delivery Map</span>
            <span class="window-close">❌</span>
        </div>
        <div class="window-content">
            <iframe src="https://gta-5-map.com/?slideout=false&slideoutright=false&x=-120.10709928325205&y=80.48718362536638&zoom=3.4021903306057872&notes=3EWfhJLeGcb,3nf05rUzzTS,61hDtXO1IAV,6KSIzbU0JCX,78yKmWHpAxr,8qmes9jiqky,9LdfkbPEQUp,Akr3xVeFxPx,BzSCrsUcHX0,CAecif3MPtL,CxmrjyVaMdb,ErAwcUUL4Jv,FqeP7JRiEfO,Gg4LUImN5RM,GZAFGvIkhQl,HD2hOgesZEE,Hpc1RWCbYNJ,HxWPJdFD5zG,I02HCZZmolC,I6nFz53EbKo,JbMeXCoX67S,K0Gco51LKq8,KOFXc19AHzl,KuW1Kv0rFKa,tzvgY7VwaI&embed=light" style="border: none; width: 100%; height: 100%;"></iframe>
        </div>
    `;
    
    const closeBtn = mapWindow.querySelector('.window-close');
    closeBtn.addEventListener('click', () => mapWindow.remove());
    
    document.getElementById('desktop').appendChild(mapWindow);
    EventBus.publish('windowCreated', mapWindow);
}