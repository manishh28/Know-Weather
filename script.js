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
const highLow = document.getElementById("high-low");
const forecastInsight = document.getElementById("forecast-insight");
const hourlyForecast = document.getElementById("hourly-forecast");
const dailyForecast = document.getElementById("daily-forecast");
const DAILY_FORECAST_DAYS = 7;
const HOURLY_FORECAST_HOURS = 24;

const valueOrNA = (value) => (value === undefined || value === null ? "N/A" : value);
const isNumber = (value) => Number.isFinite(Number(value));
const roundTemp = (value) => (isNumber(value) ? Math.round(Number(value)) : null);
const formatTemp = (value) => {
  const rounded = roundTemp(value);
  return rounded === null ? "N/A" : `${rounded}\u00b0`;
};
const formatDecimal = (value, digits = 1) => {
  if (!isNumber(value)) return "N/A";
  return Number(value).toFixed(digits).replace(/\.0$/, "");
};
const formatPercent = (value) => (isNumber(value) ? `${Math.round(Number(value))}%` : "N/A");
const formatUnit = (value, unit) => (isNumber(value) ? `${formatDecimal(value)} ${unit}` : "N/A");

const setStatus = (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
};

const periodThemes = {
  day: {
    default: "linear-gradient(160deg, #5db9f4 0%, #a6ddf4 45%, #ffe289 100%)",
    clear: "linear-gradient(160deg, #48aaf0 0%, #a8e4ff 46%, #ffe28a 100%)",
    clouds: "linear-gradient(160deg, #758cae 0%, #b7d1e3 48%, #f8eab4 100%)",
    fog: "linear-gradient(160deg, #8fa2ad 0%, #cbd8dc 50%, #eef3f1 100%)",
    drizzle: "linear-gradient(160deg, #42556e 0%, #7894ac 50%, #d8e4eb 100%)",
    rain: "linear-gradient(160deg, #34465e 0%, #7894ac 50%, #d8e4eb 100%)",
    snow: "linear-gradient(160deg, #9cc6dd 0%, #eff8ff 52%, #bdd6e5 100%)",
    thunderstorm: "linear-gradient(160deg, #1f2437 0%, #4f5d72 52%, #9ca8b7 100%)",
  },
  night: {
    default: "linear-gradient(160deg, #090c22 0%, #171c3b 45%, #263b5d 100%)",
    clear: "linear-gradient(160deg, #070918 0%, #171b3d 48%, #283f62 100%)",
    clouds: "linear-gradient(160deg, #0d1028 0%, #1b2140 48%, #364769 100%)",
    fog: "linear-gradient(160deg, #111524 0%, #242b3c 50%, #53606a 100%)",
    drizzle: "linear-gradient(160deg, #080b16 0%, #152139 50%, #2e4965 100%)",
    rain: "linear-gradient(160deg, #080b16 0%, #152139 50%, #2e4965 100%)",
    snow: "linear-gradient(160deg, #0b1525 0%, #223551 52%, #607081 100%)",
    thunderstorm: "linear-gradient(160deg, #05060d 0%, #101525 52%, #32384b 100%)",
  },
};

const weatherCodes = {
  0: ["Clear", "Clear", "01d"],
  1: ["Clear", "Mainly Clear", "02d"],
  2: ["Clouds", "Partly Cloudy", "03d"],
  3: ["Clouds", "Mostly Cloudy", "04d"],
  45: ["Fog", "Fog", "50d"],
  48: ["Fog", "Rime Fog", "50d"],
  51: ["Drizzle", "Light Drizzle", "09d"],
  53: ["Drizzle", "Drizzle", "09d"],
  55: ["Drizzle", "Heavy Drizzle", "09d"],
  56: ["Drizzle", "Freezing Drizzle", "09d"],
  57: ["Drizzle", "Freezing Drizzle", "09d"],
  61: ["Rain", "Light Rain", "10d"],
  63: ["Rain", "Rain", "10d"],
  65: ["Rain", "Heavy Rain", "10d"],
  66: ["Rain", "Freezing Rain", "10d"],
  67: ["Rain", "Freezing Rain", "10d"],
  71: ["Snow", "Light Snow", "13d"],
  73: ["Snow", "Snow", "13d"],
  75: ["Snow", "Heavy Snow", "13d"],
  77: ["Snow", "Snow Grains", "13d"],
  80: ["Rain", "Rain Showers", "09d"],
  81: ["Rain", "Rain Showers", "09d"],
  82: ["Rain", "Heavy Showers", "09d"],
  85: ["Snow", "Snow Showers", "13d"],
  86: ["Snow", "Heavy Snow", "13d"],
  95: ["Thunderstorm", "Thunderstorm", "11d"],
  96: ["Thunderstorm", "Thunderstorm", "11d"],
  99: ["Thunderstorm", "Thunderstorm", "11d"],
};

