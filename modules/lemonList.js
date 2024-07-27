import { EventBus, debounce } from './utils.js';
import { createAppWindow } from './windowManagement.js';

const lemonListConfig = {
    title: 'Lemon List',
    width: '90%',
    height: '90%',
    content: '<div id="lemon-list-app"></div>',
};

let listings = [];
let currentPage = 1;
const itemsPerPage = 50;
const debounceTime = 300;

const emojiTooltips = {
    '🚓': 'Law Enforcement',
    '🚑': 'Los Santos Medical Group',
    '⚖️': 'Lawyer/Paralegal',
    '🏛️': 'Government Employee',
    '🎵': 'Musician/Producer',
    '🌽': 'Farmer',
    '💵': 'Loans',
    '🚗': 'Car Sales',
    '🧰': 'Impound/Tow',
    '🪑': 'Furniture Sales',
    '🔧': 'Mechanic',
    '🧺': 'Laundry',
    '🚕': 'Taxi'
};

export function initializeLemonList() {
    const window = createAppWindow(lemonListConfig);
    setupLemonListApp(window);
}

function setupLemonListApp(window) {
    const container = window.querySelector('#lemon-list-app');
    if (!container) return;

    container.innerHTML = createLemonListContent();
    styleWindow(window);
    loadCSV().then(() => {
        setupFilters(container);
        displayListings(container);
        setupEventListeners(container);
    });
}

function createLemonListContent() {
    return `
        <div class="search-filter-container">
            <input type="text" id="search-bar" placeholder="Search listings..." aria-label="Search listings">
            <div id="filter-checkboxes"></div>
            <button id="clear-filters">Reset</button>
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
    `;
}

function styleWindow(window) {
    window.style.left = '50%';
    window.style.top = '50%';
    window.style.transform = 'translate(-50%, -50%)';
    window.classList.add('lemon-list-window');
    
    const content = window.querySelector('#lemon-list-app');
    if (content) {
        content.style.backgroundImage = 'url("images/lemonlistbg.png")';
        content.style.backgroundSize = 'contain';
        content.style.backgroundRepeat = 'no-repeat';
        content.style.backgroundPosition = 'center';
        content.style.fontFamily = '"Nanum Gothic Coding", monospace';
        content.style.padding = '0';
        content.style.boxSizing = 'border-box';
        content.style.width = '100%';
        content.style.height = '100%';
    }
}

function loadCSV() {
    return fetch('data/vixenlemonlist.csv')
        .then(response => response.text())
        .then(data => {
            listings = Papa.parse(data, { 
                header: false,
                skipEmptyLines: true,
                transform: function(value) {
                    return value.replace(/ /g, '\u00A0');
                }
            }).data
                .map(row => ({ emoji: row[0], text: row[1] }))
                .filter(item => item.text && item.text.trim().length > 0);
            console.log('Listings loaded:', listings.length);
        })
        .catch(error => {
            console.error('Error loading CSV:', error);
        });
}

function setupFilters(container) {
    const filterContainer = container.querySelector('#filter-checkboxes');
    if (!filterContainer) return;

    const uniqueEmojis = [...new Set(listings.map(item => item.emoji))];
    uniqueEmojis.forEach(emoji => {
        if (emoji) {
            const filterItem = document.createElement('div');
            filterItem.className = 'filter-item';
            const tooltip = emojiTooltips[emoji] || '';
            filterItem.innerHTML = `
                <input type="checkbox" id="filter-${emoji}" value="${emoji}">
                <label for="filter-${emoji}" title="${tooltip}">${emoji}</label>
            `;
            filterContainer.appendChild(filterItem);
        }
    });
}

function displayListings(container) {
    const leftColumn = container.querySelector('#left-column');
    const rightColumn = container.querySelector('#right-column');
    if (!leftColumn || !rightColumn) return;

    const filteredListings = filterListings(container);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageListings = filteredListings.slice(startIndex, endIndex);

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

    updatePagination(container, filteredListings.length);
    adjustFontSize(container);
}

function filterListings(container) {
    const searchBar = container.querySelector('#search-bar');
    const searchTerm = searchBar ? searchBar.value.toLowerCase() : '';
    const activeFilters = Array.from(container.querySelectorAll('#filter-checkboxes input:checked'))
        .map(checkbox => checkbox.value);
    
    return listings.filter(listing => {
        const matchesSearch = listing.text.toLowerCase().includes(searchTerm);
        const matchesFilter = activeFilters.length === 0 || activeFilters.includes(listing.emoji);
        return matchesSearch && matchesFilter;
    });
}

function updatePagination(container, totalItems) {
    const pageIndicator = container.querySelector('#page-indicator');
    const prevButton = container.querySelector('#prev-page');
    const nextButton = container.querySelector('#next-page');

    if (!pageIndicator || !prevButton || !nextButton) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}

function adjustFontSize(container) {
    const column = container.querySelector('.listing-column');
    if (!column) return;

    const longestText = listings.reduce((longest, current) => 
        current.text.length > longest.length ? current.text : longest, '');

    const testListing = document.createElement('div');
    testListing.className = 'listing';
    testListing.innerHTML = `<span class="listing-text">${longestText}</span>`;
    column.appendChild(testListing);

    let fontSize = 20;
    testListing.style.fontSize = `${fontSize}px`;

    while ((testListing.scrollWidth > column.clientWidth || testListing.scrollHeight > testListing.clientHeight) && fontSize > 1) {
        fontSize -= 0.5;
        testListing.style.fontSize = `${fontSize}px`;
    }

    column.removeChild(testListing);

    container.querySelectorAll('.listing').forEach(el => {
        el.style.fontSize = `${(fontSize-0.5)}px`;
    });

    console.log('Adjusted font size:', fontSize, 'px');
}

function setupEventListeners(container) {
    const searchBar = container.querySelector('#search-bar');
    const filterCheckboxes = container.querySelector('#filter-checkboxes');
    const clearFiltersButton = container.querySelector('#clear-filters');
    const prevPageButton = container.querySelector('#prev-page');
    const nextPageButton = container.querySelector('#next-page');

    if (searchBar) {
        searchBar.addEventListener('input', debounce(() => {
            currentPage = 1;
            displayListings(container);
        }, debounceTime));
    }

    if (filterCheckboxes) {
        filterCheckboxes.addEventListener('change', () => {
            currentPage = 1;
            displayListings(container);
        });
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', () => {
            if (searchBar) searchBar.value = '';
            container.querySelectorAll('#filter-checkboxes input').forEach(checkbox => checkbox.checked = false);
            currentPage = 1;
            displayListings(container);
        });
    }

    if (prevPageButton) {
        prevPageButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayListings(container);
            }
        });
    }

    if (nextPageButton) {
        nextPageButton.addEventListener('click', () => {
            const totalItems = filterListings(container).length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayListings(container);
            }
        });
    }

    window.addEventListener('resize', debounce(() => {
        displayListings(container);
    }, 250));
}