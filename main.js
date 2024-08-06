import { initializeDesktop } from './modules/desktop.js';
import { initializeAuth, checkStoredCredentials, checkAppAccess } from './modules/auth.js';
import { initializeRouting } from './modules/routing.js';
import { apps } from './modules/apps.js';
import { EventBus } from './modules/utils.js';
import { createAppWindow } from './modules/windowManagement.js';

document.addEventListener('DOMContentLoaded', function() {
    const splashScreen = document.getElementById('splash-screen');
    const splashGif = document.getElementById('splash-gif');
    const desktopContainer = document.getElementById('desktop-container');
    
    function removeSplashScreen() {
        splashScreen.classList.add('fade-out');
        splashScreen.addEventListener('animationend', function() {
            splashScreen.style.display = 'none';
            desktopContainer.classList.remove('hidden');
        });
    }

    function startSplashScreen() {
        splashGif.src = splashGif.src + '?t=' + new Date().getTime();
        setTimeout(removeSplashScreen, 8500);
    }

    if (checkStoredCredentials()) {
        removeSplashScreen();
    } else {
        startSplashScreen();
    }

    console.log('DOM content loaded, initializing modules');
    initializeDesktop();
    initializeAuth();
    initializeRouting();
});

export function openApp(appName, params = {}) {
    console.log('Opening app:', appName, 'with params:', params);
    const app = apps[appName];
    if (!app) {
        console.error(`Unknown app: ${appName}`);
        throw new Error(`Unknown app: ${appName}`);
    }

    switch(app.type) {
        case 'app':
            openRegularApp(app, params);
            break;
        case 'folder':
            openFolderApp(app, params);
            break;
        case 'map':
            openMapApp(app, params);
            break;
        default:
            console.error(`Unknown app type: ${app.type}`);
            throw new Error(`Unknown app type: ${app.type}`);
    }
}

function openRegularApp(app, params) {
    import(`./modules/${app.jsFiles[0]}`).then(module => {
        if (typeof module.initialize === 'function') {
            module.initialize(params);
        } else {
            console.error(`Initialize function not found for app: ${app.name}`);
        }
    }).catch(error => {
        console.error(`Error loading app module: ${app.name}`, error);
    });
}

function openFolderApp(app, params) {
    const folderContent = app.subApps
        .map(subAppName => apps[subAppName])
        .filter(subApp => subApp && checkAppAccess(subApp.name))
        .map(subApp => `
            <div class="folder-icon" data-app="${subApp.name}">
                <div class="icon">${subApp.icon}</div>
                <div class="label">${subApp.name}</div>
            </div>
        `).join('');

    const folderWindow = createAppWindow({
        title: app.name,
        content: `<div class="folder-container">${folderContent}</div>`,
        width: '50%',
        height: '60%',
        className: 'folder-window'
    });

    const folderContainer = folderWindow.querySelector('.folder-container');
    setupFolderLayout(folderContainer);

    folderWindow.querySelectorAll('.folder-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const subAppName = icon.getAttribute('data-app');
            openApp(subAppName);
        });
    });

    const resizeObserver = new ResizeObserver(() => {
        setupFolderLayout(folderContainer);
    });
    resizeObserver.observe(folderContainer);
}

function setupFolderLayout(container) {
    const icons = container.querySelectorAll('.folder-icon');
    const containerWidth = container.clientWidth;
    const iconWidth = 100; // Adjust this value based on your icon size
    const iconsPerRow = Math.floor(containerWidth / iconWidth);
    
    icons.forEach((icon, index) => {
        icon.style.position = 'absolute';
        icon.style.left = `${(index % iconsPerRow) * iconWidth}px`;
        icon.style.top = `${Math.floor(index / iconsPerRow) * iconWidth}px`;
    });

    container.style.height = `${Math.ceil(icons.length / iconsPerRow) * iconWidth}px`;
}

function openMapApp(app, params) {
    openRegularApp(app, params);
}

window.addEventListener('popstate', (event) => {
    if (event.state && event.state.appName) {
        openApp(event.state.appName, event.state.params);
    }
});

EventBus.subscribe('showDialog', (dialogOptions) => {
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'dialog-overlay';
    
    const dialogWindow = document.createElement('div');
    dialogWindow.className = 'dialog-window';
    
    dialogWindow.innerHTML = `
        <div class="dialog-header">
            <span class="dialog-title">${dialogOptions.title}</span>
            <span class="dialog-close">❌</span>
        </div>
        <div class="dialog-content">
            <p>${dialogOptions.message}</p>
        </div>
        <div class="dialog-buttons">
            ${dialogOptions.buttons.map(button => 
                `<button class="dialog-button">${button.text}</button>`
            ).join('')}
        </div>
    `;
    
    dialogOverlay.appendChild(dialogWindow);
    document.body.appendChild(dialogOverlay);
    
    const closeButton = dialogWindow.querySelector('.dialog-close');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(dialogOverlay);
    });
    
    const buttons = dialogWindow.querySelectorAll('.dialog-button');
    buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
            dialogOptions.buttons[index].onClick();
            document.body.removeChild(dialogOverlay);
        });
    });
});