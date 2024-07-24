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

        setupFilters();

        requestAnimationFrame(() => {
            adjustFontSize();
            calculateItemsPerPage();
            displayListings();
            setupEventListeners();
        });

        window.addEventListener('resize', debounce(() => {
            adjustFontSize();
            calculateItemsPerPage();
            displayListings();
        }, 250));
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
        
        let formattedText = `${lastName}, ${firstName} `;
        
        const hyphenCount = 60 - (formattedText.length + phoneNumber.length + 1);
        
        formattedText += '-'.repeat(hyphenCount) + ' ' + phoneNumber;

        return { emoji, text: formattedText };
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

    let listingHeight;
    const existingListing = column.querySelector('.listing');

    if (existingListing) {
        listingHeight = existingListing.offsetHeight;
    } else {
        // Create a temporary listing to measure height
        const tempListing = document.createElement('div');
        tempListing.className = 'listing';
        tempListing.innerHTML = '<span class="listing-text">Temporary</span>';
        tempListing.style.visibility = 'hidden';
        column.appendChild(tempListing);
        listingHeight = tempListing.offsetHeight;
        column.removeChild(tempListing);
    }

    const columnHeight = column.clientHeight;

    if (columnHeight > 0 && listingHeight > 0) {
        itemsPerPage = Math.floor(columnHeight / listingHeight) * 2; // Multiply by 2 for two columns
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
    testListing.innerHTML = '<span class="listing-text">' + 'X'.repeat(60) + '</span>';
    column.appendChild(testListing);

    let fontSize = 20; // Start with a larger font size
    testListing.style.fontSize = `${fontSize}px`;
    while (testListing.scrollWidth > column.clientWidth && fontSize > 1) {
        fontSize -= 0.5;
        testListing.style.fontSize = `${fontSize}px`;
    }
    
    // Set line-height based on font size
    const lineHeight = fontSize * 1.2; // Adjust the multiplier as needed

    column.removeChild(testListing);

    // Apply the calculated font size and line height to all listing elements
    content.querySelectorAll('.listing').forEach(el => {
        el.style.fontSize = `${fontSize}px`;
        el.style.lineHeight = `${lineHeight}px`;
        el.style.height = `${lineHeight}px`; // Ensure consistent height
    });

    // Also apply to emojis to maintain consistent sizing
    content.querySelectorAll('.listing-emoji').forEach(el => {
        el.style.fontSize = `${fontSize}px`;
        el.style.lineHeight = `${lineHeight}px`;
    });

    console.log('Column width:', column.clientWidth, 'Test listing width:', testListing.scrollWidth);
    console.log('Adjusted font size:', fontSize, 'px');
    console.log('Adjusted line height:', lineHeight, 'px');

    calculateItemsPerPage();
}

function displayListings() {
    const content = getWindowContent('Lemon List');
    if (!content) return;

    if (itemsPerPage === 0) {
        console.log('Items per page not calculated yet');
        calculateItemsPerPage();
        if (itemsPerPage === 0) {
            console.log('Failed to calculate items per page');
            return;
        }
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
    console.log('Displaying listings:', pageListings.length);
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