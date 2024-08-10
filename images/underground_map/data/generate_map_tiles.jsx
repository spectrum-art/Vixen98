#target photoshop

function main() {
    if (app.documents.length === 0) {
        alert("Please open an image before running this script.");
        return;
    }

    var doc = app.activeDocument;
    var originalPath = doc.path;
    var layerName = doc.name.split('.')[0];

    // Create zoom levels
    var zoomLevels = [
        {name: "zoom_4", size: 6500},
        {name: "zoom_3", size: 3250},
        {name: "zoom_2", size: 1625},
        {name: "zoom_1", size: 813},
        {name: "zoom_0", size: 407}
    ];

    for (var i = 0; i < zoomLevels.length; i++) {
        var level = zoomLevels[i];
        doc.resizeImage(UnitValue(level.size, "px"), UnitValue(level.size, "px"), null, ResampleMethod.BICUBIC);
        
        if (i < 3) {  // For zoom levels 2, 3, and 4
            // Save quadrants
            saveQuadrant(doc, originalPath, layerName, level.name, "topleft", 0, 0, level.size / 2, level.size / 2);
            saveQuadrant(doc, originalPath, layerName, level.name, "topright", level.size / 2, 0, level.size, level.size / 2);
            saveQuadrant(doc, originalPath, layerName, level.name, "bottomleft", 0, level.size / 2, level.size / 2, level.size);
            saveQuadrant(doc, originalPath, layerName, level.name, "bottomright", level.size / 2, level.size / 2, level.size, level.size);
        } else {  // For zoom levels 0 and 1
            saveImage(doc, originalPath, layerName + "_" + level.name);
        }

        // Undo resize for next iteration
        doc.activeHistoryState = doc.historyStates[0];
    }

    alert("Tile generation complete!");
}

function saveQuadrant(doc, path, layerName, zoomLevel, quadrantName, left, top, right, bottom) {
    doc.crop([left, top, right, bottom]);
    saveImage(doc, path, layerName + "_" + zoomLevel + "_" + quadrantName);
    doc.activeHistoryState = doc.historyStates[0];
}

function saveImage(doc, path, fileName) {
    var saveFile = new File(path + "/" + fileName + ".png");
    var saveOptions = new PNGSaveOptions();
    saveOptions.compression = 9;
    saveOptions.interlaced = false;
    doc.saveAs(saveFile, saveOptions, true, Extension.LOWERCASE);
}

main();