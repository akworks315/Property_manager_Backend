const mongoose = require('mongoose');
const { Schema } = mongoose;
const ref = (m) => ({ type: Schema.Types.ObjectId, ref: m });

const User = mongoose.model('User', new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager'], required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true }));

const Property = mongoose.model('Property', new Schema({
  type: { type: String, enum: ['house', 'ground'], default: 'house' },
  title: { type: String, required: true },
  address: String,
  site: String,
  status: { type: String, enum: ['empty', 'rented', 'booked', 'under_construction'], default: 'empty' },
  manager: ref('User'),
  constructionStartDate: Date,
  rent: { tenantName: String, tenantPhone: String, amount: Number, startDate: Date, endDate: Date },
  rentHistory: [{ tenantName: String, amount: Number, startDate: Date, endDate: Date, freedAt: Date }],
}, { timestamps: true }));

const Session = mongoose.model('Session', new Schema({
  manager: ref('User'),
  site: String,
  signInAt: { type: Date, default: Date.now },
  signOutAt: Date,
}, { timestamps: true }));

const Labour = mongoose.model('Labour', new Schema({
  name: { type: String, required: true },
  phone: String,
  dailyWage: Number,
  manager: ref('User'),
}, { timestamps: true }));

const attSchema = new Schema({
  labour: ref('Labour'),
  manager: ref('User'),
  date: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ['present', 'absent'], required: true },
}, { timestamps: true });
attSchema.index({ labour: 1, date: 1 }, { unique: true });
const Attendance = mongoose.model('Attendance', attSchema);

module.exports = { User, Property, Session, Labour, Attendance };
