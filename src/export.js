const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

async function exportAttendance(db, meetingId) {
    const exportDir = path.join(__dirname, "..", "data", "exports");

    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    const rows = db.prepare(`
        SELECT
            m.attendance_number,
            m.name,
            m.class_name,
            a.timestamp,
            a.status
        FROM members m
        LEFT JOIN attendance a
            ON a.member_id = m.id
            AND a.meeting_id = ?
        WHERE m.active = 1
        ORDER BY m.attendance_number
    `).all(meetingId);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Absensi");

    sheet.columns = [
        { header: "No Absen", key: "attendance_number", width: 12 },
        { header: "Nama", key: "name", width: 30 },
        { header: "Kelas", key: "class_name", width: 18 },
        { header: "Jam", key: "timestamp", width: 20 },
        { header: "Status", key: "status", width: 20 }
    ];

    for (const row of rows) {
        sheet.addRow({
            attendance_number: row.attendance_number,
            name: row.name,
            class_name: row.class_name,
            timestamp: row.timestamp || "-",
            status: row.status === "belum_absen"
                ? "Tanpa Keterangan"
                : row.status
        });
    }

    const date = new Date()
        .toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

    const filename = `absensi_${date}_${String(meetingId).padStart(3, "0")}.xlsx`;
    const filepath = path.join(exportDir, filename);

    await workbook.xlsx.writeFile(filepath);

    console.log(`Excel dibuat: ${filepath}`);
}

module.exports = exportAttendance;