import { createNoise3D } from 'https://cdn.skypack.dev/simplex-noise@4.0.1';

const noise3D = createNoise3D();

// ... (Vector and Particle classes remain the same)

let canvas;
let ctx;
let field;
let w, h;
let size;
let columns;
let rows;
let noiseZ;
let particles;
let config;
let colorConfig;
let buffer32;

function setup(container, callback) {
  console.log('Setup started');
  size = 3;
  noiseZ = 0;
  canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);
  ctx = canvas.getContext("2d", { willReadFrequently: true });
  window.addEventListener("resize", () => reset(callback));  
  config = {
    zoom: 100,
    noiseSpeed: 0.0071,
    particleSpeed: 1.5,
    fieldForce: 40,
    randomForce: 10,
  };

  colorConfig = {
    particleOpacity: 0.091,
  };
  reset(callback);
}

function reset(callback) {
  console.log('Reset called');
  w = canvas.width = canvas.offsetWidth;
  h = canvas.height = canvas.offsetHeight;
  columns = Math.floor(w / size) + 1;
  rows = Math.floor(h / size) + 1;
  initParticles();
  initField();
  drawText(() => {
    drawBackground();
    if(callback) callback();
  });
}

function initParticles() {
  console.log('Initializing particles');
  particles = [];
  let numberOfParticles = w * h / 800;
  for(let i = 0; i < numberOfParticles; i++) {
    let particle = new Particle(
      w/2 + Math.random()*400-200, 
      h/2 + Math.random()*400-200);
    particles.push(particle);
  }
}

function initField() {
  console.log('Initializing field');
  field = new Array(columns);
  for(let x = 0; x < columns; x++) {
    field[x] = new Array(columns);
    for(let y = 0; y < rows; y++) {
      field[x][y] = new Vector(0, 0);
    }
  }  
}

function calculateField() {
  let x1;
  let y1;
  for(let x = 0; x < columns; x++) {
    for(let y = 0; y < rows; y++) {
      let color = buffer32[y*size * w + x*size];
      if (color) {
        x1 = (Math.random()-0.5) * config.randomForce;
        y1 = (Math.random()-0.5) * config.randomForce;
      } else {
        x1 = noise3D(x/config.zoom, y/config.zoom, noiseZ) * config.fieldForce / 20;
        y1 = noise3D(x/config.zoom + 40000, y/config.zoom + 40000, noiseZ) * config.fieldForce / 20;
      }
      field[x][y].x = x1;
      field[x][y].y = y1;
    }
  }
}

function drawBackground() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, w, h);
}

function drawText(callback) {
  console.log('Drawing text');
  let logo = new Image();
  logo.crossOrigin = "anonymous";
  logo.src = "../images/vixenLogoBlack.png";
  logo.onload = () => {
    console.log('Image loaded');
    let leftMargin = (w - logo.width) / 2;
    let topMargin = (h - logo.height) / 2;
    ctx.drawImage(logo, leftMargin, topMargin); 
    let image = ctx.getImageData(0, 0, w, h);
    buffer32 = new Uint32Array(image.data.buffer);
    if(callback) callback();
  };
  logo.onerror = (e) => {
    console.error('Error loading image:', e);
    if(callback) callback();
  };
}

function drawParticles() {
  ctx.strokeStyle = `rgba(255, 0, 74, ${colorConfig.particleOpacity})`;
  let x;
  let y;
  particles.forEach(p => {
    x = p.pos.x / size;
    y = p.pos.y / size;
    let v;
    if(x >= 0 && x < columns && y >= 0 && y < rows) {
      v = field[Math.floor(x)][Math.floor(y)];
    }
    p.move(v);
    p.wrap();
    p.drawLine();
  });
}

function draw() {
  requestAnimationFrame(draw);
  calculateField();
  noiseZ += config.noiseSpeed;
  drawBackground();  // Add this line to refresh the background
  drawParticles();
}

export function initialize(container) {
  console.log('Initializing particleBezier');
  setup(container, () => {
    console.log('Setup complete, starting draw loop');
    draw();
  });
}