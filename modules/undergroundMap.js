const LAYER_ORDER = ['Surface Labels', 'Surface', 'Entrances', 'Vendors', 'Base'];

export function initializeUndergroundMap(container) {
    const map = L.map(container, {
        crs: L.CRS.Simple,
        minZoom: -2,
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

    LAYER_ORDER.forEach((layerName) => {
        const imageUrl = layerName === 'Surface Labels' 
            ? '/images/SewerMapSurfaceLabels.png'
            : `/images/SewerMap${layerName}.png`;
        
        const layer = L.imageOverlay(imageUrl, [[0, 0], [1000, 1000]]);
        
        if (layerName === 'Surface') {
            layer.setOpacity(0.5);
        }

        layers[layerName] = layer;
        controls.addOverlay(layer, layerName);

        // Add Base layer by default
        if (layerName === 'Base') {
            layer.addTo(map);
        }
    });

    map.fitBounds([[0, 0], [1000, 1000]]);

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