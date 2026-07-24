const cityInput = document.getElementById("city-input");
const citySuggestions = document.getElementById("city-suggestions");
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
const precipToday = document.getElementById("precip-today");
const precipNote = document.getElementById("precip-note");
const radarMap = document.getElementById("radar-map");
const radarStatus = document.getElementById("radar-status");
const favoriteCityButton = document.getElementById("favorite-city-btn");
const favoriteCities = document.getElementById("favorite-cities");
const weatherAlerts = document.getElementById("weather-alerts");
const airAqi = document.getElementById("air-aqi");
const airPm25 = document.getElementById("air-pm25");
const airPm10 = document.getElementById("air-pm10");
const airUv = document.getElementById("air-uv");
const forecastInsight = document.getElementById("forecast-insight");
const hourlyForecast = document.getElementById("hourly-forecast");
const dailyForecast = document.getElementById("daily-forecast");
const assistantForm = document.getElementById("assistant-form");
const assistantQuestion = document.getElementById("assistant-question");
const assistantSubmit = document.getElementById("assistant-submit");
const assistantAnswer = document.getElementById("assistant-answer");
const assistantPrompts = document.querySelectorAll("[data-question]");
const DAILY_FORECAST_DAYS = 7;
const HOURLY_FORECAST_HOURS = 24;
const FAVORITES_KEY = "favoriteCities";
const WEATHER_ASSISTANT_ENDPOINT =
  window.KNOW_WEATHER_AI_ENDPOINT || localStorage.getItem("knowWeatherAssistantEndpoint") || "";
let activePlace = null;
let currentWeatherSnapshot = null;
let suggestionTimer = null;
let suggestionItems = [];
let activeSuggestionIndex = -1;
let radarRequestId = 0;

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
const formatMicrograms = (value) => (isNumber(value) ? `${formatDecimal(value)} ug/m3` : "N/A");
const formatMillimeters = (value) => (isNumber(value) ? `${formatDecimal(value)} mm` : "N/A");

const setStatus = (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
};

const cityLabel = (place) => [place.name, place.admin1, place.country]
  .filter(Boolean)
  .join(", ");

const citySearchName = (place) => [place.name, place.country]
  .filter(Boolean)
  .join(", ");

function hideSuggestions() {
  if (!citySuggestions) return;
  citySuggestions.hidden = true;
  citySuggestions.replaceChildren();
  suggestionItems = [];
  activeSuggestionIndex = -1;
  cityInput.removeAttribute("aria-activedescendant");
}

function setActiveSuggestion(index) {
  if (!citySuggestions || !suggestionItems.length) return;
  activeSuggestionIndex = (index + suggestionItems.length) % suggestionItems.length;
  Array.from(citySuggestions.children).forEach((child, childIndex) => {
    child.classList.toggle("active", childIndex === activeSuggestionIndex);
  });
  const activeOption = citySuggestions.children[activeSuggestionIndex];
  if (activeOption) {
    cityInput.setAttribute("aria-activedescendant", activeOption.id);
    activeOption.scrollIntoView({ block: "nearest" });
  }
}

function chooseSuggestion(place) {
  const city = citySearchName(place);
  cityInput.value = cityLabel(place);
  localStorage.setItem("lastCity", city);
  hideSuggestions();
  window.showWeather(place);
}

function renderSuggestions(items) {
  if (!citySuggestions) return;
  citySuggestions.replaceChildren();
  suggestionItems = items;
  activeSuggestionIndex = -1;

  if (!items.length) {
    hideSuggestions();
    return;
  }

  items.forEach((place, index) => {
    const option = document.createElement("button");
    option.id = `city-suggestion-${index}`;
    option.className = "city-suggestion";
    option.type = "button";
    option.setAttribute("role", "option");

    const name = document.createElement("strong");
    name.textContent = place.name;
    const detail = document.createElement("span");
    detail.textContent = [place.admin1, place.country].filter(Boolean).join(", ") || "Weather location";

    option.append(name, detail);
    option.addEventListener("mousedown", (event) => event.preventDefault());
    option.addEventListener("click", () => chooseSuggestion(place));
    citySuggestions.append(option);
  });

  citySuggestions.hidden = false;
}

