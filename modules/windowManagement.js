import { EventBus } from './utils.js';

let windows = [];

const defaultConfig = {
    title: 'New Window',
    content: '',
    width: '50%',
    height: '30%',
    minWidth: '200px',
    minHeight: '100px',
    resizable: true,
    maximizable: true,
};

export function initializeWindowManagement() {
    console.log('Initializing window management');
    EventBus.subscribe('openApp', openWindow);
}

function openWindow(config) {
    console.log('openWindow called with config:', config);
    const existingWindow = windows.find(w => w.appName === config.title);
    if (existingWindow) {
        console.log('Existing window found, bringing to front');
        bringToFront(existingWindow.element);
        return;
    }

    console.log('Creating new window');
    createAppWindow(config);
}

// Main function to create a new application window.
export function createAppWindow(config) {
    console.log('Creating app window with config:', config);
    const mergedConfig = { ...defaultConfig, ...config };
    console.log('Merged config:', mergedConfig);
    const window = createWindowElement(mergedConfig);
    const desktop = document.getElementById('desktop');
    desktop.appendChild(window);
    windows.push({ appName: mergedConfig.title, element: window });

    createTaskbarItem(mergedConfig.title, window);
    positionWindow(window);
    makeDraggable(window);
    if (mergedConfig.resizable) makeResizable(window);
    bringToFront(window);

    console.log('Window created:', window);
    return window;
}

// Helper function to create the actual DOM elements for a window.
function createWindowElement(config) {
    console.log('Creating window element with config:', config);
    const window = document.createElement('div');
    window.className = 'window';
    window.setAttribute('data-app', config.title);
    
    window.innerHTML = `
        <div class="window-header">
            <span class="window-title">${config.title}</span>
            <div class="window-controls">
                <span class="window-minimize">🗕</span>
                ${config.maximizable ? '<span class="window-maximize">🗖</span>' : ''}
                <span class="window-close">❌</span>
            </div>
        </div>
        <div class="window-content"></div>
    `;
    
    const content = window.querySelector('.window-content');
    content.innerHTML = config.content;

    window.style.width = config.width;
    window.style.height = config.height;
    window.style.minWidth = config.minWidth;
    window.style.minHeight = config.minHeight;
    
    const minimizeBtn = window.querySelector('.window-minimize');
    const maximizeBtn = window.querySelector('.window-maximize');
    const closeBtn = window.querySelector('.window-close');
    
    minimizeBtn.addEventListener('click', () => minimizeWindow(window));
    if (maximizeBtn) maximizeBtn.addEventListener('click', () => maximizeWindow(window));
    closeBtn.addEventListener('click', () => closeWindow(window));

    return window;
}

function minimizeWindow(window) {
    window.style.transformOrigin = 'bottom left';
    window.classList.add('minimizing');
    
    window.dataset.originalLeft = window.style.left;
    window.dataset.originalTop = window.style.top;
    
    window.offsetWidth; // Force reflow
    const taskbarItem = document.querySelector(`[data-icon="${window.getAttribute('data-app')}"]`);
    if (taskbarItem) {
        const taskbarRect = taskbarItem.getBoundingClientRect();
        const windowRect = window.getBoundingClientRect();
        
        const translateX = taskbarRect.left - windowRect.left;
        const translateY = taskbarRect.top - windowRect.top;
        
        window.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.1)`;
        window.style.opacity = '0';
    }
    window.addEventListener('transitionend', () => {
        window.style.display = 'none';
        window.style.transform = '';
        window.style.opacity = '';
        window.classList.remove('minimizing');
    }, { once: true });
}

function unminimizeWindow(window) {
    window.style.display = 'flex';
    window.style.transformOrigin = 'bottom left';
    window.classList.add('unminimizing');
    
    window.offsetWidth; // Force reflow
    const taskbarItem = document.querySelector(`[data-icon="${window.getAttribute('data-app')}"]`);
    if (taskbarItem) {
        const taskbarRect = taskbarItem.getBoundingClientRect();
        const windowRect = window.getBoundingClientRect();
        
        const translateX = taskbarRect.left - windowRect.left;
        const translateY = taskbarRect.top - windowRect.top;
        
        window.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.1)`;
        window.style.opacity = '0';
        
        window.offsetWidth; // Force reflow
        
        window.style.transform = '';
        window.style.opacity = '1';
        window.style.left = window.dataset.originalLeft;
        window.style.top = window.dataset.originalTop;
    }
    window.addEventListener('transitionend', () => {
        window.classList.remove('unminimizing');
        bringToFront(window);
    }, { once: true });
}

