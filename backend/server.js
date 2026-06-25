require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./configures/database');
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const questionRoutes = require('./routes/questionRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const { generateInterviewQuestions, generateConceptExplanation, generateInterviewReport } = require('./controllers/aiController');
const { protect } = require('./middlewares/authMiddleware');

const app = express();

// Middleware - CORS
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Middleware - Body Parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/interview', interviewRoutes);

// AI Routes
app.post('/api/ai/generate-questions', protect, generateInterviewQuestions);
app.post('/api/ai/generate-explanation', protect, generateConceptExplanation);
app.post('/api/ai/generate-report', protect, generateInterviewReport);

// Static Files - Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error Handler - 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



