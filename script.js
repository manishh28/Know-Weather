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

const setWeatherBackground = (weatherType) => {
  const normalizedWeather = String(weatherType || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  document.body.dataset.weather = normalizedWeather || "default";

  if (window.setWeatherEffect) {
    window.setWeatherEffect(normalizedWeather || "default");
  }
};

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
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city
      )}&count=1&language=en&format=json`
    );

    if (!geoResponse.ok) {
      throw new Error("Location request failed");
    }

    const geoData = await geoResponse.json();
    const place = geoData.results && geoData.results[0];

    if (!place) {
      throw new Error("City not found");
    }

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m&daily=sunrise,sunset&wind_speed_unit=ms&timezone=auto`
    );

    if (!weatherResponse.ok) {
      throw new Error("Weather request failed");
    }

    const weatherData = await weatherResponse.json();
    const current = weatherData.current || {};
    const daily = weatherData.daily || {};
    const condition = weatherCodes[current.weather_code] || ["N/A", "N/A", "01d"];

    return {
