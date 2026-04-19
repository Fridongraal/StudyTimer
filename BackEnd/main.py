from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
from timer import StudyTimer
from presets import get_preset, get_all_presets
from database import init_db, save_session, get_monthly_summary
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
import os

app = Flask(__name__)
app.config["SECRET_KEY"] = "studytimer"
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

def on_state_change():
    socketio.emit("state", timer.get_state())

def on_study_complete(minutes):
    save_session(minutes)
    socketio.emit("session_complete", {"minutes": minutes})

init_db()
timer = StudyTimer(
    on_study_complete=on_study_complete,
    on_state_change=on_state_change
)

@app.route("/state", methods=["GET"])
def state():
    return jsonify(timer.get_state())

@app.route("/start", methods=["POST"])
def start():
    timer.start()
    return jsonify(timer.get_state())

@app.route("/pause", methods=["POST"])
def pause():
    timer.pause()
    return jsonify(timer.get_state())

@app.route("/resume", methods=["POST"])
def resume():
    timer.resume()
    return jsonify(timer.get_state())

@app.route("/reset", methods=["POST"])
def reset():
    timer.reset()
    return jsonify(timer.get_state())

@app.route("/set", methods=["POST"])
def set_durations():
    data = request.get_json()
    study = data.get("study")
    rest = data.get("rest")
    if not study or not rest:
        return jsonify({"error": "Faltan parámetros"}), 400
    timer.set_durations(int(study), int(rest))
    return jsonify(timer.get_state())

@app.route("/presets", methods=["GET"])
def presets():
    return jsonify(get_all_presets())

@app.route("/presets/<key>", methods=["POST"])
def apply_preset(key):
    preset = get_preset(key)
    if not preset:
        return jsonify({"error": "Preset no encontrado"}), 404
    timer.set_durations(preset["study"], preset["rest"])
    return jsonify(timer.get_state())

@app.route("/history", methods=["GET"])
def history():
    now = datetime.now()
    year  = request.args.get("year",  default=now.year,  type=int)
    month = request.args.get("month", default=now.month, type=int)
    data  = get_monthly_summary(year, month)
    return jsonify(data)

@app.route("/")
def index():
    frontend_path = os.path.join(os.path.dirname(__file__), "../frontend")
    return send_from_directory(frontend_path, "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    frontend_path = os.path.join(os.path.dirname(__file__), "../frontend")
    return send_from_directory(frontend_path, filename)

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5000)