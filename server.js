require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Allowed frontends: built-in defaults + anything listed in CLIENT_URL (comma separated)
const defaults = [
  'https://property-manager-frontend-seven.vercel.app',
  'https://property-manager-frontend-nine.vercel.app',
  'http://localhost:5173',
];
const fromEnv = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
const allowed = [...new Set([...defaults, ...fromEnv])];
app.use(cors({
  origin: (origin, cb) => (!origin || allowed.includes(origin) ? cb(null, true) : cb(null, false)),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, name: 'Property Manager API' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/manager', require('./routes/manager'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

module.exports = app;
