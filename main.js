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

    console.log('DOM content loaded, initializing modules');
    initializeDesktop();
    initializeWindowManagement();
    initializeEncryption();
    initializeDocuments();
    initializeLemonList();
    initializeAuth();

    // Set up routing
    window.addEventListener('hashchange', handleRouting);
    handleRouting();
});

export function openApp(appName) {
    console.log('Opening app:', appName);
    let config;
    switch(appName) {
        case 'System':
            config = {
                title: 'System',
                content: `<div id="system-app"></div>`,
                // Add any System-specific config here
            };
            break;
        case 'Trash':
            config = {
                title: 'Trash',
                content: `<div id="trash-app"></div>`,
                // Add any Trash-specific config here
            };
            break;
        case 'Documents':
            config = {
                title: 'Documents',
                content: `<div id="documents-app"></div>`,
            };
            break;
        case 'Lemon List':
            config = {
                title: 'Lemon List',
                content: `<div id="lemon-list-app"></div>`,
            };
            break;
        case 'Encryption':
            config = {
                title: 'Encryption',
                content: `<div id="encryption-app"></div>`,
                // Add any Encryption-specific config here
            };
            break;
        default:
            console.error(`Unknown app: ${appName}`);
            return;  // Exit the function for unknown apps
    }

    console.log('App config:', config);
    createAppWindow(config);
    console.log(`Publishing windowOpened event for ${appName}`);
    EventBus.publish('windowOpened', appName);
}

function handleRouting() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        console.log('Routing to:', hash);
        openApp(hash);
    }
}