const apiKey = "a2c0c504d2ad036873015ed88f101d42";

// DOM
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");

const cityName = document.getElementById("cityName");
const temp = document.getElementById("temp");
const condition = document.getElementById("condition");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const icon = document.getElementById("icon");
const feelsLike = document.getElementById("feelsLike");
const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");

const loader = document.getElementById("loader");
const errorBox = document.getElementById("error");
const weatherCard = document.getElementById("weatherCard");
const forecastBox = document.getElementById("forecast");
const hourlyBox = document.getElementById("hourly");
const recentBox = document.getElementById("recent");

// INIT
showRecent();

// EVENTS
searchBtn.addEventListener("click", () => getWeather(cityInput.value));
locationBtn.addEventListener("click", getLocationWeather);

cityInput.addEventListener("keypress", e => {
  if (e.key === "Enter") getWeather(cityInput.value);
});

// DARK MODE
document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("dark");
};

// MAIN WEATHER
async function getWeather(city) {
  city = city.trim();
  if (!city) return showError("Enter city name");

  showLoading(true);
  clearError();

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    updateUI(data);
    getForecast(data.coord.lat, data.coord.lon);

  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

// FORECAST (5 DAYS)
async function getForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  const res = await fetch(url);
  const data = await res.json();

  forecastBox.innerHTML = "";
  hourlyBox.innerHTML = "";

  const daily = data.list.filter(i => i.dt_txt.includes("12:00:00"));

  // DAILY FORECAST
  daily.slice(0, 5).forEach(day => {
    forecastBox.innerHTML += `
      <div class="card">
        <p>${Math.round(day.main.temp)}°C</p>
        <p>${day.weather[0].main}</p>
      </div>
    `;
  });

  // HOURLY FORECAST (next 6)
  data.list.slice(0, 6).forEach(hour => {
    const time = hour.dt_txt.split(" ")[1].slice(0,5);

    hourlyBox.innerHTML += `
      <div class="hour-card">
        <p>${time}</p>
        <p>${Math.round(hour.main.temp)}°C</p>
      </div>
    `;
  });
}

// GPS LOCATION
function getLocationWeather() {
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude, longitude } = pos.coords;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

    const res = await fetch(url);
    const data = await res.json();

    updateUI(data);
    getForecast(latitude, longitude);
  });
}

// UI UPDATE
function updateUI(data) {
  weatherCard.classList.remove("hidden");

  cityName.textContent = `${data.name}, ${data.sys.country}`;
  temp.textContent = `${Math.round(data.main.temp)}°C`;
  condition.textContent = data.weather[0].description;

  humidity.textContent = `Humidity: ${data.main.humidity}%`;
  wind.textContent = `Wind: ${data.wind.speed} m/s`;

  feelsLike.textContent = `Feels like: ${Math.round(data.main.feels_like)}°C`;

  icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  // Sunrise & Sunset
  sunrise.textContent = `Sunrise: ${convertTime(data.sys.sunrise)}`;
  sunset.textContent = `Sunset: ${convertTime(data.sys.sunset)}`;

  // Background change
  setWeatherTheme(data.weather[0].main);

  saveRecent(data.name);
}

// TIME CONVERTER
function convertTime(unix) {
  return new Date(unix * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// WEATHER BACKGROUND
function setWeatherTheme(type) {
  const body = document.body;

  body.classList.remove("sunny", "rainy", "cloudy", "snow");

  if (type.includes("Rain")) body.classList.add("rainy");
  else if (type.includes("Cloud")) body.classList.add("cloudy");
  else if (type.includes("Snow")) body.classList.add("snow");
  else body.classList.add("sunny");
}

// RECENT SEARCH
function saveRecent(city) {
  let recent = JSON.parse(localStorage.getItem("recent")) || [];

  if (!recent.includes(city)) {
    recent.unshift(city);
    recent = recent.slice(0, 5);
  }

  localStorage.setItem("recent", JSON.stringify(recent));
  showRecent();
}

function showRecent() {
  let recent = JSON.parse(localStorage.getItem("recent")) || [];

  recentBox.innerHTML = "";

  recent.forEach(c => {
    const btn = document.createElement("button");
    btn.textContent = c;
    btn.onclick = () => getWeather(c);
    recentBox.appendChild(btn);
  });
}

// LOADING
function showLoading(state) {
  loader.classList.toggle("hidden", !state);
  weatherCard.classList.add("hidden");
}

// ERROR
function showError(msg) {
  errorBox.textContent = "⚠️ " + msg;
}

function clearError() {
  errorBox.textContent = "";
}