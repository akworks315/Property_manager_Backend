// Vercel serverless entry point
const mongoose = require('mongoose');
const app = require('../app');

let connecting = null;
async function connect() {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
      .catch((e) => { connecting = null; throw e; });
  }
  await connecting;
}

module.exports = async (req, res) => {
  try {
    await connect();
  } catch (e) {
    console.error('MongoDB connection failed:', e.message);
    return res.status(500).json({ message: 'Database connection failed' });
  }
  return app(req, res);
};
