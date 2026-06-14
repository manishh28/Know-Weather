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
  let sunTimes = null; 
  function injectSunStyles() {
    if (document.getElementById("weather-sun-styles")) return;
    const style = document.createElement("style");
    style.id = "weather-sun-styles";
    style.textContent = `
      #weather-sun {
        position: fixed;
        top: 55%;
        left: -12%;
        width: 90px;
        height: 90px;
        border-radius: 50%;
        background: radial-gradient(circle, #fff8d6 0%, #ffd166 45%, rgba(255,209,102,0) 72%);
        box-shadow: 0 0 70px 35px rgba(255, 209, 102, 0.55);
        z-index: 5;
        pointer-events: none;
        transition: opacity 800ms ease;
      }
 
      /* Decorative fallback loop, used until real sun times are known */
      #weather-sun.decorative {
        animation: weather-sun-arc 70s linear infinite;
      }
 
      @keyframes weather-sun-arc {
        0%   { left: -12%; top: 60%; opacity: 0; }
        8%   { opacity: 1; }
        50%  { left: 50%;  top: 6%;  }
        92%  { opacity: 1; }
        100% { left: 112%; top: 60%; opacity: 0; }
      }
 
      @media (max-width: 680px) {
        #weather-sun {
          width: 60px;
          height: 60px;
          box-shadow: 0 0 50px 24px rgba(255, 209, 102, 0.5);
        }
      }
    `;
    document.head.appendChild(style);
  }
 
  function showSun() {
    injectSunStyles();
    if (sunEl) return;
    sunEl = document.createElement("div");
    sunEl.id = "weather-sun";
    sunEl.classList.add("decorative"); 
    document.body.appendChild(sunEl); 
  }
 
  function hideSun() {
    if (sunEl) {
      sunEl.remove();
      sunEl = null;
    }
  }
 
  
  window.setSunTimes = function (sunriseStr, sunsetStr, nowStr) {
    if (!sunriseStr || !sunsetStr || !nowStr) return;
    sunTimes = {
      sunrise: new Date(sunriseStr).getTime(),
      sunset: new Date(sunsetStr).getTime(),
      locationNow: new Date(nowStr).getTime(),
      fetchedAtMs: Date.now(),
    };
    if (sunEl) sunEl.classList.remove("decorative");
  };
 
  function updateSunPosition() {
    if (!sunEl || !sunTimes) return;
 
    const elapsedSinceFetch = Date.now() - sunTimes.fetchedAtMs;
    const now = sunTimes.locationNow + elapsedSinceFetch;
    const dayLength = sunTimes.sunset - sunTimes.sunrise;
 
    if (now < sunTimes.sunrise || now > sunTimes.sunset || dayLength <= 0) {
      sunEl.style.opacity = "0";
      return;
    }
 
    const percent = (now - sunTimes.sunrise) / dayLength; 
    const left = percent * 100; 
    const top = 60 - Math.sin(percent * Math.PI) * 54; 
 
    sunEl.style.left = `${left}%`;
    sunEl.style.top = `${top}%`;
    sunEl.style.opacity = "1";
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
 
  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
 
    if (currentEffect === "rain" || currentEffect === "drizzle" || currentEffect === "thunderstorm") {
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(210,225,245,${p.opacity})`;
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
        ctx.strokeStyle = `rgba(220,232,250,${s.opacity})`;
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
    updateSunPosition();
    requestAnimationFrame(loop);
  }
  loop();
 
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
      showSun();
    } else {
      hideSun();
    }
  };
 
  showSun();
})();
