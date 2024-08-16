import { createNoise3D } from 'https://cdn.skypack.dev/simplex-noise@4.0.1';

export function initialize(container, params = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        console.error('Invalid container provided to Placeholder initialize function');
        return;
    }

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const noise3D = createNoise3D();
    let w, h, size, columns, rows, noiseZ, particles, field, buffer32;
    const config = {
        zoom: 100,
        noiseSpeed: 0.002,
        particleSpeed: 0.5,
        fieldForce: 20,
        randomForce: 5,
        particleOpacity: 0.3
    };

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
            const current = Math.sqrt(this.x * this.x + this.y * this.y);
            if (current !== 0) {
                this.x = (this.x / current) * length;
                this.y = (this.y / current) * length;
            }
        }

        getLength() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
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
            if (acc) {
                this.acc.addTo(acc);
            }
            this.vel.addTo(this.acc);
            this.pos.addTo(this.vel);
            if (this.vel.getLength() > config.particleSpeed) {
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
            if (this.pos.x > w) {
                this.prevPos.x = this.pos.x = 0;
            } else if (this.pos.x < 0) {
                this.prevPos.x = this.pos.x = w - 1;
            }
            if (this.pos.y > h) {
                this.prevPos.y = this.pos.y = 0;
            } else if (this.pos.y < 0) {
                this.prevPos.y = this.pos.y = h - 1;
            }
        }
    }

    function setup() {
        size = 3;
        noiseZ = 0;
        resize();
        window.addEventListener('resize', resize);
        initParticles();
        initField();
        drawLogo(() => {
            drawBackground();
            requestAnimationFrame(draw);
        });
    }

    function resize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const size = Math.min(windowWidth * 0.675, windowHeight * 0.9);
        w = h = canvas.width = canvas.height = size;
        columns = Math.floor(w / size) + 1;
        rows = Math.floor(h / size) + 1;
    }

    function initParticles() {
        particles = [];
        const numberOfParticles = w * h / 1000;
        for (let i = 0; i < numberOfParticles; i++) {
            particles.push(new Particle(Math.random() * w, Math.random() * h));
        }
    }

    function initField() {
        field = new Array(columns);
        for (let x = 0; x < columns; x++) {
            field[x] = new Array(columns);
            for (let y = 0; y < rows; y++) {
                field[x][y] = new Vector(0, 0);
            }
        }  
    }

    function calculateField() {
        for (let x = 0; x < columns; x++) {
            for (let y = 0; y < rows; y++) {
                let color = buffer32[y * size * w + x * size];
                let x1, y1;
                if (color) {
                    x1 = (Math.random() - 0.5) * config.randomForce;
                    y1 = (Math.random() - 0.5) * config.randomForce;
                } else {
                    x1 = noise3D(x / config.zoom, y / config.zoom, noiseZ) * config.fieldForce;
                    y1 = noise3D(x / config.zoom + 40000, y / config.zoom + 40000, noiseZ) * config.fieldForce;
                }
                field[x][y].x = x1;
                field[x][y].y = y1;
            }
        }
    }

    function drawBackground() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, w, h);
    }

    function drawLogo(callback) {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.src = '../images/vixenLogoBlack.png';
        logo.onload = () => {
            const scale = Math.min(w / logo.width, h / logo.height) * 0.8;
            const logoWidth = logo.width * scale;
            const logoHeight = logo.height * scale;
            const leftMargin = (w - logoWidth) / 2;
            const topMargin = (h - logoHeight) / 2;
            ctx.drawImage(logo, leftMargin, topMargin, logoWidth, logoHeight); 
            const image = ctx.getImageData(0, 0, w, h);
            buffer32 = new Uint32Array(image.data.buffer);
            if (callback) callback();
        };
    }

    function drawParticles() {
        ctx.strokeStyle = `rgba(255, 0, 74, ${config.particleOpacity})`;
        particles.forEach(p => {
            const x = p.pos.x / size;
            const y = p.pos.y / size;
            let v;
            if (x >= 0 && x < columns && y >= 0 && y < rows) {
                v = field[Math.floor(x)][Math.floor(y)];
            }
            p.move(v);
            p.wrap();
            p.drawLine();
        });
    }

    function draw() {
        calculateField();
        noiseZ += config.noiseSpeed;
        drawParticles();
        requestAnimationFrame(draw);
    }

    setup();
}