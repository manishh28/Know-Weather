const DEFAULT_ORIGIN = "https://manishh28.github.io";

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return json({ error: "Use POST / with a weather question." }, 405, cors);
    }

    if (!env.AI) {
      return json({ error: "Cloudflare Workers AI is not configured." }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return json({ error: "Invalid JSON body." }, 400, cors);
    }

    const question = cleanText(body.question, 180);
    const weather = body.weather || {};

    if (!question) {
      return json({ error: "Ask a weather question first." }, 400, cors);
    }

    let result;
    try {
      result = await env.AI.run(
        env.AI_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast",
        {
          messages: [
            {
              role: "system",
              content:
                "You are Know Weather's friendly weather assistant. Give short, practical advice based only on the supplied weather data. Mention umbrella, clothing, travel, heat, UV, air quality, or rain only when relevant. Do not invent unavailable data. Keep the answer under 75 words.",
            },
            {
              role: "user",
              content: `Question: ${question}\n\nWeather data:\n${JSON.stringify(compactWeather(weather))}`,
            },
          ],
          max_tokens: 180,
          temperature: 0.35,
        }
      );
    } catch (error) {
      return json({ error: "The AI assistant could not answer right now." }, 502, cors);
    }

    const answer =
      typeof result === "string"
        ? result
        : result?.response || result?.result?.response || "";

    return json(
      { answer: cleanText(answer, 700) || "I could not generate advice for this weather yet." },
      200,
      cors
    );
  },
};

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function compactWeather(weather) {
  return {
    city: weather.city,
    condition: weather.condition,
    temperature: weather.temperature,
    feelsLike: weather.feelsLike,
    high: weather.high,
    low: weather.low,
    humidity: weather.humidity,
    wind: weather.wind,
    windGust: weather.windGust,
    precipitation: weather.precipitation,
    airQuality: weather.airQuality,
    isNight: weather.isNight,
    hourly: Array.isArray(weather.hourly) ? weather.hourly.slice(0, 12) : [],
    daily: Array.isArray(weather.daily) ? weather.daily.slice(0, 7) : [],
  };
}

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || DEFAULT_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data, status, headers) {
  return Response.json(data, {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });
}
