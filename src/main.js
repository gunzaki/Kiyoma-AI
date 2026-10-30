import "./style.css";

const MODEL_CHOICES = [
  "Qwen3.5-0.8B-q4f16_1-MLC",
  "Qwen3.5-2B-q4f16_1-MLC",
  "Llama-3.2-1B-Instruct-q4f16_1-MLC"
];
const SYSTEM_PROMPT = `You are Kiyoma, Aki's warm, friendly AI companion. Call the user Aki naturally, but not in every reply. Speak fluent, natural English by default; use another language when Aki writes in it or asks you to. Answer directly and keep ordinary replies concise. Explain beginner IT topics clearly, step by step. Never reveal hidden reasoning, analysis, or thought tokens, and never output <think> tags. If you are unsure, say so. You run locally on Aki's phone and cannot access the internet.`;
const $ = (selector) => document.querySelector(selector);
const form = $("#chat-form");
const input = $("#prompt");
const sendButton = $("#send");
const loadButton = $("#load-model");
const modelSelect = $("#model-select");
const welcome = $("#welcome");
const messagesEl = $("#messages");
const statusEl = $("#status");
const dot = $("#dot");
const progressTrack = $("#progress-track");
const progressBar = $("#progress-bar");
const connection = $("#connection");
let history = [];
try {
  const stored = JSON.parse(localStorage.getItem("kiyoma-history") || "[]");
  if (Array.isArray(stored)) history = stored.filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string");
} catch { localStorage.removeItem("kiyoma-history"); }
let engine;
let busy = false;
let installPrompt;

function hideThinking(text) {
  let visible = "";
  let cursor = 0;
  while (cursor < text.length) {
    const start = text.toLowerCase().indexOf("<think>", cursor);
    if (start < 0) { visible += text.slice(cursor); break; }
    visible += text.slice(cursor, start);
    const end = text.toLowerCase().indexOf("</think>", start + 7);
    if (end < 0) break;
    cursor = end + 8;
  }
  return visible.replace(/<\/?think>/gi, "").trim();
}

function setStatus(message, state = "") {
  statusEl.textContent = message;
  dot.className = `dot ${state}`;
}
function saveHistory() {
  try { localStorage.setItem("kiyoma-history", JSON.stringify(history.slice(-30))); } catch { /* Chat still works if storage is full. */ }
}
function addMessage(role, content) {
  welcome.hidden = true;
  const row = document.createElement("article");
  row.className = `message ${role}`;
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = role === "user" ? "A" : "K";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;
  row.append(badge, bubble);
  messagesEl.append(row);
  scrollToBottom();
  return bubble;
}
function scrollToBottom() {
  const area = $(".chat-area");
  area.scrollTop = area.scrollHeight;
}

// Remove any internal-thought text saved by the older version before drawing history.
history = history.map((item) => item.role === "assistant" ? { ...item, content: hideThinking(item.content) } : item).filter((item) => item.content);
saveHistory();
for (const message of history) addMessage(message.role, message.content);
const savedModel = localStorage.getItem("kiyoma-model");
if (MODEL_CHOICES.includes(savedModel)) modelSelect.value = savedModel;

async function setupModel() {
  if (!navigator.gpu) {
    setStatus("WebGPU isn’t available in this browser. Update Chrome and try again.", "error");
    return;
  }
  loadButton.disabled = true;
  modelSelect.disabled = true;
  loadButton.textContent = "Preparing Kiyoma…";
  progressTrack.hidden = false;
  setStatus(navigator.onLine ? "Loading Kiyoma. Keep this page open; first setup downloads the model." : "Trying to load the model saved on this phone…", "loading");
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("GPU unavailable");
    setStatus("Starting the on-device AI engine…", "loading");
    const { CreateWebWorkerMLCEngine, prebuiltAppConfig } = await import("@mlc-ai/web-llm");
    const available = prebuiltAppConfig.model_list.map((item) => item.model_id);
    const modelId = MODEL_CHOICES.find((id) => id === modelSelect.value && available.includes(id))
      || MODEL_CHOICES.find((id) => available.includes(id));
    if (!modelId) throw new Error("No compatible model found");
    localStorage.setItem("kiyoma-model", modelId);
    await navigator.storage?.persist?.();
    const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    engine = await CreateWebWorkerMLCEngine(worker, modelId, {
      appConfig: { ...prebuiltAppConfig, cacheBackend: "indexeddb" },
      initProgressCallback: (report) => {
        setStatus(report.text || "Loading the on-device model…", "loading");
        const pct = Number(report.progress);
        if (Number.isFinite(pct)) progressBar.style.width = `${Math.max(0, Math.min(100, pct * 100))}%`;
      }
    });
    setStatus("Kiyoma is ready. Replies now run on your phone.", "ready");
    loadButton.hidden = true;
    modelSelect.disabled = true;
    input.disabled = false;
    input.placeholder = "Message Kiyoma…";
    sendButton.disabled = false;
  } catch (error) {
    const message = String(error?.message || error);
    setStatus(message.includes("GPU") || message.includes("WebGPU")
      ? "This browser couldn’t start the phone’s AI graphics engine. Update Chrome and try again."
      : "Couldn’t load the model. Check Wi-Fi and free storage, then try again.", "error");
    loadButton.disabled = false;
    modelSelect.disabled = false;
    loadButton.textContent = "Try setup again";
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
  const replyBubble = addMessage("assistant", "Kiyoma is replying…");
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history.slice(-8)];
  try {
    const stream = await engine.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 256,
      stream: true,
      extra_body: { enable_thinking: false }
    });
    let rawReply = "";
    for await (const chunk of stream) {
      const part = chunk.choices?.[0]?.delta?.content || "";
      if (typeof part === "string") rawReply += part;
      const visible = hideThinking(rawReply);
      replyBubble.textContent = visible || "Kiyoma is replying…";
      scrollToBottom();
    }
    const reply = hideThinking(rawReply);
    const finalReply = reply || "I couldn’t make a useful reply that time. Try asking in a shorter way.";
    replyBubble.textContent = finalReply;
    history.push({ role: "assistant", content: finalReply });
    saveHistory();
  } catch (error) {
    replyBubble.textContent = "Kiyoma ran into a problem while replying. Try again, or reload her model.";
    setStatus("The local model paused. You can reload it and try again.", "error");
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
$("#clear-chat").addEventListener("click", () => { history = []; saveHistory(); messagesEl.replaceChildren(); welcome.hidden = false; });
window.addEventListener("online", () => { connection.textContent = "Online · model stays on your phone"; });
window.addEventListener("offline", () => { connection.textContent = "Offline · chats run on your phone"; });
connection.textContent = navigator.onLine ? "Online · model stays on your phone" : "Offline · chats run on your phone";
window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); installPrompt = event; $("#install").hidden = false; });
$("#install").addEventListener("click", async () => { if (!installPrompt) return; await installPrompt.prompt(); installPrompt = null; $("#install").hidden = true; });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
