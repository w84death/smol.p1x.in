// Initialize tileset with images
const GRID_COLUMNS = 16;
const GRID_ROWS = 8;


const tilesetDiv = document.getElementById('tileset');
const tileset = [];
for (let i = 0; i < 16; i++) {
    const tile = {
        id: i,
        imageSrc: `${i}.gif`,
    };
    tileset.push(tile);

    const tileDiv = document.createElement('div');
    tileDiv.className = 'tile';
    tileDiv.dataset.id = i;

    const img = document.createElement('img');
    img.src = tile.imageSrc;
    img.alt = `Tile ${i}`;
    img.width = 32;
    img.height = 32;

    tileDiv.appendChild(img);
    tilesetDiv.appendChild(tileDiv);

    tileDiv.addEventListener('click', () => {
        document.querySelectorAll('#tileset .selected').forEach(el => el.classList.remove('selected'));
        tileDiv.classList.add('selected');
        selectedTile = tile;
    });
}


// Meta-tile editor
let selectedTile = null;
let selectedTileSlot = null;
const metatileGrid = document.getElementById('metatile-grid');
const tileSlots = metatileGrid.querySelectorAll('.tile-slot');
const mirrorTileXBtn = document.getElementById('mirror-tile-x');
const mirrorTileYBtn = document.getElementById('mirror-tile-y');
const saveMetatileBtn = document.getElementById('save-metatile');
const metatileList = document.getElementById('metatile-list');
const toggleMovableBtn = document.getElementById('toggle-movable');
let isWater = false;

toggleMovableBtn.addEventListener('click', () => {
    isWater = !isWater;
    toggleMovableBtn.style.backgroundColor = isWater ? '#3498db' : '#8bc34a';
    toggleMovableBtn.textContent = isWater ? 'Is Water' : 'Is Land';
});

// Meta-tile list and initialization
const metatiles = [];
for (let i = 0; i < 16; i++) {
    const metatileDiv = document.createElement('div');
    metatileDiv.className = 'metatile';
    metatileDiv.dataset.id = i;
    metatileDiv.style.position = 'relative';
    metatileDiv.style.backgroundColor = '#eee'; // Light grey to represent empty
    metatileList.appendChild(metatileDiv);

    if (i === 0) {
        // Fill meta-tile ID 0 with tiles 0, 0, 0, 0
        metaTileData = {
            tiles: [0, 0, 0, 0],
            mirrors: [0, 0, 0, 0],
        };

        // Render the meta-tile visually
        metaTileData.tiles.forEach((tileId, idx) => {
            const img = document.createElement('img');
            img.src = tileset[tileId].imageSrc;
            img.alt = `Tile ${tileId}`;
            img.style.width = '32px';
            img.style.height = '32px';
            img.style.position = 'absolute';
            img.style.left = idx % 2 === 0 ? '0' : '32px';
            img.style.top = idx < 2 ? '0' : '32px';
            img.style.transform = 'scaleX(1) scaleY(1)';

            metatileDiv.appendChild(img);
        });
    } else {
        // Initialize other meta-tiles as empty
        metaTileData = {
            tiles: [null, null, null, null],
            mirrors: [0, 0, 0, 0],
        };

        // Optionally, style empty meta-tiles differently
        metatileDiv.style.backgroundColor = '#eee'; // Light grey to represent empty
    }

    metatiles.push(metaTileData);

    metatileDiv.addEventListener('click', () => {
        document.querySelectorAll('#metatile-list .selected').forEach(el => el.classList.remove('selected'));
        metatileDiv.classList.add('selected');
        selectedMetatile = i;

        // Load the selected meta-tile into the editor
        loadMetaTileIntoEditor(metatiles[selectedMetatile]);
    });
}


tileSlots.forEach(slot => {
    slot.addEventListener('click', () => {
        if (selectedTile) {
            slot.innerHTML = '';
            const img = document.createElement('img');
            img.src = selectedTile.imageSrc;
            img.alt = `Tile ${selectedTile.id}`;
            img.width = 32;
            img.height = 32;
            img.style.transform = 'scaleX(1) scaleY(1)';
            slot.appendChild(img);
            slot.dataset.tileId = selectedTile.id;
            slot.dataset.mirrorX = '0';
            slot.dataset.mirrorY = '0';
            currentMetatile.tiles[slot.dataset.index] = selectedTile.id;
            currentMetatile.mirrors[slot.dataset.index] = 0;
            selectTileSlot(slot);
        }
    });
});


