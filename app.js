const API = 'https://api.open-meteo.com/v1/forecast';
const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search';

let location = { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 };
let unit = localStorage.getItem('skycast-unit') || 'celsius';
let weatherData;
let requestController;

const $ = (id) => document.getElementById(id);
const weatherCodes = { 0:['Clear sky','☼'],1:['Mainly clear','◒'],2:['Partly cloudy','◑'],3:['Overcast','☁'],45:['Foggy','≋'],48:['Rime fog','≋'],51:['Light drizzle','⌁'],53:['Drizzle','⌁'],55:['Heavy drizzle','⌁'],61:['Light rain','☂'],63:['Rain','☂'],65:['Heavy rain','☂'],71:['Light snow','❄'],73:['Snow','❄'],75:['Heavy snow','❄'],80:['Rain showers','☂'],81:['Rain showers','☂'],82:['Heavy showers','☂'],95:['Thunderstorm','ϟ'],96:['Thunderstorm','ϟ'],99:['Thunderstorm','ϟ'] };
const codeInfo = (code) => weatherCodes[code] || ['Variable conditions','◌'];
const temp = (value) => Number.isFinite(value) ? Math.round(value) : '--';
const time = (value) => new Date(value).toLocaleTimeString([], { hour:'numeric', minute:'2-digit' });
const day = (value, index) => index === 0 ? 'Today' : new Date(`${value}T12:00:00`).toLocaleDateString([], { weekday:'short' });

function setMessage(message, type = '') {
  const element = $('formMessage');
  element.textContent = message;
  element.dataset.type = type;
}

function setLoading(isLoading) {
  $('searchForm').classList.toggle('is-loading', isLoading);
  $('searchForm').querySelector('button').disabled = isLoading;
  $('unitToggle').disabled = isLoading;
  $('locateButton').disabled = isLoading;
  $('weatherGrid').setAttribute('aria-busy', String(isLoading));
}

