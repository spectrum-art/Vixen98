import { debounce } from './utils.js';

const TILE_LAYERS = ['Base', 'Surface'];
const PIN_LAYERS = ['Vendors', 'Entrances', 'Surface Labels'];
const MAX_ZOOM = 2;
const MIN_ZOOM = -1;
const ORIGINAL_IMAGE_SIZE = 6500;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const LOAD_TIMEOUT = 20000;

export function initialize(container, params = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        console.error('Invalid container provided to Underground Map initialize function');
        return;
    }

    console.log('Initializing Underground Map');
    const loadingIndicator = createLoadingIndicator(container);
    let map, layers, controls;

    try {
        initializeMap()
            .then(() => {
                console.log('Map initialized, loading tile layers');
                return loadTileLayers();
            })
            .then(() => {
                console.log('Tile layers loaded, loading pin layers');
                return loadPinLayers();
            })
            .then(() => {
                console.log('All layers loaded, finishing map initialization');
                finishMapInitialization();
            })
            .catch(handleGlobalError);
    } catch (error) {
        console.error('Uncaught error in main initialization chain:', error);
        handleGlobalError(error);
    }

    function loadTileLayers() {
        console.log('Starting to load tile layers');
        return Promise.all(TILE_LAYERS.map(loadTileLayer));
    }

    function loadTileLayer(layerName, retryCount = 0) {
        return new Promise((resolve, reject) => {
            console.log(`Loading tile layer: ${layerName}`);
            const defaultVisible = layerName === 'Base';
            const layer = createCustomOverlay(layerName, 'quarter', defaultVisible);
            
            layer.on('load', () => {
                console.log(`${layerName} layer loaded successfully`);
                layers[layerName] = layer;
                controls.addOverlay(layer, layerName);
                if (defaultVisible) {
                    layer.addTo(map);
                }
                updateLoadingProgress();
                resolve();
            });

            layer.on('error', (error) => {
                console.error(`Error loading ${layerName} layer:`, error);
                if (retryCount < MAX_RETRIES) {
                    console.log(`Retrying ${layerName} layer load, attempt ${retryCount + 1}`);
                    setTimeout(() => {
                        loadTileLayer(layerName, retryCount + 1).then(resolve).catch(reject);
                    }, RETRY_DELAY);
                } else {
                    reject(new Error(`Failed to load ${layerName} layer after ${MAX_RETRIES} attempts`));
                }
            });

            // Add a timeout for layer loading
            setTimeout(() => {
                if (!layers[layerName]) {
                    console.error(`Timeout while loading ${layerName} layer`);
                    reject(new Error(`Timeout while loading ${layerName} layer`));
                }
            }, LOAD_TIMEOUT);
        });
    }

    function createCustomOverlay(layerName, initialResolution = 'quarter', defaultVisible = true) {
        console.log(`Creating custom overlay for ${layerName}`);
        const img = new Image();
        const imageSrc = `/images/underground_map/${layerName}_${initialResolution}.png`;
        console.log(`Loading image from: ${imageSrc}`);
        img.src = imageSrc;
        img.className = `underground-layer-${layerName.toLowerCase()}`;
        
        img.onload = () => console.log(`Image for ${layerName} loaded successfully`);
        img.onerror = (error) => console.error(`Error loading image for ${layerName}:`, error);

        const southWest = map.unproject([0, ORIGINAL_IMAGE_SIZE], MAX_ZOOM);
        const northEast = map.unproject([ORIGINAL_IMAGE_SIZE, 0], MAX_ZOOM);
        const bounds = new L.LatLngBounds(southWest, northEast);

        const overlay = L.imageOverlay(img.src, bounds, {
            opacity: layerName === 'Surface' ? 0.5 : 1,
            className: `underground-layer-${layerName.toLowerCase()}`
        });

        overlay.updateResolution = function(resolution) {
            const newSrc = `/images/underground_map/${layerName}_${resolution}.png`;
            if (img.src !== newSrc) {
                console.log(`Updating ${layerName} to ${resolution} resolution`);
                img.src = newSrc;
                this.setUrl(newSrc);
            }
        };

        console.log(`Custom overlay created for ${layerName}`);
        return overlay;
    }

    function updateImageResolution() {
        const zoom = map.getZoom();
        const size = map.getSize();
        const maxSize = Math.max(size.x, size.y);
        
        console.log(`Current zoom: ${zoom}, Map size: ${size.x}x${size.y}, Max size: ${maxSize}`);

        let resolution;
        if (zoom <= 0) {
            resolution = 'quarter';
        } else if (zoom === 1) {
            resolution = 'half';
        } else {
            resolution = 'full';
        }

        console.log(`Selected resolution: ${resolution}`);

        TILE_LAYERS.forEach(layerName => {
            if (layers[layerName] && layers[layerName].updateResolution) {
                layers[layerName].updateResolution(resolution);
            }
        });
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
        const loadedLayers = Object.keys(layers).length;
        const progress = (loadedLayers / totalLayers) * 100;
        const loadingText = loadingIndicator.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = `Loading map... ${Math.round(progress)}%`;
        }
        console.log(`Loading progress: ${Math.round(progress)}%`);
    }

    function removeLoadingIndicator() {
        if (container.contains(loadingIndicator)) {
            container.removeChild(loadingIndicator);
        }
    }

    function showErrorMessage(container, message) {
        console.error('Showing error message:', message);
        const errorElement = document.createElement('div');
        errorElement.className = 'map-error-message';
        errorElement.textContent = message;
        container.appendChild(errorElement);
    }

    const loadTimeout = setTimeout(() => {
        if (container.contains(loadingIndicator)) {
            console.error('Map loading timed out');
            handleGlobalError(new Error('Map loading timed out'));
        }
    }, LOAD_TIMEOUT);

    window.addEventListener('beforeunload', () => {
        clearTimeout(loadTimeout);
    });
}