function selectTileSlot(slot) {
    tileSlots.forEach(s => s.classList.remove('selected'));
    slot.classList.add('selected');
    selectedTileSlot = slot;
}
mirrorTileXBtn.addEventListener('click', () => {
    if (selectedTileSlot && selectedTileSlot.firstChild) {
        let mirrorX = selectedTileSlot.dataset.mirrorX === '1' ? '0' : '1';
        selectedTileSlot.dataset.mirrorX = mirrorX;
        selectedTileSlot.firstChild.style.transform = `scaleX(${mirrorX === '1' ? -1 : 1}) scaleY(${selectedTileSlot.dataset.mirrorY === '1' ? -1 : 1})`;
        updateMirrorIcon(selectedTileSlot);
        updateCurrentMetatile();
    }
});

mirrorTileYBtn.addEventListener('click', () => {
    if (selectedTileSlot && selectedTileSlot.firstChild) {
        let mirrorY = selectedTileSlot.dataset.mirrorY === '1' ? '0' : '1';
        selectedTileSlot.dataset.mirrorY = mirrorY;
        selectedTileSlot.firstChild.style.transform = `scaleX(${selectedTileSlot.dataset.mirrorX === '1' ? -1 : 1}) scaleY(${mirrorY === '1' ? -1 : 1})`;
        updateMirrorIcon(selectedTileSlot);
        updateCurrentMetatile();
    }
});


function updateMirrorIcon(slot) {
    let mirrorX = slot.dataset.mirrorX === '1';
    let mirrorY = slot.dataset.mirrorY === '1';
    let iconText = '';
    if (mirrorX) iconText += 'X';
    if (mirrorY) iconText += 'Y';

    let icon = slot.querySelector('.mirror-icon');
    if (!icon) {
        icon = document.createElement('div');
        icon.className = 'mirror-icon';
        slot.appendChild(icon);
    }
    icon.textContent = iconText;
}

function drawMetaTileInCell(cell) {
    cell.innerHTML = '';
    const metatileId = parseInt(cell.dataset.metatileId);
    const mirrorX = cell.dataset.mirrorX === '1';
    const mirrorY = cell.dataset.mirrorY === '1';
    const isWater = cell.dataset.water === '1';
    const metatileData = metatiles[metatileId];
    const tiles = metatileData.tiles;
    const tileMirrors = metatileData.mirrors;

    // Remove water visual indicator - no background color changes

    // Build an array of tile indices, adjusted for mirroring
    let tileIndices = [0, 1, 2, 3];

    // If mirrorX is true, swap left and right indices
    if (mirrorX) {
        [tileIndices[0], tileIndices[1]] = [tileIndices[1], tileIndices[0]];
        [tileIndices[2], tileIndices[3]] = [tileIndices[3], tileIndices[2]];
    }

    // If mirrorY is true, swap top and bottom indices
    if (mirrorY) {
        [tileIndices[0], tileIndices[2]] = [tileIndices[2], tileIndices[0]];
        [tileIndices[1], tileIndices[3]] = [tileIndices[3], tileIndices[1]];
    }

    // For each tile, create the image
    tileIndices.forEach((idx, pos) => {
        const tileId = tiles[idx];
        if (tileId !== null) {
            const img = document.createElement('img');
            img.src = tileset[tileId].imageSrc;
            img.alt = `Tile ${tileId}`;
            img.style.width = '32px';
            img.style.height = '32px';
            img.style.position = 'absolute';
            img.dataset.idx = pos; // Use the position after mirroring
            img.style.left = pos % 2 === 0 ? '0' : '32px';
            img.style.top = pos < 2 ? '0' : '32px';

            // Calculate the tile's own mirroring
            let tileMirrorX = (tileMirrors[idx] & 0b00010000) ? -1 : 1;
            let tileMirrorY = (tileMirrors[idx] & 0b00100000) ? -1 : 1;

            // Apply the cell's mirroring
            tileMirrorX *= mirrorX ? -1 : 1;
            tileMirrorY *= mirrorY ? -1 : 1;

            img.style.transform = `scaleX(${tileMirrorX}) scaleY(${tileMirrorY})`;

            cell.appendChild(img);
        }
    });
}


