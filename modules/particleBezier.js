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
    const currentLength = this.getLength();
    if (currentLength !== 0) {
      this.x = (this.x / currentLength) * length;
      this.y = (this.y / currentLength) * length;
    }
  }

  getLength() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}

class Particle {
  constructor(x, y) {
    this.pos = new Vector(x, y);
    this.vel = new Vector(0, 0);
    this.acc = new Vector(0, 0);
    this.color = "rgba(255, 0, 74, 0.1)";
    this.lifespan = 0;
  }
  
  update() {
    this.vel.addTo(this.acc);
    this.vel.setLength(Math.min(this.vel.getLength(), 0.5));
    this.pos.addTo(this.vel);
    this.acc.x = 0;
    this.acc.y = 0;
    this.lifespan++;
  }
  
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.pos.x, this.pos.y, 0.5, 0.5);
  }
}

let canvas, ctx, w, h;
let particles = [];
let logoData;
let noiseScale = 0.002;
let logoCenter = { x: 0, y: 0 };
let logoSize = { width: 0, height: 0 };

function setup(container) {
  canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);
  ctx = canvas.getContext("2d");
  
  window.addEventListener("resize", resize);
  resize();
  
  loadLogo(() => {
    initParticles();
    draw();
  });
}

function resize() {
  w = canvas.width = canvas.offsetWidth;
  h = canvas.height = canvas.offsetHeight;
}

function loadLogo(callback) {
  const logo = new Image();
  logo.onload = () => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = w;
    tempCanvas.height = h;
    
    const scale = Math.min(w / logo.width, h / logo.height) * 0.6;
    logoSize.width = logo.width * scale;
    logoSize.height = logo.height * scale;
    logoCenter.x = w / 2;
    logoCenter.y = h / 2;
    const x = logoCenter.x - logoSize.width / 2;
    const y = logoCenter.y - logoSize.height / 2;
    
    tempCtx.drawImage(logo, x, y, logoSize.width, logoSize.height);
    logoData = tempCtx.getImageData(0, 0, w, h).data;
    callback();
  };
  logo.src = "../images/vixenLogoBlack.png";
}

function initParticles() {
  particles = [];
  for (let i = 0; i < 20000; i++) {
    const x = logoCenter.x + (Math.random() - 0.5) * logoSize.width * 1.2;
    const y = logoCenter.y + (Math.random() - 0.5) * logoSize.height * 1.2;
    particles.push(new Particle(x, y));
  }
}

function draw() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, w, h);
  
  particles.forEach(p => {
    const index = (Math.floor(p.pos.y) * w + Math.floor(p.pos.x)) * 4;
    if (logoData[index] > 0) {
      p.acc = new Vector((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05);
      p.color = "rgba(255, 0, 74, 0.3)";
    } else {
      const noise = noise3D(p.pos.x * noiseScale, p.pos.y * noiseScale, performance.now() * 0.0001);
      p.acc = new Vector(Math.cos(noise * Math.PI * 2) * 0.01, Math.sin(noise * Math.PI * 2) * 0.01);
      p.color = "rgba(255, 255, 255, 0.1)";
    }
    p.update();
    p.draw();

    if (p.lifespan > 300 || 
        p.pos.x < logoCenter.x - logoSize.width * 0.7 || 
        p.pos.x > logoCenter.x + logoSize.width * 0.7 || 
        p.pos.y < logoCenter.y - logoSize.height * 0.7 || 
        p.pos.y > logoCenter.y + logoSize.height * 0.7) {
      const x = logoCenter.x + (Math.random() - 0.5) * logoSize.width * 1.2;
      const y = logoCenter.y + (Math.random() - 0.5) * logoSize.height * 1.2;
      p.pos = new Vector(x, y);
      p.vel = new Vector(0, 0);
      p.lifespan = 0;
    }
  });
  
  requestAnimationFrame(draw);
}

export function initialize(container) {
  setup(container);
}