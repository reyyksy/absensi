const express = require("express");
const path = require("path");

const app = express();
const PORT = 80;

app.use(express.static(path.join(__dirname, "..", "public")));

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Web server: http://localhost:${PORT}`);
});