const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const wordsDisplay = document.getElementById('words');
const inputDisplay = document.getElementById('inputDisplay');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOver');
const finalScore = document.getElementById('finalScore');
const toggleDarkModeBtn = document.getElementById('toggleDarkMode');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const words = [
    'apple', 'banana', 'cherry', 'date', 'fig', 'grape', 'lemon',
    'mango', 'nectarine', 'orange', 'papaya', 'quince', 'raspberry', 'strawberry',
    'tangerine', 'ugli', 'vanilla', 'watermelon', 'xigua', 'yellowfruit', 'zucchini',
    'apricot', 'blackberry', 'blueberry', 'cantaloupe', 'dragonfruit', 'elderberry',
    'feijoa', 'gooseberry', 'honeydew', 'jackfruit', 'kiwi', 'lime', 'mandarin',
    'mulberry', 'olive', 'peach', 'pear', 'plum', 'pomegranate', 'pumpkin',
    'redcurrant', 'starfruit', 'tomato', 'uglifruit', 'voavanga', 'wolfberry',
    'yumberry', 'zinfandel',
    'avocado', 'blackcurrant', 'coconut', 'cranberry', 'cucumber', 'damson', 'durian',
    'elderflower', 'fig', 'grapefruit', 'guava', 'huckleberry', 'jabuticaba', 'jujube',
    'kiwano', 'kumquat', 'longan', 'lychee', 'mangosteen', 'melon', 'miraclefruit',
    'nance', 'nectar', 'olive', 'passionfruit', 'peach', 'persimmon', 'pineapple',
    'plantain', 'pluot', 'pomelo', 'pricklypear', 'quenepa', 'rambutan', 'rowan',
    'salak', 'satsuma', 'soursop', 'tamarind', 'tangelo', 'tayberry', 'ugni', 'wampee',
    'whortleberry', 'yacon', 'yangmei', 'ziziphus', 'zabala', 'zapote'
];
let fallingWords = [];
let input = '';
let gameOver = false;
const wordSpeed = 2;
let wordsSpawned = 0;
let wordsCleared = 0;
let spawnRate = 2000;
let score = 0;
let usedBackspace = false;

class Word {
    constructor(text) {
        this.text = text;
        const textWidth = ctx.measureText(this.text).width;
        this.x = Math.random() * (canvas.width - textWidth);
        this.y = 0;
    }
    draw() {
        ctx.font = '20px Arial';
        ctx.fillStyle = document.body.classList.contains('dark') ? 'white' : 'black';
        ctx.fillText(this.text, this.x, this.y);
    }
    update() {
        this.y += wordSpeed;
    }
}

function spawnWord() {
    const text = words[Math.floor(Math.random() * words.length)];
    fallingWords.push(new Word(text));
    wordsSpawned++;
    
    // Increase spawn rate every 10 words
    if (wordsSpawned % 10 === 0 && spawnRate > 250) {
        clearInterval(spawnInterval);
        spawnRate -= 250;
        spawnInterval = setInterval(spawnWord, spawnRate);
    }
}

function updateGame() {
    if (gameOver) {
        gameOverScreen.style.display = 'block';
        finalScore.textContent = score;
        clearInterval(spawnInterval);
        return;    
    };
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = fallingWords.length - 1; i >= 0; i--) {
        const word = fallingWords[i];
        word.update();
        word.draw();
        if (word.y > canvas.height) {
            gameOver = true;
        }
    }
    
    wordsDisplay.textContent = `${wordsCleared} of ${wordsSpawned}`;
    inputDisplay.textContent = input;
    scoreDisplay.textContent = `${score} 🌟`;
}

function checkInput() {
    for (let i = 0; i < fallingWords.length; i++) {
        if (fallingWords[i].text === input) {
            let wordScore = fallingWords[i].text.length;
            score += usedBackspace ? Math.floor(wordScore / 2) : wordScore;
            fallingWords.splice(i, 1);
            wordsCleared++;
            input = '';
            usedBackspace = false;
            break;
        }
    }
}

function restartGame() {
    fallingWords = [];
    input = '';
    gameOver = false;
    wordsSpawned = 0;
    wordsCleared = 0;
    spawnRate = 2000;
    score = 0;
    gameOverScreen.style.display = 'none';
    spawnInterval = setInterval(spawnWord, spawnRate);
}

window.addEventListener('keydown', (e) => {
    if (gameOver) {
        if (e.key.toLowerCase() === 'r') {
            restartGame();
        }
        return;
    }
    if (e.key === 'Backspace') {
        input = input.slice(0, -1);
        usedBackspace = true;
    } else if (e.key === 'Enter') {
        checkInput();
        e.preventDefault();
    } else if (e.key.length === 1) {
        input += e.key;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark');
    }
});

toggleDarkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    if (document.body.classList.contains('dark')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
    toggleDarkModeBtn.blur();
});

let spawnInterval = setInterval(spawnWord, spawnRate);
setInterval(updateGame, 20);
