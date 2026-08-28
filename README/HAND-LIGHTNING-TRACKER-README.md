# Hand Lightning Tracker

This one's just for fun — it tracks your hand movements through your webcam and draws crackling lightning-bolt effects that follow your fingers around, kind of like you've got electricity shooting out of your hands.

## How it works

Uses MediaPipe's `HandLandmarker` (the newer tasks-vision API) to get real-time hand landmark positions, then draws animated lightning arcs on an HTML canvas that trace along your fingers and palm as you move.

## Why I built it

Honestly? Because it looked cool. After playing around with hand-tracking for the ISL translator project, I wanted to do something purely visual and satisfying with the same tech — less "useful tool," more "neat party trick."

## Running it

Open `lightning-hands.html` in your browser and grant camera permission. Move your hands around in front of the camera and watch the lightning follow.

Works best in good lighting with a plain background — busy backgrounds can confuse the hand tracking a little.

## Tech used

- MediaPipe Tasks Vision (`HandLandmarker`)
- HTML5 Canvas for the lightning rendering
- Vanilla JS, no frameworks
