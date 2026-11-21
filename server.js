// Local development only: npm run dev
try { require('dns').setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log('Server running on port ' + PORT)))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
