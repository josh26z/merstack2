// API Key for OpenWeatherMap (sign up for free at https://openweathermap.org/)
const API_KEY = 'df414a9fda537d2caef29ff7029d68fa'; // Replace with your actual API key

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const currentLocationBtn = document.getElementById('current-location-btn');
const currentCity = document.getElementById('current-city');
const currentIcon = document.getElementById('current-icon');
const currentTemp = document.getElementById('current-temp');
const currentDesc = document.getElementById('current-desc');
const currentFeels = document.getElementById('current-feels');
const currentHumidity = document.getElementById('current-humidity');
const currentWind = document.getElementById('current-wind');
const forecastContainer = document.getElementById('forecast-container');
const recentList = document.getElementById('recent-list');

// Recent searches array
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// Initialize the app
function init() {
    // Load recent searches
    renderRecentSearches();
    
    // Set up event listeners
    searchBtn.addEventListener('click', searchWeather);
    currentLocationBtn.addEventListener('click', getLocationWeather);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWeather();
    });
    
    // Load last searched city if available
    if (recentSearches.length > 0) {
        fetchWeather(recentSearches[0]);
    }
}

// Search weather by city name
function searchWeather() {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city);
        cityInput.value = '';
    } else {
        alert('Please enter a city name');
    }
}

// Get weather by current location
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            error => {
                alert('Unable to get your location: ' + error.message);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

// Fetch weather data by city name
async function fetchWeather(city) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        const data = await response.json();
        displayCurrentWeather(data);
        fetchForecast(data.coord.lat, data.coord.lon);
        
        // Add to recent searches
        addToRecentSearches(data.name);
    } catch (error) {
        alert(error.message);
    }
}

// Fetch weather data by coordinates
async function fetchWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Location not found');
        }
        
        const data = await response.json();
        displayCurrentWeather(data);
        fetchForecast(lat, lon);
        
        // Add to recent searches
        addToRecentSearches(data.name);
    } catch (error) {
        alert(error.message);
    }
}

// Fetch 5-day forecast
async function fetchForecast(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Forecast not available');
        }
        
        const data = await response.json();
        displayForecast(data);
    } catch (error) {
        console.error(error);
    }
}

// Display current weather
function displayCurrentWeather(data) {
    currentCity.textContent = `${data.name}, ${data.sys.country}`;
    currentTemp.textContent = `${Math.round(data.main.temp)}°C`;
    currentDesc.textContent = data.weather[0].description;
    currentFeels.textContent = `${Math.round(data.main.feels_like)}°C`;
    currentHumidity.textContent = `${data.main.humidity}%`;
    currentWind.textContent = `${data.wind.speed} m/s`;
    
    // Set weather icon
    currentIcon.innerHTML = getWeatherIcon(data.weather[0].icon);
}

// Display 5-day forecast
function displayForecast(data) {
    // Clear previous forecast
    forecastContainer.innerHTML = '';
    
    // Filter to get one entry per day (every 24 hours)
    const dailyForecast = data.list.filter((item, index) => index % 8 === 0);
    
    dailyForecast.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">${getWeatherIcon(day.weather[0].icon)}</div>
            <div class="forecast-temp">
                <span class="max-temp">${Math.round(day.main.temp_max)}°</span>
                <span class="min-temp">${Math.round(day.main.temp_min)}°</span>
            </div>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}

// Get weather icon based on OpenWeatherMap icon code
function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'fas fa-sun',          // clear sky (day)
        '01n': 'fas fa-moon',         // clear sky (night)
        '02d': 'fas fa-cloud-sun',    // few clouds (day)
        '02n': 'fas fa-cloud-moon',   // few clouds (night)
        '03d': 'fas fa-cloud',        // scattered clouds
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud',        // broken clouds
        '04n': 'fas fa-cloud',
        '09d': 'fas fa-cloud-rain',   // shower rain
        '09n': 'fas fa-cloud-rain',
        '10d': 'fas fa-cloud-sun-rain', // rain (day)
        '10n': 'fas fa-cloud-moon-rain', // rain (night)
        '11d': 'fas fa-bolt',         // thunderstorm
        '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake',    // snow
        '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog',         // mist
        '50n': 'fas fa-smog'
    };
    
    return `<i class="${iconMap[iconCode] || 'fas fa-question'}"></i>`;
}

// Add city to recent searches
function addToRecentSearches(city) {
    // Remove if already exists
    recentSearches = recentSearches.filter(item => item !== city);
    
    // Add to beginning of array
    recentSearches.unshift(city);
    
    // Keep only last 5 searches
    if (recentSearches.length > 5) {
        recentSearches.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    
    // Update UI
    renderRecentSearches();
}

// Render recent searches list
function renderRecentSearches() {
    recentList.innerHTML = '';
    
    recentSearches.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        li.addEventListener('click', () => fetchWeather(city));
        recentList.appendChild(li);
    });
}

// Initialize the app
init();