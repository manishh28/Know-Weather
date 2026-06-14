(function () {
  const canvas = document.getElementById("weather-canvas");
  if (!canvas) return;
 
  const ctx = canvas.getContext("2d");
  let particles = [];
  let currentEffect = "default";
  let flashOpacity = 0;
 
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);
 
  function spawn(effect) {
    const w = canvas.width;
    const h = canvas.height;
    particles = [];
 
    if (effect === "rain" || effect === "drizzle" || effect === "thunderstorm") {
      const count = effect === "thunderstorm" ? 180 : effect === "rain" ? 120 : 70;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          len: 10 + Math.random() * 20,
          speed: 9 + Math.random() * 9,
          opacity: 0.15 + Math.random() * 0.35,
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
        ctx.lineWidth = 1;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 2, p.y + p.len);
        ctx.stroke();
        p.y += p.speed;
        p.x += 1;
        if (p.y > h) {
          p.y = -20;
          p.x = Math.random() * w;
        }
      });
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
 
    // Lightning flashes for thunderstorms
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
    requestAnimationFrame(loop);
  }
  loop();
 
  // Maps your existing data-weather values to animation sets
  window.setWeatherEffect = function (weatherKey) {
    const known = ["rain", "drizzle", "snow", "thunderstorm", "clouds", "fog"];
    const effect = known.includes(weatherKey) ? weatherKey : "default";
    if (effect === currentEffect) return;
    currentEffect = effect;
    flashOpacity = 0;
    spawn(effect);
    if (effect === "default") ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
})();
