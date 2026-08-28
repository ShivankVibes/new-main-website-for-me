# Voice-Reactive Particle Sphere

A 3D particle sphere that reacts to your voice/microphone input in real time — talk, sing, or make noise, and watch the sphere pulse and deform along with the sound.

## How it works

Built with Three.js for the 3D rendering and the Web Audio API for capturing and analyzing microphone input in real time. As the audio's frequency and volume change, the particles making up the sphere shift and animate accordingly, so louder or higher-pitched sounds create more dramatic visual effects.

## Why I built it

I've always liked audio-reactive visuals, and this was a chance to combine that with some 3D graphics work using Three.js. It's a fun way to see sound in a more tangible way — plus it just looks really satisfying to watch.

## Running it

Open `voice-ball.html` in your browser and click **Start Audio** to grant microphone access. Then just talk, play music nearby, or make some noise and watch the sphere react.

## Tech used

- Three.js (WebGL rendering)
- Web Audio API (mic input + frequency analysis)
- Vanilla JS

## Notes

Needs microphone permission to work — if nothing's happening, double check your browser hasn't blocked mic access for the page.
