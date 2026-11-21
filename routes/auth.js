const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { wrap, auth } = require('../middleware/auth');

const safe = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, status: u.status });

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(400).json({ message: 'Invalid email or password' });
  if (user.status !== 'active')
    return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: safe(user) });
}));

router.get('/me', auth, (req, res) => res.json(safe(req.user)));

module.exports = router;
