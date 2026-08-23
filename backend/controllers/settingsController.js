const Settings = require('../models/Settings');

const DEFAULT_SETTINGS = {
  business: {
    name: 'MOON LIGHT RESORT',
    addressLine1: 'Thambagoundanahoor to Idappadi main Road Koneripatti, Post,',
    addressLine2: 'Nedungulam, Idappadi, Tamil Nadu 637107',
    gstin: '33AKCPR9011N2ZX',
    stateCode: '33',
    stateName: 'Tamil Nadu',
    placeOfSupply: 'Tamil Nadu'
  },
  invoice: {
    prefix: 'MLR',
    defaultGst: 18,
    defaultPackage: 'withFood',
    defaultSignatory: 'Manager',
    theme: 'classicPurple'
  },
  dashboard: {
    appearance: 'light',
    sidebarStyle: 'expanded'
  },
  export: {
    pdfQuality: 'high',
    paperSize: 'a4',
    filenameFormat: 'default'
  }
};

exports.get = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ user: req.user._id });
    if (!settings) {
      settings = await Settings.create({ user: req.user._id, ...DEFAULT_SETTINGS });
    }
    const obj = settings.toObject();
    delete obj._id;
    delete obj.user;
    delete obj.__v;
    delete obj.createdAt;
    delete obj.updatedAt;
    res.json(obj);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { section, data } = req.body;
    if (!section || !data) {
      return res.status(400).json({ message: 'Section and data are required' });
    }

    const allowedSections = ['business', 'invoice', 'dashboard', 'export'];
    if (!allowedSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid section' });
    }

    let settings = await Settings.findOne({ user: req.user._id });
    if (!settings) {
      settings = new Settings({ user: req.user._id, ...DEFAULT_SETTINGS });
    }

    settings[section] = { ...settings[section].toObject(), ...data };
    await settings.save();

    const obj = settings.toObject();
    delete obj._id;
    delete obj.user;
    delete obj.__v;
    delete obj.createdAt;
    delete obj.updatedAt;
    res.json(obj);
  } catch (err) {
    next(err);
  }
};

exports.reset = async (req, res, next) => {
  try {
    await Settings.findOneAndDelete({ user: req.user._id });
    const settings = await Settings.create({ user: req.user._id, ...DEFAULT_SETTINGS });
    const obj = settings.toObject();
    delete obj._id;
    delete obj.user;
    delete obj.__v;
    delete obj.createdAt;
    delete obj.updatedAt;
    res.json(obj);
  } catch (err) {
    next(err);
  }
};
