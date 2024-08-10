import { debounce } from './utils.js';

const TILE_LAYERS = ['Base', 'Surface'];
const PIN_LAYERS = ['Vendors', 'Entrances', 'Surface Labels'];
const MAX_ZOOM = 4;
const MIN_ZOOM = 0;

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
        zoomAnimationThreshold: 4,
        fadeAnimation: true,
        markerZoomAnimation: true,
        preferCanvas: true,
        attributionControl: false
    });

    const layers = {};
    const controls = L.control.layers(null, null, { position: 'topright' }).addTo(map);

    TILE_LAYERS.forEach((layerName, index) => {
        const layer = L.gridLayer({
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            opacity: layerName === 'Surface' ? 0.5 : 1,
            className: `underground-layer-${layerName.toLowerCase()}`
        });

        layer.createTile = function(coords) {
            const tile = document.createElement('img');
            const size = this.getTileSize();
            tile.width = size.x;
            tile.height = size.y;
            
            if (coords.z < 2) {
                tile.src = `/images/underground_map/${layerName}/zoom_${coords.z}.png`;
            } else {
                const quadrant = 
                    (coords.y % 2 === 0 ? 'top' : 'bottom') + 
                    (coords.x % 2 === 0 ? 'left' : 'right');
                tile.src = `/images/underground_map/${layerName}/zoom_${coords.z}_${quadrant}.png`;
            }

            return tile;
        };

        layer.addTo(map);
        layers[layerName] = layer;
        controls.addOverlay(layer, layerName);
    });

    PIN_LAYERS.forEach(layerName => {
        const markerGroup = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: false,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true
        });

        fetch(`/data/${layerName.toLowerCase().replace(' ', '_')}.json`)
            .then(response => response.json())
            .then(data => {
                data.forEach(pin => {
                    const marker = L.marker([pin.y, pin.x], {
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

    const mapSize = 6500 * Math.pow(2, MAX_ZOOM - MIN_ZOOM);
    map.setView([mapSize / 2, mapSize / 2], MIN_ZOOM);
    map.setMaxBounds([[0, 0], [mapSize, mapSize]]);

    const resizeMap = debounce(() => {
        const newSize = Math.min(container.clientWidth, container.clientHeight);
        container.style.width = `${newSize}px`;
        container.style.height = `${newSize}px`;
        map.invalidateSize({ animate: false, pan: false });
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
        container.removeChild(loadingIndicator);
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
    map.setMaxBounds([[-3750, -3750], [3750, 3750]]);
}