import { debounce } from './utils.js';

const LAYER_ORDER = ['Base', 'Vendors', 'Entrances', 'Surface', 'Surface Labels'];

export function initialize(container) {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'map-loading-indicator';
    loadingIndicator.textContent = 'Loading map...';
    container.appendChild(loadingIndicator);

    const map = L.map(container, {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 2,
        zoomSnap: 0.1,
        zoomDelta: 0.1,
        zoomControl: false,
        attributionControl: false
    });

    const layers = {};
    const controls = L.control.layers(null, null, { position: 'topright' }).addTo(map);

    L.imageOverlay('/images/black_pixel.png', [[0, 0], [1000, 1000]], {
        interactive: false,
        className: 'black-background-layer'
    }).addTo(map);

    [...LAYER_ORDER].reverse().forEach((layerName) => {
        const imageUrl = layerName === 'Surface Labels' 
            ? '/images/SewerMapSurfaceLabels.png'
            : `/images/SewerMap${layerName}.png`;
        
        const layer = L.imageOverlay(imageUrl, [[0, 0], [1000, 1000]]);
        
        if (layerName === 'Surface') {
            layer.setOpacity(0.5);
        }

        layers[layerName] = layer;
        
        if (layerName !== 'Surface' && layerName !== 'Surface Labels') {
            layer.addTo(map);
        }
    });

    LAYER_ORDER.forEach((layerName) => {
        controls.addOverlay(layers[layerName], layerName);
    });

    const resizeMap = debounce(() => {
        const newSize = Math.min(container.clientWidth, container.clientHeight);
        container.style.width = `${newSize}px`;
        container.style.height = `${newSize}px`;
        map.invalidateSize();
        
        map.fitBounds([[0, 0], [1000, 1000]], {
            animate: false
        });
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

    map.whenReady(() => {
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
        .black-background-layer {
            z-index: -1;
        }
    `;
    document.head.appendChild(style);
}