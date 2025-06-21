const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const app = express();
const db = new sqlite3.Database("tickets.db");

app.use(cors());
app.use(express.json());

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  department TEXT,
  issue TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// API to receive ticket
app.post("/api/tickets", (req, res) => {
  const { name, department, issue } = req.body;
  db.run(`INSERT INTO tickets (name, department, issue) VALUES (?, ?, ?)`,
    [name, department, issue],
    (err) => {
      if (err) return res.status(500).send("DB error");
      res.status(200).send("Ticket received");
    }
  );
});

// Admin-only CSV export
app.get("/api/export", (req, res) => {
  if (req.query.password !== "admin123") return res.status(403).send("Forbidden");

  const filePath = path.join(__dirname, "tickets.csv");
  const stream = fs.createWriteStream(filePath);
  stream.write("ID,Name,Department,Issue,CreatedAt\n");

  db.all("SELECT * FROM tickets", [], (err, rows) => {
    if (err) return res.status(500).send("Export error");
    rows.forEach(row => {
      stream.write(`${row.id},"${row.name}","${row.department}","${row.issue}","${row.createdAt}"\n`);
    });
    stream.end(() => res.download(filePath));
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