function updateCurrentMetatile() {
    let index = selectedTileSlot.dataset.index;
    let tileId = parseInt(selectedTileSlot.dataset.tileId);
    let mirrorX = selectedTileSlot.dataset.mirrorX === '1' ? 1 : 0;
    let mirrorY = selectedTileSlot.dataset.mirrorY === '1' ? 1 : 0;
    currentMetatile.tiles[index] = tileId;
    currentMetatile.mirrors[index] = (mirrorX << 4) | (mirrorY << 5);
}

saveMetatileBtn.addEventListener('click', () => {
    if (currentMetatile.tiles.includes(null)) {
        alert('Please fill all tile slots before saving the meta-tile.');
        return;
    }

    if (selectedMetatile === null) {
        alert('Please select a meta-tile from the list to overwrite.');
        return;
    }

    // Add water property to meta-tile
    currentMetatile.water = isWater;

    // Overwrite the selected meta-tile
    metatiles[selectedMetatile] = JSON.parse(JSON.stringify(currentMetatile));

    // Update the display of the meta-tile in the list
    // Update the display of the meta-tile in the list
    const metatileDiv = metatileList.children[selectedMetatile];
    metatileDiv.innerHTML = ''; // Clear existing content

    currentMetatile.tiles.forEach((tileId, idx) => {
        const img = document.createElement('img');
        img.src = tileset[tileId].imageSrc;
        img.alt = `Tile ${tileId}`;
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.position = 'absolute';
        img.style.left = idx % 2 === 0 ? '0' : '32px';
        img.style.top = idx < 2 ? '0' : '32px';
        
        let mirrorX = (currentMetatile.mirrors[idx] & 0b00010000) ? -1 : 1;
        let mirrorY = (currentMetatile.mirrors[idx] & 0b00100000) ? -1 : 1;

        img.style.transform = `scaleX(${mirrorX}) scaleY(${mirrorY})`;

        metatileDiv.appendChild(img);
    });


    // Deselect the meta-tile after saving
    document.querySelectorAll('#metatile-list .selected').forEach(el => el.classList.remove('selected'));
    selectedMetatile = null;

    // Reset current metatile
    currentMetatile = {
        tiles: [null, null, null, null],
        mirrors: [0, 0, 0, 0],
    };
    tileSlots.forEach(slot => {
        slot.innerHTML = '';
        slot.dataset.tileId = null;
        slot.dataset.mirrorX = '0';
        slot.dataset.mirrorY = '0';
    });

    updateDataPreview();
});

function loadMetaTileIntoEditor(metaTile) {
    metaTile.tiles.forEach((tileId, idx) => {
        const slot = tileSlots[idx];
        slot.innerHTML = '';
        if (tileId !== null) {
            const img = document.createElement('img');
            img.src = tileset[tileId].imageSrc;
            img.alt = `Tile ${tileId}`;
            img.width = 32;
            img.height = 32;
            slot.appendChild(img);
            slot.dataset.tileId = tileId;
            let mirrorX = (metaTile.mirrors[idx] & 0b00010000) ? '1' : '0';
            let mirrorY = (metaTile.mirrors[idx] & 0b00100000) ? '1' : '0';

            slot.dataset.mirrorX = mirrorX;
            slot.dataset.mirrorY = mirrorY;
            img.style.transform = `scaleX(${mirrorX === '1' ? -1 : 1}) scaleY(${mirrorY === '1' ? -1 : 1})`;
            updateMirrorIcon(slot);
        } else {
            slot.dataset.tileId = null;
            slot.dataset.mirrorX = '0';
            slot.dataset.mirrorY = '0';
            updateMirrorIcon(slot);
        }
    });
    currentMetatile = JSON.parse(JSON.stringify(metaTile));
    isWater = metaTile.water || false;
    toggleMovableBtn.style.backgroundColor = isWater ? '#3498db' : '#8bc34a';
    toggleMovableBtn.textContent = isWater ? 'Set Water' : 'Set Land';
    // Deselect any selected tile slots
    tileSlots.forEach(s => s.classList.remove('selected'));
    selectedTileSlot = null;
}



// Level Editor
const levelGrid = document.getElementById('level-grid');
const levelData = [];
for (let i = 0; i < GRID_COLUMNS * GRID_ROWS; i++) {
    levelData.push({
        metatileId: 0,
        mirror: 0,
    });
}

