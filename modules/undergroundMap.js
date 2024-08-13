import { debounce } from './utils.js';

const TILE_LAYERS = ['Base', 'Surface'];
const PIN_LAYERS = ['Vendors', 'Entrances', 'Surface Labels'];
const MAX_ZOOM = 2;
const MIN_ZOOM = -1;
const ORIGINAL_IMAGE_SIZE = 6500;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const LOAD_TIMEOUT = 30000;

export function initialize(container, params = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        console.error('Invalid container provided to Underground Map initialize function');
        return;
    }

    const loadingIndicator = createLoadingIndicator(container);
    let map, layers, controls;
    const loadedLayers = new Set();

    initializeMap()
        .then(() => Promise.all([...TILE_LAYERS, ...PIN_LAYERS].map(layerName => loadLayer(layerName))))
        .then(finishMapInitialization)
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
                backgroundColor: '#000000'
            });

            layers = {};
            controls = L.control.layers(null, null, { position: 'topright' }).addTo(map);

            const mapSize = Math.min(container.clientWidth, container.clientHeight);
            const zoom = Math.log2(mapSize / 1625);
            map.setView([ORIGINAL_IMAGE_SIZE/2, ORIGINAL_IMAGE_SIZE/2], zoom);

            const southWest = map.unproject([0, ORIGINAL_IMAGE_SIZE], MAX_ZOOM);
            const northEast = map.unproject([ORIGINAL_IMAGE_SIZE, 0], MAX_ZOOM);
            const bounds = new L.LatLngBounds(southWest, northEast);

            map.setMaxBounds(bounds.pad(0.5));

            resolve();
        });
    }

    function loadLayer(layerName, retryCount = 0) {
        return new Promise((resolve, reject) => {
            const isTileLayer = TILE_LAYERS.includes(layerName);
            const layer = isTileLayer ? createTileLayer(layerName) : createPinLayer(layerName);
            
            const onLoad = () => {
                console.log(`${layerName} layer loaded successfully`);
                layers[layerName] = layer;
                if (!loadedLayers.has(layerName)) {
                    controls.addOverlay(layer, layerName);
                    loadedLayers.add(layerName);
                }
                if (layerName === 'Base' || layerName === 'Vendors' || layerName === 'Entrances') {
                    layer.addTo(map);
                }
                updateLoadingProgress();
                resolve(layer);
            };

            const onError = (error) => {
                console.error(`Error loading ${layerName} layer:`, error);
                if (retryCount < MAX_RETRIES) {
                    setTimeout(() => {
                        loadLayer(layerName, retryCount + 1).then(resolve).catch(reject);
                    }, RETRY_DELAY);
                } else {
                    reject(`Failed to load ${layerName} layer after ${MAX_RETRIES} attempts`);
                }
            };

            if (isTileLayer) {
                layer.on('load', onLoad);
                layer.on('error', onError);
            } else {
                fetchPinData(layerName)
                    .then(data => {
                        data.forEach(pin => addPinToLayer(pin, layer, layerName));
                        onLoad();
                    })
                    .catch(onError);
            }
        });
    }

    function createTileLayer(layerName) {
        const layer = L.imageOverlay(`/images/underground_map/${layerName}_quarter.png`, map.options.maxBounds, {
            opacity: layerName === 'Surface' ? 0.5 : 1,
            className: `underground-layer-${layerName.toLowerCase()}`
        });

        layer.updateResolution = function(resolution) {
            const newSrc = `/images/underground_map/${layerName}_${resolution}.png`;
            this.setUrl(newSrc);
        };

        return layer;
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
        map.on('zoomend', updateImageResolution);
        map.on('resize', updateImageResolution);
        updateImageResolution();
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
            
            const mapSize = Math.min(container.clientWidth, container.clientHeight);
            const zoom = Math.log2(mapSize / 1625);
            map.setView(map.getCenter(), zoom);
            
            updateImageResolution();
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
        L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    function updateImageResolution() {
        const zoom = map.getZoom();
        let resolution;
        if (zoom <= 0) {
            resolution = 'quarter';
        } else if (zoom <= 1) {
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
        removeLoadingIndicator();
        showErrorMessage(container, 'Failed to load the underground map. Please try again later.');
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

    function updateLoadingProgress() {
        const totalLayers = TILE_LAYERS.length + PIN_LAYERS.length;
        const loadedLayersCount = loadedLayers.size;
        const progress = (loadedLayersCount / totalLayers) * 100;
        const loadingText = loadingIndicator.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = `Loading map... ${Math.round(progress)}%`;
        }
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