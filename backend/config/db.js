const mongoose = require('mongoose');

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