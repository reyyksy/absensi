const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const db = require("./database");
const exportAttendance = require("./export");
const membersFile = path.join(__dirname, "members.js");

const app = express();
const PORT = 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// Session middleware
app.use(
    session({
        secret: "absensi-secret-key-2026",
        resave: false,
        saveUninitialized: false,
        cookie: { 
            httpOnly: true,
            secure: false, // Localhost, not using HTTPS
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    })
);

// Admin authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session && req.session.authenticated) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }
}

function getTime() {
    return new Date().toLocaleString("sv-SE", {
        timeZone: "Asia/Jakarta"
    });
}

function syncMembersFromFile() {
    delete require.cache[require.resolve("./members")];
    const roster = require("./members");
    const attendanceNumbers = new Set();

    for (const member of roster) {
        const [attendanceNumber, name, className] = member;

        if (!Number.isInteger(attendanceNumber) || !name || !className || attendanceNumbers.has(attendanceNumber)) {
            throw new Error("Format members.js tidak valid atau nomor absen ganda");
        }

        attendanceNumbers.add(attendanceNumber);
    }

    const sync = db.transaction(() => {
        const upsert = db.prepare(`
            INSERT INTO members (attendance_number, name, class_name, active)
            VALUES (?, ?, ?, 1)
            ON CONFLICT(attendance_number)
            DO UPDATE SET
                name = excluded.name,
                class_name = excluded.class_name,
                active = 1
        `);

        for (const [attendanceNumber, name, className] of roster) {
            upsert.run(attendanceNumber, name, className);
        }

        if (attendanceNumbers.size === 0) {
            db.prepare("UPDATE members SET active = 0").run();
        } else {
            const placeholders = [...attendanceNumbers].map(() => "?").join(", ");
            db.prepare(`
                UPDATE members
                SET active = 0
                WHERE attendance_number NOT IN (${placeholders})
            `).run(...attendanceNumbers);
        }
    });

    sync();
    console.log(`${roster.length} anggota disinkronkan dari members.js.`);
}

syncMembersFromFile();

let membersSyncTimer;
const membersWatcher = fs.watch(membersFile, () => {
    clearTimeout(membersSyncTimer);
    membersSyncTimer = setTimeout(() => {
        try {
            syncMembersFromFile();
        } catch (error) {
            console.error(`Gagal menyinkronkan members.js: ${error.message}`);
        }
    }, 300);
});

const meeting = db.prepare(`
    INSERT INTO meetings (started_at, status)
    VALUES (?, 'active')
`).run(getTime());

const meetingId = meeting.lastInsertRowid;

console.log(`Pertemuan ${meetingId} dimulai.`);

// Admin login
app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;

    if (password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        res.json({
            success: true,
            message: "Login berhasil"
        });
    } else {
        res.status(401).json({
            success: false,
            message: "Password salah"
        });
    }
});

// Admin logout
app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Logout gagal"
            });
        }
        res.json({
            success: true,
            message: "Logout berhasil"
        });
    });
});

// Admin session check
app.get("/api/admin/session", (req, res) => {
    if (req.session && req.session.authenticated) {
        res.json({
            authenticated: true
        });
    } else {
        res.status(401).json({
            authenticated: false
        });
    }
});

// Daftar anggota
app.get("/api/members", (req, res) => {
    const members = db.prepare(`
        SELECT id, name, attendance_number, class_name
        FROM members
        WHERE active = 1
        ORDER BY attendance_number
    `).all();

    res.json(members);
});

// User absen
app.post("/api/attendance", (req, res) => {
    const { member_id } = req.body;

    const member = db.prepare(`
        SELECT id, name, attendance_number
        FROM members
        WHERE id = ? AND active = 1
    `).get(member_id);

    if (!member) {
        return res.status(404).json({
            success: false,
            message: "Anggota tidak ditemukan"
        });
    }

    try {
        db.prepare(`
            INSERT INTO attendance
            (meeting_id, member_id, status, timestamp)
            VALUES (?, ?, 'hadir', ?)
        `).run(meetingId, member.id, getTime());

        res.json({
            success: true,
            message: "Absensi berhasil",
            member
        });

    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).json({
                success: false,
                message: "Sudah absen"
            });
        }

        res.status(500).json({
            success: false,
            message: "Gagal menyimpan absensi"
        });
    }
});

// Admin lihat absensi
app.get("/api/admin/attendance", isAuthenticated, (req, res) => {
    const rows = db.prepare(`
        SELECT
            m.attendance_number,
            m.name,
            m.class_name,
            COALESCE(a.status, 'belum_absen') AS status,
            a.timestamp
        FROM members m
        LEFT JOIN attendance a
            ON a.member_id = m.id
            AND a.meeting_id = ?
        WHERE m.active = 1
        ORDER BY m.attendance_number
    `).all(meetingId);

    res.json(rows);
});

// Admin ubah status
app.put("/api/admin/attendance/:memberId", isAuthenticated, (req, res) => {
    const { memberId } = req.params;
    const { status } = req.body;

    const allowed = ["hadir", "izin", "sakit", "tanpa_keterangan"];

    if (!allowed.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status tidak valid"
        });
    }

    db.prepare(`
        INSERT INTO attendance
        (meeting_id, member_id, status, timestamp)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(meeting_id, member_id)
        DO UPDATE SET
            status = excluded.status,
            timestamp = excluded.timestamp
    `).run(
        meetingId,
        memberId,
        status,
        status === "hadir" ? getTime() : null
    );

    res.json({
        success: true,
        message: "Status diperbarui"
    });
});

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Web server: http://localhost:${PORT}`);
});

// Ctrl+C
process.on("SIGINT", async () => {
    console.log("\nMengakhiri pertemuan...");

    try {
        membersWatcher.close();
        clearTimeout(membersSyncTimer);

        db.prepare(`
            INSERT OR IGNORE INTO attendance
            (meeting_id, member_id, status, timestamp)
            SELECT ?, id, 'belum_absen', NULL
            FROM members
            WHERE active = 1
        `).run(meetingId);

        db.prepare(`
            UPDATE attendance
            SET status = 'tanpa_keterangan'
            WHERE meeting_id = ?
            AND status = 'belum_absen'
        `).run(meetingId);

        db.prepare(`
            UPDATE meetings
            SET ended_at = ?, status = 'closed'
            WHERE id = ?
        `).run(getTime(), meetingId);

        await exportAttendance(db, meetingId);

        server.close(() => {
            db.close();
            console.log("Server berhenti.");
            process.exit(0);
        });

    } catch (error) {
        console.error(error);
        db.close();
        process.exit(1);
    }
});