async function fetchCitySuggestions(query) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
  );
  if (!response.ok) throw new Error("City suggestions failed");
  const data = await response.json();
  return data.results || [];
}

function queueCitySuggestions() {
  const query = cityInput.value.trim();
  clearTimeout(suggestionTimer);

  if (query.length < 2) {
    hideSuggestions();
    return;
  }

  suggestionTimer = setTimeout(async () => {
    try {
      const items = await fetchCitySuggestions(query);
      if (cityInput.value.trim() === query) renderSuggestions(items);
    } catch (error) {
      hideSuggestions();
    }
  }, 220);
}

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

function getFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveFavorites(items) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(items.slice(0, 8)));
}

function isFavoriteCity(place) {
  if (!place) return false;
  const favorites = getFavorites();
  return favorites.some((item) => String(item.name).toLowerCase() === String(place.name).toLowerCase());
}

function updateFavoriteButton() {
  if (!favoriteCityButton || !activePlace) return;
  favoriteCityButton.hidden = false;
  favoriteCityButton.textContent = isFavoriteCity(activePlace) ? "Saved city" : "Save city";
  favoriteCityButton.classList.toggle("saved", isFavoriteCity(activePlace));
}

function renderFavorites() {
  if (!favoriteCities) return;
  favoriteCities.replaceChildren();
  const favorites = getFavorites();

  if (!favorites.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Save cities to open them faster.";
    favoriteCities.append(empty);
    return;
  }

  favorites.forEach((favorite) => {
    const button = document.createElement("button");
    button.className = "favorite-chip";
    button.type = "button";
    button.textContent = favorite.name;
    button.addEventListener("click", () => {
      cityInput.value = favorite.name;
      localStorage.setItem("lastCity", favorite.name);
      window.showWeather(favorite.name);
    });
    favoriteCities.append(button);
  });
}

function toggleFavoriteCity() {
  if (!activePlace) return;
  const favorites = getFavorites();
  const exists = isFavoriteCity(activePlace);
  const nextFavorites = exists
    ? favorites.filter((item) => String(item.name).toLowerCase() !== String(activePlace.name).toLowerCase())
    : [{ ...activePlace, savedAt: new Date().toISOString() }, ...favorites];

  saveFavorites(nextFavorites);
  renderFavorites();
  updateFavoriteButton();
}

function aqiLabel(value) {
  const aqi = Number(value);
  if (!Number.isFinite(aqi)) return "N/A";
  if (aqi <= 50) return `${Math.round(aqi)} Good`;
  if (aqi <= 100) return `${Math.round(aqi)} Moderate`;
  if (aqi <= 150) return `${Math.round(aqi)} Unhealthy SG`;
  if (aqi <= 200) return `${Math.round(aqi)} Unhealthy`;
  if (aqi <= 300) return `${Math.round(aqi)} Very unhealthy`;
  return `${Math.round(aqi)} Hazardous`;
}

function renderAirQuality(airQuality) {
  const current = (airQuality && airQuality.current) || {};
  airAqi.textContent = aqiLabel(current.us_aqi);
  airPm25.textContent = formatMicrograms(current.pm2_5);
  airPm10.textContent = formatMicrograms(current.pm10);
  airUv.textContent = isNumber(current.uv_index) ? formatDecimal(current.uv_index) : "N/A";
}

function renderPrecipitation(precipitation) {
  const today = precipitation && precipitation.today;
  const tomorrow = precipitation && precipitation.tomorrow;
  precipToday.textContent = formatMillimeters(today);

  if (isNumber(tomorrow) && Number(tomorrow) > 0) {
    precipNote.textContent = `${formatMillimeters(tomorrow)} expected tomorrow.`;
    return;
  }

  if (isNumber(today) && Number(today) > 0) {
    precipNote.textContent = "Rain is expected today, with little expected tomorrow.";
    return;
  }

  precipNote.textContent = "No measurable rain expected today or tomorrow.";
}

function tilePoint(latitude, longitude, zoom) {
  const latRad = (Number(latitude) * Math.PI) / 180;
  const scale = 2 ** zoom;
  const x = ((Number(longitude) + 180) / 360) * scale;
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * scale;
  return { x, y };
}

