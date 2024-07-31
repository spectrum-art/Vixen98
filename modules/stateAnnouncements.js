import { createAppWindow } from './windowManagement.js';
import { EventBus } from './utils.js';

const stateAnnouncementsConfig = {
    title: 'State Announcements',
    width: '50%',
    height: '70%',
    content: '<div id="state-announcements-app"></div>',
};

let announcements = [];

export function initializeStateAnnouncements() {
    const window = createAppWindow(stateAnnouncementsConfig);
    setupStateAnnouncementsApp(window);
}

function setupStateAnnouncementsApp(window) {
    const container = window.querySelector('#state-announcements-app');
    if (!container) return;
    
    container.innerHTML = createStateAnnouncementsHTML();
    loadAnnouncements(container);
}

function createStateAnnouncementsHTML() {
    return `
        <div class="announcements-container">
            <div id="announcements-list"></div>
            <button id="see-more-button">See more...</button>
        </div>
    `;
}

function loadAnnouncements(container) {
    fetch('/data/StateAnnouncements.txt')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, 'text/xml');
            const items = xmlDoc.querySelectorAll('item');
            
            announcements = Array.from(items).map(item => ({
                title: item.querySelector('title').textContent,
                date: new Date(item.querySelector('pubDate').textContent),
                link: item.querySelector('link').textContent,
                content: item.querySelector('content\\:encoded').textContent
            }));

            displayAnnouncements(container);
        })
        .catch(error => console.error('Error loading announcements:', error));
}

function displayAnnouncements(container) {
    const listContainer = container.querySelector('#announcements-list');
    listContainer.innerHTML = '';

    announcements.forEach(announcement => {
        const announcementElement = document.createElement('div');
        announcementElement.className = 'announcement';
        announcementElement.innerHTML = `
            <h3>${announcement.title}</h3>
            <p class="date">${announcement.date.toLocaleDateString()}</p>
            <p class="snippet">${getSnippet(announcement.content)}</p>
        `;
        listContainer.appendChild(announcementElement);
    });

    const seeMoreButton = container.querySelector('#see-more-button');
    seeMoreButton.addEventListener('click', () => {
        window.open('https://www.nopixel.net/upload/index.php?forums/city-hall.264/', '_blank');
    });
}

function getSnippet(content) {
    const div = document.createElement('div');
    div.innerHTML = content;
    const text = div.textContent || div.innerText || '';
    return text.slice(0, 150) + '...';
}