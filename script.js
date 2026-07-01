const cityInput = document.getElementById("city-input");
const weatherButton = document.getElementById("get-weather-btn");
const statusMessage = document.getElementById("status-message");
const weatherIcon = document.getElementById("weather-icon");
const mainTemperature = document.getElementById("main-temperature");
const feelsLike = document.getElementById("feels-like");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const windGust = document.getElementById("wind-gust");
const weatherMain = document.getElementById("weather-main");
const locationName = document.getElementById("location");

const valueOrNA = (value) => (value === undefined || value === null ? "N/A" : value);
const formatValue = (value, unit = "") => {
  const safeValue = valueOrNA(value);
  return safeValue === "N/A" ? safeValue : `${safeValue}${unit}`;
};

const setStatus = (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
};

const periodThemes = {
  day: {
    default: "",
    clear: "linear-gradient(145deg, #6fc6ff 0%, #bfe9ff 48%, #ffe08a 100%)",
    clouds: "linear-gradient(145deg, #8fa3b8 0%, #d9e1e8 46%, #f7fafc 100%)",
    fog: "linear-gradient(145deg, #cbd5da 0%, #eef1f2 50%, #aebbc2 100%)",
    drizzle: "linear-gradient(145deg, #4e6475 0%, #8aa3b3 52%, #d7e4ea 100%)",
    rain: "linear-gradient(145deg, #4e6475 0%, #8aa3b3 52%, #d7e4ea 100%)",
    snow: "linear-gradient(145deg, #d6e8f3 0%, #f8fbff 52%, #b8cedc 100%)",
    thunderstorm: "linear-gradient(145deg, #202637 0%, #4f5d72 52%, #9ca8b7 100%)",
  },
  night: {
    default: "linear-gradient(145deg, #02040a 0%, #0b1730 50%, #14323d 100%)",
    clear: "linear-gradient(145deg, #02040a 0%, #0b1730 50%, #14323d 100%)",
    clouds: "linear-gradient(145deg, #070a10 0%, #182432 50%, #354653 100%)",
    fog: "linear-gradient(145deg, #080c10 0%, #1a2529 48%, #3b4748 100%)",
    drizzle: "linear-gradient(145deg, #05070c 0%, #10212d 48%, #233e50 100%)",
    rain: "linear-gradient(145deg, #05070c 0%, #10212d 48%, #233e50 100%)",
    snow: "linear-gradient(145deg, #06101a 0%, #1b2d3a 50%, #51646d 100%)",
    thunderstorm: "linear-gradient(145deg, #030407 0%, #11141f 52%, #2f3546 100%)",
  },
};

const isNightIcon = (iconUrl) => /(?:^|\/)[0-9]{2}n\.png$/i.test(String(iconUrl || ""));

