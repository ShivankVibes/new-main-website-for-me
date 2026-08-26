/**
 * cli.js — Interactive Developer CLI & Terminal Engine for Shivank's Portfolio
 * Supports both on-page interactive Terminal modal and browser DevTools console.
 */

(function () {
  'use strict';

  // ── Project & Portfolio Data ────────────────────────────────────────────────
  const PROJECTS = [
    {
      id: 'dvarabell',
      num: '01',
      name: 'Dvarabell',
      category: 'Web / Hardware',
      status: 'Live',
      tag: 'Smart Doorbell',
      desc: 'Modern product release portal for Dvarabell — a smart IoT doorbell solution with product showcases, specs, and release experience.',
      stack: ['HTML', 'CSS', 'JavaScript'],
      url: 'https://dvarabell-release-portal.netlify.app/'
    },
    {
      id: 'bvk',
      num: '02',
      name: 'The Bharatheya Vidhya Kendhra',
      category: 'Game / Simulation',
      status: 'Live',
      tag: 'Simulation Game',
      desc: 'Interactive education empire simulation in India. Grow a small school into a conglomerate — choose moral trust vs corrupt shortcuts.',
      stack: ['JavaScript', 'HTML5 Canvas', 'Narrative Engine'],
      url: 'https://the-bharat-college-of-technology.vercel.app/'
    },
    {
      id: 'prabandh',
      num: '03',
      name: 'Prabandh ERP',
      category: 'SaaS / ERP',
      status: 'In Development 🚧',
      tag: 'Enterprise ERP',
      desc: 'All-in-one company ERP system to manage business operations, inventory, rentals, and analytics. Flexible rental model.',
      stack: ['JavaScript', 'Node.js', 'SQL', 'CSS Grid'],
      url: '#contact'
    },
    {
      id: 'morse',
      num: '04',
      name: 'Morse Code Translator',
      category: 'Web App / Audio',
      status: 'Live',
      tag: 'Audio & Text Tool',
      desc: 'Real-time two-way Morse code translator with Web Audio API sound synthesis, international Morse table, and live encoding.',
      stack: ['HTML', 'CSS', 'JavaScript', 'Web Audio API'],
      url: 'morse-translator.html'
    },
    {
      id: 'macdeck',
      num: '05',
      name: 'Mac Deck (Web Steam Deck)',
      category: 'App / Systems',
      status: 'Completed 🟢',
      tag: 'Remote Controller',
      desc: 'Transforms any mobile phone into a Steam Deck controller for macOS with multi-touch trackpad, gamepad, and native keyboard injection.',
      stack: ['Node.js', 'Swift', 'WebSockets', 'CGEvent API'],
      url: 'web-steam-deck/public/index.html'
    },
    {
      id: 'isl',
      num: '06',
      name: 'ISL Hand Gesture Translator',
      category: 'AI / Computer Vision',
      status: 'Live',
      tag: 'AI Gesture Recognition',
      desc: 'Real-time Indian Sign Language recognition using webcam and Google MediaPipe hand landmark tracking for A-Z, 0-9, and phrases.',
      stack: ['MediaPipe', 'JavaScript', 'Camera API', 'AI/CV'],
      url: 'isl.html'
    },
    {
      id: 'lightning',
      num: '07',
      name: 'Lightning Hands ⚡',
      category: 'AI / Creative Tech',
      status: 'Live',
      tag: 'Interactive WebGL',
      desc: 'Electric lightning bolts crackle between your fingertips in real-time using MediaPipe hand tracking and canvas particle systems.',
      stack: ['MediaPipe', 'Canvas API', 'WebGL Shaders', 'JavaScript'],
      url: 'lightning-hands.html'
    },
    {
      id: 'voiceball',
      num: '08',
      name: 'Voice Reactive Sphere 🎤',
      category: '3D / Audio',
      status: 'Live',
      tag: '3D Three.js Audio',
      desc: '3D particle sphere built in Three.js reacting to live microphone audio with 2,500 particles, frequency FFTs, and custom GLSL shaders.',
      stack: ['Three.js', 'Web Audio API', 'GLSL Shaders', 'WebGL'],
      url: 'voice-ball.html'
    },
    {
      id: 'weather',
      num: '09',
      name: 'Weather App 🌤️',
      category: 'Web App',
      status: 'Live',
      tag: 'Live Forecast',
      desc: 'Real-time weather dashboard with live search, temperature, wind, humidity, animated weather icons, and 7-day forecast.',
      stack: ['HTML', 'CSS', 'JavaScript', 'OpenWeather API'],
      url: 'weather-app/index.html'
    },
    {
      id: 'url',
      num: '10',
      name: 'URL Shortener 🔗',
      category: 'Utility',
      status: 'Live',
      tag: 'Client-Side Tool',
      desc: 'Browser-based URL shortener with custom aliases, real-time click tracking, and localStorage persistence.',
      stack: ['HTML', 'CSS', 'JavaScript', 'localStorage'],
      url: 'url-shortener.html'
    }
  ];

  const ACHIEVEMENTS = [
    { name: 'First Website', desc: 'Built first responsive web project from scratch', unlocked: true, icon: '🌐' },
    { name: 'First Python Script', desc: 'Wrote automation scripts & Pygame titles at age 8', unlocked: true, icon: '🐍' },
    { name: 'Hardware Explorer', desc: 'Built Electronic Tanpura with Arduino & sensors', unlocked: true, icon: '🤖' },
    { name: 'Built an ERP System', desc: 'Engineered Prabandh ERP for business workflows', unlocked: true, icon: '🏢' },
    { name: 'AI & Computer Vision', desc: 'Shipped MediaPipe gesture recognition in ISL & Lightning Hands', unlocked: true, icon: '⚡' },
    { name: '3D Maker Specialist', desc: 'Mastered Bambu Lab A1 + AMS Lite multicolor printing', unlocked: true, icon: '🖨️' },
    { name: 'Konami Hacker', desc: 'Unlocked the secret Konami Terminal console', unlocked: true, icon: '🕹️' },
    { name: 'Terminal Master', desc: 'Explored hidden easter eggs in the portfolio CLI', unlocked: false, icon: '🕵️', id: 'secret_cli' }
  ];

  const VIRTUAL_FILES = {
    'about.txt': `SHIVANK — Developer, Maker & AI Explorer (Age 14)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Passionate creator bridging the gap between digital software and physical hardware.
Coding since age 5 (Scratch -> Python -> Web -> Systems & Microcontrollers).
Fluent in JavaScript, Python, C++, HTML/CSS, and modern web frameworks.
Based on planet Earth. Always building what's next.`,

    'projects.json': JSON.stringify(PROJECTS.map(p => ({
      name: p.name,
      category: p.category,
      stack: p.stack,
      url: p.url
    })), null, 2),

    'skills.md': `# Technical Stack
- Languages: HTML, CSS, JavaScript (ES6+), Python, C++ (Arduino), GLSL
- Frontend & 3D: Canvas API, Three.js, WebGL, Web Audio API, MediaPipe
- Backend & Systems: Node.js, WebSockets, CGEvent API, Swift bindings
- Hardware & Making: Arduino, ESP32, Raspberry Pi, Bambu Lab A1 + AMS Lite
- Tools: Git, GitHub, VS Code, Figma, Bambu Studio`,

    'contact.info': `Email:    shivankpro23@gmail.com
YouTube:  https://youtube.com/@shivankvibes
GitHub:   https://github.com/ShivankVibes
Status:   Open for collaborations, web development, and 3D print projects`,

    'achievements.md': ACHIEVEMENTS.map(a => `[${a.unlocked ? '✓' : ' '}] ${a.icon} ${a.name} — ${a.desc}`).join('\n'),

    'secret.key': `ACCESS GRANTED: 0x73686976616e6b2d31333337
Hint: Try running the 'secret', 'matrix', or 'hack' commands in the CLI.`
  };

  // State
  const state = {
    history: [],
    historyIndex: -1,
    unlockedSecrets: new Set(['Konami Hacker']),
    matrixRunning: false
  };

  // ── Formatter Helpers ───────────────────────────────────────────────────────
  function formatBox(title, rows, width = 44) {
    const pad = (str, len) => (str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length));
    const titleClean = ` ${title} `;
    const leftDash = Math.max(0, Math.floor((width - titleClean.length) / 2));
    const rightDash = Math.max(0, width - titleClean.length - leftDash);
    
    let out = `╭${'─'.repeat(leftDash)}${titleClean}${'─'.repeat(rightDash)}╮\n`;
    for (const r of rows) {
      if (r === '---') {
        out += `├${'─'.repeat(width)}┤\n`;
      } else {
        out += `│ ${pad(r, width - 2)} │\n`;
      }
    }
    out += `╰${'─'.repeat(width)}╯`;
    return out;
  }

  // ── Command Definitions ────────────────────────────────────────────────────
  const COMMANDS = {
    // ── CORE & PORTFOLIO ──────────────────────────────────────────────────────
    about: {
      category: 'portfolio',
      description: 'Short intro about Shivank',
      exec: () => {
        return [
          `👋 %cShivank%c — Creative Developer, Maker & AI Explorer`,
          `──────────────────────────────────────────────────────`,
          `• 14-year-old developer & maker building full-stack apps, AI models & hardware.`,
          `• Coding since age 5 (Scratch ➔ Python ➔ Web ➔ Hardware ➔ Systems).`,
          `• Creator of ISL Gesture Translator, Mac Deck, Prabandh ERP, and 3D prints.`,
          `• YouTube creator sharing tech experiments at %chttps://youtube.com/@shivankvibes%c`,
          ``,
          `💡 Type %cprojects%c to explore projects or %cskills%c for the tech stack.`
        ].join('\n');
      }
    },

    projects: {
      category: 'portfolio',
      description: 'Lists all featured projects',
      exec: () => {
        const rows = [
          '  ID   NAME                            STATUS',
          '---'
        ];
        PROJECTS.forEach(p => {
          const num = p.num;
          const name = (p.name.length > 28 ? p.name.slice(0, 25) + '...' : p.name).padEnd(30, ' ');
          rows.push(`${num}  ${name} [${p.status.split(' ')[0]}]`);
        });
        rows.push('---');
        rows.push('Tip: Type `project <name>` (e.g. `project isl`)');

        return formatBox("SHIVANK'S PROJECTS", rows, 52);
      }
    },

    project: {
      category: 'portfolio',
      description: 'Deep dive into a specific project (e.g. `project isl`)',
      usage: 'project <name|id|num>',
      exec: (args) => {
        if (!args || args.length === 0) {
          return '⚠️ Please specify a project name or ID. Example: `project isl` or `project dvarabell`\nType `projects` to list all.';
        }
        const query = args.join(' ').toLowerCase().trim();
        const found = PROJECTS.find(p => 
          p.id.toLowerCase() === query ||
          p.num === query ||
          p.name.toLowerCase().includes(query)
        );

        if (!found) {
          return `❌ Project '${query}' not found. Type \`projects\` to view available projects.`;
        }

        const lines = [
          formatBox(found.name.toUpperCase(), [
            `Tag:      ${found.tag}`,
            `Category: ${found.category}`,
            `Status:   ${found.status}`,
            `Tech:     ${found.stack.join(', ')}`,
            '---',
            `Link:     ${found.url}`
          ], 52),
          '',
          `📖 ${found.desc}`,
          found.url.startsWith('http') || found.url.endsWith('.html')
            ? `🔗 Open project: <a href="${found.url}" target="_blank" class="term-link">${found.url}</a>`
            : `🔗 Internal target: ${found.url}`
        ];
        return lines.join('\n');
      }
    },

    skills: {
      category: 'portfolio',
      description: 'Shows tech stack and proficiency',
      exec: () => {
        return [
          `⚡ %cTECHNICAL SKILLS & PROFICIENCY%c`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `💻 Languages:`,
          `   HTML & CSS       [██████████] 90% · Modern layout, Grid, Animations`,
          `   JavaScript       [████████░░] 85% · ES6+, Async, DOM, Web APIs`,
          `   Python           [████████░░] 80% · Automation, Pygame, Scripts`,
          `   Arduino C++      [███████░░░] 70% · Microcontrollers, Sensors`,
          `   GLSL / Shaders   [██████░░░░] 65% · 3D WebGL visuals & Three.js`,
          ``,
          `🛠️ Technologies & Frameworks:`,
          `   • MediaPipe AI / Computer Vision · Real-time hand tracking`,
          `   • Three.js & WebGL · 3D audio reactive particles`,
          `   • Node.js & WebSockets · Low-latency device bridges`,
          `   • Web Audio API · Audio synthesis & frequency analysis`,
          `   • Git, GitHub, LocalStorage, CSS Glassmorphism`,
          ``,
          `🖨️ Hardware & Making:`,
          `   • Bambu Lab A1 + AMS Lite (Multicolor 3D printing)`,
          `   • Arduino Uno / ESP32 / Raspberry Pi IoT builds`
        ].join('\n');
      }
    },

    stack: {
      category: 'portfolio',
      description: 'Detailed breakdown of languages, tools, and hardware',
      exec: () => {
        return COMMANDS.skills.exec();
      }
    },

    github: {
      category: 'portfolio',
      description: 'Opens/displays Shivank\'s GitHub profile',
      exec: () => {
        return `🐙 GitHub: <a href="https://github.com/ShivankVibes" target="_blank" class="term-link">https://github.com/ShivankVibes</a>\nExplore repositories, open-source projects, and code experiments.`;
      }
    },

    contact: {
      category: 'portfolio',
      description: 'Shows contact info and social links',
      exec: () => {
        return [
          `📫 %cGET IN TOUCH%c`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `✉️  Email:    <a href="mailto:shivankpro23@gmail.com" class="term-link">shivankpro23@gmail.com</a>`,
          `📺  YouTube:  <a href="https://youtube.com/@shivankvibes" target="_blank" class="term-link">@shivankvibes</a>`,
          `🐙  GitHub:   <a href="https://github.com/ShivankVibes" target="_blank" class="term-link">ShivankVibes</a>`,
          `💬  Discord:  shivankvibes`,
          `🌐  Location: Planet Earth · Open for web & 3D projects`
        ].join('\n');
      }
    },

    timeline: {
      category: 'portfolio',
      description: 'Shows coding and project journey from age 5 to now',
      exec: () => {
        return [
          `⏳ %cSHIVANK'S CODING JOURNEY%c`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `2017 · Age 5   🐱 Started Coding on Scratch (Animations & games)`,
          `2020 · Age 8   🐍 Levelled Up to Python (Automation & Pygame)`,
          `2022 · Age 10  🌐 Discovered Web Dev (HTML, CSS, JavaScript)`,
          `2025 · Age 13  🤖 Entered Hardware & Arduino (Tanpura & Sensors)`,
          `2026 · Age 14  🖨️ 3D Printing, AI MediaPipe & Shipping Products`,
          `Now  · Beyond  🚀 Full-Stack AI apps, Open Source & Innovation`
        ].join('\n');
      }
    },

    stats: {
      category: 'portfolio',
      description: 'Fun & real developer stats',
      exec: () => {
        return formatBox("DEVELOPER STATS", [
          "Years Coding:       9+ years",
          "Projects Shipped:   10+ web & hardware builds",
          "Core Languages:     JavaScript, Python, C++, HTML/CSS",
          "3D Print Hours:     100+ hrs on Bambu Lab A1",
          "Lines of Code:      50,000+",
          "Caffeine Intake:    ☕ ∞",
          "Bugs Squashed:      999+",
          "Current Level:      Level 14 Full-Stack Creator"
        ], 48);
      }
    },

    resume: {
      category: 'portfolio',
      description: 'Summary of developer resume & highlights',
      exec: () => {
        return [
          `📄 %cSHIVANK — RESUME SUMMARY%c`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `Role: Full-Stack Web Developer, AI Explorer & Hardware Maker`,
          `Experience: 9+ years coding · Web development & 3D fabrication`,
          `Key Projects:`,
          `  • ISL Gesture Translator (Real-time AI gesture vision)`,
          `  • Mac Deck (Steam Deck style remote macOS controller)`,
          `  • Prabandh ERP (Enterprise SaaS platform)`,
          `  • Voice Reactive 3D Sphere (GLSL WebGL Audio)`,
          `Direct Email: shivankpro23@gmail.com`
        ].join('\n');
      }
    },

    now: {
      category: 'portfolio',
      description: 'What Shivank is currently working on',
      exec: () => {
        return [
          `📍 %cCURRENTLY WORKING ON (NOW)%c`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `• 🏢 Prabandh ERP — Expanding modules for client inventory & rentals.`,
          `• 🖨️ 3D Printing with AMS Lite — Multicolor mechanical designs.`,
          `• 🤖 Computer Vision Experiments — Enhancing MediaPipe sign language accuracy.`,
          `• 🎮 Mac Deck — Testing ultra-low latency WebSocket protocol updates.`
        ].join('\n');
      }
    },

    achievements: {
      category: 'portfolio',
      description: 'Shows unlocked milestones and badges',
      exec: () => {
        const rows = ACHIEVEMENTS.map(a => {
          const check = a.unlocked ? '[✓]' : '[?]';
          return `${check} ${a.icon} ${a.name}`;
        });
        return [
          formatBox("🏆 ACHIEVEMENTS", rows, 48),
          `Tip: Discover hidden commands to unlock secret achievements!`
        ].join('\n');
      }
    },

    // ── SYSTEM COMMANDS ───────────────────────────────────────────────────────
    clear: {
      category: 'system',
      description: 'Clears the terminal console',
      exec: (args, ctx) => {
        if (ctx && ctx.clear) {
          ctx.clear();
          return '';
        }
        return 'Console cleared.';
      }
    },

    cls: {
      category: 'system',
      description: 'Alias for clear',
      exec: (args, ctx) => COMMANDS.clear.exec(args, ctx)
    },

    history: {
      category: 'system',
      description: 'Shows command history',
      exec: () => {
        if (state.history.length === 0) {
          return 'No command history yet.';
        }
        return state.history.map((cmd, i) => `  ${(i + 1).toString().padStart(3, ' ')}  ${cmd}`).join('\n');
      }
    },

    date: {
      category: 'system',
      description: 'Displays current date',
      exec: () => {
        const d = new Date();
        return `📅 ${d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
      }
    },

    time: {
      category: 'system',
      description: 'Displays current time',
      exec: () => {
        const d = new Date();
        return `⏰ ${d.toLocaleTimeString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
      }
    },

    whoami: {
      category: 'system',
      description: 'Displays active user profile',
      exec: () => {
        return [
          `USER:     shivank`,
          `ROLE:     Creative Developer & System Architect`,
          `PERMS:    Root / Developer / Creator`,
          `HOST:     shivank-macbook-pro.local`,
          `LOCATION: /home/shivank/portfolio`,
          `STATUS:   Dream it. Make it. Break the limits.`
        ].join('\n');
      }
    },

    pwd: {
      category: 'system',
      description: 'Prints fake current directory',
      exec: () => `/home/shivank/portfolio/universe`
    },

    ls: {
      category: 'system',
      description: 'Lists files in current virtual directory',
      exec: () => {
        return [
          `📁 drwxr-xr-x  projects/`,
          `📁 drwxr-xr-x  experiments/`,
          `📄 -rw-r--r--  about.txt`,
          `📄 -rw-r--r--  projects.json`,
          `📄 -rw-r--r--  skills.md`,
          `📄 -rw-r--r--  contact.info`,
          `📄 -rw-r--r--  achievements.md`,
          `🔒 -r--------  secret.key`,
          ``,
          `Tip: Use \`cat <filename>\` (e.g. \`cat about.txt\`)`
        ].join('\n');
      }
    },

    cat: {
      category: 'system',
      description: 'Reads and displays file contents (e.g. `cat about.txt`)',
      usage: 'cat <filename>',
      exec: (args) => {
        if (!args || args.length === 0) {
          return '⚠️ Usage: `cat <filename>`. Type `ls` to see available files.';
        }
        const file = args[0].trim();
        if (VIRTUAL_FILES[file]) {
          return VIRTUAL_FILES[file];
        }
        return `cat: ${file}: No such file or directory. Try \`ls\` to list files.`;
      }
    },

    echo: {
      category: 'system',
      description: 'Echoes text back to terminal',
      usage: 'echo <text>',
      exec: (args) => args.join(' ')
    },

    sudo: {
      category: 'system',
      description: 'Try to gain root privileges',
      exec: (args) => {
        const cmd = args.join(' ');
        if (cmd) {
          return `Permission denied: Cannot sudo '${cmd}'. You're already on the internet. 🛡️`;
        }
        return `[sudo] password for guest:\nPermission denied. Nice try :)`;
      }
    },

    exit: {
      category: 'system',
      description: 'Disconnects and closes terminal',
      exec: (args, ctx) => {
        if (ctx && ctx.close) {
          setTimeout(() => ctx.close(), 600);
          return 'Disconnecting session... Goodbye! 👋';
        }
        return 'Session closed. Press Escape or close window.';
      }
    },

    reboot: {
      category: 'system',
      description: 'Triggers cyber system reload sequence',
      exec: (args, ctx) => {
        if (ctx && ctx.reboot) {
          ctx.reboot();
          return 'Reboot sequence initiated...';
        }
        return 'Reboot sequence: [System OK]';
      }
    },

    version: {
      category: 'system',
      description: 'Website & CLI build information',
      exec: () => {
        return [
          `🚀 Shivank Vibes Portfolio & CLI Engine`,
          `Version:    2.4.0-quantum`,
          `Build:      2026.08-PROD`,
          `Engine:     Vanilla JS + Modern Web APIs`,
          `Host:       Netlify / Vercel Edge Global CDN`,
          `Uptime:     99.99% · Infinite Creativity`
        ].join('\n');
      }
    },

    status: {
      category: 'system',
      description: 'System health, memory, and ping stats',
      exec: () => {
        const ping = Math.floor(12 + Math.random() * 18);
        return [
          `🟢 SYSTEM STATUS: ALL SYSTEMS NOMINAL`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `Web Audio API:      Ready`,
          `MediaPipe Engine:   Online`,
          `Three.js WebGL:     Active (60 FPS)`,
          `Particle Canvas:    Running (0 frame drops)`,
          `Network Latency:    ${ping}ms`,
          `Vibe Check:         100% Passed ✨`
        ].join('\n');
      }
    },

    // ── INTERACTIVE HELP & CATEGORIES ─────────────────────────────────────────
    help: {
      category: 'interactive',
      description: 'Shows categorized help menu (try `help --all`)',
      usage: 'help [category|--all]',
      exec: (args) => {
        const arg = args[0]?.toLowerCase();

        if (arg === '--all' || arg === 'all') {
          return [
            formatBox("ALL AVAILABLE COMMANDS", [
              "CORE / PORTFOLIO:",
              "  about         Short bio & background",
              "  projects      List all projects",
              "  project <id>  Detailed project view",
              "  skills        Technical skills breakdown",
              "  stack         Deep tech & hardware stack",
              "  timeline      Journey from age 5 to now",
              "  stats         Fun & real stats",
              "  contact       Social & contact info",
              "  github        GitHub repository link",
              "  resume        Resume overview",
              "  achievements  Unlocked milestones",
              "  now           Current work & roadmap",
              "---",
              "SYSTEM & SHELL:",
              "  clear / cls   Clear screen",
              "  history       View command history",
              "  whoami        Active profile details",
              "  ls            List virtual files",
              "  cat <file>    Read file content",
              "  pwd           Print directory",
              "  date / time   Show current date/time",
              "  echo <text>   Print text",
              "  status        System health check",
              "  version       CLI & build info",
              "  reboot        Reload sequence",
              "  exit          Close terminal",
              "---",
              "FUN & EASTER EGGS:",
              "  matrix        Full-screen Matrix digital rain",
              "  hack          Fake hacking breach sequence",
              "  coffee        Brew developer productivity",
              "  42            Answer to life & universe",
              "  secret        Unlock secret hacker achievement",
              "  shivank       Animated profile loader",
              "  godmode       Unlock unlimited creator perks",
              "  sudo          Root access attempt"
            ], 54)
          ].join('\n');
        }

        if (arg === 'portfolio') {
          return [
            `📂 %cPORTFOLIO COMMANDS%c`,
            `──────────────────────────────────────────────────────`,
            `  about         Short bio & background`,
            `  projects      List all 10 projects`,
            `  project <id>  Detailed project view (e.g. \`project isl\`)`,
            `  skills        Technical skills & progress bars`,
            `  stack         Full languages, tools, and hardware`,
            `  timeline      Coding journey from age 5 to now`,
            `  stats         Fun developer statistics`,
            `  contact       Email, YouTube, and GitHub links`,
            `  github        Direct GitHub link`,
            `  resume        Resume summary`,
            `  achievements  Milestone badges`,
            `  now           What's under active development`
          ].join('\n');
        }

        if (arg === 'system') {
          return [
            `🖥️ %cSYSTEM COMMANDS%c`,
            `──────────────────────────────────────────────────────`,
            `  clear / cls   Clear the console`,
            `  history       Show previously entered commands`,
            `  whoami        Developer identity card`,
            `  date / time   Current date and live time`,
            `  pwd           Print virtual directory`,
            `  ls            List files in virtual directory`,
            `  cat <file>    Display file content (e.g. \`cat about.txt\`)`,
            `  echo <text>   Echo text back`,
            `  status        Live system metrics`,
            `  version       Website & CLI build info`,
            `  sudo          Request root privileges`,
            `  reboot        Initiate cyber reboot`,
            `  exit          Disconnect and close terminal`
          ].join('\n');
        }

        if (arg === 'developer') {
          return [
            `🛠️ %cDEVELOPER COMMANDS%c`,
            `──────────────────────────────────────────────────────`,
            `  stack         Languages, frameworks, and tooling`,
            `  stats         Fun developer stats`,
            `  timeline      Evolution timeline`,
            `  achievements  Milestones and badges`,
            `  now           Active roadmap`,
            `  debug         Browser & viewport diagnostics`,
            `  level / xp    RPG developer stats`
          ].join('\n');
        }

        if (arg === 'fun' || arg === 'easter') {
          return [
            `🥚 %cFUN & EASTER EGGS%c`,
            `──────────────────────────────────────────────────────`,
            `  matrix        Spawns Matrix digital green rain 🟢`,
            `  hack          Runs fake mainframe breach sequence 💻`,
            `  coffee        Brew developer productivity ☕`,
            `  42            The Ultimate Question & Answer 🌌`,
            `  secret        Unlocks hidden secret achievement 🕵️`,
            `  shivank       Animated profile boot sequence 🚀`,
            `  konami        Trigger celebration particle burst 🎉`,
            `  godmode       Enable omnipotent creator mode ⚡`,
            `  1337 / admin  Hidden hacker responses`
          ].join('\n');
        }

        if (arg === 'social') {
          return COMMANDS.contact.exec();
        }

        return formatBox("COMMANDS", [
          "",
          "  portfolio    → Portfolio commands",
          "  system       → System & shell commands",
          "  developer    → Dev stats & roadmap",
          "  fun          → Easter eggs & games",
          "  social       → Contact & social links",
          "",
          "  Type a category name to explore.",
          "  Type `help --all` to list everything.",
          ""
        ], 46);
      }
    },

    portfolio: {
      category: 'interactive',
      description: 'Show portfolio commands',
      exec: () => COMMANDS.help.exec(['portfolio'])
    },

    system: {
      category: 'interactive',
      description: 'Show system commands',
      exec: () => COMMANDS.help.exec(['system'])
    },

    developer: {
      category: 'interactive',
      description: 'Show developer commands',
      exec: () => COMMANDS.help.exec(['developer'])
    },

    fun: {
      category: 'interactive',
      description: 'Show fun & easter egg commands',
      exec: () => COMMANDS.help.exec(['fun'])
    },

    social: {
      category: 'interactive',
      description: 'Show social commands',
      exec: () => COMMANDS.contact.exec()
    },

    // ── EASTER EGGS & FUN ─────────────────────────────────────────────────────
    matrix: {
      category: 'fun',
      description: 'Starts full-screen Matrix rain animation',
      exec: (args, ctx) => {
        if (ctx && ctx.matrix) {
          ctx.matrix();
          return '🟢 Entering the Matrix... (Click anywhere or press Escape to exit)';
        }
        return '🟢 Wake up, Neo... The Matrix has you.';
      }
    },

    hack: {
      category: 'fun',
      description: 'Runs fake mainframe hacking sequence',
      exec: (args, ctx) => {
        if (ctx && ctx.hack) {
          ctx.hack();
          return ''; // Animated in UI
        }
        return [
          `Initializing breach protocol...`,
          `[████████████████] 100%`,
          `Bypassing firewall...`,
          `Overriding mainframe security...`,
          `Access denied. Nice try :) 🛡️`
        ].join('\n');
      }
    },

    coffee: {
      category: 'fun',
      description: 'Brews coffee for developer energy',
      exec: () => {
        return [
          `      (  )   (   )  )`,
          `       ) (   )  (  (`,
          `       ( )  (    ) )`,
          `     ╭──────────────╮`,
          `     │  ☕ SHIVANK  │ ──╮`,
          `     │    ROAST     │   │`,
          `     ╰──────────────╯ ──╯`,
          `      └────────────┘`,
          `☕ Coffee.exe initialized. Productivity boosted +25%!`
        ].join('\n');
      }
    },

    '42': {
      category: 'fun',
      description: 'The Answer to the Ultimate Question',
      exec: () => {
        return `🌌 42.\nThe answer to the ultimate question of life, the universe, and everything.\n(Now, what was the question?)`;
      }
    },

    secret: {
      category: 'fun',
      description: 'Secret achievement unlocker',
      exec: (args, ctx) => {
        const secretAch = ACHIEVEMENTS.find(a => a.id === 'secret_cli');
        if (secretAch) {
          secretAch.unlocked = true;
        }
        state.unlockedSecrets.add('Terminal Master');
        return [
          `🎉 %cSECRET ACHIEVEMENT UNLOCKED!%c`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `🏆 [✓] 🕵️ Terminal Master`,
          `"You navigated into the secret depths of the terminal."`,
          `Special hacker privileges granted.`
        ].join('\n');
      }
    },

    konami: {
      category: 'fun',
      description: 'Triggers the Konami celebratory particle burst',
      exec: (args, ctx) => {
        if (window.confettiBurst) window.confettiBurst();
        return `🕹️ KONAMI CODE ACTIVATED: ↑ ↑ ↓ ↓ ← → ← → B A\nBonus 30 Lives granted. You are a true retro gamer! 🌟`;
      }
    },

    shivank: {
      category: 'fun',
      description: 'Animated developer profile bootloader',
      exec: (args, ctx) => {
        if (ctx && ctx.bootShivank) {
          ctx.bootShivank();
          return '';
        }
        return [
          `Loading developer profile...`,
          `████████████████████ 100%`,
          `✨ Welcome, Shivank. Dream it. Make it. Break the limits.`
        ].join('\n');
      }
    },

    1337: {
      category: 'fun',
      description: 'Leet speak status',
      exec: () => `y0u 4r3 n0w 1n 1337 h4ck3r m0d3. 3nj0y th3 v1b35!`
    },

    admin: {
      category: 'fun',
      description: 'Admin portal check',
      exec: () => `🔒 Admin access is restricted to Shivank. Have you tried asking nicely?`
    },

    godmode: {
      category: 'fun',
      description: 'Enable creative godmode',
      exec: () => `⚡ GODMODE ENGAGED: Infinite creativity, zero bugs, and limitless compute granted.`
    },

    spawn: {
      category: 'fun',
      description: 'Spawns fun elements (e.g. `spawn star`)',
      usage: 'spawn <item>',
      exec: (args) => {
        const item = args.join(' ') || 'star';
        return `✨ Spawned [${item}] in the DOM cosmos! Look around you.`;
      }
    },

    credits: {
      category: 'fun',
      description: 'Credits and shoutouts',
      exec: () => {
        return [
          `🎬 %cCREDITS%c`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `Crafted by:      Shivank (@shivankvibes)`,
          `Inspirations:    Cyberpunk, Retro Unix, Sci-Fi HUDs`,
          `Built with:      Pure JavaScript, HTML5, CSS3, Web Audio & WebGL`,
          `Special Thanks:  You, for exploring this terminal! ❤️`
        ].join('\n');
      }
    },

    level: {
      category: 'developer',
      description: 'RPG Level and Stats',
      exec: () => `⚔️ Class: Level 14 Full-Stack Alchemist\nXP: 9,420 / 10,000\nBuffs: +50% Coding Speed, +35% Hardware Tinkering`
    },

    xp: {
      category: 'developer',
      description: 'Alias for level',
      exec: () => COMMANDS.level.exec()
    },

    leaderboard: {
      category: 'developer',
      description: 'Terminal high scores',
      exec: () => {
        return [
          `🏆 TOP BUILDERS LEADERBOARD`,
          `1. Shivank       9,999,999 XP [PROD]`,
          `2. You (Guest)     1,337 XP [ACTIVE]`,
          `3. Caffeine Bot      420 XP [BREWING]`
        ].join('\n');
      }
    },

    debug: {
      category: 'developer',
      description: 'Dumps browser runtime diagnostics',
      exec: () => {
        return [
          `🔍 RUNTIME DIAGNOSTICS`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `User Agent:       ${navigator.userAgent.slice(0, 50)}...`,
          `Viewport:         ${window.innerWidth} x ${window.innerHeight}`,
          `Device Pixel:     ${window.devicePixelRatio}`,
          `Color Scheme:     ${document.documentElement.getAttribute('data-theme') || 'dark'}`,
          `Screen Res:       ${screen.width} x ${screen.height}`,
          `Language:         ${navigator.language}`,
          `Memory Info:      ${performance && performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB' : 'Protected'}`
        ].join('\n');
      }
    },

    unlock: {
      category: 'fun',
      description: 'Unlock easter egg achievements',
      exec: () => COMMANDS.secret.exec()
    }
  };

  // ── Terminal UI Controller ──────────────────────────────────────────────────
  class TerminalUI {
    constructor() {
      this.overlay = document.getElementById('terminal-overlay');
      this.modal = document.getElementById('terminal-easter-egg');
      this.body = document.querySelector('.term-body');
      this.outputContainer = null;
      this.input = null;
      this.promptLabel = null;
      this.isMaximized = false;
      this.matrixCanvas = document.getElementById('matrix-canvas');

      this.initDOM();
      this.bindEvents();
    }

    initDOM() {
      if (!this.modal) return;

      // Replace term-body with interactive CLI layout
      this.modal.innerHTML = `
        <div class="term-header">
          <div class="term-dots">
            <button class="term-dot red" id="term-btn-close" aria-label="Close terminal" title="Close (Esc)"></button>
            <button class="term-dot yellow" id="term-btn-min" aria-label="Clear terminal" title="Clear (cls)"></button>
            <button class="term-dot green" id="term-btn-max" aria-label="Maximize terminal" title="Maximize/Restore"></button>
          </div>
          <span class="term-title" id="terminal-title">shivank@portfolio: ~ (zsh)</span>
          <div class="term-header-actions">
            <button class="term-close-btn" id="terminal-close" aria-label="Close terminal">✕</button>
          </div>
        </div>
        <div class="term-body" id="term-scroll-body" aria-live="polite">
          <div class="term-output" id="term-output"></div>
          <div class="term-input-line">
            <span class="term-prompt" id="term-prompt-text">shivank@portfolio:~$</span>
            <div class="term-input-wrapper">
              <input type="text" id="term-cmd-input" class="term-input" autocomplete="off" spellcheck="false" autofocus aria-label="Terminal command input" />
            </div>
          </div>
          <div class="term-chips" id="term-chips">
            <button class="term-chip" data-cmd="help">help</button>
            <button class="term-chip" data-cmd="projects">projects</button>
            <button class="term-chip" data-cmd="skills">skills</button>
            <button class="term-chip" data-cmd="matrix">matrix</button>
            <button class="term-chip" data-cmd="hack">hack</button>
            <button class="term-chip" data-cmd="help --all">help --all</button>
          </div>
        </div>
      `;

      this.outputContainer = document.getElementById('term-output');
      this.input = document.getElementById('term-cmd-input');
      this.body = document.getElementById('term-scroll-body');

      // Print Welcome Banner
      this.printWelcome();
    }

    printWelcome() {
      const banner = [
        `<span class="term-brand">╭──────────────────────────────────────────────────╮</span>`,
        `<span class="term-brand">│  ⚡ SHIVANK VIBES INTERACTIVE DEVELOPER CLI ⚡   │</span>`,
        `<span class="term-brand">╰──────────────────────────────────────────────────╯</span>`,
        `<span class="term-muted">Welcome to the interactive portfolio terminal.</span>`,
        `<span class="term-muted">Type <span class="term-highlight">help</span> to explore commands, or <span class="term-highlight">projects</span> to view work.</span>`,
        `<span class="term-muted">Press <span class="term-highlight">Tab</span> for autocomplete · <span class="term-highlight">↑/↓</span> for history · <span class="term-highlight">Esc</span> to close.</span>`,
        ``
      ].join('\n');

      this.appendHTML(banner);
    }

    bindEvents() {
      if (!this.input) return;

      // Click anywhere in terminal body to focus input
      this.body.addEventListener('click', (e) => {
        if (!e.target.closest('a') && !e.target.closest('.term-chip')) {
          this.input.focus();
        }
      });

      // Quick chip clicks
      this.modal.addEventListener('click', (e) => {
        const chip = e.target.closest('.term-chip');
        if (chip) {
          const cmd = chip.dataset.cmd;
          if (cmd) {
            this.input.value = cmd;
            this.execute(cmd);
            this.input.focus();
          }
        }
      });

      // Window control buttons
      document.getElementById('terminal-close')?.addEventListener('click', () => this.hide());
      document.getElementById('term-btn-close')?.addEventListener('click', () => this.hide());
      document.getElementById('term-btn-min')?.addEventListener('click', () => this.clear());
      document.getElementById('term-btn-max')?.addEventListener('click', () => this.toggleMaximize());

      // Key events
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cmd = this.input.value;
          this.input.value = '';
          this.execute(cmd);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (state.history.length > 0) {
            if (state.historyIndex === -1) {
              state.historyIndex = state.history.length - 1;
            } else if (state.historyIndex > 0) {
              state.historyIndex--;
            }
            this.input.value = state.history[state.historyIndex] || '';
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (state.history.length > 0 && state.historyIndex !== -1) {
            if (state.historyIndex < state.history.length - 1) {
              state.historyIndex++;
              this.input.value = state.history[state.historyIndex];
            } else {
              state.historyIndex = -1;
              this.input.value = '';
            }
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          this.autocomplete();
        } else if (e.key === 'Escape') {
          this.hide();
        } else if (e.ctrlKey && e.key === 'l') {
          e.preventDefault();
          this.clear();
        }
      });
    }

    autocomplete() {
      const val = this.input.value.trim().toLowerCase();
      if (!val) return;

      const keys = Object.keys(COMMANDS);
      const match = keys.filter(k => k.startsWith(val));
      if (match.length === 1) {
        this.input.value = match[0] + ' ';
      } else if (match.length > 1) {
        this.appendHTML(`<div class="term-line output-dim">${match.join('    ')}</div>`);
        this.scrollToBottom();
      }
    }

    execute(rawCmd) {
      const trimmed = rawCmd.trim();
      if (!trimmed) {
        this.appendHTML(`<div class="term-line prompt-line"><span class="term-prompt">shivank@portfolio:~$</span> </div>`);
        this.scrollToBottom();
        return;
      }

      // Add to history
      state.history.push(trimmed);
      state.historyIndex = -1;

      // Print prompt line
      this.appendHTML(`<div class="term-line prompt-line"><span class="term-prompt">shivank@portfolio:~$</span> <span class="term-cmd-text">${escapeHTML(trimmed)}</span></div>`);

      const parts = trimmed.split(/\s+/);
      const cmdName = parts[0].toLowerCase();
      const args = parts.slice(1);

      const ctx = {
        clear: () => this.clear(),
        close: () => this.hide(),
        reboot: () => this.reboot(),
        matrix: () => this.runMatrix(),
        hack: () => this.runHack(),
        bootShivank: () => this.runBootShivank()
      };

      if (COMMANDS[cmdName]) {
        try {
          const res = COMMANDS[cmdName].exec(args, ctx);
          if (res) {
            this.printResult(res);
          }
        } catch (err) {
          this.appendHTML(`<div class="term-line error">⚠️ Error executing command: ${err.message}</div>`);
        }
      } else {
        this.appendHTML(`<div class="term-line error">zsh: command not found: ${escapeHTML(cmdName)}. Type <span class="term-highlight">help</span> for available commands.</div>`);
      }

      this.scrollToBottom();
    }

    printResult(text) {
      // Format color tags and URLs
      let formatted = escapeHTML(text)
        .replace(/%c(.*?)%c/g, '<span class="term-highlight">$1</span>')
        .replace(/&lt;a href=&quot;(.*?)&quot; target=&quot;_blank&quot; class=&quot;term-link&quot;&gt;(.*?)&lt;\/a&gt;/g, '<a href="$1" target="_blank" rel="noopener" class="term-link">$2</a>')
        .replace(/&lt;a href=&quot;(.*?)&quot; class=&quot;term-link&quot;&gt;(.*?)&lt;\/a&gt;/g, '<a href="$1" class="term-link">$2</a>');

      this.appendHTML(`<pre class="term-output-block">${formatted}</pre>`);
    }

    appendHTML(html) {
      if (!this.outputContainer) return;
      const el = document.createElement('div');
      el.innerHTML = html;
      this.outputContainer.appendChild(el);
    }

    clear() {
      if (this.outputContainer) {
        this.outputContainer.innerHTML = '';
      }
    }

    show() {
      if (!this.modal || !this.overlay) return;
      this.modal.classList.add('visible');
      this.overlay.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        this.input?.focus();
        this.scrollToBottom();
      }, 100);
    }

    hide() {
      if (!this.modal || !this.overlay) return;
      this.modal.classList.remove('visible');
      this.overlay.setAttribute('aria-hidden', 'true');
      this.stopMatrix();
    }

    toggleMaximize() {
      this.isMaximized = !this.isMaximized;
      this.modal.classList.toggle('maximized', this.isMaximized);
    }

    scrollToBottom() {
      if (this.body) {
        this.body.scrollTop = this.body.scrollHeight;
      }
    }

    // ── Animations ────────────────────────────────────────────────────────────
    runHack() {
      const steps = [
        { text: 'Initializing neural breach protocol...', delay: 200, cls: 'term-muted' },
        { text: '[██░░░░░░░░░░░░░░]  15% Connecting to gateway...', delay: 500, cls: 'term-cyan' },
        { text: '[██████░░░░░░░░░░]  40% Bypassing port 8080 firewall...', delay: 900, cls: 'term-cyan' },
        { text: '[████████████░░░░]  75% Injecting quantum payload...', delay: 1400, cls: 'term-purple' },
        { text: '[████████████████] 100% Mainframe bypass complete.', delay: 1900, cls: 'term-green' },
        { text: '🚨 SECURITY ALERT: Zero-day honeypot triggered!', delay: 2300, cls: 'term-red' },
        { text: '🛡️ Access denied. Nice try! But Shivank\'s defenses hold strong :)', delay: 2700, cls: 'term-highlight' }
      ];

      steps.forEach(({ text, delay, cls }) => {
        setTimeout(() => {
          this.appendHTML(`<div class="term-line ${cls}">${text}</div>`);
          this.scrollToBottom();
        }, delay);
      });
    }

    runBootShivank() {
      const lines = [
        { text: 'Booting Shivank OS Kernel v2.4...', delay: 200 },
        { text: 'Mounting modules: [JS, Python, 3D Print, Hardware, AI]...', delay: 600 },
        { text: 'Establishing neural sync with creative universe...', delay: 1000 },
        { text: '████████████████████ 100% Online.', delay: 1400 },
        { text: '✨ Welcome, Shivank. "Dream it. Make it. Break the limits."', delay: 1700 }
      ];
      lines.forEach(({ text, delay }) => {
        setTimeout(() => {
          this.appendHTML(`<div class="term-line term-highlight">${text}</div>`);
          this.scrollToBottom();
        }, delay);
      });
    }

    reboot() {
      this.modal.classList.add('glitch-active');
      this.clear();
      this.appendHTML(`<div class="term-line term-red">REBOOTING SYSTEM...</div>`);
      setTimeout(() => {
        this.modal.classList.remove('glitch-active');
        this.printWelcome();
        this.scrollToBottom();
      }, 1200);
    }

    runMatrix() {
      if (!this.matrixCanvas) {
        this.matrixCanvas = document.createElement('canvas');
        this.matrixCanvas.id = 'matrix-canvas';
        document.body.appendChild(this.matrixCanvas);
      }

      this.matrixCanvas.classList.add('active');
      state.matrixRunning = true;

      const canvas = this.matrixCanvas;
      const ctx = canvas.getContext('2d');

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const letters = '01SHIVANKVIBES010101アイウエオカキクケコサシスセソタチツテトナニヌネハヒフヘホマミムメモヤユヨラリルレワヲン';
      const fontSize = 14;
      const columns = Math.floor(canvas.width / fontSize);
      const drops = Array(columns).fill(1);

      const draw = () => {
        if (!state.matrixRunning) return;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#0F0';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const text = letters.charAt(Math.floor(Math.random() * letters.length));
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);

          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
        requestAnimationFrame(draw);
      };

      draw();

      const stopListener = () => {
        this.stopMatrix();
        window.removeEventListener('click', stopListener);
      };
      setTimeout(() => {
        window.addEventListener('click', stopListener);
      }, 300);
    }

    stopMatrix() {
      state.matrixRunning = false;
      if (this.matrixCanvas) {
        this.matrixCanvas.classList.remove('active');
      }
    }
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Browser DevTools Console Integration ────────────────────────────────────
  function registerDevToolsCLI(terminalInstance) {
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
      `%c👋 Welcome to the interactive Developer Console!%c\n` +
      `Type any command below directly into this console:\n` +
      `  • %chelp%c         — Show command categories\n` +
      `  • %cprojects%c     — List all featured projects\n` +
      `  • %cskills%c       — View technical expertise\n` +
      `  • %cmatrix%c       — Digital rain animation\n` +
      `  • %chack%c         — Simulated mainframe breach\n` +
      `  • %cterminal()%c   — Open on-screen GUI Terminal\n`,
      'color: #38bdf8; font-weight: bold; font-family: monospace; line-height: 1.2; font-size: 11px;',
      'background: linear-gradient(135deg, #2563eb, #7c3aed, #db2777); color: #ffffff; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 11px; letter-spacing: 0.5px; display: inline-block;',
      '',
      'color: #38bdf8; font-weight: bold; font-size: 13px;',
      'color: #94a3b8; font-size: 11px;',
      'color: #38bdf8; font-weight: bold;', 'color: #94a3b8;',
      'color: #38bdf8; font-weight: bold;', 'color: #94a3b8;',
      'color: #38bdf8; font-weight: bold;', 'color: #94a3b8;',
      'color: #10b981; font-weight: bold;', 'color: #94a3b8;',
      'color: #f43f5e; font-weight: bold;', 'color: #94a3b8;',
      'color: #a855f7; font-weight: bold;', 'color: #94a3b8;'
    );

    // Expose all commands as functions & getters on window
    Object.keys(COMMANDS).forEach(key => {
      const def = COMMANDS[key];
      const fn = function (...args) {
        const out = def.exec(args, {
          clear: () => console.clear(),
          matrix: () => terminalInstance.runMatrix(),
          hack: () => terminalInstance.runHack()
        });
        if (typeof out === 'string') {
          console.log(out.replace(/%c/g, '').replace(/<[^>]*>/g, ''));
        }
        return `✨ Done: ${key}`;
      };

      try {
        Object.defineProperty(window, key, {
          get: () => {
            const out = def.exec([], {
              clear: () => console.clear(),
              matrix: () => terminalInstance.runMatrix(),
              hack: () => terminalInstance.runHack()
            });
            if (typeof out === 'string') {
              console.log(out.replace(/%c/g, '').replace(/<[^>]*>/g, ''));
            }
            return `💡 Tip: Call ${key}() with arguments if supported.`;
          },
          configurable: true
        });
      } catch (e) {
        window[key] = fn;
      }
    });

    // Global helper runners
    window.cli = function (cmdStr) {
      if (!cmdStr) return window.help;
      terminalInstance.execute(cmdStr);
      return `Executed: ${cmdStr}`;
    };

    window.terminal = function () {
      terminalInstance.show();
      return '💻 Terminal opened.';
    };
  }

  // ── Global Initialization ───────────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    const terminal = new TerminalUI();
    window.terminalUI = terminal;
    registerDevToolsCLI(terminal);

    // Global keyboard shortcut: Backtick (`) or Ctrl + ` or Ctrl + ~ to toggle terminal
    document.addEventListener('keydown', (e) => {
      if (e.key === '`' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        const isOpen = document.getElementById('terminal-easter-egg')?.classList.contains('visible');
        if (isOpen) {
          terminal.hide();
        } else {
          terminal.show();
        }
      }
    });

    // Wire up any .open-terminal-btn or [data-open-terminal] triggers on the page
    document.querySelectorAll('[data-open-terminal], .open-terminal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        terminal.show();
      });
    });
  });

})();
