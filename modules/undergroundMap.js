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

    console.log('Initializing Underground Map');
    const loadingIndicator = createLoadingIndicator(container);
    let map, layers, controls;

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
        .catch(error => {
            console.error('Error in main initialization chain:', error);
            handleGlobalError(error);
        });

        function loadTileLayers() {
            console.log('Starting to load tile layers');
            return new Promise((resolve, reject) => {
                const layerPromises = TILE_LAYERS.map(loadTileLayer);
                Promise.all(layerPromises)
                    .then(() => {
                        console.log('All tile layers loaded successfully');
                        resolve();
                    })
                    .catch(error => {
                        console.error('Error loading tile layers:', error);
                        reject(error);
                    });
            });
        }
    
        function loadTileLayer(layerName) {
            return new Promise((resolve, reject) => {
                console.log(`Loading tile layer: ${layerName}`);
                const defaultVisible = layerName === 'Base';
                const layer = createCustomOverlay(layerName, 'quarter', defaultVisible);
                
                const img = new Image();
                img.onload = () => {
                    console.log(`Image for ${layerName} loaded successfully`);
                    layers[layerName] = layer;
                    controls.addOverlay(layer, layerName);
                    if (defaultVisible) {
                        layer.addTo(map);
                    }
                    updateLoadingProgress();
                    resolve();
                };
                img.onerror = (error) => {
                    console.error(`Error loading image for ${layerName}:`, error);
                    reject(new Error(`Failed to load image for ${layerName}`));
                };
                img.src = `/images/underground_map/${layerName}_quarter.png`;
    
                setTimeout(() => {
                    if (!layers[layerName]) {
                        console.error(`Timeout while loading ${layerName} layer`);
                        reject(new Error(`Timeout while loading ${layerName} layer`));
                    }
                }, LOAD_TIMEOUT);
            });
        }

    function loadPinLayers() {
        console.log('Loading pin layers');
        return Promise.all(PIN_LAYERS.map(loadPinLayer));
    }

    function loadPinLayer(layerName, retryCount = 0) {
        return new Promise((resolve, reject) => {
            console.log(`Loading pin layer: ${layerName}`);
            const markerGroup = L.layerGroup();
            const defaultVisible = layerName === 'Vendors' || layerName === 'Entrances';

            fetch(`/data/${layerName.toLowerCase().replace(' ', '_')}.json`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    console.log(`${layerName} JSON fetched successfully`);
                    return response.json();
                })
                .then(data => {
                    console.log(`${layerName} JSON parsed successfully:`, data);
                    data.forEach(pin => {
                        console.log(`Adding pin to ${layerName}:`, pin);
                        addPinToLayer(pin, markerGroup, layerName);
                    });
                    layers[layerName] = markerGroup;
                    controls.addOverlay(markerGroup, layerName);
                    if (defaultVisible) {
                        markerGroup.addTo(map);
                    }
                    console.log(`${layerName} pin layer loaded successfully`);
                    updateLoadingProgress();
                    resolve();
                })
                .catch(error => {
                    console.error(`Error loading ${layerName} data:`, error);
                    if (retryCount < MAX_RETRIES) {
                        console.log(`Retrying ${layerName} data load, attempt ${retryCount + 1}`);
                        setTimeout(() => {
                            loadPinLayer(layerName, retryCount + 1).then(resolve).catch(reject);
                        }, RETRY_DELAY);
                    } else {
                        reject(new Error(`Failed to load ${layerName} data after ${MAX_RETRIES} attempts`));
                    }
                });
        });
    }

    function addPinToLayer(pin, markerGroup, layerName) {
        console.log(`Adding pin to layer ${layerName}:`, pin);
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
        
        markerGroup.addLayer(marker);
        console.log(`Pin added to layer ${layerName}:`, marker);
    }

    function finishMapInitialization() {
        console.log('Finishing map initialization');
        setupMapEventListeners();
        setupResizeHandling();
        addMapControls();
        removeLoadingIndicator();
        console.log('Map initialization complete');
    }

    function setupMapEventListeners() {
        map.on('zoomend', function() {
            console.log('Zoom ended, current zoom:', map.getZoom());
            updateImageResolution();
        });

        map.on('resize', updateImageResolution);
        updateImageResolution();
    }

    function setupResizeHandling() {
        const resizeMap = debounce(() => {
            console.log('Resizing map');
            const windowElement = container.closest('.window');
            if (windowElement) {
                const newSize = Math.min(windowElement.clientWidth, windowElement.clientHeight);
                container.style.width = `${newSize}px`;
                container.style.height = `${newSize}px`;
            }
            map.invalidateSize({ animate: false, pan: false });
            map.fitBounds(map.options.maxBounds);
            updateImageResolution();
            console.log('Map resized');
        }, 250);

        resizeMap();
        setTimeout(resizeMap, 100);

        window.addEventListener('resize', resizeMap);

        const windowElement = container.closest('.window');
        if (windowElement) {
            const observer = new ResizeObserver(debounce(() => {
                console.log('Window resized, updating map');
                resizeMap();
            }, 100));
            observer.observe(windowElement);
        }
    }

    function addMapControls() {
        L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    function handleGlobalError(error) {
        console.error('Fatal error in underground map initialization:', error);
        removeLoadingIndicator();
        showErrorMessage(container, 'Failed to load the underground map. Please try again later.');
    }

    function createCustomOverlay(layerName, initialResolution = 'quarter', defaultVisible = true) {
        console.log(`Creating custom overlay for ${layerName}`);
        const imageSrc = `/images/underground_map/${layerName}_${initialResolution}.png`;
        console.log(`Loading image from: ${imageSrc}`);

        const southWest = map.unproject([0, ORIGINAL_IMAGE_SIZE], MAX_ZOOM);
        const northEast = map.unproject([ORIGINAL_IMAGE_SIZE, 0], MAX_ZOOM);
        const bounds = new L.LatLngBounds(southWest, northEast);

        const overlay = L.imageOverlay(imageSrc, bounds, {
            opacity: layerName === 'Surface' ? 0.5 : 1,
            className: `underground-layer-${layerName.toLowerCase()}`
        });

        overlay.updateResolution = function(resolution) {
            const newSrc = `/images/underground_map/${layerName}_${resolution}.png`;
            console.log(`Updating ${layerName} to ${resolution} resolution`);
            this.setUrl(newSrc);
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