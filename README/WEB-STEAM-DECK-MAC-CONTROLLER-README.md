# Web Steam Deck (Mac Controller)

This one turns your phone into a wireless remote control for your Mac — basically a DIY Steam Deck-style controller you access through a web browser, no app install required on the controller side.

## How it works

There's a small Node.js server (`server.js`, built with Express + `ws` for WebSockets) that:

1. Serves a controller UI (in `public/`) that you open on your phone's browser.
2. Generates a QR code so you can quickly connect your phone to the server without typing an IP address.
3. Talks to a native Swift helper (`mac-controller.swift`) that actually executes the input commands (clicks, keypresses, etc.) on macOS, since browsers can't directly control the OS.

There's also `Mac Deck.app`, a packaged Mac app version of the controller-side software, and a `mac-controller` folder with additional native pieces.

## Why I built it

I wanted a way to control my Mac from across the room without buying dedicated hardware — my phone is always in my pocket anyway, so why not use it? Plus it was a good excuse to mix Node, WebSockets, and native Swift/macOS accessibility APIs in one project.

## Running it

```bash
cd web-steam-deck
npm install
npm start
```

Then scan the QR code shown in the terminal/browser with your phone (make sure it's on the same Wi-Fi network as your Mac), and you should see the controller UI load up.

Note: because it needs to send input events to macOS, you'll likely need to grant Accessibility permissions to the Swift binary/app the first time you run it (macOS will prompt you).

## Heads up

This is very much a "built for myself" project — it assumes you're on a Mac and comfortable granting the accessibility permissions it needs to actually control your machine. Not tested on other OSes.
