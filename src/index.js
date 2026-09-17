require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { initializeFirebase } = require('./config/firebase');
const notificationRoutes = require('./routes/notification');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// CORS - Android Admin Panel থেকে request আসবে
// Production-এ আপনার Admin Panel domain যোগ করুন
app.use(
  cors({
    origin: true, // development-এ সব origin allow। Production-এ specific domain দিন।
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true,
  })
);

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', notificationRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Game Club Zone Notification Server',
    endpoints: {
      health: 'GET /api/health',
      sendNotification: 'POST /api/send-notification',
    },
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Start server
async function start() {
  try {
    // Initialize Firebase first
    initializeFirebase();

    app.listen(PORT, () => {
      console.log(`🚀 Notification server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📍 Send notification: POST http://localhost:${PORT}/api/send-notification`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
