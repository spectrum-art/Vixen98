import { createAppWindow } from './windowManagement.js';
import { initializeUndergroundMap } from './undergroundMap.js';

const documentsConfig = {
    title: 'Documents',
    width: '50%',
    height: '40%',
    content: '<div id="documents-app"></div>',
};

const myDocumentsIcons = [
    { name: 'Cookie Delivery Map', icon: '🗺️' },
    { name: 'Cookie Batch Log', icon: '🍪' },
    { name: 'Underground Map', icon: '🐀' },
    { name: 'Placeholder', icon: '📄' }
];

export function initializeDocuments({ subItem } = {}) {
    switch (subItem) {
        case 'Cookie Delivery Map':
            openCookieDeliveryMap();
            break;
        case 'Underground Map':
            openUndergroundMap();
            break;
        case 'Cookie Batch Log':
            // Implement this function later
            break;
        case 'Placeholder':
            // Implement this function later
            break;
        default:
            const window = createAppWindow(documentsConfig);
            setupDocumentsApp(window);
    }
}

function setupDocumentsApp(window) {
    const container = window.querySelector('#documents-app');
    if (!container) return;
    
    container.innerHTML = createDocumentsAppHTML();
    setupDocumentsEventListeners(container);
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
            } else if (iconName === 'Underground Map') {
                openUndergroundMap();
            }
            // Add more conditions here for other icons if needed
        });
    });
}

function openCookieDeliveryMap() {
    console.log('Opening Cookie Delivery Map');
    const mapUrl = `https://gta-5-map.com/?\
        slideout=false&slideoutright=false&x=-120.1&y=80.5&zoom=3.4&embed=light\
        &notes=3EWfhJLeGcb,3nf05rUzzTS,61hDtXO1IAV,6KSIzbU0JCX,78yKmWHpAxr,8qmes9jiqky,\
        9LdfkbPEQUp,Akr3xVeFxPx,BzSCrsUcHX0,CAecif3MPtL,CxmrjyVaMdb,ErAwcUUL4Jv,FqeP7JRiEfO,\
        Gg4LUImN5RM,GZAFGvIkhQl,HD2hOgesZEE,Hpc1RWCbYNJ,HxWPJdFD5zG,I02HCZZmolC,I6nFz53EbKo,\
        JbMeXCoX67S,K0Gco51LKq8,KOFXc19AHzl,KuW1Kv0rFKa,tzvgY7VwaI`;

    const mapConfig = {
        title: 'Cookie Delivery Map',
        content: `<iframe src="${mapUrl}" 
            style="border: none; width: 100%; height: 100%;" 
            sandbox="allow-scripts allow-same-origin">
        </iframe>`,
        width: '90%',
        height: '90%',
        minWidth: '400px',
        minHeight: '300px',
    };
    
    const window = createAppWindow(mapConfig);
}

function openUndergroundMap() {
    console.log('Opening Underground Map');
    const desktop = document.getElementById('desktop');
    const desktopRect = desktop.getBoundingClientRect();
    const mapSize = Math.min(desktopRect.width, desktopRect.height) * 0.95;

    const mapConfig = {
        title: 'Underground Map',
        content: '<div id="underground-map"></div>',
        width: `${mapSize}px`,
        height: `${mapSize + 30}px`,
        minWidth: '400px',
        minHeight: '430px',
        className: 'underground-map-window'
    };
    
    const window = createAppWindow(mapConfig);
    const mapContainer = window.querySelector('#underground-map');
    
    mapContainer.style.width = `${mapSize}px`;
    mapContainer.style.height = `${mapSize}px`;

    setTimeout(() => {
        initializeUndergroundMap(mapContainer);
    }, 50);
}