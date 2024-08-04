import L from 'leaflet';

const LAYER_ORDER = ['Base', 'Vendors', 'Entrances', 'Surface'];

export function initializeUndergroundMap(container) {
    const map = L.map(container, {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 2,
        zoomControl: false
    });

    const layers = {};
    const controls = L.control.layers(null, null, { position: 'topright' }).addTo(map);

    LAYER_ORDER.forEach((layerName, index) => {
        const imageUrl = `/images/SewerMap${layerName}.png`;
        const layer = L.imageOverlay(imageUrl, [[0, 0], [1000, 1000]]);
        
        layers[layerName] = layer;
        if (layerName === 'Base') {
            layer.addTo(map);
        } else {
            controls.addOverlay(layer, layerName);
        }
    });

    map.fitBounds([[0, 0], [1000, 1000]]);

    // Add zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Custom CSS to style the layer control
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
    `;
    document.head.appendChild(style);
}