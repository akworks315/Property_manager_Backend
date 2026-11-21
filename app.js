require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// CLIENT_URL can hold one or more frontend URLs separated by commas
const origins = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));
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
