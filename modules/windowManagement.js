import { EventBus } from './utils.js';
import { updateURL } from './routing.js';
import { apps, getAppById } from './apps.js';

let windows = [];

export function createAppWindow(appConfig = {}) {
    const app = getAppById(appConfig.id);
    if (!app) {
        console.error(`Unknown app: ${appConfig.id}`);
        return null;
    }

    const existingWindow = windows.find(w => w.appId === app.id);
    if (existingWindow) {
        console.log(`Window for ${app.name} already exists, bringing to front`);
        bringToFront(existingWindow.element);
        return existingWindow.element;
    }

    console.log('Creating app window with config:', appConfig);

    const windowElement = document.createElement('div');
    windowElement.className = 'window';
    windowElement.setAttribute('data-app-id', app.id);

    // Apply window size
    windowElement.style.width = appConfig.width || '50%';
    windowElement.style.height = appConfig.height || '50%';
    windowElement.style.minWidth = appConfig.minWidth || '300px';
    windowElement.style.minHeight = appConfig.minHeight || '200px';

    windowElement.innerHTML = `
        <div class="window-header">
            <span class="window-title">${app.name}</span>
            <div class="window-controls">
                <span class="window-minimize">🗕</span>
                <span class="window-maximize">🗖</span>
                <span class="window-close">❌</span>
            </div>
        </div>
        <div class="window-content">${appConfig.content}</div>
    `;

    const desktop = document.getElementById('desktop');
    if (!desktop) {
        console.error('Desktop element not found');
        return null;
    }
    desktop.appendChild(windowElement);
    
    const windowObj = { appId: app.id, element: windowElement };
    windows.push(windowObj);

    createTaskbarItem(app.id, windowElement);
    positionWindow(windowElement);
    makeDraggable(windowElement);
    makeResizable(windowElement);
    setupWindowControls(windowElement, windowObj);

    console.log('Window created:', windowElement);
    bringToFront(windowElement);
    
    return windowElement;
}

function positionWindow(windowElement) {
    const desktop = document.getElementById('desktop');
    const desktopRect = desktop.getBoundingClientRect();
    const windowRect = windowElement.getBoundingClientRect();

    const left = Math.round((desktopRect.width - windowRect.width) / 2);
    const top = Math.round((desktopRect.height - windowRect.height) / 2);

    windowElement.style.left = `${left}px`;
    windowElement.style.top = `${top}px`;
}

function createTaskbarItem(appId, windowElement) {
    const app = getAppById(appId);
    const openWindows = document.getElementById('open-windows');
    const taskbarItem = document.createElement('div');
    taskbarItem.className = 'taskbar-item';
    taskbarItem.setAttribute('data-app-id', appId);
    taskbarItem.innerHTML = `
        <div class="taskbar-item-icon">${app.icon}</div>
        <span>${app.name}</span>
    `;
    taskbarItem.addEventListener('click', () => {
        if (windowElement.style.display === 'none') {
            unminimizeWindow(windowElement);
        } else if (windowElement.classList.contains('active')) {
            minimizeWindow(windowElement);
        } else {
            bringToFront(windowElement);
        }
    });
    openWindows.appendChild(taskbarItem);
}

function getIconForApp(appId) {
    const app = getAppById(appId);
    return app ? app.icon : '📄';
}

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('.window-header');
    if (header) {
        header.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        bringToFront(element);
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function makeResizable(windowElement) {
    const resizer = document.createElement('div');
    resizer.className = 'window-resizer';
    windowElement.appendChild(resizer);

    resizer.addEventListener('mousedown', initResize, false);

    function initResize(e) {
        windowElement.startX = e.clientX;
        windowElement.startY = e.clientY;
        windowElement.startWidth = parseInt(document.defaultView.getComputedStyle(windowElement).width, 10);
        windowElement.startHeight = parseInt(document.defaultView.getComputedStyle(windowElement).height, 10);
        document.documentElement.addEventListener('mousemove', resize, false);
        document.documentElement.addEventListener('mouseup', stopResize, false);
    }

    function resize(e) {
        windowElement.style.width = (windowElement.startWidth + e.clientX - windowElement.startX) + 'px';
        windowElement.style.height = (windowElement.startHeight + e.clientY - windowElement.startY) + 'px';
    }

    function stopResize() {
        document.documentElement.removeEventListener('mousemove', resize, false);
        document.documentElement.removeEventListener('mouseup', stopResize, false);
    }
}

function bringToFront(windowElement) {
    let maxZIndex = 0;
    windows.forEach(w => {
        const zIndex = parseInt(w.element.style.zIndex || '0');
        maxZIndex = Math.max(maxZIndex, zIndex);
        w.element.classList.remove('active');
        const taskbarItem = document.querySelector(`[data-app-id="${w.appId}"]`);
        if (taskbarItem) {
            taskbarItem.classList.remove('active');
        }
    });
    windowElement.style.zIndex = maxZIndex + 1;
    windowElement.classList.add('active');
    const taskbarItem = document.querySelector(`[data-app-id="${windowElement.getAttribute('data-app-id')}"]`);
    if (taskbarItem) {
        taskbarItem.classList.add('active');
    }

    const appId = windowElement.getAttribute('data-app-id');
    updateURL(appId);
}

function setupWindowControls(windowElement, windowObj) {
    const minimizeBtn = windowElement.querySelector('.window-minimize');
    const maximizeBtn = windowElement.querySelector('.window-maximize');
    const closeBtn = windowElement.querySelector('.window-close');
    
    minimizeBtn.addEventListener('click', () => minimizeWindow(windowElement));
    maximizeBtn.addEventListener('click', () => maximizeWindow(windowElement));
    closeBtn.addEventListener('click', () => closeWindow(windowObj));
}

function minimizeWindow(windowElement) {
    windowElement.style.display = 'none';
    const taskbarItem = document.querySelector(`[data-app-id="${windowElement.getAttribute('data-app-id')}"]`);
    if (taskbarItem) {
        taskbarItem.classList.remove('active');
    }
}

function unminimizeWindow(windowElement) {
    windowElement.style.display = 'flex';
    bringToFront(windowElement);
}

function maximizeWindow(windowElement) {
    if (windowElement.classList.contains('maximized')) {
        windowElement.classList.remove('maximized');
        positionWindow(windowElement);
    } else {
        windowElement.classList.add('maximized');
        windowElement.style.width = '100%';
        windowElement.style.height = 'calc(100% - 30px)'; // Adjust for taskbar height
        windowElement.style.left = '0';
        windowElement.style.top = '0';
    }
}

function closeWindow(windowObj) {
    const { appId, element: windowElement } = windowObj;
    windowElement.remove();
    const taskbarItem = document.querySelector(`.taskbar-item[data-app-id="${appId}"]`);
    if (taskbarItem) {
        taskbarItem.remove();
    }
    windows = windows.filter(w => w.appId !== appId);
    EventBus.publish('windowClosed', appId);

    if (windows.length > 0) {
        const topWindow = windows[windows.length - 1];
        bringToFront(topWindow.element);
    } else {
        window.history.pushState({}, '', window.location.origin + window.location.pathname);
    }
}

export function getWindowContent(appId) {
    const windowObj = windows.find(w => w.appId === appId);
    return windowObj ? windowObj.element.querySelector('.window-content') : null;
}