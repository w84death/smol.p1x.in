import WFC from './wfc.js';

class WFCVisualizer {
    constructor() {
        this.seedCanvas = document.getElementById('seedCanvas');
        this.outputCanvas = document.getElementById('outputCanvas');
        this.seedCtx = this.seedCanvas.getContext('2d');
        this.outputCtx = this.outputCanvas.getContext('2d');
        
        this.cellSize = 12;
        this.seedWidth = 9;
        this.seedHeight = 9;
        this.currentColor = '#000000';
        this.isDrawing = false;
        this.isCalculating = false;
        this.stopRequested = false;
        
        this.initializeEvents();
        this.clearSeed();
    }

    initializeEvents() {
        this.seedCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.seedCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.seedCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.seedCanvas.addEventListener('mouseleave', () => this.stopDrawing());

        document.getElementById('clearSeed').addEventListener('click', () => this.clearSeed());
        document.getElementById('generate').addEventListener('click', () => this.generate());
        document.getElementById('stop').addEventListener('click', () => this.stopCalculation());
        document.getElementById('saveSeed').addEventListener('click', () => this.saveSeed());
        document.getElementById('loadSeed').addEventListener('click', () => this.loadSeed());

        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.currentColor = getComputedStyle(e.target).backgroundColor;
            });
        });
        // Select first color by default
        document.querySelector('.color-btn').click();
    }

    saveSeed() {
        const dataURL = this.seedCanvas.toDataURL();
        localStorage.setItem('savedSeed', dataURL);
        alert("Seed saved!");
    }

    loadSeed() {
        const dataURL = localStorage.getItem('savedSeed');
        if (dataURL) {
            const img = new Image();
            img.onload = () => {
                this.seedCtx.clearRect(0, 0, this.seedCanvas.width, this.seedCanvas.height);
                this.seedCtx.drawImage(img, 0, 0);
            };
            img.src = dataURL;
        } else {
            alert("No saved seed found.");
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.draw(e);
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.seedCanvas.getBoundingClientRect();
        const scaleX = this.seedCanvas.width / rect.width;
        const scaleY = this.seedCanvas.height / rect.height;
        
        const x = Math.floor(((e.clientX - rect.left) * scaleX) / this.cellSize);
        const y = Math.floor(((e.clientY - rect.top) * scaleY) / this.cellSize);

        if (x >= 0 && x < this.seedWidth && y >= 0 && y < this.seedHeight) {
            this.seedCtx.fillStyle = this.currentColor;
            this.seedCtx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
        }
    }

    clearSeed() {
        this.seedCtx.fillStyle = '#FFFFFF';
        this.seedCtx.fillRect(0, 0, this.seedCanvas.width, this.seedCanvas.height);
    }

    getSeedImageData() {
        const imageData = new Array(this.seedHeight);
        for (let y = 0; y < this.seedHeight; y++) {
            imageData[y] = new Array(this.seedWidth);
            for (let x = 0; x < this.seedWidth; x++) {
                const pixel = this.seedCtx.getImageData(x * this.cellSize, y * this.cellSize, 1, 1).data;
                imageData[y][x] = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
            }
        }
        return imageData;
    }

    stopCalculation() {
        this.stopRequested = true;
        document.getElementById('stop').disabled = true;
        document.getElementById('generate').disabled = false;
        document.getElementById('sizeSelector').disabled = false;
    }

    generate() {
        const seedImage = this.getSeedImageData();
        // Parse dimension pair (e.g. "64x32") instead of single integer
        const [width, height] = document.getElementById('sizeSelector')
            .value.split('x').map(Number);

        const wfc = new WFC(seedImage, width, height);
        
        this.isCalculating = true;
        this.stopRequested = false;
        document.getElementById('stop').disabled = false;
        document.getElementById('generate').disabled = true;
        document.getElementById('sizeSelector').disabled = true;
        
        const animate = () => {
            if (this.stopRequested) {
                this.isCalculating = false;
                return;
            }

            const done = wfc.collapse();
            this.drawOutput(wfc.outputImage);
            
            if (!done) {
                requestAnimationFrame(animate);
            } else {
                this.isCalculating = false;
                document.getElementById('stop').disabled = true;
                document.getElementById('generate').disabled = false;
                document.getElementById('sizeSelector').disabled = false;
            }
        };
        
        animate();
    }

    drawOutput(outputImage) {
        const height = outputImage.length; 
        const width = outputImage[0].length; 
        const ratio = width / height;
        
        // Increased max dimension from 512 to 768
        let canvasWidth = 768, canvasHeight = 768;
        if (ratio > 1) {
            canvasHeight = Math.floor(768 / ratio);
        } else if (ratio < 1) {
            canvasWidth = Math.floor(768 * ratio);
        }
        
        this.outputCanvas.width = canvasWidth;
        this.outputCanvas.height = canvasHeight;
        this.outputCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        const cellSizeX = canvasWidth / width;
        const cellSizeY = canvasHeight / height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                this.outputCtx.fillStyle = outputImage[y][x] || '#FFFFFF';
                this.outputCtx.fillRect(x * cellSizeX, y * cellSizeY, cellSizeX, cellSizeY);
            }
        }
    }
}

new WFCVisualizer();