const conditionForCode = (code) => weatherCodes[code] || ["N/A", "N/A", "01d"];
const toNightIcon = (iconCode) => (iconCode ? iconCode.replace(/d$/, "n") : iconCode);
const localWeatherIcons = {
  "01d": "clear-day.svg",
  "01n": "clear-night.svg",
  "02d": "partly-cloudy-day.svg",
  "02n": "partly-cloudy-night.svg",
  "03d": "cloudy.svg",
  "03n": "cloudy.svg",
  "04d": "cloudy.svg",
  "04n": "cloudy.svg",
  "09d": "rain.svg",
  "09n": "rain.svg",
  "10d": "rain.svg",
  "10n": "rain.svg",
  "11d": "thunderstorm.svg",
  "11n": "thunderstorm.svg",
  "13d": "snow.svg",
  "13n": "snow.svg",
  "50d": "fog.svg",
  "50n": "fog.svg",
};
const iconUrl = (iconCode, night = false) => {
  const code = night ? toNightIcon(iconCode) : iconCode;
  const iconFile = localWeatherIcons[code] || localWeatherIcons["03d"];
  return `assets/weather-icons/${iconFile}`;
};
const isNightIcon = (url) => /night|(?:^|\/)[0-9]{2}n\.(?:png|svg)$/i.test(String(url || ""));

const setWeatherBackground = (weatherType, night = false) => {
  const weatherKey = String(weatherType || "")
    .toLowerCase()
    .replace(/\s+/g, "-") || "default";
  const period = night ? "night" : "day";
  const theme = periodThemes[period][weatherKey] || periodThemes[period].default;

  document.body.dataset.weather = weatherKey;
  document.body.dataset.period = period;
  document.body.classList.toggle("night-mode", night);
  document.body.classList.toggle("day-mode", !night);
  document.body.style.background = theme;

  if (window.setWeatherEffect) {
    window.setWeatherEffect(weatherKey, { isNight: night });
  }
};

function dateMs(value) {
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function dailyIndexForTime(daily, time) {
  const date = String(time || "").slice(0, 10);
  const index = (daily.time || []).findIndex((item) => item === date);
  return index < 0 ? 0 : index;
}

function isNightTime(sunriseStr, sunsetStr, nowStr, isDayFlag) {
  if (isDayFlag === 1) return false;
  if (isDayFlag === 0) return true;
  if (!sunriseStr || !sunsetStr || !nowStr) return false;

  const sunrise = dateMs(sunriseStr);
  const sunset = dateMs(sunsetStr);
  const now = dateMs(nowStr);
  if (sunrise === null || sunset === null || now === null) return false;

  return now < sunrise || now > sunset;
}

function isNightAtTime(time, daily) {
  const index = dailyIndexForTime(daily, time);
  return isNightTime(
    daily.sunrise && daily.sunrise[index],
    daily.sunset && daily.sunset[index],
    time
  );
}

function getSunCycle(daily, nowStr) {
  const index = dailyIndexForTime(daily, nowStr);
  const sunrises = daily.sunrise || [];
  const sunsets = daily.sunset || [];

  return {
    previousSunset: sunsets[Math.max(0, index - 1)],
    sunriseToday: sunrises[index],
    sunsetToday: sunsets[index],
    sunriseTomorrow: sunrises[Math.min(sunrises.length - 1, index + 1)],
    now: nowStr,
  };
}

function formatHour(time, index) {
  if (index === 0) return "Now";
  const hour = String(time || "").slice(11, 13);
  return hour || "--";
}

function formatDay(date, index) {
  if (index === 0) return "Today";
  const value = new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return "Day";
  return value.toLocaleDateString("en", { weekday: "short" });
}

function buildHourlyForecast(hourly, daily, currentTime) {
  const times = hourly.time || [];
  let startIndex = times.findIndex((time) => time >= currentTime);
  if (startIndex < 0) startIndex = 0;

  return times.slice(startIndex, startIndex + HOURLY_FORECAST_HOURS).map((time, offset) => {
    const index = startIndex + offset;
    const condition = conditionForCode(hourly.weather_code && hourly.weather_code[index]);
    const night = isNightAtTime(time, daily);

    return {
      label: formatHour(time, offset),
      temp: hourly.temperature_2m && hourly.temperature_2m[index],
      precipitation: hourly.precipitation_probability && hourly.precipitation_probability[index],
      main: condition[0],
      icon: iconUrl(condition[2], night),
      description: condition[1],
    };
  });
}

function buildDailyForecast(daily, currentTime) {
  const dates = daily.time || [];
  const startIndex = dailyIndexForTime(daily, currentTime);

  return dates.slice(startIndex, startIndex + DAILY_FORECAST_DAYS).map((date, offset) => {
    const index = startIndex + offset;
    const condition = conditionForCode(daily.weather_code && daily.weather_code[index]);
    const night = false;

    return {
      day: formatDay(date, offset),
      min: daily.temperature_2m_min && daily.temperature_2m_min[index],
      max: daily.temperature_2m_max && daily.temperature_2m_max[index],
      precipitation: daily.precipitation_probability_max && daily.precipitation_probability_max[index],
      main: condition[0],
      icon: iconUrl(condition[2], night),
      description: condition[1],
    };
  });
}

function createIcon(src, alt) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt || "";
  img.loading = "lazy";
  return img;
}

