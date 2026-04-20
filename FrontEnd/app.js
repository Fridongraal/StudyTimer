const API = "http://localhost:5000";

// Referencias al DOM
const timerDisplay  = document.getElementById("timer-display");
const phaseBadge    = document.getElementById("phase-badge");
const btnStart      = document.getElementById("btn-start");
const btnPause      = document.getElementById("btn-pause");
const btnReset      = document.getElementById("btn-reset");
const btnSet        = document.getElementById("btn-set");
const inputStudy    = document.getElementById("input-study");
const inputRest     = document.getElementById("input-rest");
const presetsContainer = document.getElementById("presets-container");
const sessionCount  = document.getElementById("session-count");
const btnTheme = document.getElementById("btn-theme");

// Emojis y textos por fase
const PHASE_CONFIG = {
  idle:     { label: "Listo",     emoji: "🐶", class: ""         },
  studying: { label: "Estudiando",emoji: "📚", class: "studying" },
  resting:  { label: "Descansando",emoji: "🛋️", class: "resting" },
};

const PRESET_EMOJIS = {
  pomodoro: "🍅",
  long:     "🐕",
  short:    "🐾",
  deep:     "🧠",
};

// ── Helpers ──────────────────────────────────────────────

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

async function poll() {
  const state = await apiFetch("/state");
  updateUI(state);
}

async function apiFetch(path, method = "GET") {
  const res = await fetch(`${API}${path}`, { method });
  return res.json();
}

