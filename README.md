# Kiyoma sa Android — installable na offline web app

Ito ay phone-first na website na puwedeng i-install sa Android home screen na parang app. Tumakbo ang language model sa browser mismo gamit ang WebGPU; lokal sa phone ang chat history at model cache.

## Kailangan ng internet sa unang setup

Dapat munang i-publish ang site sa isang HTTPS address para ma-install ito bilang app at magamit ang WebGPU sa Chrome. Buksan ang address sa POCO X6 Pro habang nakakonekta sa Wi-Fi, pindutin ang **I-download at ihanda si Kiyoma**, at iwanang bukas ang page habang kinukuha ang Qwen model. Mahigit 1 GB ang model files; kailangan din nito ng humigit-kumulang 2.25 GB na graphics memory habang tumatakbo.

Pagkatapos ma-load ang model, pindutin ang **I-install** kung lumabas. Kung wala, sa Chrome pindutin ang **⋮ → Install app** o **Add to Home screen**. Pagkatapos, subukan sa Airplane mode.

Gumagana lang ito kung sinusuportahan ng Android Chrome at graphics chip ng phone ang WebGPU. Ang POCO X6 Pro ay makatwirang subukan, pero kailangang ikumpirma sa mismong phone. Kapag hindi available ang WebGPU o kulang ang graphics memory, magpapakita ng error; puwede pa ring gumamit ng PocketPal bilang native-app na alternatibo.

## Buuin ang website sa PC

I-install ang kasalukuyang Node.js LTS mula sa https://nodejs.org/ kung wala pa. Sa VS Code, buksan ang folder na `mobile` at piliin ang **Terminal → New Terminal**. I-type:

```powershell
npm install
npm run build
```

Ang tapos na website ay nasa `dist` folder. I-upload ang laman ng `dist` sa static web host na nagbibigay ng HTTPS address, gaya ng GitHub Pages, Cloudflare Pages, o Netlify. Huwag ilagay sa `dist` ang model file; ida-download ito ng Kiyoma sa phone kapag pinili ng may-ari ang setup.

Para makita muna sa PC:

```powershell
npm run dev
```

Ang local preview ay para sa PC lang. Hindi ito permanenteng shortcut sa phone. Kailangan ng HTTPS hosting para ma-install bilang app at gumana ang WebGPU.

## Mga file

- `index.html` at `src/`: chat screen at local AI model integration.
- `public/manifest.webmanifest`: impormasyon para sa Android install.
- `public/sw.js`: nagse-save ng app shell para mabuksan offline.
- `package.json`: WebLLM at Vite build setup.

Nagse-save ang service worker ng website files. Iniimbak naman ng WebLLM ang model sa browser storage. Maaaring mabura ng user o ng phone kapag kapos na ang storage, kaya panatilihing bakante ang storage at i-download ulit kung kailangan.

Hiwalay ito sa lumang PC app na gumagamit ng Ollama. Ito ang mobile web version ni Kiyoma.
