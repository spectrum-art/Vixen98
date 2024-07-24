import { EventBus, debounce } from './utils.js';
import { getWindowContent } from './windowManagement.js';

let listings = [];
let currentPage = 1;
let itemsPerPage = 0;
const debounceTime = 300;

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
    content.style.backgroundImage = 'url("images/lemonlistbg.png")';
    content.style.backgroundSize = 'auto 100%';
    content.style.backgroundRepeat = 'no-repeat';
    content.style.backgroundPosition = 'center';
    content.style.fontFamily = '"Nanum Gothic Coding", monospace';

    const window = content.closest('.window');
    window.style.width = 'auto';
    window.style.height = '90%';
    window.style.left = '50%';
    window.style.top = '50%';
    window.style.transform = 'translate(-50%, -50%)';
    window.classList.add('lemon-list-window');

    const img = new Image();
    img.onload = function() {
        const aspectRatio = this.width / this.height;
        const windowHeight = window.offsetHeight;
        const newWidth = windowHeight * aspectRatio;
        window.style.width = `${newWidth}px`;
        window.style.transform = 'translate(-50%, -50%)';
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                initializeLemonListContent();
            });
        });
    }
    img.src = 'images/lemonlistbg.png';
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

function initializeLemonListContent() {
    loadCSV().then(() => {
        const content = getWindowContent('Lemon List');
        if (!content) return;

        content.querySelector('#loading-indicator').style.display = 'none';
        content.querySelector('#lemon-list-app').style.display = 'block';

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

function loadCSV() {
    return new Promise((resolve, reject) => {
        console.log('Starting to load CSV');
        fetch('data/vixenlemonlist.csv')
            .then(response => {
                console.log('CSV fetched, starting to parse');
                return response.text();
            })
            .then(data => {
                console.log('CSV parsed, processing data');
                Papa.parse(data, {
                    complete: (results) => {
                        listings = parseListings(results.data);
                        console.log('Listings processed:', listings.length);
                        setupFilters();
                        resolve();
                    },
                    error: (error) => {
                        console.error('Error parsing CSV:', error);
                        reject(error);
                    }
                });
            })
            .catch(error => {
                console.error('Error loading CSV:', error);
                const content = getWindowContent('Lemon List');
                if (content) {
                    content.querySelector('#loading-indicator').textContent = 'Error loading data';
                }
                reject(error);
            });
    });
}

function parseListings(data) {
    return data.map(row => {
        let [emoji, lastName, firstName, phoneNumber] = row;
        
        if (!/^\p{Emoji}/u.test(emoji)) {
            [lastName, firstName, phoneNumber] = [emoji, lastName, firstName];
            emoji = '';
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

        return { emoji, text };
    }).filter(item => item.text.length > 0);
}

function setupFilters() {
    const content = getWindowContent('Lemon List');
    if (!content) return;

    const filterContainer = content.querySelector('#filter-checkboxes');
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
    const content = getWindowContent('Lemon List');
    if (!content) return;

    const column = content.querySelector('.listing-column');
    if (!column) return;

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
    const content = getWindowContent('Lemon List');
    if (!content) return;

    const column = content.querySelector('.listing-column');
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
    content.querySelectorAll('.listing-text').forEach(el => {
        el.style.fontSize = `${fontSize}px`;
    });

    console.log('Adjusted font size:', fontSize, 'px');

    calculateItemsPerPage();
}

function displayListings() {
    const content = getWindowContent('Lemon List');
    if (!content) return;

    if (itemsPerPage === 0) {
        console.log('Items per page not calculated yet');
        return;
    }
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
}

function filterListings() {
    const content = getWindowContent('Lemon List');
    if (!content) return [];

    const searchTerm = content.querySelector('#search-bar').value.toLowerCase();
    const activeFilters = Array.from(content.querySelectorAll('#filter-checkboxes input:checked'))
        .map(checkbox => checkbox.value);
    return listings.filter(listing => {
        const matchesSearch = listing.text.toLowerCase().includes(searchTerm);
        const matchesFilter = activeFilters.length === 0 || activeFilters.includes(listing.emoji);
        return matchesSearch && matchesFilter;
    });
}

function updatePagination(totalItems) {
    const content = getWindowContent('Lemon List');
    if (!content) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    content.querySelector('#page-indicator').textContent = `Page ${currentPage} of ${totalPages}`;
    content.querySelector('#prev-page').disabled = currentPage === 1;
    content.querySelector('#next-page').disabled = currentPage === totalPages;
}

function setupEventListeners() {
    const content = getWindowContent('Lemon List');
    if (!content) return;

    content.querySelector('#search-bar').addEventListener('input', debounce(() => {
        currentPage = 1;
        displayListings();
    }, debounceTime));

    content.querySelector('#filter-checkboxes').addEventListener('change', () => {
        currentPage = 1;
        displayListings();
    });

    content.querySelector('#clear-filters').addEventListener('click', () => {
        content.querySelector('#search-bar').value = '';
        content.querySelectorAll('#filter-checkboxes input').forEach(checkbox => checkbox.checked = false);
        currentPage = 1;
        displayListings();
    });

    content.querySelector('#prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayListings();
        }
    });

    content.querySelector('#next-page').addEventListener('click', () => {
        const totalItems = filterListings().length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayListings();
        }
    });
}