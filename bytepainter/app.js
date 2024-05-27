window.onload = function() {
    const drawingCanvas = document.getElementById('drawingCanvas');
    const previewCanvas = document.getElementById('previewCanvas');
    const ctx = drawingCanvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    const colorPalette = document.getElementById('paletteBox');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    const outputPanel = document.getElementById('outputPanel');
    let isDrawing = false, startX, startY, currentColor = '#000000';

    // Minimum and maximum rectangle dimensions
    const minSize = 4;
    const maxSize = 255;

    // Populate color palette with VGA default colors
    const colors = ['#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA', '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'];
    colors.forEach(color => {
        const colorDiv = document.createElement('div');
        colorDiv.style.backgroundColor = color;
        colorDiv.onclick = () => {
            currentColor = color;
            previewCtx.fillStyle = color;
        };
        colorPalette.appendChild(colorDiv);
    });

    // Mouse events for drawing
    previewCanvas.onmousedown = function(e) {
        startX = e.offsetX;
        startY = e.offsetY;
        isDrawing = true;
    };

    previewCanvas.onmousemove = function(e) {
        if (isDrawing) {
            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            let width = e.offsetX - startX;
            let height = e.offsetY - startY;
            if (width >= minSize && height >= minSize && width <= maxSize && height <= maxSize) {
                previewCtx.fillStyle = currentColor;
            }else{
                previewCtx.fillStyle = '#ff000030';
            }
            previewCtx.fillRect(startX, startY, width, height);
        }
    };

    previewCanvas.onmouseup = function(e) {
        isDrawing = false;
        let width = e.offsetX - startX;
        let height = e.offsetY - startY;

        if (width >= minSize && height >= minSize && width <= maxSize && height <= maxSize) {
            ctx.fillStyle = currentColor;
            ctx.fillRect(startX, startY, width, height);
            appendOutput(currentColor, startX, startY, width, height);
        }
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    };

    // Append rectangle definition to output panel
    function appendOutput(colorIndex, x, y, w, h) {
        outputPanel.value += `${colorIndex}, ${x}/${y}, ${w}x${h}\n`;
    }

    // Clear canvas button functionality
    clearBtn.onclick = function() {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        outputPanel.value = '';
    };

    // Export button functionality
    exportBtn.onclick = function() {
        const imageData = drawingCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'bytePainter.png';
        link.href = imageData;
        link.click();
    };
};