// Update level cell click handler
for (let i = 0; i < GRID_COLUMNS * GRID_ROWS; i++) {
    const cell = document.createElement('div');
    cell.className = 'level-cell';
    cell.dataset.index = i;
    levelGrid.appendChild(cell);

    cell.addEventListener('click', () => {
        if (selectedMetatile !== null && currentMode === 'level') {
            cell.dataset.metatileId = selectedMetatile;
            cell.dataset.mirrorX = '0';
            cell.dataset.mirrorY = '0';
            cell.dataset.water = isWater ? '1' : '0';

            // Draw the meta-tile in the cell
            drawMetaTileInCell(cell);

            selectLevelCell(cell);
            updateLevelData(cell);
        }
    });

}

let selectedMetatile = null;
let selectedLevelCell = null;
const mirrorMetatileXBtn = document.getElementById('mirror-metatile-x');
const mirrorMetatileYBtn = document.getElementById('mirror-metatile-y');

function selectLevelCell(cell) {
    levelGrid.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    cell.classList.add('selected');
    selectedLevelCell = cell;
}

    // Mirror Meta-Tile X in Level Grid
mirrorMetatileXBtn.addEventListener('click', () => {
    if (selectedLevelCell && selectedLevelCell.dataset.metatileId !== undefined) {
        let mirrorX = selectedLevelCell.dataset.mirrorX === '1' ? '0' : '1';
        selectedLevelCell.dataset.mirrorX = mirrorX;

        // Redraw the cell with updated mirroring
        drawMetaTileInCell(selectedLevelCell);

        // Update level data
        updateLevelData(selectedLevelCell);
    }
});

// Mirror Meta-Tile Y in Level Grid
mirrorMetatileYBtn.addEventListener('click', () => {
    if (selectedLevelCell && selectedLevelCell.dataset.metatileId !== undefined) {
        let mirrorY = selectedLevelCell.dataset.mirrorY === '1' ? '0' : '1';
        selectedLevelCell.dataset.mirrorY = mirrorY;

        // Redraw the cell with updated mirroring
        drawMetaTileInCell(selectedLevelCell);

        // Update level data
        updateLevelData(selectedLevelCell);
    }
});


function updateLevelData(cell) {
    let index = cell.dataset.index;
    let metatileId = parseInt(cell.dataset.metatileId);
    let mirrorX = cell.dataset.mirrorX === '1' ? 1 : 0;
    let mirrorY = cell.dataset.mirrorY === '1' ? 1 : 0;
    let water = cell.dataset.water === '1' ? 1 : 0;
    levelData[index] = {
        metatileId,
        mirror: (mirrorX << 4) | (mirrorY << 5) | (water << 6),
    };
    updateDataPreview();
}

function generateEntityData() {
    let entitiesPreview = 'EntityCount:\n';

    // Filter out non-null placed entities
    const entitiesPlaced = entityData.filter(e => e !== null);

    // Total count of all entities
    entitiesPreview += `dw 0x${entitiesPlaced.length.toString(16).padStart(4, '0')}\n\n`;

    // Entity Data
    entitiesPreview += 'EntityData:\n';

    // Group entities by ID
    const entityGroups = {};
    entitiesPlaced.forEach(entity => {
        if (!entityGroups[entity.id]) {
            entityGroups[entity.id] = [];
        }
        entityGroups[entity.id].push(entity.position);
    });

    // Iterate over each group of entities
    Object.keys(entityGroups).forEach(entityId => {
        const positions = entityGroups[entityId];
        const count = positions.length;

        // Output entity ID and count
        entitiesPreview += `db ${entityId}, ${count}\n`;

        // Output positions, swapping X and Y
        positions.forEach(position => {
            const row = Math.floor(position / 32);
            const col = position % 32;
            const positionWord = ((row & 0xFF) << 8) | (col & 0xFF);
            entitiesPreview += `dw 0x${positionWord.toString(16).padStart(4, '0')}\n`;
        });
    });

    entitiesPreview += 'db 0x0 ; End of entities'

    return entitiesPreview;
}

