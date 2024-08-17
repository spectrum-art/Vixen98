import { debounce } from './utils.js';

const TILE_LAYERS = ['Base', 'Surface'];
const PIN_LAYERS = ['Vendors', 'Entrances', 'Surface Labels'];
const MAX_ZOOM = 2;
const MIN_ZOOM = -1;
const ORIGINAL_IMAGE_SIZE = 6500;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const LOAD_TIMEOUT = 90000;

let map, layers, controls;
let loadingIndicator;

export function initialize(container, params = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        console.error('Invalid container provided to Underground Map initialize function');
        return Promise.reject(new Error('Invalid container'));
    }

    console.log('Initializing Underground Map');
    loadingIndicator = createLoadingIndicator(container);

    return preloadImages()
        .then(() => initializeMap(container))
        .then(() => {
            console.log('Map initialized, loading tile layers');
            return loadTileLayers(container);
        })
        .then(() => {
            console.log('Tile layers loaded, loading pin layers');
            return loadPinLayers();
        })
        .then(() => {
            console.log('All layers loaded, finishing map initialization');
            finishMapInitialization(container);
            return { map, layers, controls };
        })
        .catch(error => {
            console.error('Error in main initialization chain:', error);
            showErrorMessage(container, 'Failed to load the underground map. Please check your internet connection and try again.');
            throw error;
        });
}

function preloadImages() {
    return Promise.all(TILE_LAYERS.map(layerName => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = `/images/underground_map/${layerName}_quarter.png`;
        });
    }));
}

function initializeMap(container) {
    return new Promise((resolve) => {
        console.log('Creating Leaflet map');
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
            backgroundColor: '#FF0000',
            attributionControl: false
        });

        layers = {};
        controls = L.control.layers(null, null, { position: 'topright' }).addTo(map);

        const southWest = map.unproject([0, ORIGINAL_IMAGE_SIZE], MAX_ZOOM);
        const northEast = map.unproject([ORIGINAL_IMAGE_SIZE, 0], MAX_ZOOM);
        const bounds = new L.LatLngBounds(southWest, northEast);

        map.fitBounds(bounds);
        map.setMaxBounds(bounds.pad(0.5));

        console.log('Map initialized with bounds:', bounds.toString());
        resolve();
    });
}

function loadTileLayers(container) {
    console.log('Starting to load tile layers');
    return loadTileLayer(container, 'Base')
        .then((baseLayer) => {
            console.log('Base layer loaded successfully');
            addLayerToMap(baseLayer, 'Base');
            return loadTileLayer(container, 'Surface').then(surfaceLayer => {
                addLayerToMap(surfaceLayer, 'Surface');
                console.log('Surface layer loaded successfully');
                return [baseLayer, surfaceLayer];
            });
        })
        .then(() => {
            console.log('Tile layers loaded');
        })
        .catch(error => {
            console.error('Failed to load tile layers:', error);
            throw error;
        });
}

