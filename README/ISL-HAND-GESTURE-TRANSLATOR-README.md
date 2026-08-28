# ISL Hand Gesture Translator

A browser-based tool that tries to recognize Indian Sign Language (ISL) hand gestures using your webcam, and translates them into readable text in real time.

## How it works

It leans on Google's MediaPipe Hands library to track hand landmarks straight from your webcam feed — no installs, no backend, just your browser doing the heavy lifting. Once the hand landmarks are detected, the logic in this project matches the shape/position of your fingers against known ISL signs and displays the closest match.

There's also `isl_alphabet_guide.html`, a companion reference page showing the ISL alphabet, so you can actually learn the signs before trying them out live.

## Why I made this

I wanted to explore how far you could get with real-time gesture recognition using nothing but free, open web libraries — no paid APIs, no ML model training from scratch. It's also a small step toward making sign language a bit more accessible/learnable for people who've never seen it before.

## Running it

Just open `isl.html` in a modern browser (Chrome works best) and allow camera access when prompted. For the alphabet reference, open `isl_alphabet_guide.html`.

Because it's using MediaPipe from a CDN, you'll need an internet connection the first time you load it.

## Known limitations

- Lighting and camera angle matter a lot — recognition accuracy drops in low light.
- Currently tuned for single-hand gestures.
- It's a fun experiment, not a production-grade translator — treat the recognition as "best guess," not gospel.
