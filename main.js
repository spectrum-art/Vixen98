const desktopIcons = [
    { name: 'My Computer', icon: '💻' },
    { name: 'Recycle Bin', icon: '🗑️' },
    { name: 'My Documents', icon: '📁' },
    { name: 'Internet Explorer', icon: '🌐' },
    { name: 'Encryption', icon: '🔒' }
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
    const window = document.createElement('div');
    window.className = 'window';
    window.style.left = '25%';
    window.style.top = '25%';
    
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
    
    desktop.appendChild(window);
    createTaskbarItem(icon, window);
    
    makeDraggable(window);
}

function createEncryptionApp() {
    return `
        <div class="encryption-app">
            <div class="app-row">
                <input type="file" id="fileInput" accept="*/*">
            </div>
            <div class="app-row">
                <input type="password" id="passwordInput" placeholder="Enter password">
            </div>
            <div class="app-row">
                <button id="encryptBtn">Encrypt</button>
                <button id="decryptBtn">Decrypt</button>
            </div>
            <div class="app-row">
                <div id="statusBar"></div>
            </div>
            <div class="app-row" id="downloadContainer" style="display: none;">
                <a id="downloadLink" class="download-button">Download File</a>
            </div>
        </div>
    `;
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
            let result;
            if (isEncrypt) {
                const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
                result = CryptoJS.AES.encrypt(wordArray, password).toString();
            } else {
                let decrypted;
                try {
                    decrypted = CryptoJS.AES.decrypt(e.target.result, password);
                } catch (error) {
                    throw new Error('Decryption failed. The file might not be encrypted or the password might be incorrect.');
                }
                
                if (decrypted.sigBytes === 0) {
                    throw new Error('Decryption resulted in empty content. The password might be incorrect.');
                }
                
                result = decrypted.toString(CryptoJS.enc.Uint8Array);
            }

            let blob, fileName;
            if (isEncrypt) {
                blob = new Blob([result], { type: 'application/octet-stream' });
                fileName = `${file.name}.VIX`;
            } else {
                const byteArray = new Uint8Array(result.match(/[\s\S]/g).map(ch => ch.charCodeAt(0)));
                blob = new Blob([byteArray], { type: file.type });
                fileName = file.name.endsWith('.VIX') ? file.name.slice(0, -4) : file.name;
            }

            const url = URL.createObjectURL(blob);

            downloadLink.href = url;
            downloadLink.download = fileName;
            downloadContainer.style.display = 'block';

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

    reader.readAsArrayBuffer(file);
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
        window.style.display = window.style.display === 'none' ? 'flex' : 'none';
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
    alert('Start button clicked');
});
