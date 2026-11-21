const jwt = require('jsonwebtoken');
const { User } = require('../models');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const auth = wrap(async (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not logged in' });
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return res.status(401).json({ message: 'Invalid or expired token' }); }
  const user = await User.findById(payload.id);
  if (!user || user.status !== 'active') return res.status(401).json({ message: 'Account inactive or not found' });
  req.user = user;
  next();
});

const role = (r) => (req, res, next) =>
  req.user.role === r ? next() : res.status(403).json({ message: 'Forbidden' });

module.exports = { wrap, auth, role };
