import { validatePassword, verifyToken } from './server.js';

document.addEventListener('DOMContentLoaded', function() {
    const splashScreen = document.getElementById('splash-screen');
    const splashGif = document.getElementById('splash-gif');
    const desktopContainer = document.getElementById('desktop-container');
    
    function removeSplashScreen() {
        splashScreen.classList.add('fade-out');
        splashScreen.addEventListener('animationend', function() {
            splashScreen.style.display = 'none';
            desktopContainer.classList.remove('hidden');
        });
    }

    function startSplashScreen() {
        splashGif.src = splashGif.src + '?t=' + new Date().getTime();
        
        setTimeout(removeSplashScreen, 8500);
    }

    startSplashScreen();
});

const desktopIcons = [
    { name: 'System', icon: '💻', accessLevel: 1 },
    { name: 'Trash', icon: '🗑️', accessLevel: 1 },
    { name: 'Documents', icon: '📁', accessLevel: 2 },
    { name: 'Lemon List', icon: '🍋', accessLevel: 1 },
    { name: 'Encryption', icon: '🔒', accessLevel: 1 }
];

const myDocumentsIcons = [
    { name: 'Cookie Delivery Map', icon: '🗺️' },
    { name: 'Cookie Batch Log', icon: '🍪' },
    { name: 'Underground Map', icon: '🐀' },
    { name: 'Placeholder', icon: '📄' }
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
    } else if (icon.name === 'Documents') {
        content = createMyDocumentsContent();
    } else if (icon.name === 'Lemon List') {
        content = createLemonListContent();
    } else {
        content = `Content for ${icon.name}`;
    }
    
    window.innerHTML = `
        <div class="window-header">
            <span class="window-title">${icon.name}</span>
            <div class="window-controls">
                <span class="window-minimize">🗕</span>
                <span class="window-close">❌</span>
            </div>
        </div>
        <div class="window-content">${content}</div>
    `;
    
    const minimizeBtn = window.querySelector('.window-minimize');
    const closeBtn = window.querySelector('.window-close');
    
    minimizeBtn.addEventListener('click', () => minimizeWindow(window, icon));
    closeBtn.addEventListener('click', () => closeWindow(window, icon));
    
    positionWindow(window);
    desktop.appendChild(window);
    createTaskbarItem(icon, window);
    
    makeDraggable(window);

    if (icon.name === 'Encryption') {
        setupEncryptionApp(window);
    }
    if (icon.name === 'My Documents') {
        setupMyDocumentsEventListeners(window);
    }
    if (icon.name === 'Lemon List') {
        window.style.width = 'auto';
        window.style.height = '90%';
        window.style.backgroundImage = 'url("lemonlistbg.png")';
        window.style.backgroundSize = 'auto 100%';
        window.style.backgroundRepeat = 'no-repeat';
        window.style.backgroundPosition = 'center';
        window.style.fontFamily = '"Nanum Gothic Coding", monospace';
        window.style.left = '50%';
        window.style.top = '50%';
        window.style.transform = 'translate(-50%, -50%)';
        window.classList.add('lemon-list-window')

        const img = new Image();
        img.onload = function() {
            const aspectRatio = this.width / this.height;
            const windowHeight = window.offsetHeight;
            const newWidth = windowHeight * aspectRatio;
            window.style.width = `${newWidth}px`;
            // Recenter after resizing
            window.style.transform = 'translate(-50%, -50%)';
        }
        img.src = 'lemonlistbg.png';
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                initializeLemonList();
            });
        });
    }
    
    bringToFront(window);
}

function minimizeWindow(window, icon) {
    window.style.transformOrigin = 'bottom left';
    window.classList.add('minimizing');
    
    window.dataset.originalLeft = window.style.left;
    window.dataset.originalTop = window.style.top;
    
    window.offsetWidth;

    const taskbarItem = document.querySelector(`[data-icon="${icon.name}"]`);
    if (taskbarItem) {
        const taskbarRect = taskbarItem.getBoundingClientRect();
        const windowRect = window.getBoundingClientRect();
        
        const translateX = taskbarRect.left - windowRect.left;
        const translateY = taskbarRect.top - windowRect.top;
        
        window.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.1)`;
        window.style.opacity = '0';
    }

    window.addEventListener('transitionend', () => {
        window.style.display = 'none';
        window.style.transform = '';
        window.style.opacity = '';
        window.classList.remove('minimizing');
    }, { once: true });
}

function unminimizeWindow(window, icon) {
    window.style.display = 'flex';
    window.style.transformOrigin = 'bottom left';
    window.classList.add('unminimizing');
    
    window.offsetWidth;

    const taskbarItem = document.querySelector(`[data-icon="${icon.name}"]`);
    if (taskbarItem) {
        const taskbarRect = taskbarItem.getBoundingClientRect();
        const windowRect = window.getBoundingClientRect();
        
        const translateX = taskbarRect.left - windowRect.left;
        const translateY = taskbarRect.top - windowRect.top;
        
        window.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.1)`;
        window.style.opacity = '0';
        
        window.offsetWidth;
        
        window.style.transform = '';
        window.style.opacity = '1';
        window.style.left = window.dataset.originalLeft;
        window.style.top = window.dataset.originalTop;
    }

    window.addEventListener('transitionend', () => {
        window.classList.remove('unminimizing');
        bringToFront(window);
    }, { once: true });
}

