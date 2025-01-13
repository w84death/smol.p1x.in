const mainCanvas = document.getElementById('mainCanvas');
const previewCanvas = document.getElementById('previewCanvas');
const mainCtx = mainCanvas.getContext('2d');
const previewCtx = previewCanvas.getContext('2d');
const clearButton = document.getElementById('clearButton');
const tileButton = document.getElementById('tileButton');
const canvasSizeDropdown = document.getElementById('canvasSize');
const palette = document.getElementById('palette');

let mainColor = { r: 255, g: 255, b: 255 };
let secondaryColor = { r: 0, g: 0, b: 0 };
let pixelSize = 8;

let sprite = new Array(8).fill(null).map(() => new Array(8).fill({ r: 0, g: 0, b: 0 }));

const vgaPalette = [
    { r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 170 }, { r: 0, g: 170, b: 0 }, { r: 0, g: 170, b: 170 },
    { r: 170, g: 0, b: 0 }, { r: 170, g: 0, b: 170 }, { r: 170, g: 85, b: 0 }, { r: 170, g: 170, b: 170 },
    { r: 85, g: 85, b: 85 }, { r: 85, g: 85, b: 255 }, { r: 85, g: 255, b: 85 }, { r: 85, g: 255, b: 255 },
    { r: 255, g: 85, b: 85 }, { r: 255, g: 85, b: 255 }, { r: 255, g: 255, b: 85 }, { r: 255, g: 255, b: 255 }
];

function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function createPalette() {
    updatePrimarySecondaryColors();
    vgaPalette.forEach((color) => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color-picker';
        colorDiv.style.backgroundColor = rgbToHex(color.r, color.g, color.b);
        colorDiv.onmousedown = (event) => {
            event.preventDefault();
            if (event.button === 0) {
                mainColor = color;
            } else if (event.button === 2) {
                secondaryColor = color;
            }
            updatePrimarySecondaryColors();
        };
        palette.appendChild(colorDiv);
    });
}

function updatePrimarySecondaryColors() {
    const primaryColorDiv = document.querySelector('.primary-color');
    const secondaryColorDiv = document.querySelector('.secondary-color');
    primaryColorDiv.style.backgroundColor = rgbToHex(mainColor.r, mainColor.g, mainColor.b);
    secondaryColorDiv.style.backgroundColor = rgbToHex(secondaryColor.r, secondaryColor.g, secondaryColor.b);
}

function drawPixel(x, y, color) {
    const pixelX = Math.floor(x / pixelSize);
    const pixelY = Math.floor(y / pixelSize);
    sprite[pixelX][pixelY] = color;
    mainCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    mainCtx.fillRect(x, y, pixelSize, pixelSize);
    updatePreview();
}

function updatePreview() {
    sprite.forEach((row, x) => {
        row.forEach((color, y) => {
            previewCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            previewCtx.fillRect((x * 2 + previewCanvas.width / 2 - 8), (y * 2 + previewCanvas.height / 2 - 8), 2, 2);
        });
    });
}

function fillPreviewCanvas() {
    previewCtx.fillStyle = `rgb(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b})`;
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    updatePreview();
}

function clearCanvas() {
    mainCtx.fillStyle = `rgb(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b})`;
    mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    sprite.forEach((row, x) => {
        row.forEach((_, y) => {
            sprite[x][y] = { r: secondaryColor.r, g: secondaryColor.g, b: secondaryColor.b };
        });
    });
    previewCtx.fillStyle = `rgb(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b})`;
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    updatePreview();
}

function updateMainCanvas() {
    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    sprite.forEach((row, x) => {
        row.forEach((color, y) => {
            mainCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            mainCtx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        });
    });
}

function stampSprite(x, y) {
    const offsetX = Math.floor(x / 2 - 8);
    const offsetY = Math.floor(y / 2 - 8);
    sprite.forEach((row, spriteX) => {
        row.forEach((color, spriteY) => {
            previewCtx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            previewCtx.fillRect((offsetX + spriteX) * 2, (offsetY + spriteY) * 2, 2, 2);
        });
    });
}

function tileSprite() {
    for (let i = 0; i <= previewCanvas.width; i += 16) {
        for (let j = 0; j <= previewCanvas.height; j += 16) {
            stampSprite(i, j);
        }
    }
}

function resizeCanvas(newPixelSize) {
    pixelSize = newPixelSize;
    mainCanvas.width = 8 * pixelSize;
    mainCanvas.height = 8 * pixelSize;
    mainCtx.imageSmoothingEnabled = false;
    updateMainCanvas();
}

mainCanvas.addEventListener('mousedown', (event) => {
    const x = Math.floor(event.offsetX / pixelSize) * pixelSize;
    const y = Math.floor(event.offsetY / pixelSize) * pixelSize;
    if (event.button === 0) {
        drawPixel(x, y, mainColor);
    } else if (event.button === 2) {
        drawPixel(x, y, secondaryColor);
    }
});

previewCanvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
        stampSprite(event.offsetX, event.offsetY);
    }
});

mainCanvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

palette.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

clearButton.addEventListener('click', clearCanvas);
tileButton.addEventListener('click', tileSprite);

canvasSizeDropdown.addEventListener('change', (event) => {
    resizeCanvas(parseInt(event.target.value, 10));
});

createPalette();
updatePreview();
resizeCanvas(8); // Set initial pixel size to 8x
canvasSizeDropdown.value = "8"; // Set default dropdown value to 8x
