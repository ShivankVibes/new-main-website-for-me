# Weather App

A simple, no-frills weather app — type in a city, get the current weather. That's it.

## How it works

It uses Open-Meteo's free APIs (geocoding + forecast) to look up a city and pull real-time weather data — temperature, wind, humidity, pressure, and general conditions. No API key needed, no sign-up, nothing to configure.

## Why I built it

Sometimes you just want a clean, fast weather check without ads, trackers, or a bloated app. This was also a nice small project to practice working with public APIs that don't require auth.

## Running it

Open `index.html` in your browser (or serve the folder with any static server), type in a city name, and hit **Get Weather**.

```bash
cd weather-app
python3 -m http.server 8000
```

## APIs it talks to

- `https://geocoding-api.open-meteo.com/v1/search` – turns the city name into coordinates
- `https://api.open-meteo.com/v1/forecast` – pulls the actual weather data for those coordinates

Both are free and don't require any API key, so this should keep working without any setup on your end.
