import { Vector } from './vector.js';
import { noise } from './perlinNoise.js';

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

function setup() {
    size = 3;
    noiseZ = 0;
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    document.querySelector('.window-content').appendChild(canvas);
    
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
    
    reset();
  }
  
  function reset() {
    noise.seed(Math.random());
    
    // Set canvas size to match the window content size
    const container = document.querySelector('.window-content');
    w = canvas.width = container.clientWidth;
    h = canvas.height = container.clientHeight;
    
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
    let numberOfParticles = w * h / 400; // Adjust this value to control particle density
    for(let i = 0; i < numberOfParticles; i++) {
      let particle = new Particle(
        Math.random() * w, 
        Math.random() * h
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
    
    setup();
  }