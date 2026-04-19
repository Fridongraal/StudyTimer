import time
import threading

class StudyTimer:
    def __init__(self, study_minutes=25, rest_minutes=5, on_study_complete=None, on_state_change=None):
        self.study_duration = study_minutes * 60
        self.rest_duration = rest_minutes * 60

        self.time_left = self.study_duration
        self.phase = "idle"
        self.running = False
        self.on_study_complete = on_study_complete
        self.on_state_change = on_state_change

        self._thread = None
        self._lock = threading.Lock()

    def start(self):
        with self._lock:
            if self.running:
                return
            if self.phase == "idle":
                self.phase = "studying"
                self.time_left = self.study_duration
            self.running = True
        self._notify()
        self._thread = threading.Thread(target=self._countdown, daemon=True)
        self._thread.start()

    def pause(self):
        with self._lock:
            self.running = False
        self._notify()

    def resume(self):
        with self._lock:
            if not self.running and self.phase != "idle":
                self.running = True
        self._notify()
        self._thread = threading.Thread(target=self._countdown, daemon=True)
        self._thread.start()

    def reset(self):
        with self._lock:
            self.running = False
            self.phase = "idle"
            self.time_left = self.study_duration
        self._notify()

    def set_durations(self, study_minutes, rest_minutes):
        with self._lock:
            self.study_duration = study_minutes * 60
            self.rest_duration = rest_minutes * 60
            self.time_left = self.study_duration
            self.phase = "idle"
            self.running = False
        self._notify()

    def _notify(self):
        if self.on_state_change:
            self.on_state_change()

    def _countdown(self):
        while True:
            time.sleep(1)
            with self._lock:
                if not self.running:
                    break
                if self.time_left > 0:
                    self.time_left -= 1
                else:
                    self._switch_phase()
            self._notify()

    def get_state(self):
            with self._lock:
                return {
                    "phase": self.phase,
                    "time_left": self.time_left,
                    "running": self.running,
                    "study_duration": self.study_duration,
                    "rest_duration": self.rest_duration,
            }

    def _switch_phase(self):
        if self.phase == "studying":
            minutes = self.study_duration // 60
            if self.on_study_complete:
                self.on_study_complete(minutes)
            self.phase = "resting"
            self.time_left = self.rest_duration
        elif self.phase == "resting":
            self.phase = "studying"
            self.time_left = self.study_duration