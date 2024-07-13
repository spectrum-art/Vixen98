const SALT = "server";

const accessLevelHashes = {
    2: '1b055790275fe1228786d33b8897a3fa6fb26191c1eafe3b2074b096899a821d',
    3: '98877553b2bed31cc19b5b3ae73c855831519154d83453cb897e120e062b21d3'
};

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
        exp: Date.now() + 86400000
    };
    return CryptoJS.AES.encrypt(JSON.stringify(payload), SALT).toString();
}

function verifyToken(token) {
    try {
        const decrypted = CryptoJS.AES.decrypt(token, SALT).toString(CryptoJS.enc.Utf8);
        const payload = JSON.parse(decrypted);
        if (payload.exp > Date.now()) {
            return payload.accessLevel;
        }
    } catch (error) {
        console.error('Invalid token');
    }
    return 1; 
}

export { validatePassword, verifyToken };