function createTile(src, x, y, className) {
  const img = document.createElement("img");
  img.className = className;
  img.src = src;
  img.alt = "";
  img.loading = "lazy";
  img.style.left = `${x * 256}px`;
  img.style.top = `${y * 256}px`;
  return img;
}

async function renderRadarMap(place) {
  if (!radarMap || !place || !isNumber(place.latitude) || !isNumber(place.longitude)) return;
  const requestId = ++radarRequestId;
  radarMap.replaceChildren();
  const loading = document.createElement("p");
  loading.className = "radar-status";
  loading.textContent = "Loading precipitation map...";
  radarMap.append(loading);

  try {
    const response = await fetch("https://api.rainviewer.com/public/weather-maps.json");
    if (!response.ok) throw new Error("Radar request failed");
    const data = await response.json();
    const frames = [
      ...((data.radar && data.radar.past) || []),
      ...((data.radar && data.radar.nowcast) || []),
    ];
    const frame = frames[frames.length - 1];
    if (!frame || !data.host) throw new Error("No radar frame available");
    if (requestId !== radarRequestId) return;

    const zoom = 6;
    const point = tilePoint(place.latitude, place.longitude, zoom);
    const startX = Math.floor(point.x) - 1;
    const startY = Math.floor(point.y) - 1;
    const centerX = (point.x - startX) * 256;
    const centerY = (point.y - startY) * 256;
    const offsetX = 384 - centerX;
    const offsetY = 384 - centerY;
    const layer = document.createElement("div");
    const credit = document.createElement("a");
    const marker = document.createElement("span");

    layer.className = "radar-tile-layer";
    layer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        const tileX = startX + x;
        const tileY = startY + y;
        layer.append(
          createTile(`https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`, x, y, "radar-base-tile"),
          createTile(`${data.host}${frame.path}/256/${zoom}/${tileX}/${tileY}/2/1_1.png`, x, y, "radar-rain-tile")
        );
      }
    }

    marker.className = "radar-city-marker";
    credit.className = "radar-credit";
    credit.href = `https://www.rainviewer.com/map.html?loc=${place.latitude},${place.longitude},${zoom}`;
    credit.target = "_blank";
    credit.rel = "noopener";
    credit.textContent = "Open radar map";

    radarMap.replaceChildren(layer, marker, credit);
  } catch (error) {
    radarMap.replaceChildren();
    const message = document.createElement("p");
    message.className = "radar-status";
    message.textContent = "Radar map is unavailable right now.";
    radarMap.append(message);
  }
}

function buildAlerts(data) {
  const alerts = [];
  const hourlyItems = data.hourly || [];
  const dailyItems = data.daily || [];
  const maxRain = maxValue(hourlyItems.slice(0, 24), "precipitation");
  const maxDailyRain = maxValue(dailyItems, "precipitation");
  const maxHigh = maxValue(dailyItems, "max");
  const windGustValue = Number(data.wind && data.wind.gust);
  const aqi = Number(data.airQuality && data.airQuality.current && data.airQuality.current.us_aqi);
  const uv = Number(data.airQuality && data.airQuality.current && data.airQuality.current.uv_index);
  const stormLikely = hasWeather(hourlyItems.slice(0, 24), ["Thunderstorm"]);

  if (stormLikely) alerts.push({ title: "Thunderstorm", text: "Thunderstorms may affect your area in the next 24 hours." });
  if (maxRain !== null && maxRain >= 70) alerts.push({ title: "Rain", text: `High rain chance nearby, peaking around ${Math.round(maxRain)}%.` });
  if (maxDailyRain !== null && maxDailyRain >= 70) alerts.push({ title: "Wet week", text: `One of the next 7 days reaches about ${Math.round(maxDailyRain)}% rain chance.` });
  if (maxHigh !== null && maxHigh >= 40) alerts.push({ title: "Extreme heat", text: `High temperature may reach ${Math.round(maxHigh)} degrees this week.` });
  if (Number.isFinite(windGustValue) && windGustValue >= 14) alerts.push({ title: "Wind gusts", text: `Gusts are near ${formatUnit(windGustValue, "m/s")}.` });
  if (Number.isFinite(aqi) && aqi > 100) alerts.push({ title: "Air quality", text: `AQI is ${Math.round(aqi)}, so sensitive people should reduce outdoor exposure.` });
  if (Number.isFinite(uv) && uv >= 8) alerts.push({ title: "UV index", text: `UV index is ${formatDecimal(uv)}, so sun protection matters.` });

  return alerts.slice(0, 4);
}

