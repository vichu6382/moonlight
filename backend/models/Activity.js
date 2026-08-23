const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'deleted']
  },
  invoiceNumber: { type: String, default: '' },
  customerName: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

activitySchema.index({ owner: 1, date: -1 });

module.exports = mongoose.model('Activity', activitySchema);
