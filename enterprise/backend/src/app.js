const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Request Logger
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// Security Middleware
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs (relaxed for dev)
});
app.use('/api/', limiter);

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'SKRT Logistics API is running...' });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Load Modules
app.use('/api/auth', require('./modules/auth/routes'));
app.use('/api/inventory', require('./modules/inventory/routes'));
app.use('/api/shipments', require('./modules/shipments/routes'));
app.use('/api/contacts', require('./modules/contacts/routes'));
app.use('/api/vehicles', require('./modules/vehicles/routes'));
app.use('/api/drivers', require('./modules/drivers/routes'));
app.use('/api/invoices', require('./modules/invoices/routes'));
app.use('/api/analytics', require('./modules/analytics/routes'));
app.use('/api/clients', require('./modules/clients/routes'));
app.use('/api/expenses', require('./modules/expenses/routes'));
app.use('/api/tracking', require('./modules/tracking/routes'));
app.use('/api/notifications', require('./modules/notifications/routes'));
app.use('/api/cash-memo', require('./modules/cash-memo/routes'));
app.use('/api/entry', require('./modules/entry/routes'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// Note: app.listen moved to server.js to support Socket.io

module.exports = app;
