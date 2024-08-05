import { initializeDesktop } from './modules/desktop.js';
import { initializeSystem } from './modules/system.js';
import { initializeDocuments, openDeliveryMap, openUndergroundMap } from './modules/documents.js';
import { initializeLemonList } from './modules/lemonList.js';
import { initializeEncryption } from './modules/encryption.js';
import { initializeAuth, checkStoredCredentials } from './modules/auth.js';
import { initializepropaganda } from './modules/propaganda.js';
import { initializeRouting } from './modules/routing.js';

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
    switch(appName) {
        case 'System':
            initializeSystem();
            break;
        case 'Trash':
            // Add initialization logic here later
            break;
        case 'Documents':
            initializeDocuments(params);
            break;
        case 'Lemon List':
            initializeLemonList(params);
            break;
        case 'Encryption':
            initializeEncryption();
            break;
        case 'Propaganda':
            initializepropaganda();
            break;
        case 'Delivery Map':
            openDeliveryMap();
            break;
        case 'Cookie Batch Log':
            // Add initialization logic here later
            break;
        case 'Underground Map':
            openUndergroundMap();
            break;
        case 'Placeholder':
            // Add initialization logic here later
            break;                        
        default:
            console.error(`Unknown app: ${appName}`);
            throw new Error(`Unknown app: ${appName}`);
    }
}

window.addEventListener('popstate', (event) => {
    if (event.state && event.state.appName) {
        openApp(event.state.appName, event.state.params);
    }
});