function createEncryptionApp() {
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

function setupEncryptionApp(window) {
    const encryptBtn = window.querySelector('#encryptBtn');
    const decryptBtn = window.querySelector('#decryptBtn');
    const togglePassword = window.querySelector('#togglePassword');
    const browseButton = window.querySelector('#browseButton');
    const fileInput = window.querySelector('#fileInput');
    const fileNameInput = window.querySelector('.file-input-wrapper input[type="text"]');

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

function createMyDocumentsContent() {
    return `
        <div class="my-documents-icons">
            ${myDocumentsIcons.map(icon => `
                <div class="desktop-icon" data-name="${icon.name}">
                    <div class="icon">${icon.icon}</div>
                    <div class="label">${icon.name}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function setupMyDocumentsEventListeners(window) {
    const icons = window.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const iconName = e.currentTarget.getAttribute('data-name');
            if (iconName === 'Cookie Delivery Map') {
                openCookieDeliveryMap();
            }
            // Add more conditions here for other icons if needed
        });
    });
}

function openCookieDeliveryMap() {
    const mapWindow = document.createElement('div');
    mapWindow.className = 'window map-window';
    mapWindow.innerHTML = `
        <div class="window-header">
            <span class="window-title">Cookie Delivery Map</span>
            <span class="window-close">❌</span>
        </div>
        <div class="window-content">
            <iframe src="https://gta-5-map.com/?slideout=false&slideoutright=false&x=-120.10709928325205&y=80.48718362536638&zoom=3.4021903306057872&notes=3EWfhJLeGcb,3nf05rUzzTS,61hDtXO1IAV,6KSIzbU0JCX,78yKmWHpAxr,8qmes9jiqky,9LdfkbPEQUp,Akr3xVeFxPx,BzSCrsUcHX0,CAecif3MPtL,CxmrjyVaMdb,ErAwcUUL4Jv,FqeP7JRiEfO,Gg4LUImN5RM,GZAFGvIkhQl,HD2hOgesZEE,Hpc1RWCbYNJ,HxWPJdFD5zG,I02HCZZmolC,I6nFz53EbKo,JbMeXCoX67S,K0Gco51LKq8,KOFXc19AHzl,KuW1Kv0rFKa,tzvgY7VwaI&embed=light" style="border: none; width: 100%; height: 100%;"></iframe>
        </div>
    `;
    
    const closeBtn = mapWindow.querySelector('.window-close');
    closeBtn.addEventListener('click', () => mapWindow.remove());
    
    desktop.appendChild(mapWindow);
    makeDraggable(mapWindow);
    bringToFront(mapWindow);
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
            unminimizeWindow(window, icon);
        } else if (window.classList.contains('active')) {
            minimizeWindow(window, icon);
        } else {
            bringToFront(window);
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
        const taskbarItem = document.querySelector(`[data-icon="${w.getAttribute('data-app')}"]`);
        if (taskbarItem) {
            taskbarItem.classList.remove('active');
        }
    });

    window.style.zIndex = maxZIndex + 1;
    window.classList.add('active');
    const taskbarItem = document.querySelector(`[data-icon="${window.getAttribute('data-app')}"]`);
    if (taskbarItem) {
        taskbarItem.classList.add('active');
    }
}

