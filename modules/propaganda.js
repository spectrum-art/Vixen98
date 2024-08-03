import { createAppWindow } from './windowManagement.js';
import { EventBus } from './utils.js';

const propagandaConfig = {
    title: 'Propaganda',
    width: '50%',
    height: '70%',
    content: '<div id="propaganda-app"></div>',
};

let announcements = [];

export function initializepropaganda() {
    const window = createAppWindow(propagandaConfig);
    setuppropagandaApp(window);
}

function setuppropagandaApp(window) {
    const container = window.querySelector('#propaganda-app');
    if (!container) return;
    
    container.innerHTML = createpropagandaHTML();
    loadAnnouncements(container);
}

function createpropagandaHTML() {
    return `
        <div class="announcements-container">
            <div id="announcements-list"></div>
            <button id="see-more-button">See more...</button>
        </div>
    `;
}

function loadAnnouncements(container) {
    fetch('/data/announcements.json')
        .then(response => response.json())
        .then(data => {
            announcements = data;
            displayAnnouncements(container);
        })
        .catch(error => {
            console.error('Error loading announcements:', error);
            displayError(container);
        });
}

function displayAnnouncements(container) {
    const listContainer = container.querySelector('#announcements-list');
    listContainer.innerHTML = '';

    announcements.forEach(announcement => {
        const announcementElement = document.createElement('div');
        announcementElement.className = 'announcement';
        announcementElement.innerHTML = `
            <h3>${announcement.title}</h3>
            <p class="date">${new Date(announcement.date).toLocaleDateString()}</p>
            <p class="snippet">${getSnippet(announcement.body)}</p>
        `;
        announcementElement.addEventListener('click', () => {
            window.open(announcement.url, '_blank');
        });
        listContainer.appendChild(announcementElement);
    });

    const seeMoreButton = container.querySelector('#see-more-button');
    seeMoreButton.addEventListener('click', () => {
        window.open('https://www.nopixel.net/upload/index.php?forums/city-hall.264/', '_blank');
    });
}

function getSnippet(content) {
    const text = content || '';
    return text.slice(0, 150) + '...';
}

function displayError(container) {
    const listContainer = container.querySelector('#announcements-list');
    listContainer.innerHTML = '<p class="error-message">Error loading announcements. Please try again later.</p>';
}