const setWeatherBackground = (weatherType, isNight = false) => {
  const normalizedWeather = String(weatherType || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
  const weatherKey = normalizedWeather || "default";
  const period = isNight ? "night" : "day";
  const theme = periodThemes[period][weatherKey] || periodThemes[period].default;

  document.body.dataset.weather = weatherKey;
  document.body.dataset.period = period;
  document.body.classList.toggle("night-mode", isNight);
  document.body.classList.toggle("day-mode", !isNight);
  document.body.style.background = theme;

  if (window.setWeatherEffect) {
    window.setWeatherEffect(weatherKey, { isNight });
  }
};

function isNightTime(sunriseStr, sunsetStr, nowStr, isDayFlag) {
  if (isDayFlag === 1) return false;
  if (isDayFlag === 0) return true;
  if (!sunriseStr || !sunsetStr || !nowStr) return false;

  const sunrise = new Date(sunriseStr).getTime();
  const sunset = new Date(sunsetStr).getTime();
  const now = new Date(nowStr).getTime();

  if ([sunrise, sunset, now].some(Number.isNaN)) return false;
  return now < sunrise || now > sunset;
}

function toNightIcon(iconCode) {
  return iconCode ? iconCode.replace(/d$/, "n") : iconCode;
}

function getSunCycle(daily, nowStr) {
  const dates = daily.time || [];
  const sunrises = daily.sunrise || [];
  const sunsets = daily.sunset || [];
  const todayIndex = Math.max(0, dates.findIndex((date) => nowStr && nowStr.startsWith(date)));
  const index = todayIndex === -1 ? 0 : todayIndex;

  return {
    previousSunset: sunsets[Math.max(0, index - 1)],
    sunriseToday: sunrises[index],
    sunsetToday: sunsets[index],
    sunriseTomorrow: sunrises[Math.min(sunrises.length - 1, index + 1)],
    now: nowStr,
  };
}

const weatherCodes = {
  0: ["Clear", "Clear sky", "01d"],
  1: ["Clear", "Mainly clear", "02d"],
  2: ["Clouds", "Partly cloudy", "03d"],
  3: ["Clouds", "Overcast", "04d"],
  45: ["Fog", "Fog", "50d"],
  48: ["Fog", "Depositing rime fog", "50d"],
  51: ["Drizzle", "Light drizzle", "09d"],
  53: ["Drizzle", "Moderate drizzle", "09d"],
  55: ["Drizzle", "Dense drizzle", "09d"],
  56: ["Drizzle", "Light freezing drizzle", "09d"],
  57: ["Drizzle", "Dense freezing drizzle", "09d"],
  61: ["Rain", "Slight rain", "10d"],
  63: ["Rain", "Moderate rain", "10d"],
  65: ["Rain", "Heavy rain", "10d"],
  66: ["Rain", "Light freezing rain", "10d"],
  67: ["Rain", "Heavy freezing rain", "10d"],
  71: ["Snow", "Slight snow fall", "13d"],
  73: ["Snow", "Moderate snow fall", "13d"],
  75: ["Snow", "Heavy snow fall", "13d"],
  77: ["Snow", "Snow grains", "13d"],
  80: ["Rain", "Slight rain showers", "09d"],
  81: ["Rain", "Moderate rain showers", "09d"],
  82: ["Rain", "Violent rain showers", "09d"],
  85: ["Snow", "Slight snow showers", "13d"],
  86: ["Snow", "Heavy snow showers", "13d"],
  95: ["Thunderstorm", "Thunderstorm", "11d"],
  96: ["Thunderstorm", "Thunderstorm with slight hail", "11d"],
  99: ["Thunderstorm", "Thunderstorm with heavy hail", "11d"],
};

async function getWeather(city) {
  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    if (!geoResponse.ok) throw new Error("Location request failed");

    const geoData = await geoResponse.json();
    const place = geoData.results && geoData.results[0];
    if (!place) throw new Error("City not found");

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${place.latitude}&longitude=${place.longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_gusts_10m` +
        `&daily=sunrise,sunset` +
        `&past_days=1` +
        `&forecast_days=2` +
        `&wind_speed_unit=ms` +
        `&timezone=auto`
    );
    if (!weatherResponse.ok) throw new Error("Weather request failed");

    const weatherData = await weatherResponse.json();
    const current = weatherData.current || {};
    const daily = weatherData.daily || {};
    const condition = weatherCodes[current.weather_code] || ["N/A", "N/A", "01d"];
    const sunCycle = getSunCycle(daily, current.time);
    const night = isNightTime(
      sunCycle.sunriseToday,
      sunCycle.sunsetToday,
      current.time,
      current.is_day
    );
    const iconCode = night ? toNightIcon(condition[2]) : condition[2];

    return {
      weather: [{
        main: condition[0],
        description: condition[1],
        icon: `https://cdn.freecodecamp.org/weather-icons/${iconCode}.png`,
      }],
      main: {
        temp: current.temperature_2m,
        feels_like: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
      },
      wind: {
        speed: current.wind_speed_10m,
        gust: current.wind_gusts_10m,
      },
      sun: { ...sunCycle, isNight: night },
      isNight: night,
      name: place.country ? `${place.name}, ${place.country}` : place.name,
    };
  } catch (error) {
    console.log(error);
  }
}

async function showWeather(city) {
  const searchCity = city.trim();
  if (!searchCity) return;

  setStatus("Loading weather...");
  weatherButton.disabled = true;

  let data;
  try {
    data = await window.getWeather(searchCity);
  } catch (error) {
    data = undefined;
  }

  if (data === undefined) {
    setStatus("Something went wrong, please try again later.", true);
    weatherButton.disabled = false;
    return;
  }

  const weather = data.weather && data.weather[0] ? data.weather[0] : {};

  if (weather.icon) {
    weatherIcon.setAttribute("src", weather.icon);
    weatherIcon.setAttribute("alt", valueOrNA(weather.description));
  } else {
    weatherIcon.removeAttribute("src");
    weatherIcon.setAttribute("alt", "");
  }
  mainTemperature.textContent = formatValue(data.main && data.main.temp, "\u00b0C");
  feelsLike.textContent = formatValue(data.main && data.main.feels_like, "\u00b0C");
  humidity.textContent = formatValue(data.main && data.main.humidity, "%");
  wind.textContent = formatValue(data.wind && data.wind.speed, " m/s");
  windGust.textContent = formatValue(data.wind && data.wind.gust, " m/s");
  weatherMain.textContent = valueOrNA(weather.main);
  locationName.textContent = valueOrNA(data.name);

  const night = Boolean(data.isNight || (data.sun && data.sun.isNight) || isNightIcon(weather.icon));
  if (data.sun && window.setSunTimes) {
    window.setSunTimes({ ...data.sun, isNight: night });
  }
  setWeatherBackground(weather.main, night);

  setStatus("");
  weatherButton.disabled = false;
}

window.getWeather = getWeather;
window.showWeather = showWeather;

weatherButton.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) return;
  localStorage.setItem("lastCity", city);
  window.showWeather(city);
});

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") weatherButton.click();
});

const lastCity = localStorage.getItem("lastCity");
if (lastCity) {
  cityInput.value = lastCity;
  window.showWeather(lastCity);
}
