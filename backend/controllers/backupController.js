const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');
const Settings = require('../models/Settings');
const User = require('../models/User');

exports.exportData = async (req, res, next) => {
  try {
    const owner = req.user._id;
    const invoices = await Invoice.find({ owner }).sort({ invoiceDate: -1 });
    const activities = await Activity.find({ owner }).sort({ date: -1 });
    const settings = await Settings.findOne({ user: owner });

    const yearMap = {};
    invoices.forEach((inv) => {
      const d = new Date(inv.invoiceDate || inv.createdAt);
      const y = d.getFullYear();
      if (!yearMap[y]) yearMap[y] = 0;
      yearMap[y]++;
    });
    let maxSeq = 0;
    Object.values(yearMap).forEach((count) => { if (count > maxSeq) maxSeq = count; });

    res.json({
      version: 1,
      exportDate: new Date().toISOString(),
      invoices: invoices.map((inv) => {
        const obj = inv.toObject();
        delete obj._id;
        delete obj.owner;
        delete obj.__v;
        return obj;
      }),
      sequence: maxSeq + 1,
      activities: activities.map((a) => {
        const obj = a.toObject();
        delete obj._id;
        delete obj.owner;
        delete obj.__v;
        return obj;
      })
    });
  } catch (err) {
    next(err);
  }
};

exports.importData = async (req, res, next) => {
  try {
    const { data, password, confirmOverwrite } = req.body;
    const owner = req.user._id;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (!confirmOverwrite) {
      return res.status(400).json({ message: 'confirmOverwrite must be true' });
    }

    const user = await User.findById(owner);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    if (!data || !Array.isArray(data.invoices)) {
      return res.status(400).json({ message: 'Invalid backup format' });
    }

    const invoiceNumbers = data.invoices.map((inv) => inv.invoiceNumber).filter(Boolean);
    const uniqueImport = new Set(invoiceNumbers);
    if (uniqueImport.size !== invoiceNumbers.length) {
      return res.status(409).json({ message: 'Duplicate invoice numbers in import data' });
    }

    const existingNumbers = await Invoice.distinct('invoiceNumber', { owner });
    const existingSet = new Set(existingNumbers);
    const conflicts = invoiceNumbers.filter((num) => existingSet.has(num));
    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'Invoice numbers already exist in database',
        conflicts: conflicts.slice(0, 20)
      });
    }

    await Invoice.deleteMany({ owner });
    await Activity.deleteMany({ owner });

    if (data.invoices.length > 0) {
      const invoicesToInsert = data.invoices.map((inv) => ({
        ...inv,
        owner,
        createdAt: inv.createdAt || new Date(),
        updatedAt: inv.updatedAt || new Date()
      }));
      await Invoice.insertMany(invoicesToInsert);
    }

    if (data.activities && data.activities.length > 0) {
      const activitiesToInsert = data.activities.map((act) => ({
        ...act,
        owner,
        date: act.date || new Date()
      }));
      await Activity.insertMany(activitiesToInsert);
    }

    res.json({ success: true, count: data.invoices.length });
  } catch (err) {
    next(err);
  }
};

exports.clearData = async (req, res, next) => {
  try {
    const { password } = req.body;
    const owner = req.user._id;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findById(owner);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    await Invoice.deleteMany({ owner });
    await Activity.deleteMany({ owner });
    await Settings.findOneAndDelete({ user: owner });

    res.json({ success: true, message: 'All data cleared. Owner account preserved.' });
  } catch (err) {
    next(err);
  }
};
