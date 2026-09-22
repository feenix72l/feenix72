const API = 'https://api.open-meteo.com/v1/forecast';
const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search';
let location = { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 };
let unit = localStorage.getItem('skycast-unit') || 'celsius';
let weatherData;

const $ = (id) => document.getElementById(id);
const weatherCodes = { 0:['Clear sky','☼'],1:['Mainly clear','◒'],2:['Partly cloudy','◑'],3:['Overcast','☁'],45:['Foggy','≋'],48:['Rime fog','≋'],51:['Light drizzle','⌁'],53:['Drizzle','⌁'],55:['Heavy drizzle','⌁'],61:['Light rain','☂'],63:['Rain','☂'],65:['Heavy rain','☂'],71:['Light snow','❄'],73:['Snow','❄'],75:['Heavy snow','❄'],80:['Rain showers','☂'],81:['Rain showers','☂'],82:['Heavy showers','☂'],95:['Thunderstorm','ϟ'],96:['Thunderstorm','ϟ'],99:['Thunderstorm','ϟ']};
const codeInfo = (code) => weatherCodes[code] || ['Variable conditions','◌'];
const temp = (value) => Math.round(value);
const time = (value) => new Date(value).toLocaleTimeString([], { hour:'numeric', minute:'2-digit' });
const day = (value, index) => index === 0 ? 'Today' : new Date(value).toLocaleDateString([], { weekday:'short' });

async function searchCity(query) {
  const response = await fetch(`${GEO_API}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
  if (!response.ok) throw new Error('Could not find that city.');
  const data = await response.json();
  if (!data.results?.length) throw new Error('Could not find that city. Try another search.');
  const result = data.results[0];
  location = { name: result.name, country: result.country, latitude: result.latitude, longitude: result.longitude };
  await loadWeather();
}

async function loadWeather() {
  setMessage('');
  const params = new URLSearchParams({ latitude: location.latitude, longitude: location.longitude, timezone:'auto', forecast_days:'7', current:'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m', hourly:'temperature_2m,weather_code,precipitation_probability', daily:'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset', temperature_unit:unit === 'celsius' ? 'celsius' : 'fahrenheit', wind_speed_unit:unit === 'celsius' ? 'kmh' : 'mph' });
  try { const response = await fetch(`${API}?${params}`); if (!response.ok) throw new Error('Weather service unavailable.'); weatherData = await response.json(); render(); } catch (error) { setMessage(error.message); $('locationName').textContent = 'Unable to load weather'; }
}

function render() {
  const { current, daily, hourly } = weatherData;
  const [summary, icon] = codeInfo(current.weather_code);
  $('locationName').textContent = location.name;
  $('locationMeta').textContent = `${location.country} · Updated ${time(new Date())}`;
  $('currentIcon').textContent = icon;
  $('currentTemp').textContent = temp(current.temperature_2m);
  $('feelsLike').textContent = `${temp(current.apparent_temperature)}°`;
  $('currentSummary').textContent = summary;
  $('humidity').textContent = `${current.relative_humidity_2m}%`;
  $('wind').textContent = `${Math.round(current.wind_speed_10m)} ${unit === 'celsius' ? 'km/h' : 'mph'}`;
  $('precipitation').textContent = `${current.precipitation || 0} mm`;
  $('sunrise').textContent = time(daily.sunrise[0]); $('sunset').textContent = time(daily.sunset[0]);
  const sunrise = new Date(daily.sunrise[0]); const sunset = new Date(daily.sunset[0]); const now = new Date();
  const progress = Math.max(0, Math.min(100, ((now - sunrise) / (sunset - sunrise)) * 100));
  $('daylightProgress').style.width = `${progress}%`; $('daylightText').textContent = `${Math.round((sunset - sunrise) / 3600000)} hours of daylight today`;
  $('updatedAt').textContent = `Updated ${time(new Date())}`;
  $('forecastList').innerHTML = daily.time.map((date, i) => { const info = codeInfo(daily.weather_code[i]); return `<div class="forecast-day ${i === 0 ? 'today' : ''}"><h3>${day(date, i)}</h3><div class="day-icon">${info[1]}</div><div class="range">${temp(daily.temperature_2m_max[i])}° <span>${temp(daily.temperature_2m_min[i])}°</span></div><div class="rain">${info[0]}</div></div>`; }).join('');
  const currentHour = hourly.time.findIndex((t) => new Date(t) >= new Date()); const start = currentHour < 0 ? 0 : currentHour;
  $('hourlyList').innerHTML = hourly.time.slice(start, start + 8).map((timeValue, i) => { const index = start + i; const info = codeInfo(hourly.weather_code[index]); return `<div class="hour"><span>${i === 0 ? 'Now' : time(timeValue)}</span><span class="hour-icon">${info[1]}</span><strong>${temp(hourly.temperature_2m[index])}°</strong><span>${hourly.precipitation_probability[index]}%</span></div>`; }).join('');
  $('weatherTip').textContent = current.precipitation > 0 ? 'A little rain is on the way. Keep an umbrella close.' : current.temperature_2m > 25 ? 'Warm skies today. Don’t forget water and sunscreen.' : 'Comfortable weather today. A good day to get outside.';
}

function setMessage(message) { $('formMessage').textContent = message; }
$('searchForm').addEventListener('submit', async (event) => { event.preventDefault(); const input = $('searchInput'); if (!input.value.trim()) return; setMessage('Finding your forecast...'); try { await searchCity(input.value.trim()); input.value = ''; } catch (error) { setMessage(error.message); } });
$('unitToggle').addEventListener('click', () => { unit = unit === 'celsius' ? 'fahrenheit' : 'celsius'; localStorage.setItem('skycast-unit', unit); $('unitToggle').innerHTML = unit === 'celsius' ? '°C <span>/</span> °F' : '°F <span>/</span> °C'; loadWeather(); });
$('locateButton').addEventListener('click', () => { if (!navigator.geolocation) return setMessage('Location is not available in this browser.'); setMessage('Finding your location...'); navigator.geolocation.getCurrentPosition(async (position) => { location = { name:'Your location', country:'Local forecast', latitude:position.coords.latitude, longitude:position.coords.longitude }; await loadWeather(); }, () => setMessage('Please allow location access, or search for a city instead.')); });
$('unitToggle').innerHTML = unit === 'celsius' ? '°C <span>/</span> °F' : '°F <span>/</span> °C';
loadWeather();