async function apiPost(path, body = null) {
  const options = { method: "POST" };
  if (body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API}${path}`, options);
  return res.json();
}

// ── Actualizar UI ─────────────────────────────────────────

let lastPhase = "idle";

function updateUI(state) {
  const cfg = PHASE_CONFIG[state.phase] || PHASE_CONFIG.idle;

// Detectar cambio de fase y sonar
  if (state.phase !== lastPhase && state.phase !== "idle") {
    playSound(state.phase);
  }

  // Contar sesiones completadas
  if (lastPhase === "studying" && state.phase === "resting") {
    const current = parseInt(sessionCount.textContent);
    sessionCount.textContent = current + 1;
  }

  lastPhase = state.phase;

  // Timer
  timerDisplay.textContent = formatTime(state.time_left);
  timerDisplay.className = `timer-display ${cfg.class}`;

  // Badge
  phaseBadge.textContent = `${cfg.emoji} ${cfg.label}`;
  phaseBadge.className = `phase-badge ${cfg.class}`;

  // Botones
  btnStart.disabled  = state.running || state.phase !== "idle";
  btnPause.disabled  = !state.running;
  btnPause.textContent = state.running ? "Pausar" : "Reanudar";
  btnReset.disabled  = state.phase === "idle";

  // Inputs
  inputStudy.value = Math.round(state.study_duration / 60);
  inputRest.value  = Math.round(state.rest_duration / 60);
}

// ── Cargar presets ────────────────────────────────────────

async function loadPresets() {
  const presets = await apiFetch("/presets");
  presetsContainer.innerHTML = "";

  for (const [key, preset] of Object.entries(presets)) {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.dataset.key = key;
    btn.innerHTML = `
      <span class="preset-emoji">${PRESET_EMOJIS[key] || "⏱️"}</span>
      <span class="preset-name">${preset.name}</span>
      <span class="preset-times">${preset.study}min / ${preset.rest}min</span>
    `;
    btn.addEventListener("click", () => applyPreset(key));
    presetsContainer.appendChild(btn);
  }
}

async function applyPreset(key) {
  // Marcar activo visualmente
  document.querySelectorAll(".preset-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.key === key);
  });
  const state = await apiPost(`/presets/${key}`);
  updateUI(state);
}

// ── Eventos de botones ────────────────────────────────────

btnStart.addEventListener("click", async () => {
  const state = await apiPost("/start");
  updateUI(state);
});

btnPause.addEventListener("click", async () => {
  const action = btnPause.textContent.trim() === "Pausar" ? "/pause" : "/resume";
  const state = await apiPost(action);
  updateUI(state);
});

btnReset.addEventListener("click", async () => {
  document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
  const state = await apiPost("/reset");
  updateUI(state);
});

btnSet.addEventListener("click", async () => {
  const study = parseInt(inputStudy.value);
  const rest  = parseInt(inputRest.value);
  if (!study || !rest || study < 1 || rest < 1) return;
  document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
  const state = await apiPost("/set", { study, rest });
  updateUI(state);
});

// ── WebSocket ─────────────────────────────────────────────

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("🐾 Conectado al servidor");
});

socket.on("state", (state) => {
  updateUI(state);
});

socket.on("session_complete", () => {
  renderCalendar();
});

socket.on("disconnect", () => {
  console.log("Desconectado del servidor");
});

// ── Init ──────────────────────────────────────────────────

async function init() {
  await loadPresets();
  await poll();
  await renderCalendar();
  renderTodos();
}

// ── Sonidos ───────────────────────────────────────────────

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  const notes = type === "studying"
    ? [523, 659, 784]   // Do Mi Sol — alerta suave
    : [784, 659, 523];  // Sol Mi Do — relajante

  notes.forEach((freq, i) => {
    const osc     = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.type      = "sine";
    osc.frequency.value = freq;

    const start = audioCtx.currentTime + i * 0.18;
    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(0.3, start + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, start + 0.25);

    osc.start(start);
    osc.stop(start + 0.3);
  });
}

// ── Modo oscuro ───────────────────────────────────────────

btnTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  btnTheme.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

// Recordar preferencia
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  btnTheme.textContent = "☀️";
}

// ── Calendario ───────────────────────────────────────────

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                   "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES   = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];

let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth() + 1;

function getColor(minutes) {
  if (!minutes || minutes === 0) return { bg: "#f0e6fa", text: "#c4a8d8" };
  if (minutes < 30)  return { bg: "#d4a0f0", text: "#7a4a9a" };
  if (minutes < 60)  return { bg: "#b07cc6", text: "#ffffff" };
  if (minutes < 120) return { bg: "#8a50a8", text: "#ffffff" };
  return { bg: "#7a4a9a", text: "#ffffff" };
}

async function renderCalendar() {
  const grid       = document.getElementById("calendar-grid");
  const monthLabel = document.getElementById("month-label");

  monthLabel.textContent = `${MONTHS_ES[calMonth - 1]} ${calYear}`;

  const history = await apiFetch(`/history?year=${calYear}&month=${calMonth}`);

  const today    = new Date();
  const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();

  // Lunes primero (0=lunes ... 6=domingo)
  const startOffset = (firstDay + 6) % 7;

  grid.innerHTML = "";

  // Cabecera días
  DAYS_ES.forEach(d => {
    const el = document.createElement("div");
    el.className = "calendar-day-name";
    el.textContent = d;
    grid.appendChild(el);
  });

  // Celdas vacías iniciales
  for (let i = 0; i < startOffset; i++) {
    const el = document.createElement("div");
    el.className = "calendar-day empty";
    grid.appendChild(el);
  }

  // Días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calYear}-${String(calMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const minutes = history[dateStr] || 0;
    const { bg, text } = getColor(minutes);

    const el = document.createElement("div");
    el.className = "calendar-day";
    el.style.background = bg;

    const isToday = today.getFullYear() === calYear
                 && today.getMonth() + 1 === calMonth
                 && today.getDate() === day;
    if (isToday) el.classList.add("today");

    const hours = minutes > 0
      ? (minutes >= 60
          ? `${Math.floor(minutes/60)}h${minutes%60 > 0 ? (minutes%60)+"m" : ""}`
          : `${minutes}m`)
      : "";

    el.innerHTML = `
      <span class="day-number" style="color:${text}">${day}</span>
      ${hours ? `<span class="day-hours" style="color:${text}">${hours}</span>` : ""}
    `;

    grid.appendChild(el);
  }
}

document.getElementById("btn-prev").addEventListener("click", () => {
  calMonth--;
  if (calMonth < 1) { calMonth = 12; calYear--; }
  renderCalendar();
});

document.getElementById("btn-next").addEventListener("click", () => {
  calMonth++;
  if (calMonth > 12) { calMonth = 1; calYear++; }
  renderCalendar();
});

// ── To-do list ───────────────────────────────────────────

let todos = JSON.parse(localStorage.getItem("todos") || "[]");

const todoInput     = document.getElementById("todo-input");
const todoList      = document.getElementById("todo-list");
const btnAddTodo    = document.getElementById("btn-add-todo");
const todoRemaining = document.getElementById("todo-remaining");
const btnClearDone  = document.getElementById("btn-clear-done");

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function renderTodos() {
  todoList.innerHTML = "";

  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.className = `todo-item${todo.done ? " done" : ""}`;

    const checkbox = document.createElement("div");
    checkbox.className = `todo-checkbox${todo.done ? " checked" : ""}`;
    checkbox.textContent = todo.done ? "✓" : "";
    checkbox.addEventListener("click", () => toggleTodo(index));

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const del = document.createElement("button");
    del.className = "todo-delete";
    del.textContent = "✕";
    del.addEventListener("click", () => deleteTodo(index));

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(del);
    todoList.appendChild(li);
  });

  const pending = todos.filter(t => !t.done).length;
  todoRemaining.textContent = pending === 0
    ? todos.length === 0 ? "" : "🐾 Todo listo!"
    : `${pending} tarea${pending !== 1 ? "s" : ""} pendiente${pending !== 1 ? "s" : ""}`;
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  todos.unshift({ text, done: false });
  saveTodos();
  renderTodos();
  todoInput.value = "";
  todoInput.focus();
}

function toggleTodo(index) {
  todos[index].done = !todos[index].done;
  saveTodos();
  renderTodos();
}

function deleteTodo(index) {
  todos.splice(index, 1);
  saveTodos();
  renderTodos();
}

btnAddTodo.addEventListener("click", addTodo);
btnClearDone.addEventListener("click", () => {
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
});

todoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

document.addEventListener("DOMContentLoaded", init);