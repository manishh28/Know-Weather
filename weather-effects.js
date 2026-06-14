(function () {
  const canvas = document.getElementById("weather-canvas");
  if (!canvas) return;
 
  const ctx = canvas.getContext("2d");
  let particles = [];
  let splashes = [];
  let currentEffect = "default";
  let flashOpacity = 0;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const SUN_VISIBLE_OPACITY = 0.72;
  const MOON_VISIBLE_OPACITY = 0.88;
 
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
        z-index: 5;
        pointer-events: none;
        opacity: 0;
        transition: opacity 800ms ease;
      }

      #weather-sun {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,248,214,0.88) 0%, rgba(255,209,102,0.72) 45%, rgba(255,209,102,0) 72%);
        box-shadow: 0 0 70px 35px rgba(255, 209, 102, 0.32);
      }

      #weather-moon {
        width: 74px;
        height: 74px;
        border-radius: 50%;
        background:
          radial-gradient(circle at 31% 28%, rgba(177, 193, 209, 0.65) 0 6px, transparent 7px),
          radial-gradient(circle at 62% 38%, rgba(158, 176, 194, 0.5) 0 5px, transparent 6px),
          radial-gradient(circle at 45% 66%, rgba(170, 187, 204, 0.5) 0 7px, transparent 8px),
          linear-gradient(145deg, #fbfdff 0%, #dce8f3 55%, #aabfd4 100%);
        box-shadow: 0 0 46px 20px rgba(210, 230, 255, 0.34);
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
          width: 60px;
          height: 60px;
          box-shadow: 0 0 50px 24px rgba(255, 209, 102, 0.3);
        }

        #weather-moon {
          width: 52px;
          height: 52px;
          box-shadow: 0 0 36px 16px rgba(210, 230, 255, 0.32);
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
    if (sunEl) sunEl.classList.remove("decorative");
    if (moonEl) moonEl.classList.remove("decorative");
  };
 
  function updateCelestialPositions() {
    if ((!sunEl && !moonEl) || !sunTimes) return;
 
    const elapsedSinceFetch = Date.now() - sunTimes.fetchedAtMs;
    const now = sunTimes.locationNow + elapsedSinceFetch;
    const dayLength = sunTimes.sunset - sunTimes.sunrise;
    const isDaytime = now >= sunTimes.sunrise && now <= sunTimes.sunset;
 
    if (dayLength <= 0) {
      if (sunEl) sunEl.style.opacity = "0";
      if (moonEl) moonEl.style.opacity = "0";
      return;
    }
 
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
