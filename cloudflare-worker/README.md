# Know Weather AI Assistant Worker

This Worker uses Cloudflare Workers AI to answer weather questions for the
GitHub Pages frontend. It does not require an OpenAI account or API key.

## One-time setup

1. Sign in to Cloudflare from the project folder:

```powershell
npx wrangler login
```

2. Deploy:

```powershell
npx wrangler deploy
```

3. Copy the deployed Worker URL, then set it in `script.js`:

```js
const WEATHER_ASSISTANT_ENDPOINT =
  "https://know-weather-assistant.your-subdomain.workers.dev";
```

For quick local testing in the browser console, you can also run:

```js
localStorage.setItem("knowWeatherAssistantEndpoint", "https://your-worker-url.workers.dev");
```

Cloudflare Workers AI includes a daily free allocation. The Worker uses the
`@cf/meta/llama-3.1-8b-instruct-fast` model through the `AI` binding configured
in `wrangler.toml`.
