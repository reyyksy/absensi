const db = require("./database");
const members = require("./members");

const insert = db.prepare(`
    INSERT INTO members
    (attendance_number, name, class_name)
    VALUES (?, ?, ?)
`);

const insertMany = db.transaction((members) => {
    for (const member of members) {
        insert.run(member[0], member[1], member[2]);
    }
});

insertMany(members);

console.log(`${members.length} anggota berhasil dimasukkan.`);