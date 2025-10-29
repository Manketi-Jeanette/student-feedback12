const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Path to JSON "database"
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'feedback.json');

// Path to React frontend build
const FRONTEND_BUILD_DIR = path.join(__dirname, 'frontend', 'build');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure feedback.json exists
async function ensureDatabaseFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, '[]', 'utf8');
      console.log('✅ feedback.json created automatically');
    }
  } catch (err) {
    console.error('Error ensuring database file:', err);
  }
}

// Read all feedback
async function readFeedback() {
  const data = await fs.readFile(DB_FILE, 'utf8');
  return JSON.parse(data);
}

// Write feedback
async function writeFeedback(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// API ROUTES

// POST API - Add feedback
app.post('/api/feedback', async (req, res) => {
  const { studentName, courseCode, comments, rating } = req.body;

  if (!studentName || !courseCode || !comments || !rating) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const feedbackList = await readFeedback();

    const newFeedback = {
      id: Date.now().toString(),
      studentName: studentName.trim(),
      courseCode: courseCode.trim(),
      comments: comments.trim(),
      rating: parseInt(rating),
      createdAt: new Date().toISOString()
    };

    feedbackList.push(newFeedback);
    await writeFeedback(feedbackList);

    res.status(201).json({
      message: 'Feedback submitted successfully',
      id: newFeedback.id
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// GET API - Retrieve all feedback
app.get('/api/feedback', async (req, res) => {
  try {
    const feedback = await readFeedback();
    feedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// DELETE API - Remove feedback
app.delete('/api/feedback/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const feedback = await readFeedback();
    const index = feedback.findIndex(f => f.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    feedback.splice(index, 1);
    await writeFeedback(feedback);
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// Dashboard stats API
app.get('/api/stats', async (req, res) => {
  try {
    const feedback = await readFeedback();
    const total = feedback.length;
    const averageRating =
      total > 0
        ? (feedback.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(2)
        : 0;
    res.json({ totalFeedback: total, averageRating });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// ----------------------
// Serve React Frontend
// ----------------------
app.use(express.static(FRONTEND_BUILD_DIR));

app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_BUILD_DIR, 'index.html'));
});

// ----------------------
// Start Server
// ----------------------
app.listen(PORT, async () => {
  await ensureDatabaseFile();
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 JSON database file: ${DB_FILE}`);
  console.log(`📦 Serving React frontend from: ${FRONTEND_BUILD_DIR}`);
});
