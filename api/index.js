const connectDB = require('../config/db');
const app = require('../server');

let dbInitialized = false;

module.exports = async (req, res) => {
  try {
    if (!dbInitialized) {
      await connectDB();
      dbInitialized = true;
    }

    return app(req, res);
  } catch (error) {
    console.error(
      'Vercel function error:',
      error.message
    );

    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};