function updateDataPreview() {
    let metaTilesPreview = 'MetaTiles:\n';
    metatiles.forEach((mt) => {
        let line = `db `;
        mt.tiles.forEach((tileId, i) => {
            let tileIdValue = tileId !== null ? tileId & 0x0F : 0;
            let mirrorX = (mt.mirrors[i] & 0b00010000) ? 1 : 0;
            let mirrorY = (mt.mirrors[i] & 0b00100000) ? 1 : 0;
            let byteValue = tileIdValue | (mirrorX << 4) | (mirrorY << 5);
            line += `${byteValue.toString(2).padStart(8, '0')}b`;
            if (i < 3) line += ', ';
        });
        metaTilesPreview += line + '\n';
    });

    let levelDataPreview = 'LevelData:\n';
    let lineBuffer = [];
    for (let idx = 0; idx < levelData.length; idx++) {
        let cell = levelData[idx];
        let byteValue;
        if (cell) {
            let metatileIdValue = cell.metatileId & 0x0F;
            let mirrorX = (cell.mirror >> 4) & 1;
            let mirrorY = (cell.mirror >> 5) & 1;
            let water = (cell.mirror >> 6) & 1;
            byteValue = metatileIdValue | (mirrorX << 4) | (mirrorY << 5) | (water << 6);
        } else {
            byteValue = 0;
        }
        lineBuffer.push(`${byteValue.toString(2).padStart(8, '0')}b`);

        // Group by 4 bytes per line
        if (lineBuffer.length === 4) {
            levelDataPreview += `db ${lineBuffer.join(', ')}\n`;
            lineBuffer = []; // Reset the buffer
        }
    }

    // If any remaining bytes after grouping by 4
    if (lineBuffer.length > 0) {
        levelDataPreview += `db ${lineBuffer.join(', ')}\n`;
    }

    entitiesPreview = generateEntityData();
    document.getElementById('data-preview').textContent = metaTilesPreview + '\n' + levelDataPreview + '\n' + entitiesPreview;
}



// Add keyboard shortcuts for mirror X and Y
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    // Mirror meta-tile on X axis with 'x'
    if (key === 'x') {
        mirrorMetatileXBtn.click();
    }

    // Mirror meta-tile on Y axis with 'y'
    if (key === 'y') {
        mirrorMetatileYBtn.click();
    }

    // Number keys to select meta-tiles 0-9
    if (key >= '0' && key <= '9') {
        const metaIndex = parseInt(key);
        if (metaIndex < metatileList.children.length) {
            const metatileDiv = metatileList.children[metaIndex];
            document.querySelectorAll('#metatile-list .selected').forEach(el => el.classList.remove('selected'));
            metatileDiv.classList.add('selected');
            selectedMetatile = metaIndex;
            loadMetaTileIntoEditor(metatiles[selectedMetatile]);
        }
    }
});



// Save and Load Buttons
const saveDataButton = document.getElementById('save-data');
const loadDataButton = document.getElementById('load-data');
const loadDataTriggerButton = document.getElementById('load-data-button');

// Function to save meta-tiles and level data to a JSON file
saveDataButton.addEventListener('click', () => {
    const data = {
        metatiles,
        levelData,
        entityData,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'level-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Function to load meta-tiles and level data from a JSON file
loadDataTriggerButton.addEventListener('click', () => {
    loadDataButton.click();
});
// Function to load meta-tiles and level data from a JSON file
loadDataButton.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = JSON.parse(e.target.result);
        if (data.metatiles && data.levelData) {
            // Load Meta-Tiles
            metatiles.length = 0;
            data.metatiles.forEach((mt, idx) => {
                metatiles.push(mt);
                
                const metatileDiv = metatileList.children[idx];
                metatileDiv.innerHTML = ''; // Clear existing content
                
                mt.tiles.forEach((tileId, i) => {
                    if (tileId !== null) {
                        const img = document.createElement('img');
                        img.src = tileset[tileId].imageSrc;
                        img.alt = `Tile ${tileId}`;
                        img.style.width = '32px';
                        img.style.height = '32px';
                        img.style.position = 'absolute';
                        img.style.left = i % 2 === 0 ? '0' : '32px';
                        img.style.top = i < 2 ? '0' : '32px';

                        // Update bit masks to match bits 4 and 5
                        let mirrorX = (mt.mirrors[i] & 0b00010000) ? -1 : 1;
                        let mirrorY = (mt.mirrors[i] & 0b00100000) ? -1 : 1;
                        img.style.transform = `scaleX(${mirrorX}) scaleY(${mirrorY})`;

                        metatileDiv.appendChild(img);
                    }
                });
            });

            // Load Level Data
            levelData.length = 0;
            levelData.push(...data.levelData);
            levelGrid.querySelectorAll('.level-cell').forEach((cell, idx) => {
                const cellData = levelData[idx];
                if (cellData) {
                    cell.dataset.metatileId = cellData.metatileId;
                    cell.dataset.mirrorX = (cellData.mirror >> 4) & 1 ? '1' : '0';
                    cell.dataset.mirrorY = (cellData.mirror >> 5) & 1 ? '1' : '0';
                    cell.dataset.water = (cellData.mirror >> 6) & 1 ? '1' : '0';
                    drawMetaTileInCell(cell);
                }
            });

             // Load Entity Data
            if (data.entityData) {
                entityData.length = 0;
                entityData.push(...data.entityData);

                entityGrid.querySelectorAll('.entity-cell').forEach((cell, idx) => {
                    const entity = entityData[idx];
                    if (entity) {
                        cell.innerHTML = '';
                        const img = document.createElement('img');
                        img.src = entitiesList[entity.id].imageSrc;
                        img.alt = `Entity ${entity.id}`;
                        img.width = 32;
                        img.height = 32;
                        cell.appendChild(img);
                    } else {
                        cell.innerHTML = '';
                    }
                });
            }
            updateDataPreview();
        }
    };

    reader.readAsText(file);
});

