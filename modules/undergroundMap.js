const LAYER_ORDER = ['Base', 'Vendors', 'Entrances', 'Surface', 'Surface Labels'];

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function initializeUndergroundMap(container) {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'map-loading-indicator';
    loadingIndicator.textContent = 'Loading map...';
    container.appendChild(loadingIndicator);

    const map = L.map(container, {
        crs: L.CRS.Simple,
        minZoom: -1,  // Adjusted this value
        maxZoom: 2,
        zoomControl: false
    });

    const layers = {};
    const controls = L.control.layers(null, null, { position: 'topright' }).addTo(map);

    // Add black background layer
    L.imageOverlay('/images/black_pixel.png', [[0, 0], [1000, 1000]], {
        interactive: false,
        className: 'black-background-layer'
    }).addTo(map);

    // Reverse the layer order for adding to the map
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

    // Add layers to control in the correct order
    LAYER_ORDER.forEach((layerName) => {
        controls.addOverlay(layers[layerName], layerName);
    });

    // Ensure the map fills the container
    const resizeMap = debounce(() => {
        const newSize = Math.min(container.clientWidth, container.clientHeight);
        container.style.width = `${newSize}px`;
        container.style.height = `${newSize}px`;
        map.invalidateSize();
        map.fitBounds([[0, 0], [1000, 1000]], {animate: false, padding: [0, 0]});
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

    // Remove loading indicator after all initial layers are added
    map.whenReady(() => {
        container.removeChild(loadingIndicator);
    });

    // Add zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Custom CSS to style the layer control and improve toggle visibility
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