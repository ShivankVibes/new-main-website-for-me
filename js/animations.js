/**
 * animations.js — Scroll reveals, typing effect, counter animations
 */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Scroll Reveal ────────────────────────────────────────────────────────────
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

  if (!prefersReduced && revealEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Stagger children if it's a grid/list
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el, i) => {
      // Auto-stagger cards inside grids
      if (!el.dataset.delay && el.closest('.cards-grid, .skills-grid, .services-grid, .timeline')) {
        const siblings = Array.from(el.parentElement.children);
        const idx = siblings.indexOf(el);
        el.dataset.delay = idx * 80;
      }
      observer.observe(el);
    });
  } else {
    // If reduced motion, just make everything visible immediately
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // ── Typing Animation ─────────────────────────────────────────────────────────
  const typingEl = document.getElementById('typing-text');
  if (typingEl) {
    const words = ['Developer', 'Maker', '3D Printer', 'Student', 'Builder'];
    let wordIdx = 0, charIdx = 0, isDeleting = false;
    let typingTimeout;

    function type() {
      const currentWord = words[wordIdx];

      if (isDeleting) {
        typingEl.textContent = currentWord.slice(0, charIdx - 1);
        charIdx--;
      } else {
        typingEl.textContent = currentWord.slice(0, charIdx + 1);
        charIdx++;
      }

      let speed = isDeleting ? 60 : 100;

      if (!isDeleting && charIdx === currentWord.length) {
        speed = 1800; // Pause at end
        isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        wordIdx = (wordIdx + 1) % words.length;
        speed = 400;
      }

      typingTimeout = setTimeout(type, speed);
    }

    if (!prefersReduced) {
      setTimeout(type, 600);
    } else {
      typingEl.textContent = words[0];
    }
  }

  // ── Counter Animation ────────────────────────────────────────────────────────
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = current + (el.dataset.suffix || '');
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const counters = document.querySelectorAll('.counter');
  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!prefersReduced) {
            animateCounter(entry.target);
          } else {
            const t = entry.target;
            t.textContent = t.dataset.target + (t.dataset.suffix || '');
          }
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));
  }

  // ── Skills Bar Animation ─────────────────────────────────────────────────────
  const skillBars = document.querySelectorAll('.skill-bar-fill');
  if (skillBars.length > 0) {
    const barObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bar = entry.target;
          const pct = bar.dataset.pct || '80';
          if (!prefersReduced) {
            setTimeout(() => {
              bar.style.width = pct + '%';
            }, 200);
          } else {
            bar.style.width = pct + '%';
          }
          barObserver.unobserve(bar);
        }
      });
    }, { threshold: 0.3 });

    skillBars.forEach(b => barObserver.observe(b));
  }

  // ── Active Nav Highlight ─────────────────────────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
        // Update URL hash without scroll jump
        if (history.replaceState) {
          history.replaceState(null, '', '#' + id);
        }
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(s => sectionObserver.observe(s));

})();
