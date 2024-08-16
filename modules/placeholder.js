import { Vector } from './vector.js';

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
    zoom: 100,
    noiseSpeed: 0.0071,
    particleSpeed: 1.5,
    fieldForce: 40,
    randomForce: 10,
  };

  colorConfig = {
    particleOpacity: 0.091,
  };
  
  resetCanvas(container);
  
  const resizeObserver = new ResizeObserver(() => {
    resetCanvas(container);
  });
  resizeObserver.observe(container);
}

function resetCanvas(container) {
  if (typeof noise === 'undefined' || typeof noise.seed !== 'function') {
    console.error('Perlin noise library not loaded or incorrect');
    return;
  }
  
  noise.seed(Math.random());
  
  const dpr = window.devicePixelRatio || 1;
  w = canvas.width = container.clientWidth * dpr;
  h = canvas.height = container.clientHeight * dpr;
  
  canvas.style.width = `${container.clientWidth}px`;
  canvas.style.height = `${container.clientHeight}px`;
  
  ctx.scale(dpr, dpr);
  
  columns = Math.floor(w / size) + 1;
  rows = Math.floor(h / size) + 1;
  initParticles();
  initField();
  drawText(() => {
    drawBackground();
    requestAnimationFrame(draw);
  });
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
  requestAnimationFrame(draw);
  calculateField();
  noiseZ += config.noiseSpeed;
  drawParticles();
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
      let color = buffer32[y*size * w + x*size];
      if (color) {
        field[x][y].x = (Math.random() - 0.5) * config.randomForce;
        field[x][y].y = (Math.random() - 0.5) * config.randomForce;
      } else {
        field[x][y].x = noise.simplex3(x/config.zoom, y/config.zoom, noiseZ) * config.fieldForce / 20;
        field[x][y].y = noise.simplex3(x/config.zoom + 40000, y/config.zoom + 40000, noiseZ) * config.fieldForce / 20;
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
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.min(w / (logo.width * dpr), h / (logo.height * dpr));
    const logoWidth = logo.width * scale;
    const logoHeight = logo.height * scale;
    const leftMargin = (w / dpr - logoWidth) / 2;
    const topMargin = (h / dpr - logoHeight) / 2;
    
    ctx.drawImage(logo, leftMargin, topMargin, logoWidth, logoHeight); 
    let image = ctx.getImageData(0, 0, w / dpr, h / dpr);
    buffer32 = new Uint32Array(image.data.buffer);
    if(callback) callback();
  };
}

function drawParticles() {
  ctx.strokeStyle = `rgba(255, 0, 74, ${colorConfig.particleOpacity})`;
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