const Invoice = require('../models/Invoice');

exports.getAll = async (req, res, next) => {
  try {
    const owner = req.user._id;

    const result = await Invoice.aggregate([
      { $match: { owner } },
      { $sort: { invoiceDate: -1 } },
      {
        $group: {
          _id: { $toLower: '$customer.name' },
          name: { $first: '$customer.name' },
          contact: { $first: '$customer.contact' },
          gstNumber: { $first: '$customer.gstNumber' },
          address: { $first: '$customer.address' },
          state: { $first: '$customer.state' },
          totalBills: { $sum: 1 },
          totalSales: { $sum: '$totals.grandTotal' },
          totalReceived: { $sum: '$totals.received' },
          lastInvoiceDate: { $max: '$invoiceDate' },
          invoices: {
            $push: {
              id: '$_id',
              invoiceNumber: '$invoiceNumber',
              invoiceDate: '$invoiceDate',
              grandTotal: '$totals.grandTotal',
              paymentStatus: '$paymentStatus'
            }
          }
        }
      },
      {
        $addFields: {
          totalPending: { $subtract: ['$totalSales', '$totalReceived'] }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    const customers = result.map((c) => ({
      name: c.name,
      contact: c.contact || '',
      gstNumber: c.gstNumber || '',
      address: c.address || '',
      state: c.state || '',
      totalBills: c.totalBills,
      totalSales: c.totalSales,
      totalReceived: c.totalReceived,
      totalPending: c.totalPending,
      lastInvoiceDate: c.lastInvoiceDate,
      invoices: c.invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        totals: { grandTotal: inv.grandTotal },
        paymentStatus: inv.paymentStatus
      }))
    }));

    res.json(customers);
  } catch (err) {
    next(err);
  }
};
