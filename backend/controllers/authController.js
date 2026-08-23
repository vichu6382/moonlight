const jwt = require('jsonwebtoken');
const { isDBConnected } = require('../config/db');
const User = require('../models/User');
const Settings = require('../models/Settings');

function generateToken(userId) {
  return jwt.sign({ userId, role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function setTokenCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('mlr_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    const inputEmail = email.toLowerCase().trim();

    if (isDBConnected()) {
      const user = await User.findOne({ email: inputEmail });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = generateToken(user._id);
      setTokenCookie(res, token);
      return res.json({ user: { email: user.email, name: user.name, role: user.role } });
    }

    if (inputEmail === adminEmail && password === adminPassword) {
      const token = generateToken('admin-fallback');
      setTokenCookie(res, token);
      return res.json({ user: { email: adminEmail, name: process.env.ADMIN_NAME || 'Owner', role: 'owner' } });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('mlr_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });
  res.json({ message: 'Logged out' });
};

exports.me = (req, res) => {
  res.json({ user: req.user });
};

exports.setup = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Setup is disabled in production' });
    }

    const clientIp = req.ip || req.connection.remoteAddress || '';
    const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1';
    if (!isLocal) {
      return res.status(403).json({ message: 'Setup only available from localhost' });
    }

    const existingOwner = await User.findOne({ role: 'owner' });
    if (existingOwner) {
      return res.status(403).json({ message: 'Owner account already exists' });
    }

    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      name: name || 'Owner',
      role: 'owner'
    });

    await Settings.create({ user: user._id });

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(201).json({ user: { email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
};