// Mode Switching Variables
let currentMode = 'level'; // 'level' or 'entity'
const switchModeButton = document.getElementById('switch-mode');
const entitySelectionDiv = document.getElementById('entity-selection');
const entityGrid = document.getElementById('entity-grid');
const tilesetToolset = document.getElementById('tileset-container');
const metatileToolset = document.getElementById('metatile-editor-container');
const metatileListCont = document.getElementById('metatile-list-container');
let selectedEntity = null;

// Mode Switch Event Listener
switchModeButton.addEventListener('click', () => {
    if (currentMode === 'level') {
        currentMode = 'entity';
        switchModeButton.textContent = 'Switch to Level Design Mode';
        // Show entity selection and grid
        entitySelectionDiv.style.display = 'flex';
        entityGrid.style.display = 'grid';
        // Disable level grid interactions
        levelGrid.style.pointerEvents = 'none';

        tilesetToolset.style.display = 'none';
        metatileToolset.style.display = 'none';
        metatileListCont.style.display = 'none';
        
    } else {
        currentMode = 'level';
        switchModeButton.textContent = 'Switch to Entity Mode';
        // Hide entity selection and grid
        entitySelectionDiv.style.display = 'none';
        entityGrid.style.display = 'none';
        // Enable level grid interactions
        levelGrid.style.pointerEvents = 'auto';

        tilesetToolset.style.display = 'block';
        metatileToolset.style.display = 'block';
        metatileListCont.style.display = 'grid  ';
    }
});

// Entity Selection Setup
const entitiesList = [];
for (let i = 0; i <= 15; i++) { // 0 for erase option
    const entity = {
        id: i,
        imageSrc: i === 0 ? 'erase.gif' : `${i}_e.gif`,
    };
    entitiesList.push(entity);

    const entityDiv = document.createElement('div');
    entityDiv.className = 'entity';
    entityDiv.dataset.id = i;

    const img = document.createElement('img');
    img.src = entity.imageSrc;
    img.alt = `Entity ${i}`;
    img.width = 32;
    img.height = 32;

    entityDiv.appendChild(img);
    entitySelectionDiv.appendChild(entityDiv);

    entityDiv.addEventListener('click', () => {
        document.querySelectorAll('#entity-selection .selected').forEach(el => el.classList.remove('selected'));
        entityDiv.classList.add('selected');
        selectedEntity = entity;
    });
}

// Entity Grid Setup
const entityData = new Array(32 * 16).fill(null);
for (let i = 0; i < 32 * 16; i++) {
    const cell = document.createElement('div');
    cell.className = 'entity-cell';
    cell.dataset.index = i;
    entityGrid.appendChild(cell);

    cell.addEventListener('click', () => {
        if (selectedEntity && currentMode === 'entity') {
            if (selectedEntity.id === 0) {
                // Erase entity
                cell.innerHTML = '';
                entityData[i] = null;
            } else {
                // Place entity
                cell.innerHTML = '';
                const img = document.createElement('img');
                img.src = selectedEntity.imageSrc;
                img.alt = `Entity ${selectedEntity.id}`;
                img.width = 32;
                img.height = 32;
                cell.appendChild(img);
                entityData[i] = {
                    id: selectedEntity.id,
                    position: i,
                };
            }
            updateDataPreview();
        }
    });
}
