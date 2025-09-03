class WFC {
    constructor(seedImage, width = 32, height = 32) {
        this.seedImage = seedImage;
        this.rules = this.generateRules();
        this.outputImage = this.initializeOutputImage(width, height);
        this.entropy = this.initializeEntropy(width, height);
    }

    generateRules() {
        const rules = {
            up: {}, down: {}, left: {}, right: {}
        };

        for (let y = 0; y < this.seedImage.length; y++) {
            for (let x = 0; x < this.seedImage[y].length; x++) {
                const color = this.seedImage[y][x];
                
                // Initialize if not exists
                ['up', 'down', 'left', 'right'].forEach(dir => {
                    if (!rules[dir][color]) rules[dir][color] = new Set();
                });

                // Check adjacent cells
                if (y > 0) rules.up[color].add(this.seedImage[y-1][x]);
                if (y < this.seedImage.length-1) rules.down[color].add(this.seedImage[y+1][x]);
                if (x > 0) rules.left[color].add(this.seedImage[y][x-1]);
                if (x < this.seedImage[y].length-1) rules.right[color].add(this.seedImage[y][x+1]);
            }
        }

        // Convert Sets to Arrays
        Object.keys(rules).forEach(dir => {
            Object.keys(rules[dir]).forEach(color => {
                rules[dir][color] = Array.from(rules[dir][color]);
            });
        });

        return rules;
    }

    initializeOutputImage(width, height) {
        return Array(height).fill(null).map(() => Array(width).fill(null));
    }

    initializeEntropy(width, height) {
        return Array(height).fill(null).map(() => 
            Array(width).fill(null).map(() => 
                new Set(this.getAllColors())
            )
        );
    }

    getAllColors() {
        const colors = new Set();
        this.seedImage.forEach(row => 
            row.forEach(color => colors.add(color))
        );
        return Array.from(colors);
    }

    findLowestEntropyCell() {
        let minEntropy = Infinity;
        let cells = [];

        for (let y = 0; y < this.entropy.length; y++) {
            for (let x = 0; x < this.entropy[y].length; x++) {
                if (this.outputImage[y][x] !== null) continue;
                
                const entropy = this.entropy[y][x].size;
                if (entropy === 0) continue;
                
                if (entropy < minEntropy) {
                    minEntropy = entropy;
                    cells = [[x, y]];
                } else if (entropy === minEntropy) {
                    cells.push([x, y]);
                }
            }
        }

        if (cells.length === 0) return null;
        return cells[Math.floor(Math.random() * cells.length)];
    }

    updateEntropyAt(x, y) {
        const color = this.outputImage[y][x];
        const directions = [
            [0, -1, 'up'], [0, 1, 'down'],
            [-1, 0, 'left'], [1, 0, 'right']
        ];

        directions.forEach(([dx, dy, dir]) => {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < this.outputImage[0].length &&
                ny >= 0 && ny < this.outputImage.length &&
                this.outputImage[ny][nx] === null) {
                
                const validColors = this.rules[dir][color] || [];
                this.entropy[ny][nx] = new Set(
                    Array.from(this.entropy[ny][nx]).filter(c => validColors.includes(c))
                );
            }
        });
    }

    collapse() {
        const cell = this.findLowestEntropyCell();
        if (!cell) return true;

        const [x, y] = cell;
        const possibilities = Array.from(this.entropy[y][x]);
        if (possibilities.length === 0) return true;

        const color = possibilities[Math.floor(Math.random() * possibilities.length)];
        this.outputImage[y][x] = color;
        this.updateEntropyAt(x, y);

        return false;
    }
}

export default WFC;
