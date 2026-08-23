const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoiceDate: {
    type: String,
    required: true
  },
  theme: {
    type: String,
    default: 'classicPurple'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    name: { type: String, default: '' },
    addressLine1: { type: String, default: '' },
    addressLine2: { type: String, default: '' },
    gstin: { type: String, default: '' },
    stateCode: { type: String, default: '' },
    stateName: { type: String, default: '' },
    placeOfSupply: { type: String, default: '' }
  },
  customer: {
    name: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    contact: { type: String, default: '' },
    address: { type: String, default: '' },
    state: { type: String, default: '' }
  },
  membersCount: { type: Number, default: 0 },
  childCount: { type: Number, default: 0 },
  freeCount: { type: Number, default: 0 },
  package: {
    type: { type: String, default: 'withFood' },
    label: { type: String, default: 'With Food' },
    pricePerMember: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  discount: {
    type: { type: String, default: 'percent' },
    value: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  extraFood: [{
    id: String,
    name: String,
    qty: Number,
    rate: Number
  }],
  iceCream: [{
    id: String,
    name: String,
    qty: Number,
    rate: Number
  }],
  coolDrinks: [{
    id: String,
    name: String,
    qty: Number,
    rate: Number
  }],
  gst: {
    rate: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  totals: {
    subtotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    received: { type: Number, default: 0 },
    balance: { type: Number, default: 0 }
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'unpaid'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['full', 'advance'],
    default: 'full'
  },
  authorizedSignatory: { type: String, default: '' },
  showSignatory: { type: Boolean, default: false }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

invoiceSchema.index({ owner: 1 });
invoiceSchema.index({ owner: 1, invoiceDate: -1 });
invoiceSchema.index({ owner: 1, 'customer.name': 'text', invoiceNumber: 'text', 'customer.gstNumber': 'text', 'customer.contact': 'text' });

module.exports = mongoose.model('Invoice', invoiceSchema);
