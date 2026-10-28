/* global React, ReactDOM */
(function () {
  const { useCallback, useEffect, useMemo, useState } = React;
  const h = React.createElement;
  const DAYS = 7;
  const HOURS = 24;
  const FAVORITES_KEY = "favoriteCities";
  const ASSISTANT_ENDPOINT = "https://know-weather-ai-worker.manishh28.workers.dev";

  const weatherCodes = {
    0: ["Clear", "Clear", "01d"], 1: ["Clear", "Mainly Clear", "02d"],
    2: ["Clouds", "Partly Cloudy", "03d"], 3: ["Clouds", "Mostly Cloudy", "04d"],
    45: ["Fog", "Fog", "50d"], 48: ["Fog", "Rime Fog", "50d"],
    51: ["Drizzle", "Light Drizzle", "09d"], 53: ["Drizzle", "Drizzle", "09d"],
    55: ["Drizzle", "Heavy Drizzle", "09d"], 56: ["Drizzle", "Freezing Drizzle", "09d"],
    57: ["Drizzle", "Freezing Drizzle", "09d"], 61: ["Rain", "Light Rain", "10d"],
    63: ["Rain", "Rain", "10d"], 65: ["Rain", "Heavy Rain", "10d"],
    66: ["Rain", "Freezing Rain", "10d"], 67: ["Rain", "Freezing Rain", "10d"],
    71: ["Snow", "Light Snow", "13d"], 73: ["Snow", "Snow", "13d"],
    75: ["Snow", "Heavy Snow", "13d"], 77: ["Snow", "Snow Grains", "13d"],
    80: ["Rain", "Rain Showers", "09d"], 81: ["Rain", "Rain Showers", "09d"],
    82: ["Rain", "Heavy Showers", "09d"], 85: ["Snow", "Snow Showers", "13d"],
    86: ["Snow", "Heavy Snow", "13d"], 95: ["Thunderstorm", "Thunderstorm", "11d"],
    96: ["Thunderstorm", "Thunderstorm", "11d"], 99: ["Thunderstorm", "Thunderstorm", "11d"],
  };
  const iconFiles = {
    "01d": "clear-day.svg", "01n": "clear-night.svg", "02d": "partly-cloudy-day.svg",
    "02n": "partly-cloudy-night.svg", "03d": "cloudy.svg", "03n": "cloudy.svg",
    "04d": "cloudy.svg", "04n": "cloudy.svg", "09d": "rain.svg", "09n": "rain.svg",
    "10d": "rain.svg", "10n": "rain.svg", "11d": "thunderstorm.svg", "11n": "thunderstorm.svg",
    "13d": "snow.svg", "13n": "snow.svg", "50d": "fog.svg", "50n": "fog.svg",
  };
  const themes = {
    day: { default: "linear-gradient(160deg, #5db9f4 0%, #a6ddf4 45%, #ffe289 100%)", clear: "linear-gradient(160deg, #48aaf0 0%, #a8e4ff 46%, #ffe28a 100%)", clouds: "linear-gradient(160deg, #758cae 0%, #b7d1e3 48%, #f8eab4 100%)", fog: "linear-gradient(160deg, #8fa2ad 0%, #cbd8dc 50%, #eef3f1 100%)", drizzle: "linear-gradient(160deg, #42556e 0%, #7894ac 50%, #d8e4eb 100%)", rain: "linear-gradient(160deg, #34465e 0%, #7894ac 50%, #d8e4eb 100%)", snow: "linear-gradient(160deg, #9cc6dd 0%, #eff8ff 52%, #bdd6e5 100%)", thunderstorm: "linear-gradient(160deg, #1f2437 0%, #4f5d72 52%, #9ca8b7 100%)" },
    night: { default: "linear-gradient(160deg, #090c22 0%, #171c3b 45%, #263b5d 100%)", clear: "linear-gradient(160deg, #070918 0%, #171b3d 48%, #283f62 100%)", clouds: "linear-gradient(160deg, #0d1028 0%, #1b2140 48%, #364769 100%)", fog: "linear-gradient(160deg, #111524 0%, #242b3c 50%, #53606a 100%)", drizzle: "linear-gradient(160deg, #080b16 0%, #152139 50%, #2e4965 100%)", rain: "linear-gradient(160deg, #080b16 0%, #152139 50%, #2e4965 100%)", snow: "linear-gradient(160deg, #0b1525 0%, #223551 52%, #607081 100%)", thunderstorm: "linear-gradient(160deg, #05060d 0%, #101525 52%, #32384b 100%)" },
  };

  const number = (value) => Number.isFinite(Number(value));
  const temp = (value) => number(value) ? `${Math.round(Number(value))}°` : "N/A";
  const decimal = (value) => number(value) ? Number(value).toFixed(1).replace(/\.0$/, "") : "N/A";
  const percent = (value) => number(value) ? `${Math.round(Number(value))}%` : "N/A";
  const unit = (value, label) => number(value) ? `${decimal(value)} ${label}` : "N/A";
  const mm = (value) => number(value) ? `${decimal(value)} mm` : "N/A";
  const condition = (code) => weatherCodes[code] || ["N/A", "N/A", "01d"];
  const icon = (code, night) => `assets/weather-icons/${iconFiles[night ? code.replace(/d$/, "n") : code] || iconFiles["03d"]}`;
  const placeLabel = (place) => [place.name, place.admin1, place.country].filter(Boolean).join(", ");
  const placeSearch = (place) => [place.name, place.country].filter(Boolean).join(", ");
  const maxValue = (items, key) => {
    const values = items.map((item) => Number(item[key])).filter(Number.isFinite);
    return values.length ? Math.max(...values) : null;
  };
  const aqiLabel = (value) => {
    const aqi = Number(value);
    if (!Number.isFinite(aqi)) return "N/A";
    if (aqi <= 50) return `${Math.round(aqi)} Good`;
    if (aqi <= 100) return `${Math.round(aqi)} Moderate`;
    if (aqi <= 150) return `${Math.round(aqi)} Unhealthy SG`;
    if (aqi <= 200) return `${Math.round(aqi)} Unhealthy`;
    return `${Math.round(aqi)} Hazardous`;
  };
  const readFavorites = () => {
    try { const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); return Array.isArray(saved) ? saved : []; }
    catch { return []; }
  };
  const dateMs = (value) => { const valueMs = new Date(value).getTime(); return Number.isNaN(valueMs) ? null : valueMs; };
  const localTime = (offset, fallback) => number(offset) ? new Date(Date.now() + Number(offset) * 1000).toISOString().slice(0, 19) : fallback;
  const dayIndex = (daily, time) => Math.max(0, (daily.time || []).findIndex((item) => item === String(time || "").slice(0, 10)));
  const atNight = (sunrise, sunset, now, isDay) => {
    const [rise, set, current] = [dateMs(sunrise), dateMs(sunset), dateMs(now)];
    if (rise && set && current) return current < rise || current >= set;
    return isDay === 0;
  };

  function createForecast(weatherData, place, airQuality) {
    const current = weatherData.current || {};
    const daily = weatherData.daily || {};
    const hourly = weatherData.hourly || {};
    const now = localTime(weatherData.utc_offset_seconds, current.time);
    const today = dayIndex(daily, now);
    const sunrise = (daily.sunrise || [])[today];
    const sunset = (daily.sunset || [])[today];
    const night = atNight(sunrise, sunset, now, current.is_day);
    const weather = condition(current.weather_code);
    const start = Math.max(0, (hourly.time || []).findIndex((time) => time >= current.time));
    const hourlyItems = (hourly.time || []).slice(start, start + HOURS).map((time, offset) => {
      const index = start + offset;
      const next = condition((hourly.weather_code || [])[index]);
      const itemNight = atNight((daily.sunrise || [])[dayIndex(daily, time)], (daily.sunset || [])[dayIndex(daily, time)], time);
      return { label: offset === 0 ? "Now" : String(time).slice(11, 13), temp: (hourly.temperature_2m || [])[index], precipitation: (hourly.precipitation_probability || [])[index], main: next[0], description: next[1], icon: icon(next[2], itemNight) };
    });
    const dailyItems = (daily.time || []).slice(today, today + DAYS).map((date, offset) => {
      const index = today + offset;
      const next = condition((daily.weather_code || [])[index]);
      return { day: offset === 0 ? "Today" : new Date(`${date}T00:00:00`).toLocaleDateString("en", { weekday: "short" }), min: (daily.temperature_2m_min || [])[index], max: (daily.temperature_2m_max || [])[index], precipitation: (daily.precipitation_probability_max || [])[index], main: next[0], description: next[1], icon: icon(next[2], false) };
    });
    return {
      place: { name: place.name, country: place.country || "", latitude: place.latitude, longitude: place.longitude },
      weather: { main: weather[0], description: weather[1], icon: icon(weather[2], night) },
      main: { temp: current.temperature_2m, feelsLike: current.apparent_temperature, humidity: current.relative_humidity_2m, max: (daily.temperature_2m_max || [])[today], min: (daily.temperature_2m_min || [])[today] },
      wind: { speed: current.wind_speed_10m, gust: current.wind_gusts_10m }, precipitation: { today: (daily.precipitation_sum || [])[today], tomorrow: (daily.precipitation_sum || [])[today + 1] },
      hourly: hourlyItems, daily: dailyItems, airQuality, isNight: night,
      sun: { previousSunset: (daily.sunset || [])[Math.max(0, today - 1)], sunriseToday: sunrise, sunsetToday: sunset, sunriseTomorrow: (daily.sunrise || [])[Math.min((daily.sunrise || []).length - 1, today + 1)], now, isNight: night },
    };
  }

  async function fetchWeather(cityOrPlace) {
    let place = typeof cityOrPlace === "object" ? cityOrPlace : null;
    if (!place) {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityOrPlace)}&count=1&language=en&format=json`);
      const data = await response.json();
      place = data.results && data.results[0];
    }
    if (!place) throw new Error("City not found");
    const query = `latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_gusts_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset&past_days=1&forecast_days=${DAYS}&wind_speed_unit=ms&timezone=auto`;
    const [weatherResponse, airResponse] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?${query}`),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${place.latitude}&longitude=${place.longitude}&current=us_aqi,pm2_5,pm10,uv_index&timezone=auto`).catch(() => null),
    ]);
    if (!weatherResponse.ok) throw new Error("Weather request failed");
    const airQuality = airResponse && airResponse.ok ? await airResponse.json() : {};
    return createForecast(await weatherResponse.json(), place, airQuality);
  }

  function buildAlerts(data) {
    const alerts = [];
    const maxRain = maxValue(data.hourly.slice(0, 24), "precipitation");
    const maxWeekRain = maxValue(data.daily, "precipitation");
    const maxHigh = maxValue(data.daily, "max");
    const aqi = Number(data.airQuality?.current?.us_aqi);
    if (data.hourly.some((item) => item.main === "Thunderstorm")) alerts.push(["Thunderstorm", "Thunderstorms may affect your area in the next 24 hours."]);
    if (maxRain !== null && maxRain >= 70) alerts.push(["Rain", `High rain chance nearby, peaking around ${Math.round(maxRain)}%.`]);
    if (maxWeekRain !== null && maxWeekRain >= 70) alerts.push(["Wet week", `One of the next 7 days reaches about ${Math.round(maxWeekRain)}% rain chance.`]);
    if (maxHigh !== null && maxHigh >= 40) alerts.push(["Extreme heat", `High temperature may reach ${Math.round(maxHigh)} degrees this week.`]);
    if (Number(data.wind.gust) >= 14) alerts.push(["Wind gusts", `Gusts are near ${unit(data.wind.gust, "m/s")}.`]);
    if (aqi > 100) alerts.push(["Air quality", `AQI is ${Math.round(aqi)}, so sensitive people should reduce outdoor exposure.`]);
    return alerts.slice(0, 4);
  }
  function forecastSummary(data) {
    const [today, tomorrow] = data.daily;
    if (!today || !tomorrow) return "Forecast details will appear as soon as weather data loads.";
    const next = data.hourly.slice(0, HOURS);
    const rain = maxValue(next, "precipitation");
    if (next.some((item) => item.main === "Thunderstorm")) return `Thunderstorms are active nearby, with rain chances up to ${Math.round(rain || 0)}% in the next few hours.`;
    if (rain !== null && rain >= 70) return `Rain is likely in the next few hours, with chances peaking near ${Math.round(rain)}%.`;
    if (Number(tomorrow.precipitation) >= 60) return `Wet weather is likely tomorrow, with a ${Math.round(tomorrow.precipitation)}% chance and a high of ${temp(tomorrow.max)}.`;
    const change = Math.round(tomorrow.max) - Math.round(today.max);
    if (change <= -3) return `Lower temperatures expected tomorrow, with a high of ${temp(tomorrow.max)}.`;
    if (change >= 3) return `Warmer temperatures expected tomorrow, with a high of ${temp(tomorrow.max)}.`;
    return `Tomorrow should feel similar, with a high near ${temp(tomorrow.max)}.`;
  }
  function snapshot(data) {
    return { city: data.place.name, condition: data.weather.description, temperature: temp(data.main.temp).replace("°", " C"), feelsLike: temp(data.main.feelsLike).replace("°", " C"), high: temp(data.main.max).replace("°", " C"), low: temp(data.main.min).replace("°", " C"), humidity: percent(data.main.humidity), wind: unit(data.wind.speed, "m/s"), windGust: unit(data.wind.gust, "m/s"), precipitation: { today: mm(data.precipitation.today), tomorrow: mm(data.precipitation.tomorrow) }, airQuality: { usAqi: aqiLabel(data.airQuality?.current?.us_aqi), pm25: unit(data.airQuality?.current?.pm2_5, "ug/m3"), pm10: unit(data.airQuality?.current?.pm10, "ug/m3"), uvIndex: decimal(data.airQuality?.current?.uv_index) }, hourly: data.hourly.map((item) => ({ time: item.label, temperature: temp(item.temp), rainChance: percent(item.precipitation), condition: item.description })), daily: data.daily.map((item) => ({ day: item.day, high: temp(item.max), low: temp(item.min), rainChance: percent(item.precipitation), condition: item.description })) };
  }

  function PanelTitle({ symbol, title, className = "" }) { return h("div", { className: `panel-title ${className}`.trim() }, h("span", { "aria-hidden": true }, symbol), h("h2", null, title)); }
  function Metric({ label, value }) { return h("div", null, h("span", { className: "label" }, label), h("strong", null, value)); }
  function WeatherIcon({ item }) { return h("img", { src: item.icon, alt: item.description, loading: "lazy" }); }

  function Radar({ place }) {
    const [state, setState] = useState({ loading: true, frame: null, host: null });
    useEffect(() => {
      let cancelled = false;
      setState({ loading: true, frame: null, host: null });
      fetch("https://api.rainviewer.com/public/weather-maps.json").then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
        const frames = [...(data.radar?.past || []), ...(data.radar?.nowcast || [])];
        if (!cancelled) setState({ loading: false, frame: frames.at(-1), host: data.host });
      }).catch(() => !cancelled && setState({ loading: false, frame: null, host: null }));
      return () => { cancelled = true; };
    }, [place.latitude, place.longitude]);
    if (state.loading) return h("p", { className: "radar-status" }, "Loading precipitation map...");
    if (!state.frame || !state.host) return h("p", { className: "radar-status" }, "Radar map is unavailable right now.");
    const zoom = 6, scale = 2 ** zoom, lat = Number(place.latitude) * Math.PI / 180;
    const x = ((Number(place.longitude) + 180) / 360) * scale;
    const y = (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2 * scale;
    const startX = Math.floor(x) - 1, startY = Math.floor(y) - 1;
    const tiles = [];
    for (let row = 0; row < 3; row += 1) for (let column = 0; column < 3; column += 1) {
      const left = `${column * 256}px`, top = `${row * 256}px`, tileX = startX + column, tileY = startY + row;
      tiles.push(h("img", { key: `base-${row}-${column}`, className: "radar-base-tile", src: `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`, alt: "", loading: "lazy", style: { left, top } }));
      tiles.push(h("img", { key: `rain-${row}-${column}`, className: "radar-rain-tile", src: `${state.host}${state.frame.path}/256/${zoom}/${tileX}/${tileY}/2/1_1.png`, alt: "", loading: "lazy", style: { left, top } }));
    }
    const offset = { transform: `translate(${384 - (x - startX) * 256}px, ${384 - (y - startY) * 256}px)` };
    return h(React.Fragment, null, h("div", { className: "radar-tile-layer", style: offset }, tiles), h("span", { className: "radar-city-marker" }), h("a", { className: "radar-credit", href: `https://www.rainviewer.com/map.html?loc=${place.latitude},${place.longitude},${zoom}`, target: "_blank", rel: "noopener" }, "Open radar map"));
  }

  function App() {
    const [query, setQuery] = useState(() => localStorage.getItem("lastCity") || "Jaipur");
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);
    const [weather, setWeather] = useState(null);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [favorites, setFavorites] = useState(readFavorites);
    const [assistantQuestion, setAssistantQuestion] = useState("");
    const [assistantAnswer, setAssistantAnswer] = useState("Search a city, then ask the assistant for simple weather advice.");
    const [assistantLoading, setAssistantLoading] = useState(false);

    const search = useCallback(async (cityOrPlace) => {
      const searchTerm = typeof cityOrPlace === "object" ? placeSearch(cityOrPlace) : String(cityOrPlace || "").trim();
      if (!searchTerm) return;
      setLoading(true); setStatus("Loading weather..."); setSuggestions([]); setSuggestionsOpen(false); setActiveSuggestion(-1);
      try { const data = await fetchWeather(cityOrPlace); setWeather(data); setQuery(typeof cityOrPlace === "object" ? placeLabel(cityOrPlace) : searchTerm); localStorage.setItem("lastCity", searchTerm); setStatus(""); }
      catch (error) { setStatus(error.message || "Something went wrong. Please try again later."); }
      finally { setLoading(false); }
    }, []);

    useEffect(() => { search(query); }, []); // Load the remembered city once.
    useEffect(() => {
      if (!suggestionsOpen || query.trim().length < 2 || weather?.place.name?.toLowerCase() === query.trim().toLowerCase()) { setSuggestions([]); return undefined; }
      let cancelled = false;
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`);
          const data = await response.json();
          if (!cancelled) { setSuggestions(data.results || []); setActiveSuggestion(-1); }
        } catch {
          if (!cancelled) setSuggestions([]);
        }
      }, 220);
      return () => { cancelled = true; clearTimeout(timer); };
    }, [query, weather, suggestionsOpen]);
    useEffect(() => {
      if (!weather) return;
      const effect = weather.weather.main.toLowerCase().replace(/\s+/g, "-");
      document.body.dataset.weather = effect; document.body.dataset.period = weather.isNight ? "night" : "day";
      document.body.classList.toggle("night-mode", weather.isNight); document.body.classList.toggle("day-mode", !weather.isNight);
      document.body.style.background = themes[weather.isNight ? "night" : "day"][effect] || themes[weather.isNight ? "night" : "day"].default;
      window.setWeatherEffect?.(effect, { isNight: weather.isNight });
      window.setSunTimes?.(weather.sun);
    }, [weather]);

    const saved = Boolean(weather && favorites.some((item) => item.name.toLowerCase() === weather.place.name.toLowerCase()));
    const toggleFavorite = () => {
      if (!weather) return;
      const next = saved ? favorites.filter((item) => item.name.toLowerCase() !== weather.place.name.toLowerCase()) : [{ ...weather.place, savedAt: new Date().toISOString() }, ...favorites].slice(0, 8);
      setFavorites(next); localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    };
    const askAssistant = async (event, suppliedQuestion = "") => {
      event?.preventDefault();
      const question = (suppliedQuestion || assistantQuestion).trim();
      if (!question) return;
      if (!weather) { setAssistantAnswer("Search a city first so I can use real weather data."); return; }
      setAssistantLoading(true); setAssistantAnswer("Thinking through the weather...");
      try { const response = await fetch(ASSISTANT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...snapshot(weather), question }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setAssistantAnswer(data.advice || data.answer || "No assistant answer came back yet."); }
      catch (error) { setAssistantAnswer(error.message || "The assistant is unavailable right now."); }
      finally { setAssistantLoading(false); }
    };
    const choose = (place) => { setQuery(placeLabel(place)); setSuggestionsOpen(false); search(place); };
    const keyboardSearch = (event) => {
      if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setActiveSuggestion((current) => (current + 1 + suggestions.length) % suggestions.length); }
      else if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setActiveSuggestion((current) => (current - 1 + suggestions.length) % suggestions.length); }
      else if (event.key === "Escape") { setSuggestions([]); setSuggestionsOpen(false); setActiveSuggestion(-1); }
      else if (event.key === "Enter") { event.preventDefault(); activeSuggestion >= 0 ? choose(suggestions[activeSuggestion]) : search(query); }
    };
    const dailyRange = useMemo(() => {
      const lows = weather?.daily.map((item) => Number(item.min)).filter(Number.isFinite) || []; const highs = weather?.daily.map((item) => Number(item.max)).filter(Number.isFinite) || [];
      const min = lows.length ? Math.min(...lows) : 0, max = highs.length ? Math.max(...highs) : min + 1;
      return { min, span: Math.max(1, max - min) };
    }, [weather]);
    const air = weather?.airQuality?.current || {};
    const alerts = weather ? buildAlerts(weather) : [];

    const suggestionList = suggestions.length ? h("div", { className: "city-suggestions", role: "listbox" }, suggestions.map((place, index) => h("button", {
      key: `${place.id || place.name}-${index}`, className: `city-suggestion${index === activeSuggestion ? " active" : ""}`, type: "button", role: "option",
      onMouseDown: (event) => event.preventDefault(), onClick: () => choose(place),
    }, h("strong", null, place.name), h("span", null, [place.admin1, place.country].filter(Boolean).join(", ") || "Weather location")))) : null;
    const hourlyItems = weather?.hourly.length ? weather.hourly.map((item, index) => h("article", { className: "hour-card", key: `${item.label}-${index}` },
      h("strong", null, item.label), h(WeatherIcon, { item }), h("span", { className: "precip" }, Number(item.precipitation) > 0 ? percent(item.precipitation) : ""), h("span", { className: "hour-temp" }, temp(item.temp))
    )) : "No hourly forecast available.";
    const dailyItems = weather?.daily.length ? weather.daily.map((item) => {
      const left = Math.max(0, ((Number(item.min) - dailyRange.min) / dailyRange.span) * 100);
      const width = Math.max(10, ((Number(item.max) - Number(item.min)) / dailyRange.span) * 100);
      return h("article", { className: "daily-row", key: item.day }, h("strong", { className: "daily-day" }, item.day), h("div", { className: "daily-condition" }, h(WeatherIcon, { item }), h("span", { className: "precip" }, Number(item.precipitation) > 0 ? percent(item.precipitation) : "")), h("span", { className: "daily-min" }, temp(item.min)), h("span", { className: "range-track" }, h("span", { className: "range-fill", style: { left: `${left}%`, width: `${Math.min(100 - left, width)}%` } })), h("span", { className: "daily-max" }, temp(item.max)));
    }) : "No daily forecast available.";
    const promptQuestions = { Umbrella: "Should I carry an umbrella today?", Clothes: "What should I wear today?", Travel: "Is it safe to travel tonight?" };

    return h(React.Fragment, null,
      h("canvas", { id: "weather-canvas" }),
      h("main", { className: "weather-app", "aria-live": "polite" },
        h("section", { className: "search-panel", "aria-label": "Weather search" }, h("div", { className: "search-actions" },
          h("div", { className: "controls" }, h("input", { value: query, onChange: (event) => { setQuery(event.target.value); setSuggestionsOpen(true); }, onFocus: () => setSuggestionsOpen(true), onKeyDown: keyboardSearch, onBlur: () => setTimeout(() => { setSuggestions([]); setSuggestionsOpen(false); setActiveSuggestion(-1); }, 120), placeholder: "Search city", "aria-label": "Search city", "aria-autocomplete": "list" }), h("button", { type: "button", onClick: () => search(query), disabled: loading }, loading ? "Loading" : "Search"), suggestionList),
          h("p", { className: `status-message${status ? " error" : ""}` }, status)
        )),
        h("section", { className: "hero-weather" }, h("p", { className: "location" }, weather?.place.name || "Select a city"), h("p", { className: "hero-temperature" }, weather ? temp(weather.main.temp) : "--°"), h("p", { className: "weather-main" }, weather?.weather.description || "N/A"), h("p", { className: "high-low" }, weather ? `H:${temp(weather.main.max)} L:${temp(weather.main.min)}` : "H:--° L:--°"), weather ? h("button", { className: `favorite-city-btn${saved ? " saved" : ""}`, type: "button", onClick: toggleFavorite }, saved ? "Saved city" : "Save city") : null),
        h("section", { className: "forecast-panel favorites-panel", "aria-label": "Favorite cities" }, h(PanelTitle, { symbol: "F", title: "Favorite Cities" }), h("div", { className: "favorite-cities" }, favorites.length ? favorites.map((favorite) => h("button", { key: `${favorite.name}-${favorite.latitude}`, className: "favorite-chip", type: "button", onClick: () => search(favorite) }, favorite.name)) : h("p", { className: "empty-state" }, "Save cities to open them faster."))),
        h("section", { className: "forecast-panel alerts-panel", "aria-label": "Weather alerts" }, h(PanelTitle, { symbol: "!", title: "Weather Alerts" }), h("div", { className: "weather-alerts" }, alerts.length ? alerts.map(([title, text]) => h("article", { className: "alert-card", key: title }, h("strong", null, title), h("span", null, text))) : h("p", { className: "empty-state" }, "No major weather alerts right now."))),
        h("section", { className: "forecast-panel hourly-panel", "aria-label": "Hourly forecast" }, h("p", { className: "forecast-insight" }, weather ? forecastSummary(weather) : "Search a city to see what the sky is doing next."),
          h("div", { className: "assistant-card", "aria-label": "AI weather assistant" }, h("div", { className: "assistant-heading" }, h("div", null, h("span", { className: "assistant-kicker" }, "AI Assistant"), h("h2", null, "Ask about this weather")), h("span", { className: "assistant-orb", "aria-hidden": true })), h("form", { className: "assistant-form", onSubmit: askAssistant }, h("input", { value: assistantQuestion, onChange: (event) => setAssistantQuestion(event.target.value), placeholder: "Should I carry an umbrella today?", "aria-label": "Ask weather assistant" }), h("button", { type: "submit", disabled: assistantLoading }, assistantLoading ? "Thinking" : "Ask")), h("div", { className: "assistant-prompts" }, Object.entries(promptQuestions).map(([label, question]) => h("button", { key: label, type: "button", onClick: () => { setAssistantQuestion(question); askAssistant(null, question); } }, label))), h("p", { className: "assistant-answer" }, assistantAnswer)),
          h(PanelTitle, { symbol: "24", title: "24-Hour Forecast", className: "hourly-title" }), h("div", { className: "hourly-forecast" }, hourlyItems)
        ),
        h("section", { className: "forecast-panel daily-panel", "aria-label": "7-day forecast" }, h(PanelTitle, { symbol: "7", title: "7-Day Forecast" }), h("div", { className: "daily-forecast" }, dailyItems)),
        h("section", { className: "forecast-panel radar-panel", "aria-label": "Precipitation map" }, h(PanelTitle, { symbol: "M", title: "Precipitation Map" }), h("div", { className: "radar-map" }, weather ? h(Radar, { place: weather.place }) : h("p", { className: "radar-status" }, "Radar map will load after weather data."))),
        h("section", { className: "forecast-panel precipitation-panel", "aria-label": "Precipitation" }, h(PanelTitle, { symbol: "P", title: "Precipitation" }), h("div", { className: "precipitation-card" }, h("div", null, h("strong", null, weather ? mm(weather.precipitation.today) : "N/A"), h("span", null, "Today")), h("p", null, weather ? (Number(weather.precipitation.tomorrow) > 0 ? `${mm(weather.precipitation.tomorrow)} expected tomorrow.` : Number(weather.precipitation.today) > 0 ? "Rain is expected today, with little expected tomorrow." : "No measurable rain expected today or tomorrow.") : "Rain totals will appear after weather data loads."))),
        h("section", { className: "metric-grid", "aria-label": "Weather details" }, h(Metric, { label: "Feels like", value: weather ? temp(weather.main.feelsLike) : "N/A" }), h(Metric, { label: "Humidity", value: weather ? percent(weather.main.humidity) : "N/A" }), h(Metric, { label: "Wind", value: weather ? unit(weather.wind.speed, "m/s") : "N/A" }), h(Metric, { label: "Wind gust", value: weather ? unit(weather.wind.gust, "m/s") : "N/A" })),
        h("section", { className: "metric-grid air-quality-grid", "aria-label": "Air quality details" }, h(Metric, { label: "US AQI", value: aqiLabel(air.us_aqi) }), h(Metric, { label: "PM2.5", value: unit(air.pm2_5, "ug/m3") }), h(Metric, { label: "PM10", value: unit(air.pm10, "ug/m3") }), h(Metric, { label: "UV Index", value: decimal(air.uv_index) }))
      )
    );
  }

  const root = document.getElementById("root");
  if (root) ReactDOM.flushSync(() => ReactDOM.createRoot(root).render(h(App)));
})();
