import { debounce } from './utils.js';

const TILE_LAYERS = ['Base', 'Surface'];
const PIN_LAYERS = ['Vendors', 'Entrances', 'Surface Labels'];
const MAX_ZOOM = 2;
const MIN_ZOOM = -1;
const ORIGINAL_IMAGE_SIZE = 6500;

export function initialize(container, params = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        console.error('Invalid container provided to Underground Map initialize function');
        return;
    }

    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'map-loading-indicator';
    loadingIndicator.textContent = 'Loading map...';
    container.appendChild(loadingIndicator);

    container.style.width = '100%';
    container.style.height = '100%';

    const map = L.map(container, {
        crs: L.CRS.Simple,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        zoomSnap: 0.25,
        zoomDelta: 0.25,
        wheelPxPerZoomLevel: 120,
        zoomAnimation: true,
        markerZoomAnimation: true,
        preferCanvas: true,
        attributionControl: false
    });

    const layers = {};
    const controls = L.control.layers(null, null, { position: 'topright' }).addTo(map);

    const southWest = map.unproject([0, ORIGINAL_IMAGE_SIZE], MAX_ZOOM);
    const northEast = map.unproject([ORIGINAL_IMAGE_SIZE, 0], MAX_ZOOM);
    const bounds = new L.LatLngBounds(southWest, northEast);

    function createCustomOverlay(layerName, initialResolution = 'quarter') {
        const img = new Image();
        img.src = `/images/${layerName}_${initialResolution}.png`;
        img.className = `underground-layer-${layerName.toLowerCase()}`;
        
        const overlay = L.imageOverlay(img.src, bounds, {
            opacity: layerName === 'Surface' ? 0.5 : 1,
            className: `underground-layer-${layerName.toLowerCase()}`
        });

        overlay.updateResolution = function(resolution) {
            const newSrc = `/images/underground_map/${layerName}_${resolution}.png`;
            if (img.src !== newSrc) {
                img.src = newSrc;
                this.setUrl(newSrc);
            }
        };

        return overlay;
    }

    TILE_LAYERS.forEach((layerName) => {
        const layer = createCustomOverlay(layerName);
        layer.addTo(map);
        layers[layerName] = layer;
        controls.addOverlay(layer, layerName);
    });

    PIN_LAYERS.forEach(layerName => {
        const markerGroup = L.layerGroup();

        fetch(`/data/${layerName.toLowerCase().replace(' ', '_')}.json`)
            .then(response => response.json())
            .then(data => {
                data.forEach(pin => {
                    const latlng = map.unproject([pin.x, pin.y], MAX_ZOOM);
                    const marker = L.marker(latlng, {
                        icon: L.divIcon({
                            html: pin.icon,
                            className: 'map-pin',
                            iconSize: [20, 20]
                        })
                    });
                    marker.bindTooltip(pin.label);
                    markerGroup.addLayer(marker);
                });
            })
            .catch(error => console.error(`Error loading ${layerName} data:`, error));

        layers[layerName] = markerGroup;
        controls.addOverlay(markerGroup, layerName);
    });

    map.fitBounds(bounds);
    map.setMaxBounds(bounds.pad(0.5));

    function updateImageResolution() {
        const zoom = map.getZoom();
        const size = map.getSize();
        const maxSize = Math.max(size.x, size.y);
        
        let resolution;
        if (maxSize <= 1625 || zoom <= 0) {
            resolution = 'quarter';
        } else if (maxSize <= 3250 || zoom === 1) {
            resolution = 'half';
        } else {
            resolution = 'full';
        }

        TILE_LAYERS.forEach(layerName => {
            layers[layerName].updateResolution(resolution);
        });
    }

    map.on('zoomend resize', updateImageResolution);
    updateImageResolution();

    const resizeMap = debounce(() => {
        const windowElement = container.closest('.window');
        if (windowElement) {
            const newSize = Math.min(windowElement.clientWidth, windowElement.clientHeight);
            container.style.width = `${newSize}px`;
            container.style.height = `${newSize}px`;
        }
        map.invalidateSize({ animate: false, pan: false });
        
        map.fitBounds(bounds);
        updateImageResolution();
    }, 250);

    resizeMap();
    setTimeout(resizeMap, 100);

    window.addEventListener('resize', resizeMap);

    const windowElement = container.closest('.window');
    if (windowElement) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (windowElement.classList.contains('active')) {
                        setTimeout(resizeMap, 0);
                    }
                }
            });
        });
        observer.observe(windowElement, { attributes: true });
    }

    map.on('load', () => {
        if (container.contains(loadingIndicator)) {
            container.removeChild(loadingIndicator);
        }
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const style = document.createElement('style');
    style.textContent = `
        .leaflet-control-layers {
            background: rgba(255, 255, 255, 0.8);
            border-radius: 5px;
            padding: 5px;
        }
        .leaflet-control-layers label {
            margin-bottom: 5px;
        }
        .leaflet-control-layers-selector:checked + span {
            font-weight: bold;
            color: #000080;
        }
        .leaflet-control-layers-selector:not(:checked) + span {
            color: #808080;
        }
        .map-pin {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
    `;
    document.head.appendChild(style);

    `psetTimeout(() => {
        if (container.contains(loadingIndicator)) {
            container.removeChild(loadingIndicator);
        }
    }, 5000);
}