function positionWindow(window) {
    let left = 25;
    let top = 25;
    const step = 5;

    if (window.classList.contains('lemon-list-window')) {
        return;
    }

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

function showErrorDialog(message) {
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'dialog-overlay';
    
    const dialogWindow = document.createElement('div');
    dialogWindow.className = 'dialog-window';
    
    dialogWindow.innerHTML = `
        <div class="dialog-header">
            <span class="dialog-title">Error</span>
            <span class="dialog-close">❌</span>
        </div>
        <div class="dialog-content">
            <div class="dialog-icon">❗</div>
            <div class="dialog-message">${message}</div>
        </div>
        <div class="dialog-buttons">
            <button class="dialog-ok">OK</button>
        </div>
    `;
    
    dialogOverlay.appendChild(dialogWindow);
    document.body.appendChild(dialogOverlay);
    
    const closeButton = dialogWindow.querySelector('.dialog-close');
    const okButton = dialogWindow.querySelector('.dialog-ok');
    
    const closeDialog = () => {
        document.body.removeChild(dialogOverlay);
    };
    
    closeButton.addEventListener('click', closeDialog);
    okButton.addEventListener('click', closeDialog);
}

function createLemonListContent() {
    return `
        <div id="loading-indicator">Loading...</div>
        <div id="lemon-list-app" style="display: none; height: 100%;">
            <div class="search-filter-container">
                <input type="text" id="search-bar" placeholder="Search listings..." aria-label="Search listings">
                <div id="filter-checkboxes"></div>
                <button id="clear-filters">Clear All Filters</button>
            </div>
            <div class="listings-container">
                <div class="listing-column" id="left-column"></div>
                <div class="listing-column" id="right-column"></div>
            </div>
            <div class="pagination-container">
                <button id="prev-page" aria-label="Previous page">◀</button>
                <span id="page-indicator">Page 1 of 1</span>
                <button id="next-page" aria-label="Next page">▶</button>
            </div>
        </div>
    `;
}

const filterOptions = [
    { emoji: '🚓', label: 'Law Enforcement' },
    { emoji: '🚑', label: 'Los Santos Medical Group' },
    { emoji: '⚖️', label: 'Lawyer/Paralegal' },
    { emoji: '🏛️', label: 'Government Employee' },
    { emoji: '🎵', label: 'Musician/Producer' },
    { emoji: '🌽', label: 'Farmer' },
    { emoji: '💵', label: 'Loans' },
    { emoji: '🚗', label: 'Car Sales' },
    { emoji: '🧰', label: 'Impound/Tow' },
    { emoji: '🪑', label: 'Furniture Sales' },
    { emoji: '🔧', label: 'Mechanic' },
    { emoji: '🧺', label: 'Laundry' }
];

let listings = [];
let currentPage = 1;
let itemsPerPage = 0;
const debounceTime = 300;

function loadCSV() {
    return new Promise((resolve, reject) => {
        console.log('Starting to load CSV');
        fetch('vixenlemonlist.csv')
            .then(response => {
                console.log('CSV fetched, starting to parse');
                return response.text();
            })
            .then(data => {
                console.log('CSV parsed, processing data');
                listings = parseCSV(data);
                console.log('Listings processed:', listings.length);
                setupFilters();
                resolve();
            })
            .catch(error => {
                console.error('Error loading CSV:', error);
                document.getElementById('loading-indicator').textContent = 'Error loading data';
                reject(error);
            });
    });
}

function parseCSV(csv) {
    return csv.split('\n').map(row => {
        const parts = row.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
        const cleanParts = parts.map(part => part.replace(/^"|"$/g, '').trim());

        let emoji = '';
        let lastName = '';
        let firstName = '';
        let phoneNumber = '';

        if (/^\p{Emoji}/u.test(cleanParts[0])) {
            [emoji, lastName, firstName, phoneNumber] = cleanParts;
        } else {
            [lastName, firstName, phoneNumber] = cleanParts;
        }

        lastName = lastName.endsWith(',') ? lastName + ' ' : lastName + ', ';

        // Construct the base text without hyphens first
        let text = `${lastName}${firstName} ${phoneNumber}`;

        // Calculate remaining space for hyphens
        const remainingSpace = 55 - text.length;
        
        // Insert hyphens between the name and phone number
        if (remainingSpace > 0) {
            const hyphens = '-'.repeat(remainingSpace);
            text = `${lastName}${firstName} ${hyphens} ${phoneNumber}`;
        } else {
            // If no space for hyphens, just ensure the text is 55 characters
            text = text.padEnd(55, ' ').slice(0, 55);
        }

        console.log('Parsed text:', text, 'Length:', text.length); // Debug log

        return { emoji, text };
    }).filter(item => item.text.length > 0);
}

function setupFilters() {
    const filterContainer = document.getElementById('filter-checkboxes');
    filterOptions.forEach(option => {
        const filterItem = document.createElement('div');
        filterItem.className = 'filter-item';
        filterItem.innerHTML = `
            <input type="checkbox" id="filter-${option.emoji}" value="${option.emoji}">
            <label for="filter-${option.emoji}" title="${option.label}">${option.emoji}</label>
        `;
        filterContainer.appendChild(filterItem);
    });
}

function calculateItemsPerPage() {
    const column = document.querySelector('.listing-column');
    if (!column) return; // Exit if the column doesn't exist

    const listing = document.createElement('div');
    listing.className = 'listing';
    listing.innerHTML = '<span class="listing-emoji">&nbsp;</span><span class="listing-text">X</span>';
    column.appendChild(listing);

    const columnHeight = column.clientHeight;
    const listingHeight = listing.offsetHeight;

    column.removeChild(listing);

    if (columnHeight > 0 && listingHeight > 0) {
        itemsPerPage = Math.floor(columnHeight / listingHeight) * 2; // Multiply by 2 for two columns
        itemsPerPage -= 14;
    } else {
        itemsPerPage = 40; // Fallback value
    }

    console.log('Column height:', columnHeight, 'Listing height:', listingHeight, 'Items per page:', itemsPerPage);
}

function adjustFontSize() {
    const column = document.querySelector('.listing-column');
    if (!column) return;

    const testListing = document.createElement('div');
    testListing.className = 'listing';
    testListing.innerHTML = '<span class="listing-emoji">🌽</span><span class="listing-text">' + 'X'.repeat(55) + '</span>';
    column.appendChild(testListing);

    const textElement = testListing.querySelector('.listing-text');
    let fontSize = 16; // Start with 16px
    textElement.style.fontSize = `${fontSize}px`;

    while (textElement.scrollWidth > column.clientWidth - 28 && fontSize > 1) {
        fontSize -= 0.5;
        textElement.style.fontSize = `${fontSize}px`;
    }

    column.removeChild(testListing);

    // Multiply the fontSize by 0.9 before applying
    fontSize *= 0.9;

    // Apply the calculated and adjusted font size to all listing-text elements
    document.querySelectorAll('.listing-text').forEach(el => {
        el.style.fontSize = `${fontSize}px`;
    });

    console.log('Adjusted font size:', fontSize, 'px');
    
    calculateItemsPerPage();
}

function displayListings() {
    if (itemsPerPage === 0) {
        console.log('Items per page not calculated yet');
        return;
    }

    const filteredListings = filterListings();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageListings = filteredListings.slice(startIndex, endIndex);

    const leftColumn = document.getElementById('left-column');
    const rightColumn = document.getElementById('right-column');
    leftColumn.innerHTML = '';
    rightColumn.innerHTML = '';

    pageListings.forEach((listing, index) => {
        const listingElement = document.createElement('div');
        listingElement.className = 'listing';
        listingElement.innerHTML = `
            <span class="listing-emoji">${listing.emoji || ''}</span>
            <span class="listing-text debug-border">${listing.text}</span>
        `;
        if (index < itemsPerPage / 2) {
            leftColumn.appendChild(listingElement);
        } else {
            rightColumn.appendChild(listingElement);
        }
    });

    updatePagination(filteredListings.length);
}

function filterListings() {
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();
    const activeFilters = Array.from(document.querySelectorAll('#filter-checkboxes input:checked'))
        .map(checkbox => checkbox.value);

    return listings.filter(listing => {
        const matchesSearch = listing.text.toLowerCase().includes(searchTerm);
        const matchesFilter = activeFilters.length === 0 || activeFilters.includes(listing.emoji);
        return matchesSearch && matchesFilter;
    });
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    document.getElementById('page-indicator').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setupEventListeners() {
    document.getElementById('search-bar').addEventListener('input', debounce(() => {
        currentPage = 1;
        displayListings();
    }, debounceTime));

    document.getElementById('filter-checkboxes').addEventListener('change', () => {
        currentPage = 1;
        displayListings();
    });

    document.getElementById('clear-filters').addEventListener('click', () => {
        document.getElementById('search-bar').value = '';
        document.querySelectorAll('#filter-checkboxes input').forEach(checkbox => checkbox.checked = false);
        currentPage = 1;
        displayListings();
    });

    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayListings();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        const totalItems = filterListings().length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayListings();
        }
    });

    window.addEventListener('resize', debounce(() => {
        calculateItemsPerPage();
        displayListings();
    }, 250));
}

function initializeLemonList() {
    loadCSV().then(() => {
        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('lemon-list-app').style.display = 'block';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                adjustFontSize();
                displayListings();
                setupEventListeners();

                window.addEventListener('resize', debounce(() => {
                    adjustFontSize();
                    displayListings();
                }, 250));
            });
        });
    });
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
