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
        if (checkAppAccess(appName)) {
            openApp(appName, params);
        } else {
            showAccessDenied();
        }
    }
}

function parseHash(hash) {
    const [appName, paramString] = hash.split('?');
    const params = {};
    if (paramString) {
        paramString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            params[key] = decodeURIComponent(value);
        });
    }
    return [appName, params];
}

export function generateDeepLink(appName, params = {}) {
    const paramString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
    return `${window.location.origin}/#${appName}${paramString ? `?${paramString}` : ''}`;
}

function showAccessDenied() {
    EventBus.publish('showDialog', {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        buttons: [{ text: 'OK', onClick: () => {} }]
    });
}