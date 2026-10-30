import { CreateWebWorkerMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
import "./style.css";

const MODEL_CHOICES = [
  "Qwen3.5-2B-q4f16_1-MLC",
  "Qwen3-1.7B-q4f16_1-MLC",
  "Llama-3.2-1B-Instruct-q4f16_1-MLC"
];
const SYSTEM_PROMPT = `You are Kiyoma, a friendly and patient AI companion. Reply in the same language as the user; use natural Filipino/Tagalog when the user writes in Filipino. Explain beginner IT topics step by step. Be encouraging and practical. If you are unsure, say so. You run entirely on the user's phone and cannot access the internet.`;
const $ = (selector) => document.querySelector(selector);
const form = $("#chat-form");
const input = $("#prompt");
const sendButton = $("#send");
const loadButton = $("#load-model");
const welcome = $("#welcome");
const messagesEl = $("#messages");
const statusEl = $("#status");
const dot = $("#dot");
const progressTrack = $("#progress-track");
const progressBar = $("#progress-bar");
const connection = $("#connection");
const history = JSON.parse(localStorage.getItem("kiyoma-history") || "[]");
let engine;
let busy = false;
let installPrompt;

function setStatus(message, state = "") {
  statusEl.textContent = message;
  dot.className = `dot ${state}`;
}
function saveHistory() { localStorage.setItem("kiyoma-history", JSON.stringify(history.slice(-30))); }
function addMessage(role, content) {
  welcome.hidden = true;
  const row = document.createElement("article");
  row.className = `message ${role}`;
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = role === "user" ? "Y" : "K";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;
  row.append(badge, bubble);
  messagesEl.append(row);
  scrollToBottom();
  return bubble;
}
function scrollToBottom() { const area = $(".chat-area"); area.scrollTop = area.scrollHeight; }

for (const message of history) addMessage(message.role, message.content);

async function setupModel() {
  if (!navigator.gpu) {
    setStatus("Hindi makita ang WebGPU. I-update ang Chrome at subukan ulit.", "error");
    return;
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    setStatus("Hindi ma-access ang graphics hardware ng phone. Subukan ang updated na Chrome.", "error");
    return;
  }
  const available = prebuiltAppConfig.model_list.map((item) => item.model_id);
  const modelId = MODEL_CHOICES.find((id) => available.includes(id));
  if (!modelId) {
    setStatus("Hindi mahanap ang compatible na model. I-update ang app at subukan ulit.", "error");
    return;
  }
  loadButton.disabled = true;
  loadButton.textContent = "Inihahanda…";
  progressTrack.hidden = false;
  setStatus(navigator.onLine ? "Ikinokonekta para i-download ang AI model. Huwag munang isara ang app." : "Kumonekta sa Wi-Fi para sa unang download ng model.", "loading");
  try {
    await navigator.storage?.persist?.();
    const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    engine = await CreateWebWorkerMLCEngine(worker, modelId, {
      appConfig: { ...prebuiltAppConfig, cacheBackend: "indexeddb" },
      initProgressCallback: (report) => {
        setStatus(report.text || "Loading model…", "loading");
        const pct = Number(report.progress);
        if (Number.isFinite(pct)) progressBar.style.width = `${Math.max(0, Math.min(100, pct * 100))}%`;
      }
    });
    setStatus("Handa na si Kiyoma sa phone mo. Subukan ang airplane mode para tiyaking offline siya.", "ready");
    loadButton.hidden = true;
    input.disabled = false;
    input.placeholder = "Mensahe kay Kiyoma…";
    sendButton.disabled = false;
  } catch (error) {
    const message = String(error?.message || error);
    setStatus(message.includes("WebGPU") || message.includes("GPU")
      ? "Hindi masimulan ng browser ang AI graphics engine. I-update ang Chrome at subukan ulit."
      : "Hindi ma-load ang model. Tingnan ang Wi-Fi at bakanteng storage, saka subukan ulit.", "error");
    loadButton.disabled = false;
    loadButton.textContent = "Subukan ulit ang setup";
  }
}

async function sendMessage(text) {
  const content = text.trim();
  if (!content || busy || !engine) return;
  busy = true;
  input.value = "";
  input.style.height = "auto";
  history.push({ role: "user", content });
  addMessage("user", content);
  saveHistory();
  const replyBubble = addMessage("assistant", "Nag-iisip si Kiyoma…");
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history.slice(-16)];
  try {
    const stream = await engine.chat.completions.create({ messages, temperature: 0.7, max_tokens: 512, stream: true });
    let reply = "";
    for await (const chunk of stream) {
      const part = chunk.choices?.[0]?.delta?.content || "";
      if (typeof part === "string") reply += part;
      replyBubble.textContent = reply || "…";
      scrollToBottom();
    }
    history.push({ role: "assistant", content: reply || "I couldn’t make a reply that time. Please try again." });
    replyBubble.textContent = history.at(-1).content;
    saveHistory();
  } catch (error) {
    replyBubble.textContent = "Nagkaaberya sa pagsagot. Kung nahinto ang model, pindutin ang setup para i-load ulit.";
    setStatus("Nahinto ang model. Puwede mo itong i-load ulit.", "error");
    console.error(error);
  } finally {
    busy = false;
    input.focus();
  }
}

loadButton.addEventListener("click", setupModel);
form.addEventListener("submit", (event) => { event.preventDefault(); sendMessage(input.value); });
input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = `${Math.min(input.scrollHeight, 140)}px`; });
input.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
document.querySelectorAll(".suggestions button").forEach((button) => button.addEventListener("click", () => sendMessage(button.dataset.prompt)));
$("#clear-chat").addEventListener("click", () => { history.length = 0; saveHistory(); messagesEl.replaceChildren(); welcome.hidden = false; });
window.addEventListener("online", () => { connection.textContent = "May internet · nasa phone mo pa rin ang model"; });
window.addEventListener("offline", () => { connection.textContent = "Offline · sa phone mo tumatakbo ang usapan"; });
connection.textContent = navigator.onLine ? "May internet · nasa phone mo pa rin ang model" : "Offline · sa phone mo tumatakbo ang usapan";
window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); installPrompt = event; $("#install").hidden = false; });
$("#install").addEventListener("click", async () => { if (!installPrompt) return; await installPrompt.prompt(); installPrompt = null; $("#install").hidden = true; });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
