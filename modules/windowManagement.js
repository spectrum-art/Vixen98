import { EventBus } from './utils.js';

let windows = [];

export function createAppWindow(appConfig = {}) {
    const defaultConfig = {
        width: '50%',
        height: '60%',
        minWidth: '300px',
        minHeight: '200px',
        resizable: true,
        maximizable: true,
        title: 'New Window',
        content: '',
    };

    const config = { ...defaultConfig, ...appConfig };
    console.log('Creating app window with config:', config);

    const windowElement = document.createElement('div');
    windowElement.className = 'window';
    windowElement.setAttribute('data-app', config.title);

    windowElement.style.width = config.width;
    windowElement.style.height = config.height;
    windowElement.style.minWidth = config.minWidth;
    windowElement.style.minHeight = config.minHeight;

    windowElement.innerHTML = `
        <div class="window-header">
            <span class="window-title">${config.title}</span>
            <div class="window-controls">
                <span class="window-minimize">🗕</span>
                ${config.maximizable ? '<span class="window-maximize">🗖</span>' : ''}
                <span class="window-close">❌</span>
            </div>
        </div>
        <div class="window-content">${config.content}</div>
    `;

    if (config.className) {
        windowElement.classList.add(config.className);
    }

    const desktop = document.getElementById('desktop');
    desktop.appendChild(windowElement);
    windows.push({ appName: config.title, element: windowElement });

    createTaskbarItem(config.title, windowElement);
    positionWindow(windowElement);
    makeDraggable(windowElement);
    if (config.resizable) makeResizable(windowElement);
    bringToFront(windowElement);

    setupWindowControls(windowElement);

    console.log('Window created:', windowElement);
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

function createTaskbarItem(appName, windowElement) {
    const openWindows = document.getElementById('open-windows');
    const taskbarItem = document.createElement('div');
    taskbarItem.className = 'taskbar-item';
    taskbarItem.setAttribute('data-icon', appName);
    taskbarItem.innerHTML = `
        <div class="taskbar-item-icon">${getIconForApp(appName)}</div>
        <span>${appName}</span>
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

function getIconForApp(appName) {
    const iconMap = {
        'System': '💻',
        'Trash': '🗑️',
        'Documents': '📁',
        'Lemon List': '🍋',
        'Encryption': '🔒'
    };
    return iconMap[appName] || '📄';
}

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    element.querySelector('.window-header').onmousedown = dragMouseDown;

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
        const taskbarItem = document.querySelector(`[data-icon="${w.appName}"]`);
        if (taskbarItem) {
            taskbarItem.classList.remove('active');
        }
    });
    windowElement.style.zIndex = maxZIndex + 1;
    windowElement.classList.add('active');
    const taskbarItem = document.querySelector(`[data-icon="${windowElement.getAttribute('data-app')}"]`);
    if (taskbarItem) {
        taskbarItem.classList.add('active');
    }
}

function setupWindowControls(windowElement) {
    const minimizeBtn = windowElement.querySelector('.window-minimize');
    const maximizeBtn = windowElement.querySelector('.window-maximize');
    const closeBtn = windowElement.querySelector('.window-close');
    
    minimizeBtn.addEventListener('click', () => minimizeWindow(windowElement));
    if (maximizeBtn) maximizeBtn.addEventListener('click', () => maximizeWindow(windowElement));
    closeBtn.addEventListener('click', () => closeWindow(windowElement));
}

function minimizeWindow(windowElement) {
    windowElement.style.display = 'none';
    const taskbarItem = document.querySelector(`[data-icon="${windowElement.getAttribute('data-app')}"]`);
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

function closeWindow(windowElement) {
    const appName = windowElement.getAttribute('data-app');
    windowElement.remove();
    const taskbarItem = document.querySelector(`[data-icon="${appName}"]`);
    if (taskbarItem) {
        taskbarItem.remove();
    }
    windows = windows.filter(w => w.appName !== appName);
    EventBus.publish('windowClosed', appName);
}

export function getWindowContent(appName) {
    const windowObj = windows.find(w => w.appName === appName);
    return windowObj ? windowObj.element.querySelector('.window-content') : null;
}