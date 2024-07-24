import { EventBus } from './utils.js';
import { getWindowContent } from './windowManagement.js';

export function initializeEncryption() {
    EventBus.subscribe('windowOpened', (appName) => {
        if (appName === 'Encryption') {
            setupEncryptionApp();
        }
    });
}

function setupEncryptionApp() {
    const content = getWindowContent('Encryption');
    if (!content) return;

    content.innerHTML = createEncryptionAppHTML();
    
    const encryptBtn = content.querySelector('#encryptBtn');
    const decryptBtn = content.querySelector('#decryptBtn');
    const togglePassword = content.querySelector('#togglePassword');
    const browseButton = content.querySelector('#browseButton');
    const fileInput = content.querySelector('#fileInput');
    const fileNameInput = content.querySelector('.file-input-wrapper input[type="text"]');

    browseButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameInput.value = e.target.files[0].name;
        } else {
            fileNameInput.value = '';
        }
    });

    encryptBtn.addEventListener('click', () => handleEncryptDecrypt(true));
    decryptBtn.addEventListener('click', () => handleEncryptDecrypt(false));
    togglePassword.addEventListener('click', togglePasswordVisibility);

    setupFileDrop(content);
}

function createEncryptionAppHTML() {
    return `
        <div class="encryption-app">
            <div class="file-drop-area">
                <div class="file-input-wrapper">
                    <input type="text" readonly placeholder="No file selected">
                    <button id="browseButton">Browse...</button>
                </div>
                <input type="file" id="fileInput" accept="*/*" style="display: none;">
                <p>Drag & drop a file here or click Browse to select</p>
            </div>
            <div class="app-row">
                <div class="password-container">
                    <input type="password" id="passwordInput" placeholder="Enter password">
                    <button id="togglePassword">👁️</button>
                </div>
            </div>
            <div class="app-row">
                <button id="encryptBtn">Encrypt</button>
                <button id="decryptBtn">Decrypt</button>
            </div>
            <div class="app-row">
                <div id="statusBar"></div>
            </div>
            <div class="app-row" id="downloadContainer" style="display: none">
                <a id="downloadLink" class="download-button">Download File</a>
            </div>
        </div>
    `;
}

function handleEncryptDecrypt(isEncrypt) {
    const content = getWindowContent('Encryption');
    if (!content) return;

    const fileInput = content.querySelector('#fileInput');
    const passwordInput = content.querySelector('#passwordInput');
    const statusBar = content.querySelector('#statusBar');
    const downloadContainer = content.querySelector('#downloadContainer');
    const downloadLink = content.querySelector('#downloadLink');

    const file = fileInput.files[0];
    const password = passwordInput.value;

    if (!file) {
        statusBar.textContent = 'Please select a file.';
        return;
    }
    if (!password) {
        statusBar.textContent = 'Please enter a password.';
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        statusBar.textContent = 'File size exceeds 10 MB limit.';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let result, fileName, blob;
            if (isEncrypt) {
                const fileInfo = {
                    name: file.name,
                    type: file.type,
                    data: Array.from(new Uint8Array(e.target.result))
                };
                result = CryptoJS.AES.encrypt(JSON.stringify(fileInfo), password).toString();
                blob = new Blob([result], { type: 'application/octet-stream' });
                fileName = `${file.name}.VIX`;
            } else {
                const decrypted = CryptoJS.AES.decrypt(e.target.result, password);
                const fileInfo = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
                result = new Uint8Array(fileInfo.data);
                blob = new Blob([result], { type: fileInfo.type });
                fileName = fileInfo.name;
            }
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = fileName;
            downloadContainer.style.display = 'flex';
            statusBar.textContent = `File ${isEncrypt ? 'encrypted' : 'decrypted'} successfully.`;
        } catch (error) {
            statusBar.textContent = `Error: ${error.message}`;
            downloadContainer.style.display = 'none';
        }
    };
    reader.onerror = function() {
        statusBar.textContent = `Error: Failed to read the file. Please try again.`;
        downloadContainer.style.display = 'none';
    };
    if (isEncrypt) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}

function togglePasswordVisibility() {
    const content = getWindowContent('Encryption');
    if (!content) return;

    const passwordInput = content.querySelector('#passwordInput');
    const toggleButton = content.querySelector('#togglePassword');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    toggleButton.classList.toggle('active');
}

function setupFileDrop(content) {
    const dropArea = content.querySelector('.file-drop-area');
    const fileInput = content.querySelector('#fileInput');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('dragover');
    }

    function unhighlight() {
        dropArea.classList.remove('dragover');
    }

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        const fileNameInput = content.querySelector('.file-input-wrapper input[type="text"]');
        if (files.length > 0) {
            fileNameInput.value = files[0].name;
        }
    }
}