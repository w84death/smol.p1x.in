import WFC from './wfc.js';

class WFCVisualizer {
    constructor() {
        this.seedCanvas = document.getElementById('seedCanvas');
        this.outputCanvas = document.getElementById('outputCanvas');
        this.seedCtx = this.seedCanvas.getContext('2d');
        this.outputCtx = this.outputCanvas.getContext('2d');
        
        this.cellSize = 12;
        this.seedWidth = 8;
        this.seedHeight = 8;
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
        const size = parseInt(document.getElementById('sizeSelector').value);
        const wfc = new WFC(seedImage, size);
        
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
        const size = outputImage.length;
        const cellSize = Math.floor(512 / size);
        this.outputCtx.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
        
        for (let y = 0; y < outputImage.length; y++) {
            for (let x = 0; x < outputImage[y].length; x++) {
                this.outputCtx.fillStyle = outputImage[y][x] || '#FFFFFF';
                this.outputCtx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
}

new WFCVisualizer();
