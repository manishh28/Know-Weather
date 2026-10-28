# Know Weather

Know Weather is a responsive weather dashboard that combines live conditions,
hourly and seven-day forecasts, precipitation information, air quality, weather
alerts, saved cities, a radar map, and a practical AI weather assistant.

## Live site

https://manishh28.github.io/Know-Weather/

## Technology

- React 18, used for the complete application UI, data state, API requests, and interactions
- CSS for responsive layout, day/night themes, and glass-style panels
- Canvas API for animated rain, clouds, snow, fog, and lightning effects
- Open-Meteo APIs for geocoding, live weather, forecasts, sunrise/sunset, and air quality
- RainViewer for precipitation radar imagery
- Cloudflare Workers AI for the weather assistant
- localStorage for saved cities and the most recently searched location
- GitHub Pages for hosting

## Features

- City search with suggestions
- Current weather, feels-like temperature, humidity, wind, and gusts
- 24-hour scrolling forecast and seven-day forecast
- Day and night themes based on the searched city's sunrise and sunset
- Precipitation totals, radar map, weather alerts, and air-quality details
- Favorite cities stored in the browser
- AI assistant for practical questions about rain, clothing, travel, and weather conditions

## Project structure

```text
index.html             Page shell and script loading
react-app.js           React components, API requests, state, forecasts, radar, favorites, and AI requests
styles.css             Responsive application styling
weather-effects.js     Canvas and sun/moon weather effects
cloudflare-worker/     Cloudflare Workers AI backend
assets/                Local weather and sky artwork
```

## Run locally

This is a static project, so no build step is required. Open `index.html` in a
browser, or serve the folder with a simple local web server.

## Deployment

Push changes to the `main` branch. GitHub Pages publishes the site at the live
site URL above.
