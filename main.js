import { initializeDesktop } from './modules/desktop.js';
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
    initializeAuth();

    // Set up routing
    window.addEventListener('hashchange', handleRouting);
    handleRouting();
});

export function openApp(appName) {
    console.log('Opening app:', appName);
    switch(appName) {
        case 'Documents':
            initializeDocuments();
            break;
        case 'Lemon List':
            initializeLemonList();
            break;
        case 'Encryption':
            initializeEncryption();
            break;
        // Add cases for other apps
        default:
            console.error(`Unknown app: ${appName}`);
    }
}

function handleRouting() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        console.log('Routing to:', hash);
        openApp(hash);
    }
}