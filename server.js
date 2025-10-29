const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

// Create table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeName TEXT NOT NULL,
    employeeID TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL
  )`);

  // Add sample data
  db.run(`INSERT INTO attendance (employeeName, employeeID, date, status) 
          VALUES ('John Doe', 'EMP001', '2024-01-29', 'Present')`);
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build (when built)
app.use(express.static(path.join(__dirname, 'client/build')));

// API Routes
app.post('/api/attendance', (req, res) => {
  const { employeeName, employeeID, date, status } = req.body;
  
  if (!employeeName || !employeeID || !date || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `INSERT INTO attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [employeeName, employeeID, date, status], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      message: 'Attendance recorded successfully',
      id: this.lastID
    });
  });
});

app.get('/api/attendance', (req, res) => {
  const sql = `SELECT * FROM attendance ORDER BY date DESC`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.delete('/api/attendance/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM attendance WHERE id = ?`;
  
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Record deleted successfully' });
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// All other requests return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});