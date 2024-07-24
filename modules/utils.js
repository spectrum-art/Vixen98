export const EventBus = {
    events: {},
    subscribe(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    },
    unsubscribe(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    },
    publish(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
};

export function debounce(func, wait) {
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

export function showErrorDialog(message) {
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