function renderAlerts(data) {
  if (!weatherAlerts) return;
  weatherAlerts.replaceChildren();
  const alerts = buildAlerts(data);

  if (!alerts.length) {
    const calm = document.createElement("p");
    calm.className = "empty-state";
    calm.textContent = "No major weather alerts right now.";
    weatherAlerts.append(calm);
    return;
  }

  alerts.forEach((alert) => {
    const card = document.createElement("article");
    card.className = "alert-card";
    const title = document.createElement("strong");
    title.textContent = alert.title;
    const text = document.createElement("span");
    text.textContent = alert.text;
    card.append(title, text);
    weatherAlerts.append(card);
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

function buildAssistantSnapshot(data) {
  const weather = data.weather && data.weather[0] ? data.weather[0] : {};
  return {
    city: data.name,
    condition: weather.description,
    temperature: formatTemp(data.main && data.main.temp),
    feelsLike: formatTemp(data.main && data.main.feels_like),
    high: formatTemp(data.main && data.main.temp_max),
    low: formatTemp(data.main && data.main.temp_min),
    humidity: formatPercent(data.main && data.main.humidity),
    wind: formatUnit(data.wind && data.wind.speed, "m/s"),
    windGust: formatUnit(data.wind && data.wind.gust, "m/s"),
    precipitation: {
      today: formatMillimeters(data.precipitation && data.precipitation.today),
      tomorrow: formatMillimeters(data.precipitation && data.precipitation.tomorrow),
    },
    airQuality: {
      usAqi: aqiLabel(data.airQuality && data.airQuality.current && data.airQuality.current.us_aqi),
      pm25: formatMicrograms(data.airQuality && data.airQuality.current && data.airQuality.current.pm2_5),
      pm10: formatMicrograms(data.airQuality && data.airQuality.current && data.airQuality.current.pm10),
      uvIndex: isNumber(data.airQuality && data.airQuality.current && data.airQuality.current.uv_index)
        ? formatDecimal(data.airQuality.current.uv_index)
        : "N/A",
    },
    isNight: Boolean(data.isNight),
    hourly: (data.hourly || []).slice(0, 24).map((item) => ({
      time: item.label,
      temperature: formatTemp(item.temp),
      rainChance: formatPercent(item.precipitation),
      condition: item.description,
    })),
    daily: (data.daily || []).slice(0, DAILY_FORECAST_DAYS).map((item) => ({
      day: item.day,
      high: formatTemp(item.max),
      low: formatTemp(item.min),
      rainChance: formatPercent(item.precipitation),
      condition: item.description,
    })),
  };
}

function setAssistantAnswer(message, isError = false) {
  if (!assistantAnswer) return;
  assistantAnswer.textContent = message;
  assistantAnswer.classList.toggle("error", isError);
}

async function askWeatherAssistant(question) {
  if (!assistantAnswer || !assistantSubmit) return;

  if (!currentWeatherSnapshot) {
    setAssistantAnswer("Search a city first so I can use real weather data.", true);
    return;
  }

  if (!WEATHER_ASSISTANT_ENDPOINT) {
    setAssistantAnswer("AI backend is ready in code. Add your Cloudflare Worker URL in script.js to enable live answers.", true);
    return;
  }

  assistantSubmit.disabled = true;
  setAssistantAnswer("Thinking through the weather...");

  try {
    const response = await fetch(WEATHER_ASSISTANT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        weather: currentWeatherSnapshot,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "The assistant could not answer right now.");
    }

    setAssistantAnswer(data.answer || "No assistant answer came back yet.");
  } catch (error) {
    setAssistantAnswer(error.message || "The assistant is unavailable right now.", true);
  } finally {
    assistantSubmit.disabled = false;
  }
}

async function getWeather(city) {
  try {
    let place = typeof city === "object" && city !== null ? city : null;

    if (!place) {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
      );
      if (!geoResponse.ok) throw new Error("Location request failed");

      const geoData = await geoResponse.json();
      place = geoData.results && geoData.results[0];
    }

    if (!place) throw new Error("City not found");

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${place.latitude}&longitude=${place.longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_gusts_10m` +
        `&hourly=temperature_2m,weather_code,precipitation_probability` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset` +
        `&past_days=1` +
        `&forecast_days=${DAILY_FORECAST_DAYS}` +
        `&wind_speed_unit=ms` +
        `&timezone=auto`
    );
    if (!weatherResponse.ok) throw new Error("Weather request failed");

    const weatherData = await weatherResponse.json();
    let airQuality = {};
    try {
      const airResponse = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality` +
          `?latitude=${place.latitude}&longitude=${place.longitude}` +
          `&current=us_aqi,pm2_5,pm10,uv_index` +
          `&timezone=auto`
      );
      if (airResponse.ok) {
        airQuality = await airResponse.json();
      }
    } catch (error) {
      airQuality = {};
    }

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
    const precipitationToday = daily.precipitation_sum && daily.precipitation_sum[todayIndex];
    const precipitationTomorrow = daily.precipitation_sum && daily.precipitation_sum[todayIndex + 1];

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
      precipitation: {
        today: precipitationToday,
        tomorrow: precipitationTomorrow,
      },
      sun: { ...sunCycle, isNight: night },
      hourly: hourlyItems,
      daily: dailyItems,
      airQuality,
      isNight: night,
      name: place.name,
      place: {
        name: place.name,
        country: place.country || "",
        latitude: place.latitude,
        longitude: place.longitude,
      },
    };
  } catch (error) {
    console.log(error);
  }
}

async function showWeather(city) {
  const searchCity = typeof city === "object" && city !== null ? citySearchName(city) : String(city).trim();
  if (!searchCity) return;

  setStatus("Loading weather...");
  weatherButton.disabled = true;

  let data;
  try {
    data = await window.getWeather(typeof city === "object" && city !== null ? city : searchCity);
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
  activePlace = data.place || { name: data.name };

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
  currentWeatherSnapshot = buildAssistantSnapshot(data);
  renderHourly(data.hourly || []);
  renderDaily(data.daily || []);
  renderRadarMap(data.place);
  renderPrecipitation(data.precipitation || {});
  renderAirQuality(data.airQuality || {});
  renderAlerts(data);
  updateFavoriteButton();

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
  hideSuggestions();
  localStorage.setItem("lastCity", city);
  window.showWeather(city);
});

if (favoriteCityButton) {
  favoriteCityButton.addEventListener("click", toggleFavoriteCity);
}

if (assistantForm) {
  assistantForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = assistantQuestion.value.trim();
    if (!question) return;
    askWeatherAssistant(question);
  });
}

assistantPrompts.forEach((button) => {
  button.addEventListener("click", () => {
    const question = button.dataset.question || "";
    assistantQuestion.value = question;
    askWeatherAssistant(question);
  });
});

cityInput.addEventListener("input", queueCitySuggestions);

cityInput.addEventListener("focus", queueCitySuggestions);

cityInput.addEventListener("blur", () => {
  setTimeout(hideSuggestions, 120);
});

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" && suggestionItems.length) {
    event.preventDefault();
    setActiveSuggestion(activeSuggestionIndex + 1);
    return;
  }

  if (event.key === "ArrowUp" && suggestionItems.length) {
    event.preventDefault();
    setActiveSuggestion(activeSuggestionIndex - 1);
    return;
  }

  if (event.key === "Escape") {
    hideSuggestions();
    return;
  }

  if (event.key === "Enter") {
    if (activeSuggestionIndex >= 0 && suggestionItems[activeSuggestionIndex]) {
      event.preventDefault();
      chooseSuggestion(suggestionItems[activeSuggestionIndex]);
      return;
    }
    weatherButton.click();
  }
});

const lastCity = localStorage.getItem("lastCity") || "Jaipur";
cityInput.value = lastCity;
renderFavorites();
window.showWeather(lastCity);
