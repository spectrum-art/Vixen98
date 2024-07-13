const crypto = require('crypto-js');

const SECRETS = {
    passwordSecret: 'verySecretKey123',
    tokenSecret: 'anotherSecretKey456'
};

const hashedPasswords = {
    'babyshark': '3d7e3d93e43aff2e8790102d47832f24f3eebe631b5aa8e27cecc98af2c99f11',
    'lazarus': '7fad6ea86e768759721a2aa8e3c36cf28b21fa9d1beecc68c8e809c053e08186'
};

const accessLevels = {
    'babyshark': 2,
    'lazarus': 3
};

function validatePassword(password) {
    const hashedPassword = crypto.SHA256(password + SECRETS.passwordSecret).toString();
    for (let key in hashedPasswords) {
        if (hashedPasswords[key] === hashedPassword) {
            return generateToken(accessLevels[key]);
        }
    }
    return generateToken(1);
}

function generateToken(accessLevel) {
    const payload = {
        accessLevel: accessLevel,
        exp: Date.now() + 3600000 // 1 hour expiration
    };
    const token = crypto.AES.encrypt(JSON.stringify(payload), SECRETS.tokenSecret).toString();
    return token;
}

function verifyToken(token) {
    try {
        const decrypted = crypto.AES.decrypt(token, SECRETS.tokenSecret).toString(crypto.enc.Utf8);
        const payload = JSON.parse(decrypted);
        if (payload.exp > Date.now()) {
            return payload.accessLevel;
        }
    } catch (error) {
        console.error('Invalid token');
    }
    return 1;
}

module.exports = { validatePassword, verifyToken };
