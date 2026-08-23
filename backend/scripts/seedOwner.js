require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');
const readline = require('readline');
const User = require('../models/User');
const Settings = require('../models/Settings');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function seed() {
  try {
    if (process.env.MONGODB_DNS_SERVERS) {
      dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()));
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      authSource: process.env.MONGODB_AUTH_SOURCE || 'admin'
    });
    console.log('Connected to MongoDB');

    const existingOwner = await User.findOne({ role: 'owner' });
    if (existingOwner) {
      console.log('Owner account already exists. Aborting.');
      process.exit(1);
    }

    const email = await ask('Enter owner email: ');
    const password = await ask('Enter owner password (min 8 chars): ');
    const name = await ask('Enter owner name (default: Owner): ');

    if (!email || !password) {
      console.log('Email and password are required.');
      process.exit(1);
    }

    if (password.length < 8) {
      console.log('Password must be at least 8 characters.');
      process.exit(1);
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim() || 'Owner',
      role: 'owner'
    });

    await Settings.create({ user: user._id });

    console.log(`Owner account created: ${user.email}`);
    console.log('You can now log in through the application.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
