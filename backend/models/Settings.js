const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true
  },
  business: {
    name: { type: String, default: 'MOON LIGHT RESORT' },
    addressLine1: { type: String, default: 'Thambagoundanahoor to Idappadi main Road Koneripatti, Post,' },
    addressLine2: { type: String, default: 'Nedungulam, Idappadi, Tamil Nadu 637107' },
    gstin: { type: String, default: '33AKCPR9011N2ZX' },
    stateCode: { type: String, default: '33' },
    stateName: { type: String, default: 'Tamil Nadu' },
    placeOfSupply: { type: String, default: 'Tamil Nadu' }
  },
  invoice: {
    prefix: { type: String, default: 'MLR' },
    defaultGst: { type: Number, default: 18 },
    defaultPackage: { type: String, default: 'withFood' },
    defaultSignatory: { type: String, default: 'Manager' },
    theme: { type: String, default: 'classicPurple' }
  },
  dashboard: {
    appearance: { type: String, default: 'light' },
    sidebarStyle: { type: String, default: 'expanded' }
  },
  export: {
    pdfQuality: { type: String, default: 'high' },
    paperSize: { type: String, default: 'a4' },
    filenameFormat: { type: String, default: 'default' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
