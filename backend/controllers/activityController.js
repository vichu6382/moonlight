const Activity = require('../models/Activity');

exports.getAll = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const activities = await Activity.find({ owner: req.user._id })
      .sort({ date: -1 })
      .limit(limit);
    res.json(activities);
  } catch (err) {
    next(err);
  }
};
