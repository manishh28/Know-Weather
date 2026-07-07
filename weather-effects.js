(function () {
  const canvas = document.getElementById("weather-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let particles = [];
  let splashes = [];
  let currentEffect = "default";
  let flashOpacity = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  let sunEl = null;
  let moonEl = null;
  let sunTimes = null;
  let isNight = document.body.dataset.period === "night";

  function setPeriod(night) {
    isNight = Boolean(night);
    document.body.dataset.period = isNight ? "night" : "day";
  }

  function injectCelestialStyles() {
    if (document.getElementById("weather-celestial-styles")) return;
    const style = document.createElement("style");
    style.id = "weather-celestial-styles";
    style.textContent = `
      #weather-sun, #weather-moon {
        position: fixed;
        top: 55%;
        left: -12%;
        z-index: 0;
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: opacity 800ms ease;
        border-radius: 50%;
      }
      #weather-sun {
        width: 90px;
        height: 90px;
        opacity: 0;
        background: radial-gradient(circle, #fff8d6 0%, #ffd166 45%, rgba(255,209,102,0) 72%);
        box-shadow: 0 0 70px 35px rgba(255, 209, 102, 0.4);
      }
      #weather-moon {
        width: 86px;
        height: 86px;
        opacity: 0;
        background:
          radial-gradient(circle at 35% 34%, rgba(112,121,146,0.34) 0 6px, rgba(221,226,238,0.18) 7px 13px, transparent 14px),
          radial-gradient(circle at 63% 57%, rgba(104,113,139,0.32) 0 4px, rgba(220,225,238,0.18) 5px 9px, transparent 10px),
          radial-gradient(circle at 69% 31%, rgba(120,130,154,0.26) 0 3px, transparent 8px),
          radial-gradient(circle at 47% 69%, rgba(96,105,130,0.24) 0 5px, transparent 12px),
          radial-gradient(circle at 40% 38%, #ffffff 0%, #e7ebf4 34%, #b9c1d2 65%, rgba(116,124,148,0.15) 100%);
        box-shadow:
          inset -14px -10px 18px rgba(75,82,106,0.28),
          inset 9px 8px 16px rgba(255,255,255,0.34),
          0 0 26px 8px rgba(230,236,252,0.38),
          0 0 80px 28px rgba(155,174,215,0.2);
      }
      #weather-moon::before {
        content: "";
        position: absolute;
        inset: -20%;
        border-radius: inherit;
        background: radial-gradient(circle, rgba(230,236,252,0.3) 0 24%, rgba(230,236,252,0.08) 45%, transparent 68%);
        filter: blur(8px);
        z-index: -1;
      }
      #weather-sun.decorative {
        animation: weather-sun-arc 70s linear infinite;
      }
      @keyframes weather-sun-arc {
        0%   { left: -12%; top: 60%; opacity: 0; }
        8%   { opacity: 0.65; }
        50%  { left: 50%;  top: 6%; }
        92%  { opacity: 0.65; }
        100% { left: 112%; top: 60%; opacity: 0; }
      }
      @media (max-width: 680px) {
        #weather-sun  { width: 60px; height: 60px; box-shadow: 0 0 50px 24px rgba(255,209,102,0.35); }
        #weather-moon { width: 68px; height: 68px; box-shadow: 0 0 35px 14px rgba(214,222,240,0.3); }
      }
    `;
    document.head.appendChild(style);
  }

  function positionAlongArc(el, percent) {
    el.style.left = `${percent * 100}%`;
    el.style.top = `${60 - Math.sin(percent * Math.PI) * 54}%`;
  }

  function syncFallbackCelestial() {
    if (!sunEl || !moonEl || sunTimes) return;

    if (isNight) {
      sunEl.classList.remove("decorative");
      sunEl.style.opacity = "0";
      positionAlongArc(moonEl, 0.72);
      moonEl.style.opacity = "0.75";
      return;
    }

    sunEl.classList.add("decorative");
    sunEl.style.opacity = "";
    moonEl.style.opacity = "0";
  }

  function showCelestialBodies() {
    injectCelestialStyles();
    if (!sunEl) {
      sunEl = document.createElement("div");
      sunEl.id = "weather-sun";
      document.body.appendChild(sunEl);
    }
    if (!moonEl) {
      moonEl = document.createElement("div");
      moonEl.id = "weather-moon";
      document.body.appendChild(moonEl);
    }

    if (sunTimes) {
      updateCelestialPositions();
    } else {
      syncFallbackCelestial();
    }
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

  function parseMs(value) {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  window.setSunTimes = function (sun) {
    if (!sun) return;

    setPeriod(Boolean(sun.isNight));
    const sunriseToday = parseMs(sun.sunriseToday);
    const sunsetToday = parseMs(sun.sunsetToday);
    const previousSunset = parseMs(sun.previousSunset);
    const sunriseTomorrow = parseMs(sun.sunriseTomorrow);
    const locationNow = parseMs(sun.now);

    if (!sunriseToday || !sunsetToday || !sunriseTomorrow || !locationNow) {
      sunTimes = null;
      syncFallbackCelestial();
      return;
    }

    sunTimes = {
      previousSunset,
      sunriseToday,
      sunsetToday,
      sunriseTomorrow,
      locationNow,
      fetchedAtMs: Date.now(),
    };

    if (sunEl) sunEl.classList.remove("decorative");
    updateCelestialPositions();
  };

  function updateCelestialPositions() {
    if (!sunTimes || !sunEl || !moonEl) return;

    const elapsed = Date.now() - sunTimes.fetchedAtMs;
    const now = sunTimes.locationNow + elapsed;
    const { previousSunset, sunriseToday, sunsetToday, sunriseTomorrow } = sunTimes;
    const dayLength = sunsetToday - sunriseToday;

    if (now >= sunriseToday && now <= sunsetToday && dayLength > 0) {
      const percent = (now - sunriseToday) / dayLength;
      setPeriod(false);
      positionAlongArc(sunEl, percent);
      sunEl.style.opacity = "0.65";
      moonEl.style.opacity = "0";
      return;
    }

    const nightStart = now < sunriseToday ? previousSunset : sunsetToday;
    const nightEnd = now < sunriseToday ? sunriseToday : sunriseTomorrow;
    const nightLength = nightEnd - nightStart;

    setPeriod(true);
    if (!nightStart || !nightEnd || nightLength <= 0) {
      positionAlongArc(moonEl, 0.72);
      moonEl.style.opacity = "0.75";
      sunEl.style.opacity = "0";
      return;
    }

    const percent = Math.max(0, Math.min(1, (now - nightStart) / nightLength));
    positionAlongArc(moonEl, percent);
    moonEl.style.opacity = "0.75";
    sunEl.style.opacity = "0";
  }

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
      const count = effect === "fog" ? 8 : isNight ? 7 : 7;
      for (let i = 0; i < count; i++) {
        const size = isNight ? 95 + Math.random() * 145 : 92 + Math.random() * 130;
        particles.push({
          x: Math.random() * w,
          y: effect === "fog" ? Math.random() * h : Math.random() * h * (isNight ? 0.45 : 0.38),
          size,
          speed: 0.12 + Math.random() * 0.25,
          opacity: effect === "fog"
            ? 0.05 + Math.random() * 0.07
            : isNight
              ? 0.08 + Math.random() * 0.075
              : 0.065 + Math.random() * 0.065,
          lobes: [
            { x: -0.7, y: 0.05, rx: 0.58, ry: 0.28 },
            { x: -0.32, y: -0.12, rx: 0.55, ry: 0.33 },
            { x: 0.12, y: -0.18, rx: 0.72, ry: 0.39 },
            { x: 0.58, y: 0.02, rx: 0.62, ry: 0.31 },
            { x: 0.02, y: 0.15, rx: 1.05, ry: 0.28 },
          ],
        });
      }
    }
  }

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
        if (p.x > w + 20) p.x = -20;
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
        const cloudGradient = ctx.createRadialGradient(
          p.x - p.size * 0.2,
          p.y - p.size * 0.15,
          p.size * 0.08,
          p.x,
          p.y,
          p.size * 1.25
        );
        const light = isNight ? 190 : 255;
        const mid = isNight ? 132 : 238;
        cloudGradient.addColorStop(0, `rgba(${light},${light + 4},${light + 16},${p.opacity * 1.25})`);
        cloudGradient.addColorStop(0.42, `rgba(${mid},${mid + 8},${mid + 24},${p.opacity})`);
        cloudGradient.addColorStop(1, `rgba(${mid},${mid + 8},${mid + 24},0)`);

        ctx.save();
        ctx.filter = currentEffect === "fog" ? "blur(14px)" : isNight ? "blur(5px)" : "blur(2.5px)";
        ctx.fillStyle = cloudGradient;
        p.lobes.forEach((lobe) => {
          ctx.beginPath();
          ctx.ellipse(
            p.x + lobe.x * p.size,
            p.y + lobe.y * p.size,
            lobe.rx * p.size,
            lobe.ry * p.size,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
        ctx.restore();

        if (!isNight && currentEffect !== "fog") {
          ctx.save();
          ctx.filter = "blur(1px)";
          ctx.strokeStyle = `rgba(255,255,255,${p.opacity * 0.75})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y - p.size * 0.08, p.size * 0.95, p.size * 0.28, 0, Math.PI * 1.02, Math.PI * 1.92);
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.filter = isNight ? "blur(16px)" : "blur(10px)";
        ctx.fillStyle = `rgba(14,18,34,${isNight ? p.opacity * 0.62 : p.opacity * 0.08})`;
        ctx.beginPath();
        ctx.ellipse(p.x + p.size * 0.15, p.y + p.size * 0.2, p.size * 0.95, p.size * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        p.x += p.speed;
        if (p.x > w + p.size * 1.5) p.x = -p.size * 1.5;
      });
    }

    if (currentEffect === "thunderstorm") {
      if (Math.random() < 0.012) flashOpacity = 0.5 + Math.random() * 0.35;
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

  window.setWeatherEffect = function (weatherKey, options = {}) {
    if (typeof options.isNight === "boolean") {
      setPeriod(options.isNight);
    }

    const known = ["rain", "drizzle", "snow", "thunderstorm", "clouds", "fog"];
    const effect = known.includes(weatherKey) ? weatherKey : "default";
    if (effect !== currentEffect) {
      currentEffect = effect;
      flashOpacity = 0;
      spawn(effect);
      if (effect === "default") ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (effect === "default" || weatherKey === "clear" || weatherKey === "clouds" || weatherKey === "fog") {
      showCelestialBodies();
    } else {
      hideCelestialBodies();
    }
  };

  showCelestialBodies();
})();
