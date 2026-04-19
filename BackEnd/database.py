import sqlite3
import os
from datetime import date

DB_PATH = os.path.join(os.path.dirname(__file__), "sessions.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            date      TEXT NOT NULL,
            minutes   INTEGER NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def save_session(minutes: int):
    conn = get_connection()
    conn.execute(
        "INSERT INTO sessions (date, minutes) VALUES (?, ?)",
        (date.today().isoformat(), minutes)
    )
    conn.commit()
    conn.close()

def get_monthly_summary(year: int, month: int) -> dict:
    conn = get_connection()
    rows = conn.execute("""
        SELECT date, SUM(minutes) as total_minutes
        FROM sessions
        WHERE strftime('%Y', date) = ?
          AND strftime('%m', date) = ?
        GROUP BY date
    """, (str(year), str(month).zfill(2))).fetchall()
    conn.close()
    return {row["date"]: row["total_minutes"] for row in rows}