const desktopIcons = [
    { name: 'My Computer', icon: '💻' },
    { name: 'Recycle Bin', icon: '🗑️' },
    { name: 'My Documents', icon: '📁' },
    { name: 'Internet Explorer', icon: '🌐' }
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
    window.innerHTML = `
        <div class="window-header">
            <span class="window-title">${icon.name}</span>
            <span class="window-close">❌</span>
        </div>
        <div class="window-content">
            Content for ${icon.name}
        </div>
    `;
    
    const closeBtn = window.querySelector('.window-close');
    closeBtn.addEventListener('click', () => closeWindow(window, icon));
    
    desktop.appendChild(window);
    createTaskbarItem(icon, window);
    
    makeDraggable(window);
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