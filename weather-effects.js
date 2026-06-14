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
