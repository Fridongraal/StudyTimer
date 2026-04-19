# 🐾 Study Timer

Un timer de estudio con estética de perritos y colores pasteles, construido con Python + Flask en el backend y HTML/CSS/JS en el frontend.

## ✨ Features

- ⏱️ **Timer configurable** — establecé tu propio tiempo de estudio y descanso
- 🎯 **Presets incluidos** — Pomodoro (25/5), Bloque largo (50/10), Sesión corta (15/3) y Deep work (90/20)
- 🔄 **Cambio automático de fase** — el timer alterna entre estudio y descanso solo
- 🔔 **Sonido de notificación** — acorde suave al cambiar de fase
- 🐾 **Contador de sesiones** — lleva la cuenta de cuántos pomodoros completaste
- 📅 **Calendario mensual** — visualizá cuántas horas estudiaste por día, estilo GitHub contributions
- 🌙 **Modo oscuro** — con un click, recuerda tu preferencia
- ⚡ **WebSockets** — el servidor avisa los cambios en tiempo real, sin polling

## 🛠️ Tecnologías

| Capa          | Tecnología                    |
| ------------- | ----------------------------- |
| Backend       | Python, Flask, Flask-SocketIO |
| Base de datos | SQLite                        |
| Frontend      | HTML, CSS, JavaScript         |
| Comunicación  | WebSockets (Socket.IO)        |

## 📁 Estructura del proyecto

```
StudyTimer/
├── backend/
│   ├── timer.py        # Lógica del countdown y estados
│   ├── presets.py      # Configuraciones predefinidas
│   ├── database.py     # Manejo de SQLite
│   └── main.py         # Servidor Flask + API
└── frontend/
    ├── index.html      # Estructura de la UI
    ├── app.js          # Comunicación con el backend
    └── style.css       # Estilos visuales
```

## 🚀 Instalación

**1. Cloná el repositorio**

```bash
git clone https://github.com/Fridongraal/StudyTimer.git
cd StudyTimer
```

**2. Instalá las dependencias**

```bash
pip install flask flask-cors flask-socketio
```

**3. Iniciá el servidor**

```bash
cd backend
python main.py
```

**4. Abrí el browser en**

```
http://localhost:5000
```

## 🎮 Uso

1. Elegí un **preset** o configurá tu propio tiempo de estudio y descanso
2. Presioná **Iniciar** para arrancar
3. El timer cambia automáticamente entre fases y reproduce un sonido al hacerlo
4. Cada sesión de estudio completada suma al **contador** y al **calendario**
5. Usá el botón 🌙 para alternar entre modo claro y oscuro

## 🐶 Presets disponibles

| Preset          | Estudio | Descanso |
| --------------- | ------- | -------- |
| 🍅 Pomodoro     | 25 min  | 5 min    |
| 🐕 Bloque largo | 50 min  | 10 min   |
| 🐾 Sesión corta | 15 min  | 3 min    |
| 🧠 Deep work    | 90 min  | 20 min   |
