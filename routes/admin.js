const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User, Property, Session, Labour, Attendance } = require('../models');
const { wrap, auth, role } = require('../middleware/auth');

router.use(auth, role('admin'));

// ---------- Managers ----------
router.get('/managers', wrap(async (req, res) => {
  res.json(await User.find({ role: 'manager' }).select('-password').sort('-createdAt'));
}));

router.post('/managers', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email already exists' });
  const u = await User.create({ name, email, role: 'manager', password: await bcrypt.hash(password, 10) });
  res.status(201).json({ id: u._id });
}));

router.put('/managers/:id', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  const u = await User.findOne({ _id: req.params.id, role: 'manager' });
  if (!u) return res.status(404).json({ message: 'Manager not found' });
  if (email && email.toLowerCase() !== u.email) {
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email already exists' });
    u.email = email;
  }
  if (name) u.name = name;
  if (password) u.password = await bcrypt.hash(password, 10);
  await u.save();
  res.json({ ok: true });
}));

router.patch('/managers/:id/status', wrap(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) return res.status(400).json({ message: 'Bad status' });
  const u = await User.findOneAndUpdate({ _id: req.params.id, role: 'manager' }, { status }, { new: true });
  if (!u) return res.status(404).json({ message: 'Manager not found' });
  res.json({ ok: true });
}));

router.delete('/managers/:id', wrap(async (req, res) => {
  const u = await User.findOneAndDelete({ _id: req.params.id, role: 'manager' });
  if (!u) return res.status(404).json({ message: 'Manager not found' });
  res.json({ ok: true });
}));

// ---------- Dashboard summary ----------
router.get('/summary', wrap(async (req, res) => {
  const rows = await Property.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  const s = { empty: 0, rented: 0, booked: 0, under_construction: 0 };
  rows.forEach((r) => (s[r._id] = r.n));
  s.total = s.empty + s.rented + s.booked + s.under_construction;
  s.managers = await User.countDocuments({ role: 'manager' });
  s.activeSessions = await Session.countDocuments({ signOutAt: null });
  const bs = await Property.aggregate([{ $group: { _id: { site: '$site', status: '$status' }, n: { $sum: 1 } } }]);
  s.bySite = {};
  bs.forEach((r) => {
    const k = r._id.site || 'Other';
    s.bySite[k] = s.bySite[k] || { total: 0 };
    s.bySite[k][r._id.status] = r.n;
    s.bySite[k].total += r.n;
  });
  res.json(s);
}));

// ---------- Properties ----------
router.get('/properties', wrap(async (req, res) => {
  const f = {};
  if (req.query.manager) f.manager = req.query.manager;
  if (req.query.status) f.status = req.query.status;
  if (req.query.site) f.site = req.query.site;
  res.json(await Property.find(f).populate('manager', 'name email').sort('-createdAt'));
}));

// ---------- Sessions (sign in / out) ----------
router.get('/sessions', wrap(async (req, res) => {
  const f = {};
  if (req.query.manager) f.manager = req.query.manager;
  res.json(await Session.find(f).populate('manager', 'name email').sort('-signInAt').limit(300));
}));

// ---------- Labour & attendance ----------
router.get('/labour', wrap(async (req, res) => {
  const f = {};
  if (req.query.manager) f.manager = req.query.manager;
  const labour = await Labour.find(f).populate('manager', 'name email').sort('-createdAt').lean();
  const counts = await Attendance.aggregate([{ $group: { _id: { l: '$labour', s: '$status' }, n: { $sum: 1 } } }]);
  const map = {};
  counts.forEach((c) => { (map[c._id.l] = map[c._id.l] || {})[c._id.s] = c.n; });
  res.json(labour.map((l) => ({ ...l, present: (map[l._id] || {}).present || 0, absent: (map[l._id] || {}).absent || 0 })));
}));

router.get('/attendance', wrap(async (req, res) => {
  const f = {};
  if (req.query.manager) f.manager = req.query.manager;
  if (req.query.date) f.date = req.query.date;
  res.json(await Attendance.find(f).populate('labour', 'name phone').populate('manager', 'name').sort('-date').limit(500));
}));

// ---------- Managers working right now ----------
router.get('/active', wrap(async (req, res) => {
  res.json(await Session.find({ signOutAt: null }).populate('manager', 'name email').sort('signInAt'));
}));

module.exports = router;
