(function () {
  const canvas = document.getElementById("weather-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let particles = [];
  let splashes = [];
  let currentEffect = "default";
  let flashOpacity = 0;
  const cloudSprites = {
    day: new Image(),
    night: new Image(),
  };
  cloudSprites.day.src = "assets/clouds/cloud-day.png";
  cloudSprites.night.src = "assets/clouds/cloud-night.png";

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
        width: 126px;
        height: 126px;
        opacity: 0;
        background:
          radial-gradient(circle, rgba(255,244,184,0.34) 0 26%, rgba(255,198,73,0.15) 48%, transparent 73%),
          url("assets/sky/sun.png") center/contain no-repeat;
        filter: drop-shadow(0 0 22px rgba(255,221,112,0.58)) drop-shadow(0 0 58px rgba(255,195,58,0.36));
      }
      #weather-moon {
        width: 112px;
        height: 112px;
        opacity: 0;
        background: url("assets/sky/moon.png") center/contain no-repeat;
        filter: drop-shadow(0 0 18px rgba(230,236,252,0.5)) drop-shadow(0 0 58px rgba(155,174,215,0.26));
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
        #weather-sun  { width: 82px; height: 82px; }
        #weather-moon { width: 88px; height: 88px; }
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
        const depth = 0.72 + Math.random() * 0.65;
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          len: (12 + Math.random() * 26) * depth,
          speed: (9 + Math.random() * 12) * depth,
          wind: (1.8 + Math.random() * 1.8) * depth,
          opacity: (0.12 + Math.random() * 0.36) * depth,
          width: Math.random() < 0.28 ? 1.8 : 1,
          depth,
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
    } else if (effect === "clouds") {
      const count = isNight ? 5 : 5;
      for (let i = 0; i < count; i++) {
        const width = isNight ? 360 + Math.random() * 420 : 300 + Math.random() * 360;
        particles.push({
          x: Math.random() * (w + width) - width * 0.5,
          y: Math.random() * h * (isNight ? 0.34 : 0.32),
          width,
          speed: 0.08 + Math.random() * 0.16,
          opacity: isNight ? 0.48 + Math.random() * 0.22 : 0.42 + Math.random() * 0.2,
          sprite: isNight ? "night" : "day",
        });
      }
    } else if (effect === "fog") {
      for (let i = 0; i < 8; i++) {
        const size = 90 + Math.random() * 150;
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size,
          speed: 0.12 + Math.random() * 0.25,
          opacity: 0.05 + Math.random() * 0.07,
        });
      }
    }
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (currentEffect === "rain" || currentEffect === "drizzle" || currentEffect === "thunderstorm") {
      const mist = ctx.createLinearGradient(0, h * 0.42, 0, h);
      const mistOpacity = currentEffect === "drizzle" ? 0.035 : currentEffect === "rain" ? 0.055 : 0.08;
      mist.addColorStop(0, "rgba(190,215,245,0)");
      mist.addColorStop(0.72, `rgba(180,205,238,${mistOpacity})`);
      mist.addColorStop(1, `rgba(210,225,248,${mistOpacity * 0.55})`);
      ctx.fillStyle = mist;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      particles.forEach((p) => {
        const x2 = p.x + p.wind * 2.7;
        const y2 = p.y + p.len;
        const rainGradient = ctx.createLinearGradient(p.x, p.y, x2, y2);
        rainGradient.addColorStop(0, "rgba(210,230,255,0)");
        rainGradient.addColorStop(0.35, `rgba(145,190,238,${p.opacity})`);
        rainGradient.addColorStop(1, `rgba(235,246,255,${p.opacity * 0.58})`);
        ctx.beginPath();
        ctx.strokeStyle = rainGradient;
        ctx.lineWidth = p.width;
        ctx.lineCap = "round";
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        p.y += p.speed;
        p.x += p.wind;
        if (p.y > h) {
          splashes.push({ x: p.x, y: h - 2, r: 1, opacity: 0.32 * p.depth });
          p.y = -20;
          p.x = Math.random() * w;
        }
        if (p.x > w + 20) p.x = -20;
      });
      ctx.restore();

      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        ctx.beginPath();
        ctx.strokeStyle = `rgba(210,232,255,${s.opacity})`;
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
    } else if (currentEffect === "clouds") {
      particles.forEach((p) => {
        const sprite = cloudSprites[p.sprite || (isNight ? "night" : "day")];
        if (sprite.complete && sprite.naturalWidth) {
          const height = p.width * (sprite.naturalHeight / sprite.naturalWidth);
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.filter = isNight ? "saturate(1.16) hue-rotate(5deg)" : "saturate(1.18) hue-rotate(7deg) brightness(1.04)";
          ctx.drawImage(sprite, p.x, p.y, p.width, height);
          ctx.restore();
        }

        p.x += p.speed;
        if (p.x > w + p.width * 0.2) {
          p.x = -p.width;
          p.y = Math.random() * h * (isNight ? 0.34 : 0.32);
        }
      });
    } else if (currentEffect === "fog") {
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
        ctx.filter = "blur(14px)";
        ctx.fillStyle = cloudGradient;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.filter = "blur(16px)";
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
