const jwt = require('jsonwebtoken');
const { isDBConnected } = require('../config/db');
const User = require('../models/User');

async function auth(req, res, next) {
  try {
    const token = req.cookies?.mlr_token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!isDBConnected()) {
      if (decoded.userId === 'admin-fallback') {
        req.user = { _id: 'admin-fallback', email: process.env.ADMIN_EMAIL, name: process.env.ADMIN_NAME || 'Owner', role: 'owner' };
        return next();
      }
      return res.status(401).json({ message: 'User not found' });
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    next(err);
  }
}

module.exports = auth;
