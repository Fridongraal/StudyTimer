PRESETS = {
    "pomodoro": {
        "name": "Pomodoro",
        "study": 25,
        "rest": 5,
    },
    "long": {
        "name": "Bloque largo",
        "study": 50,
        "rest": 10,
    },
    "short": {
        "name": "Sesión corta",
        "study": 15,
        "rest": 3,
    },
    "deep": {
        "name": "Deep work",
        "study": 90,
        "rest": 20,
    },
}

def get_preset(key: str) -> dict | None:
    return PRESETS.get(key)

def get_all_presets() -> dict:
    return PRESETS