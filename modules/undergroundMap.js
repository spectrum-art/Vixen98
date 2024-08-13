import { debounce } from './utils.js';

const TILE_LAYERS = ['Base', 'Surface'];
const PIN_LAYERS = ['Vendors', 'Entrances', 'Surface Labels'];
const MAX_ZOOM = 2;
const MIN_ZOOM = -2;
const ORIGINAL_IMAGE_SIZE = 6500;
const LOAD_TIMEOUT = 30000;

export function initialize(container, params = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        console.error('Invalid container provided to Underground Map initialize function');
        return;
    }

    const loadingIndicator = createLoadingIndicator(container);
    let map, layers, controls;

    initializeMap()
        .then(() => {
            const layerPromises = [...TILE_LAYERS, ...PIN_LAYERS].map(layerName => loadLayer(layerName));
            return Promise.all(layerPromises);
        })
        .then(() => {
            console.log('All layers loaded successfully');
            finishMapInitialization();
        })
        .catch(handleGlobalError);

    function initializeMap() {
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

            resolve();
        });
    }

    function loadLayer(layerName) {
        return new Promise((resolve, reject) => {
            const isTileLayer = TILE_LAYERS.includes(layerName);
            
            if (isTileLayer) {
                const imageUrl = `/images/underground_map/${layerName}_quarter.png`;
                preloadImage(imageUrl)
                    .then(() => {
                        const layer = createTileLayer(layerName);
                        layers[layerName] = layer;
                        controls.addOverlay(layer, layerName);
                        if (layerName === 'Base') {
                            layer.addTo(map);
                        }
                        console.log(`${layerName} layer loaded successfully`);
                        resolve(layer);
                    })
                    .catch(error => {
                        console.error(`Error preloading ${layerName} layer:`, error);
                        reject(error);
                    });
            } else {
                const layer = createPinLayer(layerName);
                fetchPinData(layerName)
                    .then(data => {
                        data.forEach(pin => addPinToLayer(pin, layer, layerName));
                        layers[layerName] = layer;
                        controls.addOverlay(layer, layerName);
                        if (layerName === 'Vendors' || layerName === 'Entrances') {
                            layer.addTo(map);
                        }
                        resolve(layer);
                    })
                    .catch(reject);
            }
        });
    }

    function preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
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
        removeLoadingIndicator();
    }

    function setupMapEventListeners() {
        // Commented out for troubleshooting
        // map.on('zoomend', updateImageResolution);
        // map.on('resize', updateImageResolution);
        // updateImageResolution();
    }

    function setupResizeHandling() {
        const resizeMap = debounce(() => {
            const windowElement = container.closest('.window');
            if (windowElement) {
                const newSize = Math.min(windowElement.clientWidth, windowElement.clientHeight);
                container.style.width = `${newSize}px`;
                container.style.height = `${newSize}px`;
            }
            map.invalidateSize({ animate: false, pan: false });
            map.fitBounds(map.options.maxBounds);
            // Commented out for troubleshooting
            // updateImageResolution();
        }, 250);

        resizeMap();
        window.addEventListener('resize', resizeMap);

        const windowElement = container.closest('.window');
        if (windowElement) {
            const observer = new ResizeObserver(resizeMap);
            observer.observe(windowElement);
        }
    }

    function addMapControls() {
        L.control.zoom({ position: 'topleft' }).addTo(map);
    }

    function handleGlobalError(error) {
        console.error('Fatal error in underground map initialization:', error);
        console.error('Stack trace:', error.stack);
        removeLoadingIndicator();
        showErrorMessage(container, `Failed to load the underground map: ${error.message}. Please try again later.`);
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

    function removeLoadingIndicator() {
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

    setTimeout(() => {
        if (container.contains(loadingIndicator)) {
            handleGlobalError('Map loading timed out');
        }
    }, LOAD_TIMEOUT);
}