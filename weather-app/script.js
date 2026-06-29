const searchButton = document.getElementById('search-button');
const cityInput = document.getElementById('city-input');
const statusEl = document.getElementById('status');
const weatherContainer = document.getElementById('weather-container');
const locationEl = document.getElementById('location');
const descriptionEl = document.getElementById('description');
const temperatureEl = document.getElementById('temperature');
const windEl = document.getElementById('wind');
const humidityEl = document.getElementById('humidity');
const pressureEl = document.getElementById('pressure');
const timeEl = document.getElementById('time');

const weatherCodeMap = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Freezing fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail',
};

searchButton.addEventListener('click', async () => {
  const city = cityInput.value.trim();
  if (!city) {
    updateStatus('Please enter a city name.', true);
    return;
  }

  weatherContainer.classList.add('hidden');
  updateStatus('Looking up city…');

  try {
    const location = await fetchLocation(city);
    const weather = await fetchWeather(location.latitude, location.longitude, location.timezone);
    showWeather(location, weather);
    updateStatus('Weather updated successfully.');
  } catch (error) {
    console.error(error);
    updateStatus(error.message || 'Unable to load weather.', true);
  }
});

cityInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    searchButton.click();
  }
});

function updateStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ff8787' : '#c5d5f4';
}

async function fetchLocation(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch location.');

  const data = await response.json();
  const location = data.results?.[0];

  if (!location) {
    throw new Error('City not found. Try a different name.');
  }

  return {
    name: `${location.name}${location.admin1 ? ', ' + location.admin1 : ''}${location.country ? ', ' + location.country : ''}`,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone || 'auto',
  };
}

async function fetchWeather(latitude, longitude, timezone) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,pressure_msl&timezone=${encodeURIComponent(timezone)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch weather.');

  const data = await response.json();
  const current = data.current_weather;
  const hourlyTimes = data.hourly?.time || [];
  const currentIndex = hourlyTimes.indexOf(current.time);
  const humidity = currentIndex >= 0 ? data.hourly?.relativehumidity_2m?.[currentIndex] : data.hourly?.relativehumidity_2m?.[0];
  const pressure = currentIndex >= 0 ? data.hourly?.pressure_msl?.[currentIndex] : data.hourly?.pressure_msl?.[0];

  return {
    temperature: current.temperature,
    windSpeed: current.windspeed,
    windDirection: current.winddirection,
    weatherCode: current.weathercode,
    time: current.time,
    humidity,
    pressure,
  };
}

function showWeather(location, weather) {
  locationEl.textContent = location.name;
  descriptionEl.textContent = weatherCodeMap[weather.weatherCode] || 'Current conditions';
  temperatureEl.textContent = `${Math.round(weather.temperature)}°C`;
  windEl.textContent = `${Math.round(weather.windSpeed)} km/h · ${formatWindDirection(weather.windDirection)}`;
  humidityEl.textContent = weather.humidity ? `${Math.round(weather.humidity)}%` : 'N/A';
  pressureEl.textContent = weather.pressure ? `${Math.round(weather.pressure)} hPa` : 'N/A';
  timeEl.textContent = formatTime(weather.time, location.timezone);
  weatherContainer.classList.remove('hidden');
}

function formatWindDirection(degrees) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(degrees / 45) % 8];
}

function formatTime(value, timezone) {
  try {
    const date = new Date(value);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    });
  } catch {
    return value;
  }
}
