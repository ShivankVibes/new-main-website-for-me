# My Portfolio Site

This is my personal portfolio — basically a little desktop-style website where I've collected all the random projects I've built over time. I wanted it to feel less like a boring list of links and more like something fun to click around in, so I went with a "desktop" theme (see `portfolio.html`) alongside the more standard landing page (`index.html`).

## What's in here

- `index.html` – the main landing page
- `portfolio.html` – the desktop-style portfolio view
- `css/` – styles, animations, and responsive tweaks
- `js/` – the JS that powers the animations, particles, and general app behavior
- `images/` – screenshots/thumbnails for each project shown on the site
- `assets/` – favicon and other small assets

## Why I built it this way

Most portfolio sites look the same, so I tried to make mine a bit more playful — with animated backgrounds, particle effects, and a "desktop" metaphor where each project is basically its own little window/app. It's still a work in progress and I keep adding new projects to it whenever I finish something I'm proud of.

## Running it locally

There's no build step — it's plain HTML/CSS/JS. Just open `index.html` (or `portfolio.html`) in a browser, or spin up any static file server in the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Notes to self

- A bunch of the individual project pages (ISL translator, Morse translator, voice ball, etc.) live as separate `.html` files right alongside this one — they're meant to be opened either directly or through the portfolio.
- Some projects shown as images on the site (like the Arduino/3D/Tanpura ones) aren't included as code here — those live in other repos of mine, this site just showcases them.
