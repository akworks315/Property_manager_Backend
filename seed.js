try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const make = async (name, email, password, role) => {
    if (await User.findOne({ email })) return console.log('exists:', email);
    await User.create({ name, email, role, password: await bcrypt.hash(password, 10) });
    console.log('created:', email);
  };
  await make('Admin', 'admin@propertyapp.com', 'Admin@12345', 'admin');
  await make('Demo Manager', 'manager@propertyapp.com', 'Manager@12345', 'manager');
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
