require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', loginLimiter);
app.use('/api', apiLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/backup', require('./routes/backup'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;

if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5001;

  async function startServer() {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the existing backend or set a different PORT.`);
      } else {
        console.error('Server listen error:', err.message);
      }
      process.exit(1);
    });
  }

  startServer().catch((err) => {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  });
}