function closeWindow(window) {
    const appName = window.getAttribute('data-app');
    window.remove();
    const taskbarItem = document.querySelector(`[data-icon="${appName}"]`);
    if (taskbarItem) {
        taskbarItem.remove();
    }
    windows = windows.filter(w => w.appName !== appName);
    EventBus.publish('windowClosed', appName);
}

function createTaskbarItem(appName, window) {
    const openWindows = document.getElementById('open-windows');
    const taskbarItem = document.createElement('div');
    taskbarItem.className = 'taskbar-item';
    taskbarItem.setAttribute('data-icon', appName);
    taskbarItem.innerHTML = `
        <div class="taskbar-item-icon">${getIconForApp(appName)}</div>
        <span>${appName}</span>
    `;
    taskbarItem.addEventListener('click', () => {
        if (window.style.display === 'none') {
            unminimizeWindow(window);
        } else if (window.classList.contains('active')) {
            minimizeWindow(window);
        } else {
            bringToFront(window);
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

    element.addEventListener('mousedown', () => {
        bringToFront(element);
    });
}

function bringToFront(window) {
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
    window.style.zIndex = maxZIndex + 1;
    window.classList.add('active');
    const taskbarItem = document.querySelector(`[data-icon="${window.getAttribute('data-app')}"]`);
    if (taskbarItem) {
        taskbarItem.classList.add('active');
    }
}

function positionWindow(window) {
    let left = 25;
    let top = 25;
    const step = 5;
    const desktop = document.getElementById('desktop');
    
    while (isPositionOccupied(left, top)) {
        left += step;
        top += step;
        if (left > desktop.clientWidth - window.clientWidth) {
            left = 25;
        }
        if (top > desktop.clientHeight - window.clientHeight) {
            top = 25;
        }
    }
    window.style.left = `${left}px`;
    window.style.top = `${top}px`;
}

function isPositionOccupied(left, top) {
    return windows.some(w => {
        const wLeft = parseInt(w.element.style.left);
        const wTop = parseInt(w.element.style.top);
        return Math.abs(wLeft - left) < 10 && Math.abs(wTop - top) < 10;
    });
}

function makeResizable(window) {
    const resizer = document.createElement('div');
    resizer.className = 'window-resizer';
    window.appendChild(resizer);

    resizer.addEventListener('mousedown', initResize, false);

    function initResize(e) {
        window.startX = e.clientX;
        window.startY = e.clientY;
        window.startWidth = parseInt(document.defaultView.getComputedStyle(window).width, 10);
        window.startHeight = parseInt(document.defaultView.getComputedStyle(window).height, 10);
        document.documentElement.addEventListener('mousemove', resize, false);
        document.documentElement.addEventListener('mouseup', stopResize, false);
    }

    function resize(e) {
        window.style.width = (window.startWidth + e.clientX - window.startX) + 'px';
        window.style.height = (window.startHeight + e.clientY - window.startY) + 'px';
    }

    function stopResize() {
        document.documentElement.removeEventListener('mousemove', resize, false);
        document.documentElement.removeEventListener('mouseup', stopResize, false);
    }
}

function maximizeWindow(window) {
    if (window.classList.contains('maximized')) {
        window.classList.remove('maximized');
        window.style.width = window.dataset.originalWidth;
        window.style.height = window.dataset.originalHeight;
        window.style.left = window.dataset.originalLeft;
        window.style.top = window.dataset.originalTop;
    } else {
        window.classList.add('maximized');
        window.dataset.originalWidth = window.style.width;
        window.dataset.originalHeight = window.style.height;
        window.dataset.originalLeft = window.style.left;
        window.dataset.originalTop = window.style.top;
        window.style.width = '100%';
        window.style.height = 'calc(100% - 30px)'; // Adjust for taskbar height
        window.style.left = '0';
        window.style.top = '0';
    }
}

export function getWindowContent(appName) {
    const window = windows.find(w => w.appName === appName);
    return window ? window.element.querySelector('.window-content') : null;
}