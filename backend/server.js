require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoices');
const customerRoutes = require('./routes/customers');
const statsRoutes = require('./routes/stats');
const activitiesRoutes = require('./routes/activities');
const settingsRoutes = require('./routes/settings');
const backupRoutes = require('./routes/backup');

const app = express();

/* =========================
   Middleware
========================= */

app.use(helmet());

app.use(cookieParser());

app.use(
  express.json({
    limit: '10mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

/* =========================
   CORS
========================= */

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin
      // Example: server-to-server / Postman
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error('Not allowed by CORS')
      );
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ],

    maxAge: 86400
  })
);

/* =========================
   Rate Limiters
========================= */

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 5,

  message: {
    message:
      'Too many login attempts. Please try again later.'
  },

  standardHeaders: true,

  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 100,

  message: {
    message:
      'Too many requests. Please try again later.'
  },

  standardHeaders: true,

  legacyHeaders: false
});

/* =========================
   Apply Rate Limits
========================= */

app.use(
  '/api/auth/login',
  loginLimiter
);

app.use(
  '/api',
  apiLimiter
);

/* =========================
   Routes
========================= */

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/invoices',
  invoiceRoutes
);

app.use(
  '/api/customers',
  customerRoutes
);

app.use(
  '/api/stats',
  statsRoutes
);

app.use(
  '/api/activities',
  activitiesRoutes
);

app.use(
  '/api/settings',
  settingsRoutes
);

app.use(
  '/api/backup',
  backupRoutes
);

/* =========================
   Health Check
========================= */

app.get(
  '/api/health',
  (req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'Moonlight Resort API is running',
      timestamp: new Date().toISOString()
    });
  }
);

/* =========================
   404 API Handler
========================= */

app.use(
  '/api',
  (req, res) => {
    res.status(404).json({
      message: 'API route not found'
    });
  }
);

/* =========================
   Error Handler
========================= */

app.use(
  (err, req, res, next) => {
    console.error(
      'Unhandled error:',
      err.message
    );

    res.status(
      err.status || 500
    ).json({
      message:
        err.message ||
        'Internal server error'
    });
  }
);

/* =========================
   Local Server
========================= */

if (process.env.VERCEL !== '1') {
  const PORT =
    process.env.PORT || 5001;

  async function startServer() {
    try {
      await connectDB();

      const server = app.listen(
        PORT,
        () => {
          console.log(
            `Server running on port ${PORT}`
          );
        }
      );

      server.on(
        'error',
        (err) => {
          if (
            err.code ===
            'EADDRINUSE'
          ) {
            console.error(
              `Port ${PORT} is already in use.`
            );
          } else {
            console.error(
              'Server listen error:',
              err.message
            );
          }

          process.exit(1);
        }
      );
    } catch (err) {
      console.error(
        'Server startup failed:',
        err.message
      );

      process.exit(1);
    }
  }

  startServer();
}

/* =========================
   Export for Vercel
========================= */

module.exports = app;