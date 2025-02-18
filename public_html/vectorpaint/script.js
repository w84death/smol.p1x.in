const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const paths = [];
let startPoint = null;
let currentPath = null;
let backgroundImage = null;
let fillColor = '#ffffff';

document.getElementById('backgroundImageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        backgroundImage = img;
        drawPaths();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('fillColorInput').addEventListener('input', (e) => {
  fillColor = e.target.value;
  drawPaths();
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.round((e.clientX - rect.left) * scaleX);
  const y = Math.round((e.clientY - rect.top) * scaleY);

  if (!startPoint) {
    startPoint = { x, y };
    currentPath = [{ x, y }];
    paths.push(currentPath);
  } else {
    currentPath.push({ x, y });
    if (!e.shiftKey) {
      startPoint = null;
      currentPath = null;
    } else {
      startPoint = { x, y };
    }
    drawPaths();
    updateDataOutput();
  }
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  startPoint = null;
  drawPaths();
});

canvas.addEventListener('mousemove', (e) => {
  if (!startPoint) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  drawPaths();

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.restore();
});

document.getElementById('redoButton').addEventListener('click', () => {
  if (currentPath && currentPath.length > 1) {
    currentPath.pop();
    if (currentPath.length === 1) {
      paths.pop();
      startPoint = null;
      currentPath = null;
    }
  } else if (paths.length > 0) {
    const lastPath = paths[paths.length - 1];
    lastPath.pop();
    if (lastPath.length === 1) {
      paths.pop();
    }
  }
  drawPaths();
  updateDataOutput();
});

document.getElementById('clearButton').addEventListener('click', () => {
  paths.length = 0;
  startPoint = null;
  currentPath = null;
  drawPaths();
  updateDataOutput();
});

document.getElementById('panLeftButton').addEventListener('click', () => panCanvas(-4, 0));
document.getElementById('panUpButton').addEventListener('click', () => panCanvas(0, -4));
document.getElementById('panDownButton').addEventListener('click', () => panCanvas(0, 4));
document.getElementById('panRightButton').addEventListener('click', () => panCanvas(4, 0));

// Add this after other event listeners
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    if (currentPath && currentPath.length > 1) {
      currentPath.pop();
      if (currentPath.length === 1) {
        paths.pop();
        startPoint = null;
        currentPath = null;
      }
    } else if (paths.length > 0) {
      const lastPath = paths[paths.length - 1];
      lastPath.pop();
      if (lastPath.length === 1) {
        paths.pop();
      }
    }
    drawPaths();
    updateDataOutput();
  }
});

document.getElementById('loadButton').addEventListener('click', () => {
  const data = document.getElementById('dataInput').value;  // Changed from dataOutput to dataInput
  const lines = data.split('\n');
  paths.length = 0;
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith('db')) {
      const numLines = parseInt(line.split(' ')[1]);
      if (numLines === 0) break;
      
      i++;
      const pointsData = lines[i].substring(3).split(',').map(x => parseInt(x.trim()));
      const path = [];
      
      for (let j = 0; j < pointsData.length; j += 2) {
        path.push({
          x: pointsData[j],
          y: pointsData[j + 1]
        });
      }
      
      paths.push(path);
    }
    i++;
  }
  
  startPoint = null;
  currentPath = null;
  drawPaths();
  updateDataOutput();  // Added this line to update the output textarea
});

function panCanvas(dx, dy) {
  for (const path of paths) {
    for (const point of path) {
      point.x += dx;
      point.y += dy;
    }
  }
  drawPaths();
  updateDataOutput();
}

function drawPaths() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  }
  ctx.strokeStyle = fillColor;
  ctx.beginPath();
  for (const path of paths) {
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
  }
  ctx.stroke();
}

function updateDataOutput() {
  let data = '';
  let dataSize = 0;
  for (const path of paths) {
    const numLines = path.length - 1;
    data += `db ${numLines}\ndb `;
    for (const point of path) {
      data += `${point.x}, ${point.y}, `;
      dataSize += 2;
    }
    data = data.slice(0, -2);
    data += '\n';
  }
  data += 'db 0\n';
  dataSize += 1;
  document.getElementById('dataOutput').value = data;
  document.getElementById('dataSize').textContent = `Data size: ${dataSize} bytes`;
}