async function searchCity(query) {
  const response = await fetch(`${GEO_API}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
  if (!response.ok) throw new Error('Could not reach the location service.');
  const data = await response.json();
  if (!data.results?.length) throw new Error('Could not find that city. Try another search.');
  const result = data.results[0];
  location = { name: result.name, country: result.country || result.country_code || 'Unknown location', latitude: result.latitude, longitude: result.longitude };
  await loadWeather();
}

async function loadWeather() {
  requestController?.abort();
  requestController = new AbortController();
  setLoading(true);
  setMessage('Loading forecast...');
  const params = new URLSearchParams({ latitude: location.latitude, longitude: location.longitude, timezone:'auto', forecast_days:'7', current:'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m', hourly:'temperature_2m,weather_code,precipitation_probability', daily:'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset', temperature_unit:unit === 'celsius' ? 'celsius' : 'fahrenheit', wind_speed_unit:unit === 'celsius' ? 'kmh' : 'mph' });
  try {
    const response = await fetch(`${API}?${params}`, { signal: requestController.signal });
    if (!response.ok) throw new Error('Weather service unavailable. Please try again.');
    weatherData = await response.json();
    render();
    setMessage('');
  } catch (error) {
    if (error.name === 'AbortError') return;
    setMessage(error.message || 'Unable to load the forecast.', 'error');
    $('locationName').textContent = 'Unable to load weather';
  } finally {
    setLoading(false);
  }
}

function render() {
  const { current, daily, hourly } = weatherData;
  const [summary, icon] = codeInfo(current.weather_code);
  const temperatureUnit = unit === 'celsius' ? '°C' : '°F';
  $('locationName').textContent = location.name;
  $('locationMeta').textContent = `${location.country} · Updated ${time(new Date())}`;
  $('currentIcon').textContent = icon;
  $('currentIcon').setAttribute('aria-label', summary);
  $('currentTemp').textContent = temp(current.temperature_2m);
  $('degree').textContent = temperatureUnit;
  $('feelsLike').textContent = `${temp(current.apparent_temperature)}${temperatureUnit}`;
  $('currentSummary').textContent = summary;
  $('humidity').textContent = `${current.relative_humidity_2m}%`;
  $('wind').textContent = `${Math.round(current.wind_speed_10m)} ${unit === 'celsius' ? 'km/h' : 'mph'}`;
  $('precipitation').textContent = `${current.precipitation || 0} mm`;
  $('sunrise').textContent = time(daily.sunrise[0]);
  $('sunset').textContent = time(daily.sunset[0]);
  const sunrise = new Date(daily.sunrise[0]);
  const sunset = new Date(daily.sunset[0]);
  const progress = Math.max(0, Math.min(100, ((new Date() - sunrise) / (sunset - sunrise)) * 100));
  $('daylightProgress').style.width = `${progress}%`;
  $('daylightText').textContent = `${Math.round((sunset - sunrise) / 3600000)} hours of daylight today`;
  $('updatedAt').textContent = `Updated ${time(new Date())}`;
  document.title = `${temp(current.temperature_2m)}${temperatureUnit} in ${location.name} — Skycast`;
  $('forecastList').innerHTML = daily.time.map((date, index) => { const info = codeInfo(daily.weather_code[index]); return `<div class="forecast-day ${index === 0 ? 'today' : ''}"><h3>${day(date, index)}</h3><div class="day-icon" aria-label="${info[0]}">${info[1]}</div><div class="range">${temp(daily.temperature_2m_max[index])}° <span>${temp(daily.temperature_2m_min[index])}°</span></div><div class="rain">${info[0]}</div></div>`; }).join('');
  const currentHour = hourly.time.findIndex((value) => new Date(value) >= new Date());
  const start = currentHour < 0 ? 0 : currentHour;
  $('hourlyList').innerHTML = hourly.time.slice(start, start + 8).map((timeValue, index) => { const dataIndex = start + index; const info = codeInfo(hourly.weather_code[dataIndex]); return `<div class="hour"><span>${index === 0 ? 'Now' : time(timeValue)}</span><span class="hour-icon" aria-label="${info[0]}">${info[1]}</span><strong>${temp(hourly.temperature_2m[dataIndex])}°</strong><span>${hourly.precipitation_probability[dataIndex]}%</span></div>`; }).join('');
  $('weatherTip').textContent = current.precipitation > 0 ? 'A little rain is on the way. Keep an umbrella close.' : current.temperature_2m > 25 ? 'Warm skies today. Don’t forget water and sunscreen.' : 'Comfortable weather today. A good day to get outside.';
}

$('searchForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = $('searchInput');
  const query = input.value.trim();
  if (!query) return;
  setMessage('Finding your forecast...');
  try { await searchCity(query); input.value = ''; } catch (error) { setMessage(error.message || 'Could not find that city.', 'error'); }
});

$('unitToggle').addEventListener('click', () => {
  unit = unit === 'celsius' ? 'fahrenheit' : 'celsius';
  localStorage.setItem('skycast-unit', unit);
  $('unitToggle').innerHTML = unit === 'celsius' ? '°C <span>/</span> °F' : '°F <span>/</span> °C';
  loadWeather();
});

$('locateButton').addEventListener('click', () => {
  if (!navigator.geolocation) { setMessage('Location is not available in this browser.', 'error'); return; }
  setMessage('Finding your location...');
  navigator.geolocation.getCurrentPosition(async ({ coords }) => { location = { name:'Your location', country:'Local forecast', latitude:coords.latitude, longitude:coords.longitude }; await loadWeather(); }, () => setMessage('Please allow location access, or search for a city instead.', 'error'), { enableHighAccuracy:false, timeout:10000, maximumAge:300000 });
});

$('unitToggle').innerHTML = unit === 'celsius' ? '°C <span>/</span> °F' : '°F <span>/</span> °C';
loadWeather();
