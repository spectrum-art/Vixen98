import { createNoise3D } from 'https://cdn.skypack.dev/simplex-noise@4.0.1';

const noise3D = createNoise3D();

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  addTo(v) {
    this.x += v.x;
    this.y += v.y;
  }

  setLength(length) {
    let angle = this.getAngle();
    this.x = Math.cos(angle) * length;
    this.y = Math.sin(angle) * length;
  }

  getLength() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  getAngle() {
    return Math.atan2(this.y, this.x);
  }
}

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
let imageRect;

function setup(container) {
  size = 1;  // Reduced size for higher resolution
  noiseZ = 0;
  canvas = document.createElement('canvas');
  container.appendChild(canvas);
  ctx = canvas.getContext("2d");
  config = {
    zoom: 200,  // Increased zoom for finer detail
    noiseSpeed: 0.0035,  // Reduced speed to match higher resolution
    particleSpeed: 0.75,  // Reduced speed to match higher resolution
    fieldForce: 20,  // Adjusted force
    randomForce: 5,  // Adjusted force
  };

  colorConfig = {
    particleOpacity: 0.05,  // Reduced opacity for more subtle effect
  };
  
  // Scale up canvas size
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  
  reset();
}

function reset() {
  w = canvas.width = canvas.offsetWidth * 2;  // Double the canvas resolution
  h = canvas.height = canvas.offsetHeight * 2;
  columns = Math.floor(w / size) + 1;
  rows = Math.floor(h / size) + 1;
  initField();
  drawText(() => {
    drawBackground();
    initParticles();
    draw();
  });
}

function initParticles() {
  particles = [];
  let numberOfParticles = imageRect.width * imageRect.height / 100;  // Adjust particle density
  for(let i = 0; i < numberOfParticles; i++) {
    let particle = new Particle(
      imageRect.x + Math.random() * imageRect.width, 
      imageRect.y + Math.random() * imageRect.height
    );
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
  let logo = new Image();
  logo.crossOrigin = "anonymous";
  logo.src = "../images/vixenLogoBlack.png";
  logo.onload = () => {
    let scale = Math.min(w / logo.width, h / logo.height) * 0.8;
    let scaledWidth = Math.floor(logo.width * scale);
    let scaledHeight = Math.floor(logo.height * scale);
    let leftMargin = Math.floor((w - scaledWidth) / 2);
    let topMargin = Math.floor((h - scaledHeight) / 2);
    
    imageRect = {
      x: leftMargin,
      y: topMargin,
      width: scaledWidth,
      height: scaledHeight
    };
    
    ctx.drawImage(logo, leftMargin, topMargin, scaledWidth, scaledHeight);
    let image = ctx.getImageData(0, 0, w, h);
    buffer32 = new Uint32Array(image.data.buffer);
    if(callback) callback();
  };
}

function drawParticles() {
  ctx.strokeStyle = `rgba(255, 0, 74, ${colorConfig.particleOpacity})`;
  ctx.lineWidth = 0.5;  // Thinner lines for more detail
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

export { setup };