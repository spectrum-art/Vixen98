import { EventBus } from './utils.js';
import { createAppWindow, getWindowContent } from './windowManagement.js';
import '../styles/encryption.css';
import '../styles/main.css';
import '../styles/common.css';

const encryptionConfig = {
    title: 'Encryption',
    width: '50%',
    height: '41%',
    content: '<div id="encryption-app"></div>',
};

export function initializeEncryption() {
    const window = createAppWindow(encryptionConfig);
    setupEncryptionApp(window);
}

function setupEncryptionApp(window) {
    const container = getWindowContent('Encryption');
    if (!container) return;

    container.innerHTML = createEncryptionAppHTML();
    setupEventListeners(container);
    setupFileDrop(container);
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

function setupEventListeners(container) {
    const encryptBtn = container.querySelector('#encryptBtn');
    const decryptBtn = container.querySelector('#decryptBtn');
    const togglePassword = container.querySelector('#togglePassword');
    const browseButton = container.querySelector('#browseButton');
    const fileInput = container.querySelector('#fileInput');
    const fileNameInput = container.querySelector('.file-input-wrapper input[type="text"]');

    browseButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameInput.value = e.target.files[0].name;
        } else {
            fileNameInput.value = '';
        }
    });

    encryptBtn.addEventListener('click', () => handleEncryptDecrypt(true, container));
    decryptBtn.addEventListener('click', () => handleEncryptDecrypt(false, container));
    togglePassword.addEventListener('click', () => togglePasswordVisibility(container));
}

function setupFileDrop(container) {
    const dropArea = container.querySelector('.file-drop-area');
    const fileInput = container.querySelector('#fileInput');

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
        const fileNameInput = container.querySelector('.file-input-wrapper input[type="text"]');
        if (files.length > 0) {
            fileNameInput.value = files[0].name;
        }
    }
}

function handleEncryptDecrypt(isEncrypt, container) {
    const fileInput = container.querySelector('#fileInput');
    const passwordInput = container.querySelector('#passwordInput');
    const statusBar = container.querySelector('#statusBar');
    const downloadContainer = container.querySelector('#downloadContainer');
    const downloadLink = container.querySelector('#downloadLink');

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

function togglePasswordVisibility(container) {
    const passwordInput = container.querySelector('#passwordInput');
    const toggleButton = container.querySelector('#togglePassword');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    toggleButton.classList.toggle('active');
}