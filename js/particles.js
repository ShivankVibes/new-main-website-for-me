/**
 * particles.js — Canvas particle system + mouse spotlight
 * Lightweight, no external dependencies
 */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
  const isTouchDevice = window.matchMedia('(hover: none)').matches;

  // ── Mouse Spotlight ──────────────────────────────────────────────────────────
  const spotlight = document.getElementById('mouse-spotlight');
  if (spotlight && !isTouchDevice) {
    document.addEventListener('mousemove', (e) => {
      spotlight.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(59,130,246,0.06), transparent 70%)`;
    });
    document.addEventListener('mouseleave', () => {
      spotlight.style.background = 'transparent';
    });
  }

  // ── Particles Canvas ─────────────────────────────────────────────────────────
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], mouse = { x: -9999, y: -9999 };
  const PARTICLE_COUNT = prefersReduced ? 0 : (isSmallScreen || isTouchDevice ? 32 : 90);
  const LINE_THRESHOLD = isSmallScreen ? 95 : 130;
  const MOUSE_THRESHOLD = 150;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function randomBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = randomBetween(0, W);
      this.y = randomBetween(0, H);
      this.vx = randomBetween(-0.3, 0.3);
      this.vy = randomBetween(-0.3, 0.3);
      this.radius = randomBetween(1, 2.5);
      this.baseOpacity = randomBetween(0.2, 0.6);
      this.opacity = this.baseOpacity;
      // Color: mostly blue, some purple
      this.color = Math.random() > 0.6
        ? `rgba(139,92,246,${this.opacity})`   // purple
        : `rgba(59,130,246,${this.opacity})`;   // blue
    }

    update() {
      // Drift toward mouse slightly
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_THRESHOLD) {
        const force = (MOUSE_THRESHOLD - dist) / MOUSE_THRESHOLD * 0.015;
        this.vx += dx * force * 0.01;
        this.vy += dy * force * 0.01;
      }

      // Speed cap
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 1.2) {
        this.vx = (this.vx / speed) * 1.2;
        this.vy = (this.vy / speed) * 1.2;
      }

      this.x += this.vx;
      this.y += this.vy;

      // Wrap edges
      if (this.x < -10) this.x = W + 10;
      if (this.x > W + 10) this.x = -10;
      if (this.y < -10) this.y = H + 10;
      if (this.y > H + 10) this.y = -10;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINE_THRESHOLD) {
          const alpha = (1 - dist / LINE_THRESHOLD) * 0.25;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  function resize() {
    const newW = canvas.clientWidth || window.innerWidth;
    const newH = canvas.clientHeight || window.innerHeight;
    if (W !== newW || H !== newH) {
      W = canvas.width = newW;
      H = canvas.height = newH;
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    }
  }

  function animate() {
    if (prefersReduced) return;
    ctx.clearRect(0, 0, W, H);
    drawLines();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); }, 150);
  });

  // Initial populate
  W = canvas.width = canvas.clientWidth || window.innerWidth;
  H = canvas.height = canvas.clientHeight || window.innerHeight;
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  // Handle post-layout resize when stylesheets fully load
  window.addEventListener('load', resize);
  document.addEventListener('DOMContentLoaded', resize);

  animate();
})();
