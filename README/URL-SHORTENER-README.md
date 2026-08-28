# URL Shortener

A simple client-side URL shortener — paste in a long link, get a short one back.

## How it works

This one doesn't rely on a backend or database. It generates short codes and keeps track of your shortened links using `localStorage` in your browser, so your link history sticks around between visits (but only on that browser/device).

## Why I built it

I wanted something simple to demonstrate handling data persistence entirely in the browser, without needing to spin up a server or a database just for a small demo tool. It's not meant to replace real shorteners like Bitly — it's more of a learning project and a handy little utility for myself.

## Running it

Open `url-shortener.html` in your browser, paste a URL, and click **Generate short link**. Since everything's stored locally, your shortened links won't be accessible from other devices or browsers.

## Heads up

Because there's no real backend, the "short" links this generates won't actually resolve anywhere outside this page — it's more of a UI/UX demo than a production shortener like tinyurl or bit.ly.
