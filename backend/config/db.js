const mongoose = require('mongoose');
const dns = require('dns');

let isConnected = false;

async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured');
    }

    if (process.env.MONGODB_DNS_SERVERS) {
      dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()));
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      authSource: process.env.MONGODB_AUTH_SOURCE || 'admin'
    });
    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    isConnected = false;
    console.warn('MongoDB connection failed. Running in fallback mode with admin credentials.');
    console.warn('Error:', err.message);
  }
}

function isDBConnected() {
  return isConnected;
}

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;
