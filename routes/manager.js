const router = require('express').Router();
const { Property, Session, Labour, Attendance } = require('../models');
const { wrap, auth, role } = require('../middleware/auth');

router.use(auth, role('manager'));

const mine = (req) => ({ manager: req.user._id });
const getProp = async (req, res) => {
  const p = await Property.findOne({ _id: req.params.id, ...mine(req) });
  if (!p) res.status(404).json({ message: 'Property not found' });
  return p;
};

// ---------- Properties ----------
router.get('/properties', wrap(async (req, res) => {
  res.json(await Property.find(mine(req)).sort('-createdAt'));
}));

router.post('/properties', wrap(async (req, res) => {
  const { title, type, address, site, status } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });
  const st = ['empty', 'booked', 'under_construction'].includes(status) ? status : 'empty';
  const p = await Property.create({
    title, type, address, site, status: st, manager: req.user._id,
    constructionStartDate: st === 'under_construction' ? new Date() : undefined,
  });
  res.status(201).json(p);
}));

router.put('/properties/:id', wrap(async (req, res) => {
  const p = await getProp(req, res); if (!p) return;
  const { title, type, address, site, status } = req.body;
  if (title) p.title = title;
  if (type) p.type = type;
  if (address !== undefined) p.address = address;
  if (site !== undefined) p.site = site;
  if (status && status !== p.status) {
    if (p.status === 'rented') return res.status(400).json({ message: 'Free the property first' });
    if (!['empty', 'booked', 'under_construction'].includes(status)) return res.status(400).json({ message: 'Use the Rent action to rent' });
    if (status === 'under_construction' && !p.constructionStartDate) p.constructionStartDate = new Date();
    p.status = status;
  }
  await p.save();
  res.json(p);
}));

router.patch('/properties/:id/rent', wrap(async (req, res) => {
  const p = await getProp(req, res); if (!p) return;
  if (p.status === 'rented') return res.status(400).json({ message: 'Already rented' });
  if (p.status === 'under_construction') return res.status(400).json({ message: 'Construction not finished' });
  const { tenantName, tenantPhone, amount, startDate, endDate } = req.body;
  if (!tenantName) return res.status(400).json({ message: 'Tenant name required' });
  p.rent = { tenantName, tenantPhone, amount: Number(amount) || 0, startDate: startDate ? new Date(startDate) : new Date(), endDate: endDate ? new Date(endDate) : undefined };
  p.status = 'rented';
  await p.save();
  res.json(p);
}));

router.patch('/properties/:id/free', wrap(async (req, res) => {
  const p = await getProp(req, res); if (!p) return;
  if (p.status !== 'rented') return res.status(400).json({ message: 'Property is not rented' });
  p.rentHistory.push({ ...p.rent.toObject(), freedAt: new Date() });
  p.rent = undefined;
  p.status = 'empty';
  await p.save();
  res.json(p);
}));

router.delete('/properties/:id', wrap(async (req, res) => {
  const p = await getProp(req, res); if (!p) return;
  await p.deleteOne();
  res.json({ ok: true });
}));

// ---------- Sign in / out ----------
router.get('/sessions', wrap(async (req, res) => {
  const current = await Session.findOne({ ...mine(req), signOutAt: null });
  const history = await Session.find(mine(req)).sort('-signInAt').limit(50);
  res.json({ current, history });
}));

router.post('/signin', wrap(async (req, res) => {
  if (await Session.findOne({ ...mine(req), signOutAt: null })) return res.status(400).json({ message: 'Already signed in' });
  res.status(201).json(await Session.create({ manager: req.user._id, site: req.body.site }));
}));

router.post('/signout', wrap(async (req, res) => {
  const s = await Session.findOne({ ...mine(req), signOutAt: null });
  if (!s) return res.status(400).json({ message: 'You are not signed in' });
  s.signOutAt = new Date();
  await s.save();
  res.json(s);
}));

// ---------- Labour & attendance ----------
router.get('/labour', wrap(async (req, res) => {
  res.json(await Labour.find(mine(req)).sort('name'));
}));

router.post('/labour', wrap(async (req, res) => {
  const { name, phone, dailyWage } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  res.status(201).json(await Labour.create({ name, phone, dailyWage: Number(dailyWage) || 0, manager: req.user._id }));
}));

router.delete('/labour/:id', wrap(async (req, res) => {
  const l = await Labour.findOneAndDelete({ _id: req.params.id, ...mine(req) });
  if (!l) return res.status(404).json({ message: 'Labour not found' });
  await Attendance.deleteMany({ labour: l._id });
  res.json({ ok: true });
}));

router.get('/attendance', wrap(async (req, res) => {
  const f = { ...mine(req) };
  if (req.query.date) f.date = req.query.date;
  res.json(await Attendance.find(f));
}));

router.post('/attendance', wrap(async (req, res) => {
  const { labourId, date, status } = req.body;
  if (!['present', 'absent'].includes(status) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ message: 'Bad data' });
  const l = await Labour.findOne({ _id: labourId, ...mine(req) });
  if (!l) return res.status(404).json({ message: 'Labour not found' });
  const a = await Attendance.findOneAndUpdate(
    { labour: l._id, date },
    { labour: l._id, manager: req.user._id, date, status },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json(a);
}));

module.exports = router;
