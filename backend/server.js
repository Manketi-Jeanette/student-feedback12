const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// POST API - Add feedback
app.post('/api/feedback', async (req, res) => {
  const { studentName, courseCode, comments, rating } = req.body;

  // Validation
  if (!studentName || !courseCode || !comments || !rating) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const newFeedback = await db.insert({
      studentName: studentName.trim(),
      courseCode: courseCode.trim(),
      comments: comments.trim(),
      rating: parseInt(rating)
    });

    if (!newFeedback) {
      return res.status(500).json({ error: 'Failed to save feedback' });
    }

    res.status(201).json({ 
      message: 'Feedback submitted successfully', 
      id: newFeedback.id 
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// GET API - Retrieve all feedback
app.get('/api/feedback', async (req, res) => {
  try {
    const feedback = await db.getAll();
    // Sort by createdAt descending (newest first)
    feedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(feedback);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// DELETE API - Remove feedback (Bonus)
app.delete('/api/feedback/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const deleted = await db.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// Dashboard stats API
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`JSON database file: ${process.env.DB_FILE}`);
});