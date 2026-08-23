const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');

exports.getAll = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ owner: req.user._id }).sort({ invoiceDate: -1 });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }
    const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.user._id });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

exports.getSequence = async (req, res, next) => {
  try {
    const settings = require('../models/Settings');
    const settingsDoc = await settings.findOne({ user: req.user._id });
    const prefix = settingsDoc?.invoice?.prefix || 'MLR';
    const year = new Date().getFullYear();

    const lastInvoice = await Invoice.findOne({ owner: req.user._id, invoiceNumber: new RegExp('^' + prefix + '-' + year) })
      .sort({ createdAt: -1 });

    let nextSeq = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      nextSeq = lastNum + 1;
    }

    const formatted = `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
    res.json({ sequence: nextSeq, formatted });
  } catch (err) {
    next(err);
  }
};

exports.search = async (req, res, next) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      const invoices = await Invoice.find({ owner: req.user._id }).sort({ invoiceDate: -1 });
      return res.json(invoices);
    }

    const invoices = await Invoice.find({
      owner: req.user._id,
      $or: [
        { invoiceNumber: { $regex: query, $options: 'i' } },
        { 'customer.name': { $regex: query, $options: 'i' } },
        { 'customer.gstNumber': { $regex: query, $options: 'i' } },
        { 'customer.contact': { $regex: query, $options: 'i' } },
        { 'customer.address': { $regex: query, $options: 'i' } }
      ]
    }).sort({ invoiceDate: -1 });

    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const settingsDoc = await require('../models/Settings').findOne({ user: req.user._id });
    const prefix = settingsDoc?.invoice?.prefix || 'MLR';
    const year = new Date().getFullYear();

    const lastInvoice = await Invoice.findOne({ owner: req.user._id, invoiceNumber: new RegExp('^' + prefix + '-' + year) })
      .sort({ createdAt: -1 });

    let nextSeq = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      nextSeq = parseInt(parts[parts.length - 1], 10) + 1;
    }

    const invoiceNumber = req.body.invoiceNumber || `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;

    const existing = await Invoice.findOne({ invoiceNumber });
    if (existing) {
      return res.status(409).json({ message: 'Invoice number already exists' });
    }

    const invoice = await Invoice.create({
      ...req.body,
      invoiceNumber,
      owner: req.user._id
    });

    await Activity.create({
      type: 'created',
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer?.name || '',
      date: new Date(),
      owner: req.user._id
    });

    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.user._id });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const allowedUpdates = { ...req.body };
    delete allowedUpdates.invoiceNumber;
    delete allowedUpdates.createdAt;
    delete allowedUpdates.owner;

    Object.assign(invoice, allowedUpdates);
    await invoice.save();

    await Activity.create({
      type: 'updated',
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer?.name || '',
      date: new Date(),
      owner: req.user._id
    });

    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await Activity.create({
      type: 'deleted',
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer?.name || '',
      date: new Date(),
      owner: req.user._id
    });

    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    next(err);
  }
};
