import { initializeDesktop } from './modules/desktop.js';
import { initializeWindowManagement, createAppWindow } from './modules/windowManagement.js';
import { initializeEncryption } from './modules/encryption.js';
import { initializeDocuments } from './modules/documents.js';
import { initializeLemonList } from './modules/lemonList.js';
import { initializeAuth } from './modules/auth.js';
import { EventBus } from './modules/utils.js';

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

    startSplashScreen();

    // Initialize modules
    initializeDesktop();
    initializeWindowManagement();
    initializeEncryption();
    initializeDocuments();
    initializeLemonList();
    initializeAuth();

    // Set up routing
    window.addEventListener('hashchange', handleRouting);
    handleRouting(); // Handle initial route
});

function handleRouting() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        openApp(hash);
    }
}

function openApp(appName) {
    switch(appName) {
        case 'System':
        case 'Trash':
        case 'Documents':
        case 'Lemon List':
        case 'Encryption':
            createAppWindow({
                title: appName,
                content: `<div id="${appName.toLowerCase().replace(' ', '-')}-app"></div>`,
                width: '50%',
                height: '60%',
            });
            EventBus.publish('windowOpened', appName);
            break;
        default:
            console.error(`Unknown app: ${appName}`);
    }
}