function renderHourly(items) {
  hourlyForecast.replaceChildren();
  if (!items.length) {
    hourlyForecast.textContent = "No hourly forecast available.";
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "hour-card";

    const time = document.createElement("strong");
    time.textContent = item.label;

    const icon = createIcon(item.icon, item.description);
    const precipitation = document.createElement("span");
    precipitation.className = "precip";
    precipitation.textContent = isNumber(item.precipitation) && Number(item.precipitation) > 0
      ? `${Math.round(Number(item.precipitation))}%`
      : "";

    const temp = document.createElement("span");
    temp.className = "hour-temp";
    temp.textContent = formatTemp(item.temp);

    card.append(time, icon, precipitation, temp);
    hourlyForecast.append(card);
  });
}

function renderDaily(items) {
  dailyForecast.replaceChildren();
  if (!items.length) {
    dailyForecast.textContent = "No daily forecast available.";
    return;
  }

  const lows = items.map((item) => roundTemp(item.min)).filter((value) => value !== null);
  const highs = items.map((item) => roundTemp(item.max)).filter((value) => value !== null);
  const minAll = lows.length ? Math.min(...lows) : 0;
  const maxAll = highs.length ? Math.max(...highs) : minAll + 1;
  const span = Math.max(1, maxAll - minAll);

  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "daily-row";

    const day = document.createElement("strong");
    day.className = "daily-day";
    day.textContent = item.day;

    const condition = document.createElement("div");
    condition.className = "daily-condition";
    condition.append(createIcon(item.icon, item.description));
    const precipitation = document.createElement("span");
    precipitation.className = "precip";
    precipitation.textContent = isNumber(item.precipitation) && Number(item.precipitation) > 0
      ? `${Math.round(Number(item.precipitation))}%`
      : "";
    condition.append(precipitation);

    const min = document.createElement("span");
    min.className = "daily-min";
    min.textContent = formatTemp(item.min);

    const range = document.createElement("span");
    range.className = "range-track";
    const fill = document.createElement("span");
    fill.className = "range-fill";

    const low = roundTemp(item.min);
    const high = roundTemp(item.max);
    const left = low === null ? 0 : ((low - minAll) / span) * 100;
    const width = low === null || high === null ? 0 : Math.max(10, ((high - low) / span) * 100);
    fill.style.left = `${Math.min(100, Math.max(0, left))}%`;
    fill.style.width = `${Math.min(100 - left, width)}%`;
    range.append(fill);

    const max = document.createElement("span");
    max.className = "daily-max";
    max.textContent = formatTemp(item.max);

    row.append(day, condition, min, range, max);
    dailyForecast.append(row);
  });
}

function hasWeather(items, types) {
  return items.some((item) => types.includes(item.main));
}

function maxValue(items, key) {
  const values = items.map((item) => Number(item[key])).filter(Number.isFinite);
  return values.length ? Math.max(...values) : null;
}