function loadTileLayer(container, layerName, retryCount = 0) {
    return new Promise((resolve, reject) => {
        console.log(`Loading tile layer: ${layerName} (Attempt ${retryCount + 1})`);
        const defaultVisible = layerName === 'Base';
        const layer = createCustomOverlay(container, layerName, 'quarter', defaultVisible);
        
        layer.on('load', () => {
            console.log(`${layerName} layer loaded successfully`);
            layers[layerName] = layer;
            controls.addOverlay(layer, layerName);
            updateLoadingProgress();
            resolve(layer);
        });

        layer.on('error', (error) => {
            console.error(`Error loading ${layerName} layer:`, error);
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying ${layerName} layer load (Attempt ${retryCount + 2})`);
                setTimeout(() => {
                    loadTileLayer(container, layerName, retryCount + 1).then(resolve).catch(reject);
                }, RETRY_DELAY);
            } else {
                reject(new Error(`Failed to load ${layerName} layer after ${MAX_RETRIES + 1} attempts`));
            }
        });

        if (defaultVisible) {
            layer.addTo(map);
        }

        setTimeout(() => {
            if (!layers[layerName]) {
                console.error(`Timeout while loading ${layerName} layer`);
                if (retryCount < MAX_RETRIES) {
                    console.log(`Retrying ${layerName} layer load due to timeout (Attempt ${retryCount + 2})`);
                    loadTileLayer(container, layerName, retryCount + 1).then(resolve).catch(reject);
                } else {
                    reject(new Error(`Timeout while loading ${layerName} layer after ${MAX_RETRIES + 1} attempts`));
                }
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

function finishMapInitialization(container) {
    console.log('Finishing map initialization');
    setupMapEventListeners();
    setupResizeHandling(container);
    addMapControls();
    removeLoadingIndicator();
    map.invalidateSize();
    map.fitBounds(map.getBounds());

    setTimeout(() => {
        map.invalidateSize();
        TILE_LAYERS.forEach(layerName => {
            if (layers[layerName]) {
                layers[layerName].bringToFront();
            }
        });
    }, 100);

    setTimeout(() => {
        checkLayerVisibility();
        debugLayerBounds();
        addDebugRectangle();
    }, 2000);

    setTimeout(() => {
        console.log('Underground layer CSS (Base):', getComputedStyle(container.querySelector('.underground-layer-base')));
        console.log('Underground layer CSS (Surface):', getComputedStyle(container.querySelector('.underground-layer-surface')));
    }, 1000);

    console.log('Map initialization complete');
}

function setupMapEventListeners() {
    map.on('zoomend', function() {
        console.log('Zoom ended, current zoom:', map.getZoom());
        updateImageResolution();
    });

    map.on('moveend', function() {
        const center = map.getCenter();
        const bounds = map.getBounds();
        console.log(`Map moved. Center: (${center.lat}, ${center.lng}), Bounds: SW(${bounds.getSouthWest().lat}, ${bounds.getSouthWest().lng}), NE(${bounds.getNorthEast().lat}, ${bounds.getNorthEast().lng})`);
    });

    map.on('layeradd', function(e) {
        console.log(`Layer added: ${e.layer.options.className}`);
    });

    map.on('layerremove', function(e) {
        console.log(`Layer removed: ${e.layer.options.className}`);
    });

    map.on('resize', updateImageResolution);
    updateImageResolution();
}

function setupResizeHandling(container) {
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

function createCustomOverlay(container, layerName, initialResolution = 'quarter', defaultVisible = true) {
    console.log(`Creating custom overlay for ${layerName}`);
    const imageSrc = `/images/underground_map/${layerName}_${initialResolution}.png`;
    console.log(`Full image URL: ${window.location.origin}${imageSrc}`);

    const CustomGridLayer = L.GridLayer.extend({
        createTile: function(coords) {
            const tile = L.DomUtil.create('img', `underground-layer-${layerName.toLowerCase()} visible-image`);
            tile.src = imageSrc;
            tile.style.width = `${ORIGINAL_IMAGE_SIZE}px`;
            tile.style.height = `${ORIGINAL_IMAGE_SIZE}px`;
            return tile;
        }
    });

    const overlay = new CustomGridLayer({
        tileSize: L.point(ORIGINAL_IMAGE_SIZE, ORIGINAL_IMAGE_SIZE),
        opacity: layerName === 'Surface' ? 0.5 : 1,
        zIndex: layerName === 'Base' ? 10 : 20,
    });

    overlay.on('loading', function() {
        console.log(`${layerName} overlay loading`);
    });

    overlay.on('load', function() {
        console.log(`${layerName} overlay loaded`);
    });

    overlay.updateResolution = function(resolution) {
        const newSrc = `/images/underground_map/${layerName}_${resolution}.png`;
        console.log(`Updating ${layerName} to ${resolution} resolution: ${newSrc}`);
        this.options.tileUrl = newSrc;
        this.redraw();
    };

    console.log(`Custom overlay created for ${layerName}`);
    
    return overlay;
}

function addLayerToMap(layer, layerName) {
    layer.addTo(map);
    console.log(`${layerName} layer added to map`);
    console.log(`${layerName} layer visibility:`, map.hasLayer(layer));
    console.log(`${layerName} layer bounds:`, layer.getBounds().toString());
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
            if (layers[layerName].options.tileUrl !== `/images/underground_map/${layerName}_${resolution}.png`) {
                layers[layerName].updateResolution(resolution);
                console.log(`Updated ${layerName} to ${resolution} resolution`);
            }
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
    if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
    }
}

function showErrorMessage(container, message) {
    console.error('Showing error message:', message);
    const errorElement = document.createElement('div');
    errorElement.className = 'map-error-message';
    errorElement.textContent = message;
    container.appendChild(errorElement);
}

function checkLayerVisibility() {
    TILE_LAYERS.forEach(layerName => {
        if (layers[layerName]) {
            console.log(`${layerName} layer visibility:`, map.hasLayer(layers[layerName]));
            console.log(`${layerName} layer opacity:`, layers[layerName].options.opacity);
            console.log(`${layerName} layer z-index:`, layers[layerName].options.zIndex);
        } else {
            console.log(`${layerName} layer not found in layers object`);
        }
    });
}

function debugLayerBounds() {
    TILE_LAYERS.forEach(layerName => {
        if (layers[layerName]) {
            const bounds = layers[layerName].getBounds();
            console.log(`${layerName} layer bounds:`, bounds.toString());
            console.log(`${layerName} layer bounds in pixels:`, {
                SW: map.project(bounds.getSouthWest(), map.getZoom()),
                NE: map.project(bounds.getNorthEast(), map.getZoom())
            });
        }
    });
}

function addDebugRectangle() {
    const bounds = map.getBounds();
    const rectangle = L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(map);
    console.log('Debug rectangle added with bounds:', bounds.toString());
}