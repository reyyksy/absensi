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

    // -------------------------------------------------------
    // Setup Workbook & Worksheet
    // -------------------------------------------------------
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Absensi");

    // -------------------------------------------------------
    // Column Widths (A–E)
    // -------------------------------------------------------
    sheet.columns = [
        { key: "no",        width: 6  },  // A
        { key: "nama",      width: 30 },  // B
        { key: "kelas",     width: 18 },  // C
        { key: "jam",       width: 20 },  // D
        { key: "status",    width: 18 },  // E
    ];

    // -------------------------------------------------------
    // Helper: thin border on all sides
    // -------------------------------------------------------
    const thinBorder = {
        top:    { style: "thin" },
        bottom: { style: "thin" },
        left:   { style: "thin" },
        right:  { style: "thin" },
    };

    // -------------------------------------------------------
    // Helper: apply thin border to a range of cells in a row
    // -------------------------------------------------------
    function applyBorderToRow(rowNumber, fromCol, toCol) {
        for (let col = fromCol; col <= toCol; col++) {
            sheet.getCell(rowNumber, col).border = thinBorder;
        }
    }

    // -------------------------------------------------------
    // ROW 1 — Judul "ABSENSI PRODI TJKT"
    // -------------------------------------------------------
    sheet.mergeCells("A1:E1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "ABSENSI PRODI TJKT";
    titleCell.font = { name: "Calibri", size: 13, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    // -------------------------------------------------------
    // ROW 2 — Tanggal pertemuan (format: "14 SEPTEMBER 2026")
    // -------------------------------------------------------
    sheet.mergeCells("A2:E2");
    const dateCell = sheet.getCell("A2");
    const dateStr = new Date()
        .toLocaleDateString("id-ID", {
            timeZone: "Asia/Jakarta",
            day:      "numeric",
            month:    "long",
            year:     "numeric",
        })
        .toUpperCase();
    dateCell.value = dateStr;
    dateCell.font = { name: "Calibri", size: 13, bold: true };
    dateCell.alignment = { horizontal: "center", vertical: "middle" };

    // -------------------------------------------------------
    // ROW 3 — Kosong (spacing)
    // -------------------------------------------------------
    // (dibiarkan kosong, tidak ada aksi)

    // -------------------------------------------------------
    // ROW 4 — Header Tabel
    // -------------------------------------------------------
    const HEADER_ROW = 4;
    const headers = ["NO", "NAMA", "KELAS", "JAM", "STATUS"];
    headers.forEach((text, i) => {
        const cell = sheet.getCell(HEADER_ROW, i + 1);
        cell.value = text;
        cell.font      = { name: "Calibri", size: 12, bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border    = thinBorder;
    });

    // -------------------------------------------------------
    // ROW 5+ — Isi Data
    // -------------------------------------------------------
    let currentRow = 5;
    for (const row of rows) {
        const statusValue = (row.status === "belum_absen" || !row.status)
            ? "Tanpa Keterangan"
            : row.status;

        const cells = [
            { col: 1, value: row.attendance_number, align: { horizontal: "center", vertical: "middle" } },
            { col: 2, value: row.name,               align: { horizontal: "left",   vertical: "middle" } },
            { col: 3, value: row.class_name,          align: { horizontal: "left",   vertical: "middle" } },
            { col: 4, value: row.timestamp || "-",    align: { horizontal: "center", vertical: "middle" } },
            { col: 5, value: statusValue,             align: { horizontal: "left",   vertical: "middle" } },
        ];

        for (const { col, value, align } of cells) {
            const cell = sheet.getCell(currentRow, col);
            cell.value     = value;
            cell.font      = { name: "Calibri", size: 11, bold: false };
            cell.alignment = align;
            cell.border    = thinBorder;
        }

        currentRow++;
    }

    // -------------------------------------------------------
    // Simpan File
    // -------------------------------------------------------
    const date = new Date()
        .toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

    const filename = `absensi_${date}_${String(meetingId).padStart(3, "0")}.xlsx`;
    const filepath = path.join(exportDir, filename);

    await workbook.xlsx.writeFile(filepath);

    console.log(`Excel dibuat: ${filepath}`);
}

module.exports = exportAttendance;