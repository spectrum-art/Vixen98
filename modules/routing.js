import { apps } from './apps.js';
import { EventBus } from './utils.js';
import { checkAppAccess } from './auth.js';
import { openApp } from '../main.js';

export function initializeRouting() {
    window.addEventListener('hashchange', handleRouting);
    handleRouting();
}

export function handleRouting() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        const [appName, params] = parseHash(hash);
        if (apps[appName] && checkAppAccess(appName)) {
            handleAppOpen(appName, params);
        } else {
            showAccessDenied();
        }
    }
}

export function parseHash(hash) {
    const [encodedAppName, paramString] = hash.split('?');
    const appName = decodeURIComponent(encodedAppName).replace(/%20/g, ' ');
    const params = {};
    if (paramString) {
        paramString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value);
        });
    }
    return [appName, params];
}

export function generateDeepLink(appName, params = {}) {
    if (!apps[appName]) {
        console.error(`Unknown app: ${appName}`);
        return '';
    }
    const encodedAppName = encodeURIComponent(appName);
    const paramString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    return `${window.location.origin}/#${encodedAppName}${paramString ? `?${paramString}` : ''}`;
}

export function updateURL(appName, params = {}) {
    const newURL = appName ? generateDeepLink(appName, params) : `${window.location.origin}/`;
    if (window.location.href !== newURL) {
        window.history.pushState({ appName, params }, '', newURL);
    }
}

export function handleAppOpen(appName, params = {}) {
    updateURL(appName, params);
    if (!checkAppAccess(appName)) {
        showAccessDenied();
        return;
    }
    try {
        openApp(appName, params);
    } catch (error) {
        console.error(`Error opening app ${appName}:`, error);
        showErrorDialog(`Failed to open ${appName}. Please try again.`);
    }
}

export function showAccessDenied() {
    EventBus.publish('showDialog', {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        buttons: [{ text: 'OK', onClick: () => {} }]
    });
}

function showErrorDialog(message) {
    EventBus.publish('showDialog', {
        title: 'Error',
        message: message,
        buttons: [{ text: 'OK', onClick: () => {} }]
    });
}