const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherInfo = document.getElementById('weatherInfo');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');

const cityNameEl = document.getElementById('cityName');
const tempEl = document.getElementById('temperature');
const conditionEl = document.getElementById('conditionText');
const descriptionEl = document.getElementById('descriptionText');
const humidityEl = document.getElementById('humidityValue');
const windEl = document.getElementById('windValue');

// WMO Weather interpretation codes
const weatherCodes = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    71: 'Slight Snow Fall',
    73: 'Moderate Snow Fall',
    75: 'Heavy Snow Fall',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    95: 'Thunderstorm',
};

async function getWeatherData(city) {
    try {
        showLoader();
        hideError();
        hideWeather();

        // 1. Geocoding API to get lat/lon
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found. Please check the spelling.');
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // 2. Weather API
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&relative_humidity_2m=true`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        updateUI(name, country, weatherData);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoader();
    }
}

function updateUI(city, country, data) {
    const current = data.current_weather;
    const humidity = data.current_weather_units ? "" : "N/A"; // Open-Meteo current_weather doesn't always include humidity directly in one object
    
    // Note: To get humidity in current_weather with Open-Meteo, we sometimes need to look at hourly or use specific parameters.
    // Let's adjust the fetch to include current humidity if possible or just use a placeholder if not.
    // Actually, I'll update the fetch to get current humidity properly.
    
    const temp = Math.round(current.temperature);
    const wind = current.windspeed;
    const condition = weatherCodes[current.weathercode] || 'Cloudy';

    cityNameEl.textContent = `${city}, ${country}`;
    tempEl.textContent = `${temp}°C`;
    conditionEl.textContent = condition;

    // Indian English requirement: “Today’s Weather in Delhi is Sunny with 32°C”
    descriptionEl.textContent = `Today’s Weather in ${city} is ${condition} with ${temp}°C.`;
    
    // Open-Meteo current_weather doesn't return humidity in the 'current_weather' object by default.
    // I will mock humidity for now or just show a '-' if not found.
    // For a better experience, I'll update the fetch to include 'current' variables.
    
    windEl.textContent = `${wind} km/h`;
    
    // We'll show the info
    weatherInfo.classList.add('active');
}

// Improved fetch to get humidity
async function getWeatherDataImproved(city) {
    try {
        showLoader();
        hideError();
        hideWeather();

        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found. Please check the spelling.');
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // Fetch current with specific variables
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        const current = weatherData.current;
        const temp = Math.round(current.temperature_2m);
        const humidity = current.relative_humidity_2m;
        const wind = current.wind_speed_10m;
        const condition = weatherCodes[current.weather_code] || 'Cloudy';

        cityNameEl.textContent = `${city}, ${country}`;
        tempEl.textContent = `${temp}°C`;
        conditionEl.textContent = condition;
        descriptionEl.textContent = `Today’s Weather in ${city} is ${condition} with ${temp}°C.`;
        humidityEl.textContent = `${humidity}%`;
        windEl.textContent = `${wind} km/h`;

        weatherInfo.classList.add('active');
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoader();
    }
}

function showLoader() { loader.style.display = 'block'; }
function hideLoader() { loader.style.display = 'none'; }
function showError(msg) { errorMessage.textContent = msg; errorMessage.style.display = 'block'; }
function hideError() { errorMessage.style.display = 'none'; }
function hideWeather() { weatherInfo.classList.remove('active'); }

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherDataImproved(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherDataImproved(city);
        }
    }
});

// Load a default city
getWeatherDataImproved('Delhi');
