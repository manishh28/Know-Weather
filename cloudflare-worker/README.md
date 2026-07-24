# Know Weather AI Assistant Worker

This Cloudflare Worker keeps the OpenAI API key hidden and lets the GitHub Pages
frontend ask weather questions safely.

## One-time setup

1. Create a Cloudflare API token with permission to edit Workers.
2. Set it in PowerShell:

```powershell
$env:CLOUDFLARE_API_TOKEN="your_cloudflare_token"
```

3. Add your OpenAI API key as a Worker secret:

```powershell
npx wrangler secret put OPENAI_API_KEY
```

4. Deploy:

```powershell
npx wrangler deploy
```

5. Copy the deployed Worker URL, then set it in `script.js`:

```js
const WEATHER_ASSISTANT_ENDPOINT =
  "https://know-weather-assistant.your-subdomain.workers.dev";
```

For quick local testing in the browser console, you can also run:

```js
localStorage.setItem("knowWeatherAssistantEndpoint", "https://your-worker-url.workers.dev");
```
