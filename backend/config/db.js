const mongoose = require('mongoose');
const dns = require('dns');

let isConnected = false;

async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured');
    }

    // Already connected
    if (
      isConnected &&
      mongoose.connection.readyState === 1
    ) {
      return mongoose.connection;
    }

    // Custom DNS servers if configured
    if (process.env.MONGODB_DNS_SERVERS) {
      const servers = process.env.MONGODB_DNS_SERVERS
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean);

      if (servers.length > 0) {
        dns.setServers(servers);
      }
    }

    const conn = await mongoose.connect(
      process.env.MONGODB_URI,
      {
        authSource:
          process.env.MONGODB_AUTH_SOURCE || 'admin'
      }
    );

    isConnected = true;

    console.log(
      `MongoDB connected: ${conn.connection.host}`
    );

    return conn;
  } catch (err) {
    isConnected = false;

    console.warn(
      'MongoDB connection failed. Running in fallback mode with admin credentials.'
    );

    console.warn(
      'Error:',
      err.message
    );

    return null;
  }
}

function isDBConnected() {
  return (
    isConnected &&
    mongoose.connection.readyState === 1
  );
}

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;