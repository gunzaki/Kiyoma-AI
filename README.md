# Kiyoma Mobile — installable offline web app

Kiyoma is a phone-first progressive web app. Install it from Chrome on Android to add a home-screen icon. The AI model runs on the phone with WebGPU; chats are stored in the browser on that device.

## Quick setup on the POCO X6 Pro

The website must be published at an HTTPS address first. Open its Vercel URL in Chrome while on Wi-Fi. Choose **Quick · lighter model** for Qwen 3.5 0.8B, or **More capable · may respond slower** for Qwen 3.5 2B, then tap **Set up Kiyoma**. Keep the page open while the model downloads. The first download needs over 1 GB of free space. The 0.8B option uses less graphics memory and should respond faster; the 2B option may give better answers but can take longer.

After setup, tap **Install app** if it appears. Otherwise use Chrome **⋮ → Install app** or **Add to Home screen**. Reopen Kiyoma from the icon and test it in Airplane mode.

Kiyoma turns Qwen thinking mode off and filters `<think>` tags as a fallback. Replies are capped to keep ordinary chats short. The phone's actual speed depends on Chrome, WebGPU support, available memory, and temperature; we cannot guarantee a specific response time without testing on the device.

## Build or update the website

Install Node.js LTS from https://nodejs.org/ if needed. Open this `mobile` folder in VS Code, choose **Terminal → New Terminal**, then run:

```powershell
npm install
npm run build
```

The finished site is in `dist`. Vercel can build it automatically from GitHub using `npm run build` and output directory `dist`. See [VERCEL-SETUP.md](./VERCEL-SETUP.md) for upload steps. Do not upload `node_modules`; `.gitignore` excludes it.

## Offline and privacy notes

- The first visit and model download require internet. Later chat requests run locally on the phone.
- The website shell is cached by its service worker; WebLLM stores the model in browser storage.
- Chrome or Android can clear cached data under storage pressure. If that happens, open the Vercel site online and set up the model again.
- This is separate from the PC app, which uses Ollama.
