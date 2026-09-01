const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "database.sqlite");

const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        attendance_number INTEGER NOT NULL UNIQUE,
        class_name TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'belum_absen',
        timestamp TEXT,
        FOREIGN KEY (meeting_id) REFERENCES meetings(id),
        FOREIGN KEY (member_id) REFERENCES members(id),
        UNIQUE(meeting_id, member_id)
    );
`);

module.exports = db;