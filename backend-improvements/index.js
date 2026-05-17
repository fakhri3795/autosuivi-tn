require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./src/utils/logger');

// ─── Initialize Express ─────────────────────────────────────────────────────
const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins for mobile app
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Max 200 requests per window
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Max 20 auth attempts per 15 min
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ─── HTTP Request Logging ────────────────────────────────────────────────────
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';
app.use(morgan(morganFormat, {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes = require('./src/routes/authRoutes');
const vehicleRoutes = require('./src/routes/vehicleRoutes');
const maintenanceRoutes = require('./src/routes/maintenanceRoutes');
const deadlineRoutes = require('./src/routes/deadlineRoutes');
const predictionRoutes = require('./src/routes/predictionRoutes');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/predictions', predictionRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'UP',
  server: 'Oxahost VPS',
  version: '2.0.0',
  timestamp: new Date().toISOString(),
}));

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message,
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trouvé' });
});

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 API AutoSuivi v2.0 prête sur le port ${PORT}`);
});
