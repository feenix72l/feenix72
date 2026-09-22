# Skycast

Skycast is a responsive, installable weather dashboard built with vanilla HTML, CSS, and JavaScript. It uses the free [Open-Meteo API](https://open-meteo.com/) for geocoding and forecast data, so no API key is required.

## Features

- Search forecasts by city
- Quick city shortcuts and browser geolocation
- Current conditions, sunrise/sunset, hourly outlook, and 7-day forecast
- Celsius/Fahrenheit toggle saved in local storage
- Manual forecast refresh
- Responsive layout for mobile and desktop
- Installable as a Progressive Web App (PWA)
- Offline app-shell caching after the first visit
- Accessible loading and error feedback
- Request cancellation to prevent stale forecast results

## Run locally

Open `index.html` in a browser. For PWA installation and reliable API requests, use a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Download

- [Download the latest source as a ZIP](https://github.com/feenix72l/feenix72/archive/refs/heads/main.zip)
- [Browse the latest build on GitHub](https://github.com/feenix72l/feenix72/tree/main)

The project can also be deployed directly with GitHub Pages. Once served over HTTPS, supported browsers can install Skycast from the browser's install option.
