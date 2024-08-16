import { Vector } from './vector.js';

const CANVAS_SIZE = 1000;

let canvas, ctx, field, w, h, size, columns, rows, noiseZ, particles, config, colorConfig, buffer32;

class Particle {
  constructor(x, y) {
    this.pos = new Vector(x, y);
    this.prevPos = new Vector(x, y);
    this.vel = new Vector(Math.random() - 0.5, Math.random() - 0.5);
    this.acc = new Vector(0, 0);
  }
  
  move(acc) {
    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;
    if(acc) {
      this.acc.addTo(acc);
    }
    this.vel.addTo(this.acc);
    this.pos.addTo(this.vel);
    if(this.vel.getLength() > config.particleSpeed) {
      this.vel.setLength(config.particleSpeed);
    }
    this.acc.x = 0;
    this.acc.y = 0;
  }
    
  drawLine() {
    ctx.beginPath();
    ctx.moveTo(this.prevPos.x, this.prevPos.y);
    ctx.lineTo(this.pos.x, this.pos.y);
    ctx.stroke();  
  }
  
  wrap() {
    if(this.pos.x > w) {
      this.prevPos.x = this.pos.x = 0;
    } else if(this.pos.x < 0) {
      this.prevPos.x = this.pos.x = w - 1;
    }
    if(this.pos.y > h) {
      this.prevPos.y = this.pos.y = 0;
    } else if(this.pos.y < 0) {
      this.prevPos.y = this.pos.y = h - 1;
    }
  }
}

function setup(container) {
  size = 3;
  noiseZ = 0;
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
  container.appendChild(canvas);
  
  config = {
    zoom: 50,
    noiseSpeed: 0.005,
    particleSpeed: 2,
    fieldForce: 60,
    randomForce: 20,
  };

  colorConfig = {
    particleOpacity: 0.2,
  };
  
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  
  resetCanvas(container);
  
  const resizeObserver = new ResizeObserver(() => {
    scaleCanvas(container);
  });
  resizeObserver.observe(container);
}

function resetCanvas(container) {
  if (typeof noise === 'undefined' || typeof noise.seed !== 'function') {
    console.error('Perlin noise library not loaded or incorrect');
    return;
  }
  
  noise.seed(Math.random());
  
  w = h = CANVAS_SIZE;
  
  columns = Math.floor(w / size) + 1;
  rows = Math.floor(h / size) + 1;
  initParticles();
  initField();
  drawText(() => {
    drawBackground();
    requestAnimationFrame(draw);
  });

  scaleCanvas(container);
}

function scaleCanvas(container) {
  const headerHeight = 20;
  const availableWidth = container.clientWidth;
  const availableHeight = container.clientHeight - headerHeight;
  const scale = Math.min(availableWidth / CANVAS_SIZE, availableHeight / CANVAS_SIZE);
  const scaledWidth = Math.floor(CANVAS_SIZE * scale);
  const scaledHeight = Math.floor(CANVAS_SIZE * scale);

  canvas.style.width = `${scaledWidth}px`;
  canvas.style.height = `${scaledHeight}px`;

  canvas.style.position = 'absolute';
  canvas.style.left = `${(availableWidth - scaledWidth) / 2}px`;
  canvas.style.top = `${headerHeight + (availableHeight - scaledHeight) / 2}px`;
}

function initParticles() {
  particles = [];
  let numberOfParticles = w * h / 400;
  for(let i = 0; i < numberOfParticles; i++) {
    let particle = new Particle(Math.random() * w, Math.random() * h);
    particles.push(particle);
  }
}

function draw() {
  ctx.clearRect(0, 0, w, h);
  drawBackground();
  calculateField();
  noiseZ += config.noiseSpeed;
  drawParticles();
  requestAnimationFrame(draw);
}

function initField() {
  field = new Array(columns);
  for(let x = 0; x < columns; x++) {
    field[x] = new Array(columns);
    for(let y = 0; y < rows; y++) {
      field[x][y] = new Vector(0, 0);
    }
  }  
}

function calculateField() {
  if (typeof noise === 'undefined' || typeof noise.simplex3 !== 'function') {
    console.error('Perlin noise library not loaded or incorrect');
    return;
  }

  for(let x = 0; x < columns; x++) {
    for(let y = 0; y < rows; y++) {
      let index = (y * size * w + x * size) * 4;
      let color = buffer32[index/4];
      if (color) {
        field[x][y].x = (Math.random() - 0.5) * config.randomForce * 2;
        field[x][y].y = (Math.random() - 0.5) * config.randomForce * 2;
      } else {
        field[x][y].x = noise.simplex3(x/config.zoom, y/config.zoom, noiseZ) * config.fieldForce;
        field[x][y].y = noise.simplex3(x/config.zoom + 40000, y/config.zoom + 40000, noiseZ) * config.fieldForce;
      }
    }
  }
}

function drawBackground() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, w, h);
}

function drawText(callback) {
  let logo = new Image();
  logo.crossOrigin = "anonymous";
  logo.src = "../images/vixenLogoBlack.png";
  logo.onload = () => {
    const scale = Math.min(w / logo.width, h / logo.height);
    const logoWidth = logo.width * scale;
    const logoHeight = logo.height * scale;
    const leftMargin = (w - logoWidth) / 2;
    const topMargin = (h - logoHeight) / 2;
    
    ctx.drawImage(logo, leftMargin, topMargin, logoWidth, logoHeight); 
    let image = ctx.getImageData(0, 0, w, h);
    buffer32 = new Uint32Array(image.data.buffer);
    if(callback) callback();
  };
}

function drawParticles() {
  ctx.strokeStyle = `rgba(250, 70, 2, ${colorConfig.particleOpacity})`;
  ctx.lineWidth = 2;
  particles.forEach(p => {
    let x = p.pos.x / size;
    let y = p.pos.y / size;
    let v;
    if(x >= 0 && x < columns && y >= 0 && y < rows) {
      v = field[Math.floor(x)][Math.floor(y)];
    }
    p.move(v);
    p.wrap();
    p.drawLine();
  });
}

export function initialize(container) {
  if (!container || !(container instanceof HTMLElement)) {
    console.error('Invalid container provided to Placeholder initialize function');
    return;
  }
  
  if (typeof noise === 'undefined' || typeof noise.seed !== 'function') {
    console.error('Perlin noise library not loaded or incorrect');
    return;
  }
  
  setup(container);
}