/**
 * app.js — Navigation, smooth scroll, hamburger, easter eggs
 */

(function () {
  'use strict';

  // ── Page Load Fade-In ────────────────────────────────────────────────────────
  document.documentElement.classList.add('js-loaded');
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });

  // ── Shared Navigation Elements ───────────────────────────────────────────────
  const navbar = document.querySelector('.navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');

  // ── Smooth Scroll ────────────────────────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navH = document.querySelector('.navbar')?.offsetHeight || 70;
        const top = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
        // Close mobile nav if open
        navMenu?.classList.remove('open');
        hamburger?.setAttribute('aria-expanded', 'false');
        hamburger?.classList.remove('active');
      }
    });
  });

  // ── Sticky Nav on Scroll ─────────────────────────────────────────────────────
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }, { passive: true });

  // ── Hamburger / Mobile Nav ───────────────────────────────────────────────────
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      hamburger.classList.toggle('active', isOpen);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar?.contains(e.target) && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('active');
      }
    });
  }

  // ── Back to Top ──────────────────────────────────────────────────────────────
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Theme Switcher ───────────────────────────────────────────────────────────
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  // Load saved theme
  const savedTheme = localStorage.getItem('shivank-theme') || 'dark';
  root.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('shivank-theme', next);
      updateThemeIcon(next);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    themeToggle.innerHTML = theme === 'dark'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  // ── Konami Code Easter Egg ───────────────────────────────────────────────────
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiIdx = 0;
  const terminal = document.getElementById('terminal-easter-egg');

  document.addEventListener('keydown', (e) => {
    if (e.key === KONAMI[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === KONAMI.length) {
        konamiIdx = 0;
        showTerminal();
      }
    } else {
      konamiIdx = 0;
    }
  });

  function showTerminal() {
    if (!terminal) return;
    terminal.classList.add('visible');
    const lines = terminal.querySelectorAll('.term-line');
    lines.forEach(l => l.classList.remove('typed'));
    let delay = 0;
    lines.forEach((line, i) => {
      setTimeout(() => line.classList.add('typed'), delay);
      delay += line.textContent.length * 28 + 400;
    });
  }

  document.getElementById('terminal-close')?.addEventListener('click', () => {
    terminal?.classList.remove('visible');
  });

  // Close terminal with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && terminal?.classList.contains('visible')) {
      terminal.classList.remove('visible');
    }
  });

  // ── Developer Console ASCII Art & Greeting ───────────────────────────────────
  const asciiArt = [
    "  ___  _  _ ___ __   __   _   _  _ _  __",
    " / __|| || |_ _|\\ \\ / /  /_\\ | \\| | |/ /",
    " \\__ \\| __ || |  \\ V /  / _ \\| .` | ' < ",
    " |___/|_||_|___|  \\_/  /_/ \\_\\_|\\_|_|\\_\\",
    "  __   _____ ___ ___ ___ ",
    "  \\ \\ / /_ _| _ ) __/ __|",
    "   \\ V / | || _ \\ _|\\__ \\",
    "    \\_/ |___|___/___|___/"
  ].join("\n");

  console.log(
    `%c${asciiArt}\n\n` +
    `%c ✨ Dream it. Make it. Break the limits. %c\n\n` +
    `%c👋 Welcome to the source!%c Crafted with passion by Shivank.\n` +
    `🐙 GitHub:   https://github.com/shivankvibes\n` +
    `⚡ Hint:     Try typing %cshivank%c or %chelp()%c in this console!\n`,
    'color: #38bdf8; font-weight: bold; font-family: monospace; line-height: 1.2; font-size: 11px;',
    'background: linear-gradient(135deg, #2563eb, #7c3aed, #db2777); color: #ffffff; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 11px; letter-spacing: 0.5px; display: inline-block;',
    '',
    'color: #38bdf8; font-weight: bold; font-size: 12px;',
    'color: #94a3b8; font-size: 11px;',
    'color: #f43f5e; font-weight: bold; font-family: monospace;',
    'color: #94a3b8;',
    'color: #f43f5e; font-weight: bold; font-family: monospace;',
    'color: #94a3b8;'
  );

  // Interactive console helpers
  window.shivank = {
    tagline: 'Dream it. Make it.',
    role: 'Creative Developer & AI Explorer',
    github: 'https://github.com/shivankvibes',
    easterEgg: 'Try entering the Konami Code on the page: ↑ ↑ ↓ ↓ ← → ← → B A'
  };

  window.help = function () {
    console.log('%c🚀 SHIVANK VIBES CONSOLE HELP', 'color: #38bdf8; font-weight: bold; font-size: 13px;');
    console.table({
      'shivank': { Description: 'Creator profile & details' },
      'help()': { Description: 'Show this interactive help menu' },
      'Konami Code': { Description: 'Press ↑ ↑ ↓ ↓ ← → ← → B A on page for secret terminal' }
    });
    return '✨ Have fun exploring!';
  };

  // ── Copy Email on Click ───────────────────────────────────────────────────────
  document.querySelectorAll('[data-copy]').forEach(el => {
    el.addEventListener('click', () => {
      const text = el.dataset.copy;
      navigator.clipboard.writeText(text).then(() => {
        const original = el.innerHTML;
        el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        el.style.color = '#22C55E';
        setTimeout(() => {
          el.innerHTML = original;
          el.style.color = '';
        }, 2000);
      });
    });
  });

  // ── Scroll Progress Bar ───────────────────────────────────────────────────────
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      progressBar.style.width = pct + '%';
    }, { passive: true });
  }

})();
