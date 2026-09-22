# Skycast

Skycast is a responsive weather dashboard built with vanilla HTML, CSS, and JavaScript. It uses the free [Open-Meteo API](https://open-meteo.com/) for geocoding and forecast data, so no API key is required.

## Features

- Search forecasts by city
- Use the browser's current location
- Current conditions, sunrise/sunset, hourly outlook, and 7-day forecast
- Celsius/Fahrenheit toggle saved in local storage
- Responsive layout for mobile and desktop
- Accessible loading and error feedback
- Request cancellation to prevent stale forecast results

## Run locally

Open `index.html` in a browser. If your browser blocks local network requests, serve the folder with any static server, for example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

The project can also be deployed directly with GitHub Pages.
