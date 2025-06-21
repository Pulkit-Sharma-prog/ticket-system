const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database
const db = new sqlite3.Database("./tickets.db", (err) => {
  if (err) {
    console.error("Error connecting to SQLite:", err.message);
  } else {
    console.log("Connected to SQLite DB ✅");
  }
});

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    message TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API routes
app.post("/api/tickets", (req, res) => {
  const { name = "", email = "", message = "" } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  db.run(
    `INSERT INTO tickets (name, email, message) VALUES (?, ?, ?)`,
    [name, email, message],
    function (err) {
      if (err) {
        console.error("Insert error:", err.message);
        return res.status(500).json({ error: "Database insert failed." });
      }

      res.status(201).json({
        message: "Ticket submitted successfully!",
        ticketId: this.lastID,
      });
    }
  );
});

app.get("/api/export", (req, res) => {
  db.all(`SELECT * FROM tickets`, [], (err, rows) => {
    if (err) {
      console.error("Export error:", err.message);
      return res.status(500).json({ error: "Failed to export tickets." });
    }

    const parser = new Parser();
    const csv = parser.parse(rows);

    const filePath = path.join(__dirname, "tickets.csv");
    fs.writeFileSync(filePath, csv);

    res.download(filePath, "tickets.csv", (err) => {
      if (err) {
        console.error("Download error:", err.message);
      }
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
