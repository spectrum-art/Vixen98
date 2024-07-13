import { validatePassword, verifyToken } from './server.js';

const desktopIcons = [
    { name: 'My Computer', icon: '💻', accessLevel: 1 },
    { name: 'Recycle Bin', icon: '🗑️', accessLevel: 1 },
    { name: 'My Documents', icon: '📁', accessLevel: 2 },
    { name: 'Internet Explorer', icon: '🌐', accessLevel: 1 },
    { name: 'Encryption', icon: '🔒', accessLevel: 2 }
];

const iconGrid = document.getElementById('icon-grid');
const openWindows = document.getElementById('open-windows');
const desktop = document.getElementById('desktop');

function createDesktopIcons() {
    desktopIcons.forEach(icon => {
        const iconElement = document.createElement('div');
        iconElement.className = 'desktop-icon';
        iconElement.innerHTML = `
            <div class="icon">${icon.icon}</div>
            <div class="label">${icon.name}</div>
        `;
        iconElement.addEventListener('click', () => openWindow(icon));
        iconGrid.appendChild(iconElement);
    });
}

function openWindow(icon) {
    const token = localStorage.getItem('accessToken');
    const currentAccessLevel = verifyToken(token);

    if (currentAccessLevel < icon.accessLevel) {
        alert('Unauthorized');
        return;
    }

    // Check if the window is already open
    const existingWindow = document.querySelector(`.window[data-app="${icon.name}"]`);
    if (existingWindow) {
        bringToFront(existingWindow);
        return;
    }

    const window = document.createElement('div');
    window.className = 'window';
    window.setAttribute('data-app', icon.name);
    
    let content;
    if (icon.name === 'Encryption') {
        content = createEncryptionApp();
    } else {
        content = `Content for ${icon.name}`;
    }
    
    window.innerHTML = `
        <div class="window-header">
            <span class="window-title">${icon.name}</span>
            <span class="window-close">❌</span>
        </div>
        <div class="window-content">${content}</div>
    `;
    
    const closeBtn = window.querySelector('.window-close');
    closeBtn.addEventListener('click', () => closeWindow(window, icon));
    
    positionWindow(window);
    desktop.appendChild(window);
    createTaskbarItem(icon, window);
    
    makeDraggable(window);

    if (icon.name === 'Encryption') {
        setupEncryptionApp(window);
    }

    bringToFront(window);
}

function createEncryptionApp() {
    return `
        <div class="encryption-app">
            <div class="app-row file-drop-area">
                <input type="file" id="fileInput" accept="*/*">
                <p>Drag & drop a file or click to select</p>
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

function setupEncryptionApp(window) {
    const encryptBtn = window.querySelector('#encryptBtn');
    const decryptBtn = window.querySelector('#decryptBtn');
    const togglePassword = window.querySelector('#togglePassword');

    encryptBtn.addEventListener('click', () => handleEncryptDecrypt(true));
    decryptBtn.addEventListener('click', () => handleEncryptDecrypt(false));
    togglePassword.addEventListener('click', togglePasswordVisibility);

    setupFileDrop(window);
}

function handleEncryptDecrypt(isEncrypt) {
    const fileInput = document.getElementById('fileInput');
    const passwordInput = document.getElementById('passwordInput');
    const statusBar = document.getElementById('statusBar');
    const downloadContainer = document.getElementById('downloadContainer');
    const downloadLink = document.getElementById('downloadLink');

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
    const passwordInput = document.getElementById('passwordInput');
    const toggleButton = document.getElementById('togglePassword');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    toggleButton.classList.toggle('active');
}

function setupFileDrop(window) {
    const dropArea = window.querySelector('.file-drop-area');
    const fileInput = window.querySelector('#fileInput');

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
    }
}

function closeWindow(window, icon) {
    window.remove();
    const taskbarItem = document.querySelector(`[data-icon="${icon.name}"]`);
    if (taskbarItem) {
        taskbarItem.remove();
    }
}

function createTaskbarItem(icon, window) {
    const taskbarItem = document.createElement('div');
    taskbarItem.className = 'taskbar-item';
    taskbarItem.setAttribute('data-icon', icon.name);
    taskbarItem.innerHTML = `
        <div class="taskbar-item-icon">${icon.icon}</div>
        <span>${icon.name}</span>
    `;
    taskbarItem.addEventListener('click', () => {
        if (window.style.display === 'none') {
            window.style.display = 'flex';
            bringToFront(window);
        } else {
            window.style.display = 'none';
        }
    });
    openWindows.appendChild(taskbarItem);
}

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    element.querySelector('.window-header').onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        bringToFront(element);
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }

    element.addEventListener('mousedown', () => {
        bringToFront(element);
    });
}

function bringToFront(window) {
    const windows = document.querySelectorAll('.window');
    let maxZIndex = 0;

    windows.forEach(w => {
        const zIndex = parseInt(w.style.zIndex || '0');
        maxZIndex = Math.max(maxZIndex, zIndex);
        w.classList.remove('active');
    });

    window.style.zIndex = maxZIndex + 1;
    window.classList.add('active');
}

function positionWindow(window) {
    let left = 25;
    let top = 25;
    const step = 5;

    while (isPositionOccupied(left, top)) {
        left += step;
        top += step;

        if (left > desktop.clientWidth - window.clientWidth) {
            left = 25;
        }
        if (top > desktop.clientHeight - window.clientHeight) {
            top = 25;
        }
    }

    window.style.left = `${left}%`;
    window.style.top = `${top}%`;
}

function isPositionOccupied(left, top) {
    const windows = document.querySelectorAll('.window');
    for (let w of windows) {
        const wLeft = parseInt(w.style.left);
        const wTop = parseInt(w.style.top);
        if (Math.abs(wLeft - left) < 10 && Math.abs(wTop - top) < 10) {
            return true;
        }
    }
    return false;
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' });
    document.getElementById('clock').textContent = timeString;
}

createDesktopIcons();
updateClock();
setInterval(updateClock, 1000);

document.getElementById('start-button').addEventListener('click', () => {
    const password = prompt('Enter password:');
    if (password) {
        const token = validatePassword(password);
        localStorage.setItem('accessToken', token);
        const accessLevel = verifyToken(token);
        if (accessLevel > 1) {
            alert(`Access level ${accessLevel} granted.`);
        } else {
            alert('Invalid password.');
        }
    }
});
