export function initialize(container) {
    setTimeout(() => {
        const mapContainer = document.createElement('div');
        mapContainer.id = 'map-container';
        mapContainer.innerHTML = `
            <div id="map">
                <img id="base-layer" class="map-layer active" src="./images/underground_map/base_full.png" alt="Base Layer">
                <img id="surface-layer" class="map-layer active" src="./images/underground_map/surface_full.png" alt="Surface Layer">
                <div id="base-pins" class="pin-layer"></div>
                <div id="surface-pins" class="pin-layer"></div>
            </div>
            <div id="layers-panel">
                <label>
                    <input type="checkbox" id="toggle-base-layer" checked>
                    <span>Base Layer</span>
                </label>
                <label>
                    <input type="checkbox" id="toggle-surface-layer">
                    <span>Surface Layer</span>
                </label>
            </div>
            <div id="zoom-controls">
                <button id="zoom-in" class="zoom-button">+</button>
                <button id="zoom-out" class="zoom-button">-</button>
            </div>
        `;
        container.appendChild(mapContainer);

        const baseLayer = document.getElementById('base-layer');
        const surfaceLayer = document.getElementById('surface-layer');
        const basePinsContainer = document.getElementById('base-pins');
        const surfacePinsContainer = document.getElementById('surface-pins');
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const baseLayerCheckbox = document.getElementById('toggle-base-layer');
        const surfaceLayerCheckbox = document.getElementById('toggle-surface-layer');

        let scale = 1;
        let panX = 0;
        let panY = 0;
        let isPanning = false;
        let startX = 0, startY = 0;

        function updateLayerSize(layer) {
            const containerRect = mapContainer.getBoundingClientRect();
            const imgAspect = layer.naturalWidth / layer.naturalHeight;
            const containerAspect = containerRect.width / containerRect.height;

            if (imgAspect > containerAspect) {
                layer.style.width = '100%';
                layer.style.height = 'auto';
            } else {
                layer.style.width = 'auto';
                layer.style.height = '100%';
            }
        }

        function updateLayerVisibility() {
            baseLayer.style.display = baseLayerCheckbox.checked ? 'block' : 'none';
            basePinsContainer.style.display = baseLayerCheckbox.checked ? 'block' : 'none';
            
            surfaceLayer.style.display = surfaceLayerCheckbox.checked ? 'block' : 'none';
            surfacePinsContainer.style.display = surfaceLayerCheckbox.checked ? 'block' : 'none';
            surfaceLayer.style.opacity = surfaceLayerCheckbox.checked ? '0.5' : '0';
        }
        
        baseLayerCheckbox.addEventListener('change', updateLayerVisibility);
        surfaceLayerCheckbox.addEventListener('change', updateLayerVisibility);
        
        updateLayerVisibility();

        function updatePinContainerSize() {
            const layerRect = baseLayer.getBoundingClientRect();
            basePinsContainer.style.width = `${layerRect.width}px`;
            basePinsContainer.style.height = `${layerRect.height}px`;
            surfacePinsContainer.style.width = `${layerRect.width}px`;
            surfacePinsContainer.style.height = `${layerRect.height}px`;
        }

        function resizePinContainerToLayer(layer, container) {
            container.style.position = 'absolute';
            container.style.left = '0';
            container.style.top = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.pointerEvents = 'none';
        }

        function loadPins(container, pins, imageWidth, imageHeight, isBaseLayer = true) {
            container.innerHTML = '';
            pins.forEach(pin => {
                const pinElement = document.createElement('div');
                pinElement.className = 'pin';
                pinElement.style.left = `${(pin.x / imageWidth) * 100}%`;
                pinElement.style.top = `${(pin.y / imageHeight) * 100}%`;

                const emojiElement = document.createElement('span');
                emojiElement.className = 'emoji';
                emojiElement.textContent = pin.icon;
                pinElement.appendChild(emojiElement);

                const labelElement = document.createElement('span');
                labelElement.className = 'label';
                labelElement.textContent = pin.label;

                if (isBaseLayer) {
                    labelElement.classList.add(pin.x >= imageWidth / 2 ? 'right' : 'left');
                    pinElement.appendChild(labelElement);
                } else {
                    labelElement.style.display = 'none';
                    pinElement.appendChild(labelElement);
                    pinElement.addEventListener('mouseover', () => labelElement.style.display = 'inline-block');
                    pinElement.addEventListener('mouseout', () => labelElement.style.display = 'none');
                }

                container.appendChild(pinElement);
            });
        }

        function ensureImagesLoaded() {
            return Promise.all([baseLayer, surfaceLayer].map(img => 
                new Promise(resolve => {
                    if (img.complete) resolve();
                    else img.onload = resolve;
                })
            ));
        }

        function loadPinsWithRetry() {
            ensureImagesLoaded()
                .then(() => {
                    updatePinContainerSize();
                    resizePinContainerToLayer(baseLayer, basePinsContainer);
                    resizePinContainerToLayer(surfaceLayer, surfacePinsContainer);
                    return Promise.all([
                        fetch('./data/base_labels.json').then(response => response.json()),
                        fetch('./data/surface_labels.json').then(response => response.json())
                    ]);
                })
                .then(([basePins, surfacePins]) => {
                    loadPins(basePinsContainer, basePins, 6500, 6500, true);
                    loadPins(surfacePinsContainer, surfacePins, 6500, 6500, false);
                    updateLayers();
                })
                .catch(error => console.error("Error loading pins:", error));
        }

        let initialScale = 1;

        function updateLayers() {
            const transform = `scale(${scale}) translate(${panX}px, ${panY}px)`;
            baseLayer.style.transform = transform;
            surfaceLayer.style.transform = transform;
            basePinsContainer.style.transform = transform;
            surfacePinsContainer.style.transform = transform;
            document.documentElement.style.setProperty('--pin-scale', 1 / scale);
        }

        mapContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const newScale = Math.min(Math.max(scale + (e.deltaY > 0 ? -0.2 : 0.2), initialScale), 4);
            if (newScale !== scale) {
                scale = newScale;
                updateLayers();
            }
        });

        zoomInBtn.addEventListener('click', () => {
            scale = Math.min(scale * 1.2, 4);
            updateLayers();
        });

        zoomOutBtn.addEventListener('click', () => {
            const newScale = scale / 1.2;
            if (newScale >= initialScale) {
                scale = newScale;
                updateLayers();
            }
        });

        mapContainer.addEventListener('mousedown', (e) => {
            isPanning = true;
            startX = e.clientX;
            startY = e.clientY;
            mapContainer.style.cursor = 'grabbing';
            e.preventDefault();
        });

        mapContainer.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            const deltaX = (e.clientX - startX) / scale;
            const deltaY = (e.clientY - startY) / scale;
            panX += deltaX;
            panY += deltaY;
            startX = e.clientX;
            startY = e.clientY;
            updateLayers();
        });

        mapContainer.addEventListener('mouseup', () => {
            isPanning = false;
            mapContainer.style.cursor = 'grab';
        });

        mapContainer.addEventListener('mouseleave', () => {
            if (isPanning) {
                isPanning = false;
                mapContainer.style.cursor = 'grab';
            }
        });

        baseLayer.onload = surfaceLayer.onload = () => {
            const containerRect = mapContainer.getBoundingClientRect();
            const imgAspect = baseLayer.naturalWidth / baseLayer.naturalHeight;
            const containerAspect = containerRect.width / containerRect.height;
            initialScale = imgAspect > containerAspect 
                ? containerRect.width / baseLayer.naturalWidth 
                : containerRect.height / baseLayer.naturalHeight;
            scale = initialScale;
            updateLayers();
            loadPinsWithRetry();
        };

        window.addEventListener('resize', () => {
            updateLayerSize(baseLayer);
            updateLayerSize(surfaceLayer);
            updateLayers();
        });

        updateLayerSize(baseLayer);
        updateLayerSize(surfaceLayer);
        updateLayers();

        surfaceLayerCheckbox.checked = false;
        surfaceLayer.style.opacity = '0';
        surfacePinsContainer.style.display = 'none';

        loadPinsWithRetry();
        updateLayers();
    }, 100);
}