import { EventBus, debounce } from './utils.js';
import { getWindowContent } from './windowManagement.js';

let listings = [];
let currentPage = 1;
const itemsPerPage = 60;
const debounceTime = 300;

export function initializeLemonList() {
    EventBus.subscribe('windowOpened', (appName) => {
        if (appName === 'Lemon List') {
            setupLemonListApp();
        }
    });
}

function setupLemonListApp() {
    const content = getWindowContent('Lemon List');
    if (!content) return;

    content.innerHTML = createLemonListContent();
    styleWindow(content);
    loadCSV().then(() => {
        setupFilters();
        displayListings();
        setupEventListeners();
    });
}

function createLemonListContent() {
    return `
        <div id="lemon-list-app">
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

function styleWindow(content) {
    const window = content.closest('.window');
    window.style.width = '90%';
    window.style.height = '90%';
    window.style.left = '5%';
    window.style.top = '5%';
    window.classList.add('lemon-list-window');
    
    content.style.backgroundImage = 'url("images/lemonlistbg.png")';
    content.style.backgroundSize = 'cover';
    content.style.backgroundRepeat = 'no-repeat';
    content.style.backgroundPosition = 'center';
    content.style.fontFamily = '"Nanum Gothic Coding", monospace';
}

function loadCSV() {
    return fetch('data/vixenlemonlist.csv')
        .then(response => response.text())
        .then(data => {
            listings = Papa.parse(data, { header: false }).data
                .map(row => ({ emoji: row[0], text: row[1] }))
                .filter(item => item.text && item.text.trim().length > 0);
            console.log('Listings loaded:', listings.length);
        })
        .catch(error => {
            console.error('Error loading CSV:', error);
            getWindowContent('Lemon List').innerHTML = 'Error loading data';
        });
}

function setupFilters() {
    const filterContainer = document.getElementById('filter-checkboxes');
    const uniqueEmojis = [...new Set(listings.map(item => item.emoji))];
    uniqueEmojis.forEach(emoji => {
        if (emoji) {
            const filterItem = document.createElement('div');
            filterItem.className = 'filter-item';
            filterItem.innerHTML = `
                <input type="checkbox" id="filter-${emoji}" value="${emoji}">
                <label for="filter-${emoji}">${emoji}</label>
            `;
            filterContainer.appendChild(filterItem);
        }
    });
}

function displayListings() {
    const content = getWindowContent('Lemon List');
    if (!content) return;

    const filteredListings = filterListings();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageListings = filteredListings.slice(startIndex, endIndex);

    const leftColumn = content.querySelector('#left-column');
    const rightColumn = content.querySelector('#right-column');
    leftColumn.innerHTML = '';
    rightColumn.innerHTML = '';

    pageListings.forEach((listing, index) => {
        const listingElement = document.createElement('div');
        listingElement.className = 'listing';
        listingElement.innerHTML = `
            <span class="listing-emoji">${listing.emoji || ''}</span>
            <span class="listing-text">${listing.text}</span>
        `;
        if (index < itemsPerPage / 2) {
            leftColumn.appendChild(listingElement);
        } else {
            rightColumn.appendChild(listingElement);
        }
    });

    updatePagination(filteredListings.length);
    adjustFontSize();
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

function adjustFontSize() {
    const content = getWindowContent('Lemon List');
    if (!content) return;

    const column = content.querySelector('.listing-column');
    if (!column) return;

    const testListing = document.createElement('div');
    testListing.className = 'listing';
    testListing.innerHTML = '<span class="listing-text">X'.repeat(60) + '</span>';
    column.appendChild(testListing);

    let fontSize = 20; // Start with a larger font size
    testListing.style.fontSize = `${fontSize}px`;
    while (testListing.scrollWidth > column.clientWidth && fontSize > 1) {
        fontSize -= 0.5;
        testListing.style.fontSize = `${fontSize}px`;
    }

    column.removeChild(testListing);

    content.querySelectorAll('.listing').forEach(el => {
        el.style.fontSize = `${fontSize}px`;
    });

    console.log('Adjusted font size:', fontSize, 'px');
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
        displayListings();
    }, 250));
}