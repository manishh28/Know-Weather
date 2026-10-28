/* global React, ReactDOM */
(function () {
  const h = React.createElement;

  function PanelTitle({ symbol, title, className = "" }) {
    return h("div", { className: `panel-title ${className}`.trim() },
      h("span", { "aria-hidden": "true" }, symbol),
      h("h2", null, title)
    );
  }

  function Metric({ label, id }) {
    return h("div", null,
      h("span", { className: "label" }, label),
      h("strong", { id }, "N/A")
    );
  }

  function SearchPanel() {
    return h("section", { className: "search-panel", "aria-label": "Weather search" },
      h("div", { className: "search-actions" },
        h("div", { className: "controls" },
          h("input", {
            id: "city-input",
            type: "text",
            placeholder: "Search city",
            "aria-label": "Search city",
            autoComplete: "off",
            "aria-autocomplete": "list",
            "aria-controls": "city-suggestions",
          }),
          h("button", { id: "get-weather-btn", type: "button" }, "Search"),
          h("div", { id: "city-suggestions", className: "city-suggestions", role: "listbox", hidden: true })
        ),
        h("p", { id: "status-message", className: "status-message" })
      )
    );
  }

  function Assistant() {
    return h("div", { className: "assistant-card", "aria-label": "AI weather assistant" },
      h("div", { className: "assistant-heading" },
        h("div", null,
          h("span", { className: "assistant-kicker" }, "AI Assistant"),
          h("h2", null, "Ask about this weather")
        ),
        h("span", { className: "assistant-orb", "aria-hidden": "true" })
      ),
      h("form", { id: "assistant-form", className: "assistant-form" },
        h("input", {
          id: "assistant-question",
          type: "text",
          placeholder: "Should I carry an umbrella today?",
          "aria-label": "Ask weather assistant",
          autoComplete: "off",
        }),
        h("button", { id: "assistant-submit", type: "submit" }, "Ask")
      ),
      h("div", { className: "assistant-prompts", "aria-label": "Quick weather questions" },
        h("button", { type: "button", "data-question": "Should I carry an umbrella today?" }, "Umbrella"),
        h("button", { type: "button", "data-question": "What should I wear today?" }, "Clothes"),
        h("button", { type: "button", "data-question": "Is it safe to travel tonight?" }, "Travel")
      ),
      h("p", { id: "assistant-answer", className: "assistant-answer" }, "Search a city, then ask the assistant for simple weather advice.")
    );
  }

  function App() {
    return h(React.Fragment, null,
      h("canvas", { id: "weather-canvas" }),
      h("main", { className: "weather-app", "aria-live": "polite" },
        h(SearchPanel),
        h("section", { className: "hero-weather" },
          h("p", { id: "location", className: "location" }, "Select a city"),
          h("p", { id: "main-temperature", className: "hero-temperature" }, "--°"),
          h("p", { id: "weather-main", className: "weather-main" }, "N/A"),
          h("p", { id: "high-low", className: "high-low" }, "H:--° L:--°"),
          h("button", { id: "favorite-city-btn", className: "favorite-city-btn", type: "button", hidden: true }, "Save city")
        ),
        h("section", { className: "forecast-panel favorites-panel", "aria-label": "Favorite cities" },
          h(PanelTitle, { symbol: "F", title: "Favorite Cities" }),
          h("div", { id: "favorite-cities", className: "favorite-cities" })
        ),
        h("section", { className: "forecast-panel alerts-panel", "aria-label": "Weather alerts" },
          h(PanelTitle, { symbol: "!", title: "Weather Alerts" }),
          h("div", { id: "weather-alerts", className: "weather-alerts" })
        ),
        h("section", { className: "forecast-panel hourly-panel", "aria-label": "Hourly forecast" },
          h("p", { id: "forecast-insight", className: "forecast-insight" }, "Search a city to see what the sky is doing next."),
          h(Assistant),
          h(PanelTitle, { symbol: "24", title: "24-Hour Forecast", className: "hourly-title" }),
          h("div", { id: "hourly-forecast", className: "hourly-forecast" })
        ),
        h("section", { className: "forecast-panel daily-panel", "aria-label": "7-day forecast" },
          h(PanelTitle, { symbol: "7", title: "7-Day Forecast" }),
          h("div", { id: "daily-forecast", className: "daily-forecast" })
        ),
        h("section", { className: "forecast-panel radar-panel", "aria-label": "Precipitation map" },
          h(PanelTitle, { symbol: "M", title: "Precipitation Map" }),
          h("div", { id: "radar-map", className: "radar-map" },
            h("p", { id: "radar-status", className: "radar-status" }, "Radar map will load after weather data.")
          )
        ),
        h("section", { className: "forecast-panel precipitation-panel", "aria-label": "Precipitation" },
          h(PanelTitle, { symbol: "P", title: "Precipitation" }),
          h("div", { className: "precipitation-card" },
            h("div", null, h("strong", { id: "precip-today" }, "N/A"), h("span", null, "Today")),
            h("p", { id: "precip-note" }, "Rain totals will appear after weather data loads.")
          )
        ),
        h("section", { className: "metric-grid", "aria-label": "Weather details" },
          h(Metric, { label: "Feels like", id: "feels-like" }),
          h(Metric, { label: "Humidity", id: "humidity" }),
          h(Metric, { label: "Wind", id: "wind" }),
          h(Metric, { label: "Wind gust", id: "wind-gust" })
        ),
        h("section", { className: "metric-grid air-quality-grid", "aria-label": "Air quality details" },
          h(Metric, { label: "US AQI", id: "air-aqi" }),
          h(Metric, { label: "PM2.5", id: "air-pm25" }),
          h(Metric, { label: "PM10", id: "air-pm10" }),
          h(Metric, { label: "UV Index", id: "air-uv" })
        )
      )
    );
  }

  const root = document.getElementById("root");

  if (root) {
    // The static markup in index.html keeps the weather app usable if the CDN is unavailable.
    ReactDOM.createRoot(root).render(h(App));
  }
})();
