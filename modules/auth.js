import { apps, getAppById } from './apps.js';
import { EventBus } from './utils.js';

const SALT = "server";
const defaultAccess = 1;

const accessLevelHashes = {
    2: '1b055790275fe1228786d33b8897a3fa6fb26191c1eafe3b2074b096899a821d',
    3: '98877553b2bed31cc19b5b3ae73c855831519154d83453cb897e120e062b21d3'
};

export function initializeAuth() {
    document.getElementById('start-button').addEventListener('click', handleStartButtonClick);
    checkStoredCredentials();
}

function handleStartButtonClick() {
    const password = prompt('Enter password:');
    if (password) {
        const token = validatePassword(password);
        storeCredentials(token);
        const accessLevel = verifyToken(token);
        if (accessLevel > 1) {
            alert(`Access level ${accessLevel} granted.`);
            EventBus.publish('accessLevelChanged', accessLevel);
        } else {
            alert('Invalid password.');
        }
    }
}

function validatePassword(password) {
    const hashedPassword = CryptoJS.SHA256(password + SALT).toString();
    for (let accessLevel in accessLevelHashes) {
        if (accessLevelHashes[accessLevel] === hashedPassword) {
            return generateToken(parseInt(accessLevel));
        }
    }
    return generateToken(defaultAccess);
}

function generateToken(accessLevel) {
    const payload = {
        accessLevel: accessLevel,
        exp: Date.now() + 86400000 // 24 hours
    };
    return CryptoJS.AES.encrypt(JSON.stringify(payload), SALT).toString();
}

export function verifyToken(token) {
    try {
        const decrypted = CryptoJS.AES.decrypt(token, SALT).toString(CryptoJS.enc.Utf8);
        const payload = JSON.parse(decrypted);
        if (payload.exp > Date.now()) {
            return payload.accessLevel;
        }
    } catch (error) {
        console.error('Invalid token');
    }
    return defaultAccess;
}

export function storeCredentials(token) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('lastLogin', Date.now().toString());
}

function isValidToken(token) {
    // Add more comprehensive checks if needed
    return typeof token === 'string' && token.length > 0;
}

function isValidTimestamp(timestamp) {
    const parsedTimestamp = parseInt(timestamp);
    return !isNaN(parsedTimestamp) && parsedTimestamp > 0;
}

export function checkStoredCredentials() {
    try {
        const token = localStorage.getItem('accessToken');
        const lastLogin = localStorage.getItem('lastLogin');
        const currentTime = Date.now();

        if (!isValidToken(token) || !isValidTimestamp(lastLogin)) {
            console.warn('Invalid stored credentials detected');
            clearStoredCredentials();
            return false;
        }

        const loginTimestamp = parseInt(lastLogin);
        if (currentTime - loginTimestamp < 12 * 60 * 60 * 1000) {
            const accessLevel = verifyToken(token);
            if (accessLevel > 1) {
                EventBus.publish('accessLevelChanged', accessLevel);
                return true;
            } else {
                console.warn('Invalid access level detected');
            }
        } else {
            console.log('Stored credentials have expired');
        }

        clearStoredCredentials();
        return false;
    } catch (error) {
        console.error('Error checking stored credentials:', error);
        clearStoredCredentials();
        return false;
    }
}

function clearStoredCredentials() {
    console.log(localStorage.getItem('accessToken'));
    console.log(localStorage.getItem('lastLogin'));
    console.log('Clearing stored credentials');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('lastLogin');
}

export function getAccessLevel() {
    const token = localStorage.getItem('accessToken');
    return token ? verifyToken(token) : 1;
}

export function checkAppAccess(appId) {
    const app = getAppById(appId);
    if (!app) {
        console.error(`App not found: ${appId}`);
        return false;
    }
    const userAccessLevel = getAccessLevel();
    return userAccessLevel >= app.accessLevel;
}