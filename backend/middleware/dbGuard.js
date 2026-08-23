const { isDBConnected } = require('../config/db');

const EMPTY_OBJECT_ROUTES = [
  '/api/stats/dashboard',
  '/api/stats/payments',
  '/api/settings'
];

function dbGuard(req, res, next) {
  if (!isDBConnected()) {
    if (req.method === 'GET') {
      const wantsObject = EMPTY_OBJECT_ROUTES.some((r) => req.originalUrl.startsWith(r));
      return res.json(wantsObject ? {} : []);
    }
    return res.status(503).json({ message: 'Database not available. Data will not be persisted.' });
  }
  next();
}

module.exports = dbGuard;
