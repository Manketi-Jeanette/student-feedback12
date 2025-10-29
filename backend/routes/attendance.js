const express = require('express');
const router = express.Router();
const db = require('../database.js');

// POST - Add new attendance record
router.post('/attendance', (req, res) => {
  const { employeeName, employeeID, date, status } = req.body;
  
  if (!employeeName || !employeeID || !date || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `INSERT INTO attendance (employeeName, employeeID, date, status) 
               VALUES (?, ?, ?, ?)`;
  
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

// GET - Retrieve all attendance records
router.get('/attendance', (req, res) => {
  const sql = `SELECT * FROM attendance ORDER BY date DESC, employeeName ASC`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET - Filter by date
router.get('/attendance/filter/:date', (req, res) => {
  const { date } = req.params;
  const sql = `SELECT * FROM attendance WHERE date = ? ORDER BY employeeName ASC`;
  
  db.all(sql, [date], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// DELETE - Remove attendance record
router.delete('/attendance/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM attendance WHERE id = ?`;
  
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record deleted successfully' });
  });
});

module.exports = router;