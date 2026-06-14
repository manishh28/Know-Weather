(function () {
  const canvas = document.getElementById("weather-canvas");
  if (!canvas) return;
 
  const ctx = canvas.getContext("2d");
  let particles = [];
  let splashes = [];
  let currentEffect = "default";
  let flashOpacity = 0;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const SUN_VISIBLE_OPACITY = 0.58;
  const MOON_VISIBLE_OPACITY = 0.7;
 
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);
 
  /* ---------------- Sun + moon (DOM elements) ---------------- */
  let sunEl = null;
  let moonEl = null;
  let sunTimes = null; // { sunrise, sunset, locationNow, fetchedAtMs } all in ms
 
  function injectCelestialStyles() {
    if (document.getElementById("weather-celestial-styles")) return;
    const style = document.createElement("style");
    style.id = "weather-celestial-styles";
    style.textContent = `
      #weather-sun,
      #weather-moon {
        position: fixed;
        top: 55%;
        left: -12%;
        z-index: 0;
        pointer-events: none;
        opacity: 0;
        transition: opacity 800ms ease;
      }

      #weather-sun {
        width: 128px;
        height: 128px;
        border-radius: 50%;
        background:
          radial-gradient(circle at 34% 30%, rgba(255, 255, 236, 0.82) 0 11%, transparent 18%),
          radial-gradient(circle, rgba(255, 245, 187, 0.74) 0%, rgba(255, 201, 76, 0.52) 45%, rgba(255, 177, 66, 0) 72%);
        box-shadow:
          0 0 86px 42px rgba(255, 209, 102, 0.22),
          0 0 160px 72px rgba(255, 185, 80, 0.12);
      }

      #weather-moon {
        width: 108px;
        height: 108px;
        border-radius: 50%;
        background:
          radial-gradient(circle at 31% 28%, rgba(149, 166, 184, 0.58) 0 8px, transparent 9px),
          radial-gradient(circle at 62% 38%, rgba(142, 160, 180, 0.44) 0 7px, transparent 8px),
          radial-gradient(circle at 45% 66%, rgba(154, 172, 190, 0.48) 0 10px, transparent 11px),
          radial-gradient(circle at 68% 70%, rgba(180, 196, 214, 0.36) 0 5px, transparent 6px),
          linear-gradient(145deg, rgba(251, 253, 255, 0.92) 0%, rgba(220, 232, 243, 0.78) 55%, rgba(170, 191, 212, 0.68) 100%);
        box-shadow:
          0 0 62px 26px rgba(210, 230, 255, 0.26),
          0 0 120px 48px rgba(138, 180, 230, 0.1);
        overflow: hidden;
      }

      #weather-moon::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        box-shadow: inset -13px -10px 20px rgba(97, 121, 146, 0.22);
      }
 
      /* Decorative fallback loop, used until real sun times are known */
      #weather-sun.decorative {
        animation: weather-sun-arc 72s linear infinite;
      }

      #weather-moon.decorative {
        animation: weather-moon-arc 72s linear infinite;
      }
 
      @keyframes weather-sun-arc {
        0%   { left: -12%; top: 60%; opacity: 0; }
        7%   { opacity: ${SUN_VISIBLE_OPACITY}; }
        26%  { left: 50%; top: 6%; opacity: ${SUN_VISIBLE_OPACITY}; }
        47%  { opacity: ${SUN_VISIBLE_OPACITY}; }
        52%  { left: 112%; top: 60%; opacity: 0; }
        100% { left: 112%; top: 60%; opacity: 0; }
      }

      @keyframes weather-moon-arc {
        0%, 50% { left: -12%; top: 62%; opacity: 0; }
        57%     { opacity: ${MOON_VISIBLE_OPACITY}; }
        76%     { left: 50%; top: 12%; opacity: ${MOON_VISIBLE_OPACITY}; }
        95%     { opacity: ${MOON_VISIBLE_OPACITY}; }
        100%    { left: 112%; top: 62%; opacity: 0; }
      }
 
      @media (max-width: 680px) {
        #weather-sun {
          width: 86px;
          height: 86px;
          box-shadow:
            0 0 58px 28px rgba(255, 209, 102, 0.2),
            0 0 110px 48px rgba(255, 185, 80, 0.1);
        }

        #weather-moon {
          width: 76px;
          height: 76px;
          box-shadow:
            0 0 44px 18px rgba(210, 230, 255, 0.24),
            0 0 84px 34px rgba(138, 180, 230, 0.1);
        }
      }
    `;
    document.head.appendChild(style);
  }
 
  function createCelestialElement(id) {
    const el = document.createElement("div");
    el.id = id;
    if (!sunTimes) el.classList.add("decorative"); // fallback until real times arrive
    document.body.appendChild(el); // appended last -> sits above other content
    return el;
  }
 
  function showCelestialBodies() {
    injectCelestialStyles();
    if (!sunEl) sunEl = createCelestialElement("weather-sun");
    if (!moonEl) moonEl = createCelestialElement("weather-moon");
  }

  function hideCelestialBodies() {
    if (sunEl) {
      sunEl.remove();
      sunEl = null;
    }
    if (moonEl) {
      moonEl.remove();
      moonEl = null;
    }
  }

  function setTimeOfDay(isDaytime) {
    document.body.dataset.timeOfDay = isDaytime ? "day" : "night";
  }
 
  // Called from script.js with the city's local sunrise/sunset and
  // its current local time, all as ISO-ish strings from Open-Meteo.
  window.setSunTimes = function (sunriseStr, sunsetStr, nowStr) {
    if (!sunriseStr || !sunsetStr || !nowStr) return;
    sunTimes = {
      sunrise: new Date(sunriseStr).getTime(),
      sunset: new Date(sunsetStr).getTime(),
      locationNow: new Date(nowStr).getTime(),
      fetchedAtMs: Date.now(),
    };
    const dayLength = sunTimes.sunset - sunTimes.sunrise;
    if (dayLength > 0) {
      setTimeOfDay(sunTimes.locationNow >= sunTimes.sunrise && sunTimes.locationNow <= sunTimes.sunset);
    }
    if (sunEl) sunEl.classList.remove("decorative");
    if (moonEl) moonEl.classList.remove("decorative");
  };
 
  function updateCelestialPositions() {
    if (!sunTimes) return;
 
    const elapsedSinceFetch = Date.now() - sunTimes.fetchedAtMs;
    const now = sunTimes.locationNow + elapsedSinceFetch;
    const dayLength = sunTimes.sunset - sunTimes.sunrise;
    const isDaytime = now >= sunTimes.sunrise && now <= sunTimes.sunset;
 
    if (dayLength <= 0) {
      if (sunEl) sunEl.style.opacity = "0";
      if (moonEl) moonEl.style.opacity = "0";
      delete document.body.dataset.timeOfDay;
      return;
    }

    setTimeOfDay(isDaytime);
 
    if (isDaytime) {
      const percent = (now - sunTimes.sunrise) / dayLength; // 0 (sunrise) -> 1 (sunset)
      const left = percent * 100; // sweeps across full width
      const top = 60 - Math.sin(percent * Math.PI) * 54; // arcs up then down
 
      if (sunEl) {
        sunEl.style.left = `${left}%`;
        sunEl.style.top = `${top}%`;
        sunEl.style.opacity = String(SUN_VISIBLE_OPACITY);
      }
      if (moonEl) moonEl.style.opacity = "0";
      return;
    }

    if (sunEl) sunEl.style.opacity = "0";
    if (!moonEl) return;

    const nightStart = now < sunTimes.sunrise ? sunTimes.sunset - DAY_MS : sunTimes.sunset;
    const nightEnd = now < sunTimes.sunrise ? sunTimes.sunrise : sunTimes.sunrise + DAY_MS;
    const nightLength = nightEnd - nightStart;
    const nightPercent = Math.min(Math.max((now - nightStart) / nightLength, 0), 1);
    const moonLeft = nightPercent * 100;
    const moonTop = 62 - Math.sin(nightPercent * Math.PI) * 50;

    moonEl.style.left = `${moonLeft}%`;
    moonEl.style.top = `${moonTop}%`;
    moonEl.style.opacity = String(MOON_VISIBLE_OPACITY);
  }
 
  /* ---------------- Particle setup ---------------- */
  function spawn(effect) {
    const w = canvas.width;
    const h = canvas.height;
    particles = [];
    splashes = [];
 
    if (effect === "rain" || effect === "drizzle" || effect === "thunderstorm") {
      const count = effect === "thunderstorm" ? 200 : effect === "rain" ? 140 : 80;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          len: 14 + Math.random() * 22,
          speed: 10 + Math.random() * 10,
          wind: 2 + Math.random() * 1.5,
          opacity: 0.15 + Math.random() * 0.35,
          width: Math.random() < 0.3 ? 2 : 1,
        });
      }
    } else if (effect === "snow") {
      for (let i = 0; i < 130; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1 + Math.random() * 3,
          speed: 0.5 + Math.random() * 1.5,
          drift: Math.random() * 1.2 - 0.6,
          opacity: 0.4 + Math.random() * 0.6,
        });
      }
    } else if (effect === "clouds" || effect === "fog") {
      const count = effect === "fog" ? 8 : 5;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: effect === "fog" ? Math.random() * h : Math.random() * h * 0.4,
          size: 90 + Math.random() * 150,
          speed: 0.12 + Math.random() * 0.25,
          opacity: effect === "fog" ? 0.05 + Math.random() * 0.07 : 0.07 + Math.random() * 0.1,
        });
      }
    }
  }
 
  /* ---------------- Drawing ---------------- */
  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
 
    if (currentEffect === "rain" || currentEffect === "drizzle" || currentEffect === "thunderstorm") {
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(70,100,140,${p.opacity + 0.25})`;
        ctx.lineWidth = p.width;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.wind * 2.5, p.y + p.len);
        ctx.stroke();
 
        p.y += p.speed;
        p.x += p.wind;
 
        if (p.y > h) {
          splashes.push({ x: p.x, y: h - 2, r: 1, opacity: 0.45 });
          p.y = -20;
          p.x = Math.random() * w;
        }
        if (p.x > w + 20) {
          p.x = -20;
        }
      });
 
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        ctx.beginPath();
        ctx.strokeStyle = `rgba(70,100,140,${s.opacity})`;
        ctx.lineWidth = 1;
        ctx.ellipse(s.x, s.y, s.r, s.r * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        s.r += 1.4;
        s.opacity -= 0.05;
        if (s.opacity <= 0) splashes.splice(i, 1);
      }
    } else if (currentEffect === "snow") {
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.speed;
        p.x += p.drift;
        if (p.y > h) {
          p.y = -5;
          p.x = Math.random() * w;
        }
        if (p.x > w) p.x = 0;
        if (p.x < 0) p.x = w;
      });
    } else if (currentEffect === "clouds" || currentEffect === "fog") {
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.speed;
        if (p.x > w + p.size) p.x = -p.size;
      });
    }
 
    if (currentEffect === "thunderstorm") {
      if (Math.random() < 0.012) {
        flashOpacity = 0.5 + Math.random() * 0.35;
      }
      if (flashOpacity > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flashOpacity})`;
        ctx.fillRect(0, 0, w, h);
        flashOpacity -= 0.05;
      }
    }
  }
 
  function loop() {
    draw();
    updateCelestialPositions();
    requestAnimationFrame(loop);
  }
  loop();
 
  /* ---------------- Public API ---------------- */
  window.setWeatherEffect = function (weatherKey) {
    const known = ["rain", "drizzle", "snow", "thunderstorm", "clouds", "fog"];
    const effect = known.includes(weatherKey) ? weatherKey : "default";
    if (effect !== currentEffect) {
      currentEffect = effect;
      flashOpacity = 0;
      spawn(effect);
      if (effect === "default") ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
 
    if (effect === "default" || weatherKey === "clear") {
      showCelestialBodies();
    } else {
      hideCelestialBodies();
    }
  };
 
  // Show sun (decorative loop) by default until real weather data arrives
  showCelestialBodies();
})();
