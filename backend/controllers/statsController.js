const Invoice = require('../models/Invoice');

exports.dashboard = async (req, res, next) => {
  try {
    const owner = req.user._id;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const result = await Invoice.aggregate([
      { $match: { owner } },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalSales: { $sum: '$totals.grandTotal' },
          totalReceived: { $sum: '$totals.received' },
          totalGST: { $sum: '$gst.total' },
          thisMonthSales: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: [{ $month: { $dateFromString: { dateString: '$invoiceDate' } } }, currentMonth + 1] },
                    { $eq: [{ $year: { $dateFromString: { dateString: '$invoiceDate' } } }, currentYear] }
                  ]
                },
                '$totals.grandTotal',
                0
              ]
            }
          },
          thisYearSales: {
            $sum: {
              $cond: [
                { $eq: [{ $year: { $dateFromString: { dateString: '$invoiceDate' } } }, currentYear] },
                '$totals.grandTotal',
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = result[0] || {
      totalBills: 0, totalSales: 0, totalReceived: 0, totalGST: 0,
      thisMonthSales: 0, thisYearSales: 0
    };

    delete stats._id;
    stats.totalPending = stats.totalSales - stats.totalReceived;
    stats.avgBill = stats.totalBills > 0 ? stats.totalSales / stats.totalBills : 0;

    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.monthly = async (req, res, next) => {
  try {
    const owner = req.user._id;
    const year = parseInt(req.params.year) || new Date().getFullYear();

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      label: new Date(2000, i, 1).toLocaleString('en', { month: 'short' }),
      fullName: new Date(2000, i, 1).toLocaleString('en', { month: 'long' }),
      sales: 0, bills: 0, received: 0, gst: 0, taxable: 0, cgst: 0, sgst: 0
    }));

    const invoices = await Invoice.find({ owner });
    invoices.forEach((inv) => {
      const d = new Date(inv.invoiceDate || inv.createdAt);
      if (d.getFullYear() === year) {
        const m = d.getMonth();
        months[m].sales += inv.totals?.grandTotal || 0;
        months[m].bills += 1;
        months[m].received += inv.totals?.received || 0;
        months[m].gst += inv.gst?.total || 0;
        months[m].taxable += inv.gst?.taxableAmount || 0;
        months[m].cgst += inv.gst?.cgst || 0;
        months[m].sgst += inv.gst?.sgst || 0;
      }
    });

    res.json(months);
  } catch (err) {
    next(err);
  }
};

exports.payments = async (req, res, next) => {
  try {
    const owner = req.user._id;
    const result = await Invoice.aggregate([
      { $match: { owner } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          amount: { $sum: '$totals.grandTotal' }
        }
      }
    ]);

    const stats = { paid: { count: 0, amount: 0 }, partial: { count: 0, amount: 0 }, unpaid: { count: 0, amount: 0 } };
    result.forEach((r) => {
      if (stats[r._id]) {
        stats[r._id] = { count: r.count, amount: r.amount };
      }
    });

    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.years = async (req, res, next) => {
  try {
    const owner = req.user._id;
    const result = await Invoice.aggregate([
      { $match: { owner } },
      {
        $group: {
          _id: { $year: { $dateFromString: { dateString: '$invoiceDate' } } }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json(result.map((r) => r._id));
  } catch (err) {
    next(err);
  }
};