function forecastSummary(data) {
  const dailyItems = data.daily || [];
  const hourlyItems = data.hourly || [];
  const today = dailyItems[0];
  const tomorrow = dailyItems[1];
  if (!today || !tomorrow || !isNumber(today.max) || !isNumber(tomorrow.max)) {
    return "Forecast details will appear as soon as weather data loads.";
  }

  const todayHigh = roundTemp(today.max);
  const tomorrowHigh = roundTemp(tomorrow.max);
  const tempChange = tomorrowHigh - todayHigh;
  const nextHours = hourlyItems.slice(0, HOURLY_FORECAST_HOURS);
  const maxNextRain = maxValue(nextHours, "precipitation");
  const maxWeekRain = maxValue(dailyItems, "precipitation");
  const hottestDay = dailyItems.reduce((hottest, day) => {
    if (!hottest || Number(day.max) > Number(hottest.max)) return day;
    return hottest;
  }, null);
  const weekHigh = hottestDay ? roundTemp(hottestDay.max) : null;

  if (hasWeather(nextHours, ["Thunderstorm"])) {
    return `Thunderstorms are active nearby, with rain chances up to ${Math.round(maxNextRain || 0)}% in the next few hours.`;
  }

  if (hasWeather([today, tomorrow], ["Thunderstorm"])) {
    return `Thunderstorm chances stay high through tomorrow, with a high near ${tomorrowHigh}\u00b0.`;
  }

  if (maxNextRain !== null && maxNextRain >= 70) {
    return `Rain is likely in the next few hours, with chances peaking near ${Math.round(maxNextRain)}%.`;
  }

  if (hasWeather([tomorrow], ["Rain", "Drizzle", "Snow"]) || Number(tomorrow.precipitation) >= 60) {
    return `Wet weather is likely tomorrow, with a ${Math.round(Number(tomorrow.precipitation) || 0)}% chance and a high of ${tomorrowHigh}\u00b0.`;
  }

  if (Number(tomorrow.precipitation) >= 35) {
    return `Keep an umbrella ready tomorrow; rain chances reach ${Math.round(Number(tomorrow.precipitation))}% with a high of ${tomorrowHigh}\u00b0.`;
  }

  if (weekHigh !== null && weekHigh >= 38) {
    return `A hot week is ahead, peaking near ${weekHigh}\u00b0 on ${hottestDay.day}.`;
  }

  if (tempChange <= -3) {
    return `Lower temperatures expected tomorrow, with a high of ${tomorrowHigh}\u00b0.`;
  }
  if (tempChange >= 3) {
    return `Warmer temperatures expected tomorrow, with a high of ${tomorrowHigh}\u00b0.`;
  }

  if (maxWeekRain !== null && maxWeekRain >= 50) {
    return `The week stays unsettled, with rain chances reaching ${Math.round(maxWeekRain)}% on some days.`;
  }

  return `Tomorrow should feel similar, with a high near ${tomorrowHigh}\u00b0.`;
}

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
        `&hourly=temperature_2m,weather_code,precipitation_probability` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` +
        `&past_days=1` +
        `&forecast_days=${DAILY_FORECAST_DAYS}` +
        `&wind_speed_unit=ms` +
        `&timezone=auto`
    );
    if (!weatherResponse.ok) throw new Error("Weather request failed");

    const weatherData = await weatherResponse.json();
    const current = weatherData.current || {};
    const daily = weatherData.daily || {};
    const hourly = weatherData.hourly || {};
    const todayIndex = dailyIndexForTime(daily, current.time);
    const sunCycle = getSunCycle(daily, current.time);
    const condition = conditionForCode(current.weather_code);
    const night = isNightTime(
      sunCycle.sunriseToday,
      sunCycle.sunsetToday,
      current.time,
      current.is_day
    );
    const icon = iconUrl(condition[2], night);
    const hourlyItems = buildHourlyForecast(hourly, daily, current.time);
    const dailyItems = buildDailyForecast(daily, current.time);

    return {
      weather: [{
        main: condition[0],
        description: condition[1],
        icon,
      }],
      main: {
        temp: current.temperature_2m,
        feels_like: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        temp_max: daily.temperature_2m_max && daily.temperature_2m_max[todayIndex],
        temp_min: daily.temperature_2m_min && daily.temperature_2m_min[todayIndex],
      },
      wind: {
        speed: current.wind_speed_10m,
        gust: current.wind_gusts_10m,
      },
      sun: { ...sunCycle, isNight: night },
      hourly: hourlyItems,
      daily: dailyItems,
      isNight: night,
      name: place.name,
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
  const night = Boolean(data.isNight || (data.sun && data.sun.isNight) || isNightIcon(weather.icon));

  if (weatherIcon) {
    if (weather.icon) {
      weatherIcon.setAttribute("src", weather.icon);
      weatherIcon.setAttribute("alt", valueOrNA(weather.description));
    } else {
      weatherIcon.removeAttribute("src");
      weatherIcon.setAttribute("alt", "");
    }
  }

  mainTemperature.textContent = formatTemp(data.main && data.main.temp);
  feelsLike.textContent = formatTemp(data.main && data.main.feels_like);
  humidity.textContent = formatPercent(data.main && data.main.humidity);
  wind.textContent = formatUnit(data.wind && data.wind.speed, "m/s");
  windGust.textContent = formatUnit(data.wind && data.wind.gust, "m/s");
  weatherMain.textContent = valueOrNA(weather.description);
  locationName.textContent = valueOrNA(data.name);
  highLow.textContent = `H:${formatTemp(data.main && data.main.temp_max)} L:${formatTemp(data.main && data.main.temp_min)}`;
  forecastInsight.textContent = forecastSummary(data);
  renderHourly(data.hourly || []);
  renderDaily(data.daily || []);

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

const lastCity = localStorage.getItem("lastCity") || "Jaipur";
cityInput.value = lastCity;
window.showWeather(lastCity);
