import { EventBus } from './utils.js';

const SALT = "server";

const accessLevelHashes = {
    2: '1b055790275fe1228786d33b8897a3fa6fb26191c1eafe3b2074b096899a821d',
    3: '98877553b2bed31cc19b5b3ae73c855831519154d83453cb897e120e062b21d3'
};

export const appAccessLevels = {
    System: { level: 1, hiddenIfLocked: false },
    Trash: { level: 5, hiddenIfLocked: false },
    Documents: { level: 2, hiddenIfLocked: false },
        'Cookie Delivery Map': { level: 2, hiddenIfLocked: false },
        'Cookie Batch Log': { level: 5, hiddenIfLocked: false },
        'Underground Map': { level: 2, hiddenIfLocked: false },
        Placeholder: { level: 5, hiddenIfLocked: true },
    'Lemon List': { level: 1, hiddenIfLocked: false },
    Encryption: { level: 2, hiddenIfLocked: false },
    Propaganda: { level: 1, hiddenIfLocked: false }
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
    return generateToken(1);  // Default access level
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
    return 1; // Default access level
}

export function storeCredentials(token) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('lastLogin', Date.now().toString());
}

export function checkStoredCredentials() {
    const token = localStorage.getItem('accessToken');
    const lastLogin = localStorage.getItem('lastLogin');
    const currentTime = Date.now();

    if (token && lastLogin && (currentTime - parseInt(lastLogin) < 12 * 60 * 60 * 1000)) {
        const accessLevel = verifyToken(token);
        if (accessLevel > 1) {
            EventBus.publish('accessLevelChanged', accessLevel);
            return true;
        }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('lastLogin');
    return false;
}

export function getAccessLevel() {
    const token = localStorage.getItem('accessToken');
    return token ? verifyToken(token) : 1;
}

export function checkAppAccess(appName) {
    const userAccessLevel = getAccessLevel();
    const { level: requiredLevel } = appAccessLevels[appName] || { level: 1 };
    return userAccessLevel >= requiredLevel;
}