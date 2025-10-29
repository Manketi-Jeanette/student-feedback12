const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const DB_FILE = process.env.DB_FILE || './data/feedback.json';
const DB_DIR = path.dirname(DB_FILE);

class JSONDatabase {
  constructor() {
    this.dbFile = DB_FILE;
    this.init();
  }

  async init() {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(DB_DIR, { recursive: true });
      
      // Create file with empty array if it doesn't exist
      try {
        await fs.access(this.dbFile);
      } catch {
        await this.writeData([]);
        console.log('Created new JSON database file.');
      }
      
      console.log('JSON database ready.');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  async readData() {
    try {
      const data = await fs.readFile(this.dbFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading database:', error);
      return [];
    }
  }

  async writeData(data) {
    try {
      await fs.writeFile(this.dbFile, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error writing to database:', error);
      return false;
    }
  }

  async getAll() {
    return await this.readData();
  }

  async insert(item) {
    const data = await this.readData();
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      ...item,
      createdAt: new Date().toISOString()
    };
    data.push(newItem);
    const success = await this.writeData(data);
    return success ? newItem : null;
  }

  async delete(id) {
    const data = await this.readData();
    const initialLength = data.length;
    const newData = data.filter(item => item.id !== id);
    
    if (newData.length === initialLength) {
      return false; // Item not found
    }
    
    const success = await this.writeData(newData);
    return success;
  }

  async getStats() {
    const data = await this.readData();
    
    if (data.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        totalCourses: 0,
        courseStats: []
      };
    }

    // Calculate overall stats
    const totalFeedback = data.length;
    const averageRating = data.reduce((sum, item) => sum + item.rating, 0) / totalFeedback;
    
    // Get unique courses
    const courses = [...new Set(data.map(item => item.courseCode))];
    const totalCourses = courses.length;

    // Calculate course-wise stats
    const courseStats = courses.map(course => {
      const courseFeedbacks = data.filter(item => item.courseCode === course);
      const courseAverage = courseFeedbacks.reduce((sum, item) => sum + item.rating, 0) / courseFeedbacks.length;
      
      return {
        courseCode: course,
        feedbackCount: courseFeedbacks.length,
        averageRating: courseAverage
      };
    });

    return {
      totalFeedback,
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalCourses,
      courseStats
    };
  }
}

module.exports = new JSONDatabase();