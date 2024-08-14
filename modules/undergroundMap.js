import { debounce } from './utils.js';

const TILE_LAYERS = ['Base', 'Surface'];
const PIN_LAYERS = ['Vendors', 'Entrances', 'Surface Labels'];
const MAX_ZOOM = 2;
const MIN_ZOOM = -2;
const ORIGINAL_IMAGE_SIZE = 6500;

let map, layers, controls;

export function initialize(container, params = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        console.error('Invalid container provided to Underground Map initialize function');
        return;
    }

    const loadingIndicator = createLoadingIndicator(container);

    initializeMap(container)
        .then(() => loadAllLayers())
        .then(() => {
            finishMapInitialization();
            removeLoadingIndicator(container, loadingIndicator);
        })
        .catch(handleGlobalError);
}

function initializeMap(container) {
    return new Promise((resolve) => {
        map = L.map(container, {
            crs: L.CRS.Simple,
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            zoomSnap: 0.25,
            zoomDelta: 0.25,
            wheelPxPerZoomLevel: 120,
            zoomAnimation: true,
            markerZoomAnimation: true,
            preferCanvas: true,
            attributionControl: false,
            backgroundColor: '#000000',
            zoomControl: false
        });

        layers = {};
        controls = L.control.layers(null, null, { position: 'topright' }).addTo(map);

        const southWest = map.unproject([0, ORIGINAL_IMAGE_SIZE], MAX_ZOOM);
        const northEast = map.unproject([ORIGINAL_IMAGE_SIZE, 0], MAX_ZOOM);
        const bounds = new L.LatLngBounds(southWest, northEast);

        map.fitBounds(bounds);
        map.setMaxBounds(bounds.pad(0.5));

        // Ensure the map is properly sized
        map.invalidateSize();

        resolve();
    });
}

function loadAllLayers() {
    return Promise.all([...TILE_LAYERS, ...PIN_LAYERS].map(layerName => loadLayer(layerName)));
}

function loadLayer(layerName) {
    return new Promise((resolve, reject) => {
        const isTileLayer = TILE_LAYERS.includes(layerName);
        const layer = isTileLayer ? createTileLayer(layerName) : createPinLayer(layerName);

        layers[layerName] = layer;
        controls.addOverlay(layer, layerName);

        if (isTileLayer) {
            layer.on('load', () => {
                console.log(`${layerName} layer loaded successfully`);
                if (layerName === 'Base') {
                    layer.addTo(map);
                }
                resolve(layer);
            });
            layer.on('error', (error) => {
                console.error(`Error loading ${layerName} layer:`, error);
                reject(error);
            });
        } else {
            fetchPinData(layerName)
                .then(data => {
                    data.forEach(pin => addPinToLayer(pin, layer, layerName));
                    if (layerName === 'Vendors' || layerName === 'Entrances') {
                        layer.addTo(map);
                    }
                    resolve(layer);
                })
                .catch(reject);
        }
    });
}

function createTileLayer(layerName) {
    const imageUrl = `/images/underground_map/${layerName}_quarter.png`;
    return L.imageOverlay(imageUrl, [[0, 0], [ORIGINAL_IMAGE_SIZE, ORIGINAL_IMAGE_SIZE]], {
        opacity: layerName === 'Surface' ? 0.5 : 1,
        className: `underground-layer-${layerName.toLowerCase()}`
    });
}

function createPinLayer(layerName) {
    return L.layerGroup();
}

function fetchPinData(layerName) {
    return fetch(`/data/${layerName.toLowerCase().replace(' ', '_')}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
}

function addPinToLayer(pin, layer, layerName) {
    const latlng = map.unproject([pin.x, pin.y], MAX_ZOOM);
    const marker = L.marker(latlng, {
        icon: L.divIcon({
            html: pin.icon,
            className: 'map-pin',
            iconSize: [20, 20]
        })
    });
    
    if (layerName === 'Vendors' || layerName === 'Entrances') {
        const labelDirection = pin.x > ORIGINAL_IMAGE_SIZE / 2 ? 'right' : 'left';
        const labelOffset = labelDirection === 'right' ? [10, 0] : [-10, 0];
        
        marker.bindTooltip(pin.label, {
            permanent: true,
            direction: labelDirection,
            offset: labelOffset,
            className: 'underground-map-label'
        });
    }
    
    layer.addLayer(marker);
}

function finishMapInitialization() {
    setupMapEventListeners();
    setupResizeHandling();
    addMapControls();
}

function setupMapEventListeners() {
    map.on('zoomend', updateImageResolution);
    map.on('resize', updateImageResolution);
    updateImageResolution();
}

function setupResizeHandling() {
    const resizeMap = debounce(() => {
        const windowElement = map.getContainer().closest('.window');
        if (windowElement) {
            const newSize = Math.min(windowElement.clientWidth, windowElement.clientHeight);
            map.getContainer().style.width = `${newSize}px`;
            map.getContainer().style.height = `${newSize}px`;
        }
        map.invalidateSize({ animate: false, pan: false });
        map.fitBounds(map.options.maxBounds);
        updateImageResolution();
    }, 250);

    resizeMap();
    window.addEventListener('resize', resizeMap);

    const windowElement = map.getContainer().closest('.window');
    if (windowElement) {
        const observer = new ResizeObserver(resizeMap);
        observer.observe(windowElement);
    }
}

function addMapControls() {
    L.control.zoom({ position: 'topleft' }).addTo(map);
}

function updateImageResolution() {
    const zoom = map.getZoom();
    let resolution;
    if (zoom <= 0) {
        resolution = 'quarter';
    } else if (zoom < 1.5) {
        resolution = 'half';
    } else {
        resolution = 'full';
    }

    Object.values(layers).forEach(layer => {
        if (layer.updateResolution) {
            layer.updateResolution(resolution);
        }
    });
}

function handleGlobalError(error) {
    console.error('Fatal error in underground map initialization:', error);
    console.error('Stack trace:', error.stack);
    showErrorMessage(map.getContainer(), `Failed to load the underground map: ${error.message}. Please try again later.`);
}

function createLoadingIndicator(container) {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'map-loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading map... 0%</div>
    `;
    container.appendChild(loadingIndicator);
    return loadingIndicator;
}

function removeLoadingIndicator(container, loadingIndicator) {
    if (container.contains(loadingIndicator)) {
        container.removeChild(loadingIndicator);
    }
}

function showErrorMessage(container, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'map-error-message';
    errorElement.textContent = message;
    container.appendChild(errorElement);
}