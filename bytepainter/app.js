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
            previewCtx.fillRect(startX, startY, width, height);
        }
    };

    previewCanvas.onmouseup = function(e) {
        isDrawing = false;
        let width = e.offsetX - startX;
        let height = e.offsetY - startY;
        ctx.fillStyle = currentColor;
        ctx.fillRect(startX, startY, width, height);
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        appendOutput(currentColor, startX, startY, startX + width, startY + height);
    };

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

    // Append rectangle definition to output panel
    function appendOutput(color, x1, y1, x2, y2) {
        outputPanel.value += `Color: ${color}, Start: (${x1}, ${y1}), End: (${x2}, ${y2})\n`;
    }
};
