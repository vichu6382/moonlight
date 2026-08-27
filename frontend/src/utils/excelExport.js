import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { getLogoBase64 } from './logoHelper';
import { formatDateDDMMYYYY, downloadFileName } from './format';
import { numberToWords } from './numberToWords';

// Modern Coastal Calm Brand Palette for Excel
const BRAND_NAVY = '0F172A';
const BRAND_BLUE = '2563EB';
const BRAND_BLUE_LIGHT = 'EFF6FF';
const ACCENT_GOLD = 'D97706';
const GOLD_TINT = 'FFFBEB';
const SUCCESS_GREEN = '059669';
const SUCCESS_LIGHT = 'ECFDF5';
const DANGER_RED = 'DC2626';
const TEXT_DARK = '0F172A';
const TEXT_MUTED = '64748B';
const BORDER_COLOR = 'E2E8F0';

const BORDER_THIN = { style: 'thin', color: { argb: 'FF' + BORDER_COLOR } };
const BORDER_DOUBLE_BOTTOM = {
  top: BORDER_THIN,
  left: BORDER_THIN,
  right: BORDER_THIN,
  bottom: { style: 'double', color: { argb: 'FF' + BRAND_NAVY } }
};
const CURRENCY_FMT = '"₹"#,##0.00';

const COLS = [
  { header: '', key: 'a', width: 32 },
  { header: '', key: 'b', width: 14 },
  { header: '', key: 'c', width: 14 },
  { header: '', key: 'd', width: 16 },
  { header: '', key: 'e', width: 16 },
  { header: '', key: 'f', width: 15 },
  { header: '', key: 'g', width: 15 },
  { header: '', key: 'h', width: 16 }
];

function merge(ws, r1, c1, r2, c2) {
  ws.mergeCells(r1, c1, r2, c2);
}

function cell(ws, row, col, value, opts = {}) {
  const c = ws.getCell(row, col);
  c.value = value;
  const color = (opts.color || TEXT_DARK).replace('#', 'FF');
  c.font = {
    bold: !!opts.bold,
    size: opts.size || 10,
    color: { argb: color },
    name: 'Segoe UI'
  };
  if (opts.fill) {
    c.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + opts.fill.replace('#', '') }
    };
  }
  c.alignment = {
    horizontal: opts.align || 'left',
    vertical: 'middle',
    wrapText: !!opts.wrap
  };
  if (opts.format) c.numFmt = opts.format;
  if (opts.border !== false) {
    c.border = opts.doubleBottom
      ? BORDER_DOUBLE_BOTTOM
      : { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };
  }
  if (opts.height) ws.getRow(row).height = opts.height;
  return c;
}

function rangeBorder(ws, r1, c1, r2, c2) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).border = {
        top: BORDER_THIN,
        bottom: BORDER_THIN,
        left: BORDER_THIN,
        right: BORDER_THIN
      };
    }
  }
}

function rangeFill(ws, r1, c1, r2, c2, fill) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF' + fill.replace('#', '') }
      };
    }
  }
}

function headerBand(ws, row, text, height = 24) {
  merge(ws, row, 1, row, 8);
  const c = cell(ws, row, 1, text.toUpperCase(), {
    bold: true,
    fill: BRAND_NAVY,
    color: 'FFFFFF',
    size: 10.5,
    height,
    align: 'left'
  });
  rangeBorder(ws, row, 1, row, 8);
  return c;
}

function itemsBlock(ws, startRow, title, items, total, firstLabel = 'Item') {
  let row = startRow;
  headerBand(ws, row, title);
  row++;
  merge(ws, row, 1, row, 3);
  cell(ws, row, 1, firstLabel, { bold: true, fill: BRAND_BLUE_LIGHT, color: BRAND_BLUE, height: 22 });
  cell(ws, row, 4, 'Qty', { bold: true, fill: BRAND_BLUE_LIGHT, color: BRAND_BLUE, align: 'center' });
  cell(ws, row, 5, 'Rate', { bold: true, fill: BRAND_BLUE_LIGHT, color: BRAND_BLUE, align: 'right' });
  merge(ws, row, 6, row, 8);
  cell(ws, row, 6, 'Amount', { bold: true, fill: BRAND_BLUE_LIGHT, color: BRAND_BLUE, align: 'right' });
  rangeBorder(ws, row, 1, row, 8);
  row++;

  items.forEach((item, idx) => {
    merge(ws, row, 1, row, 3);
    cell(ws, row, 1, item.name || `Item ${idx + 1}`);
    cell(ws, row, 4, Number(item.qty) || 0, { align: 'center' });
    cell(ws, row, 5, Number(item.rate) || 0, { align: 'right', format: CURRENCY_FMT });
    merge(ws, row, 6, row, 8);
    cell(ws, row, 6, { formula: `=D${row}*E${row}` }, { align: 'right', format: CURRENCY_FMT });
    rangeBorder(ws, row, 1, row, 8);
    row++;
  });

  merge(ws, row, 1, row, 5);
  cell(ws, row, 1, `${title} Total`, { bold: true, fill: GOLD_TINT, color: ACCENT_GOLD, align: 'right' });
  merge(ws, row, 6, row, 8);
  const firstData = startRow + 2;
  cell(ws, row, 6, { formula: `=SUM(F${firstData}:F${row - 1})` }, {
    bold: true,
    fill: GOLD_TINT,
    color: ACCENT_GOLD,
    align: 'right',
    format: CURRENCY_FMT
  });
  rangeBorder(ws, row, 1, row, 8);
  row++;
  return row;
}

function summaryRow(ws, row, label, valueOrFormula, opts = {}) {
  const isGrand = opts.fill === BRAND_NAVY;
  merge(ws, row, 1, row, 5);
  cell(ws, row, 1, label, {
    bold: isGrand || opts.bold || opts.fill === GOLD_TINT,
    fill: opts.fill || (opts.bold && !isGrand ? GOLD_TINT : null),
    color: isGrand ? 'FFFFFF' : opts.fill === GOLD_TINT ? ACCENT_GOLD : TEXT_DARK,
    align: 'right',
    height: isGrand ? 24 : 20
  });
  merge(ws, row, 6, row, 8);
  const v = typeof valueOrFormula === 'object' && valueOrFormula.formula
    ? { formula: valueOrFormula.formula }
    : valueOrFormula;
  cell(ws, row, 6, v, {
    bold: isGrand || opts.bold || opts.fill === GOLD_TINT,
    fill: opts.fill || (opts.bold && !isGrand ? GOLD_TINT : null),
    color: isGrand ? 'FFFFFF' : opts.fill === GOLD_TINT ? ACCENT_GOLD : opts.color || TEXT_DARK,
    align: 'right',
    format: CURRENCY_FMT,
    doubleBottom: isGrand
  });
  rangeBorder(ws, row, 1, row, 8);
}

export async function exportInvoiceToExcel(invoiceData, invoiceNumber) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Moon Light Resort Billing System';
  const ws = workbook.addWorksheet('Tax Invoice');
  ws.columns = COLS;

  const t = invoiceData.totals || {};
  const dateDisplay = formatDateDDMMYYYY(invoiceData.dateISO);
  const logo = await getLogoBase64();

  ws.getRow(1).height = 32;
  ws.getRow(2).height = 20;
  ws.getRow(3).height = 20;
  ws.getRow(4).height = 20;

  merge(ws, 1, 1, 4, 1);
  if (logo) {
    const imgId = workbook.addImage({ base64: logo, extension: 'png' });
    ws.addImage(imgId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 84, height: 84 } });
  }

  merge(ws, 1, 2, 1, 8);
  cell(ws, 1, 2, invoiceData.seller?.name || 'MOON LIGHT RESORT', {
    bold: true,
    color: 'FFFFFF',
    size: 18,
    align: 'center',
    border: false
  });

  merge(ws, 2, 2, 2, 8);
  cell(ws, 2, 2, 'LUXURY HOSPITALITY & RESORT SERVICES', {
    bold: true,
    color: '93C5FD',
    size: 9.5,
    align: 'center',
    border: false
  });

  merge(ws, 3, 2, 3, 8);
  cell(ws, 3, 2, `${invoiceData.seller?.addressLine1 || ''} ${invoiceData.seller?.addressLine2 || ''}`, {
    color: 'E2E8F0',
    size: 9,
    align: 'center',
    border: false
  });

  merge(ws, 4, 2, 4, 8);
  cell(ws, 4, 2, `GSTIN: ${invoiceData.seller?.gstin || ''}    •    State: ${invoiceData.seller?.stateCode || ''} - ${invoiceData.seller?.stateName || ''}`, {
    bold: true,
    color: 'FFFFFF',
    size: 9.5,
    align: 'center',
    border: false
  });

  rangeFill(ws, 1, 1, 4, 8, BRAND_NAVY);

  ws.getRow(5).height = 4;
  merge(ws, 5, 1, 5, 8);
  cell(ws, 5, 1, '', { fill: BRAND_BLUE, border: false, height: 4 });

  ws.getRow(6).height = 26;
  headerBand(ws, 6, 'TAX INVOICE');

  // Customer & Invoice Details Grid
  merge(ws, 8, 1, 8, 4);
  cell(ws, 8, 1, 'CUSTOMER BILL TO', { bold: true, fill: BRAND_BLUE_LIGHT, color: BRAND_BLUE, height: 22 });
  merge(ws, 8, 5, 8, 8);
  cell(ws, 8, 5, 'INVOICE METADATA', { bold: true, fill: BRAND_BLUE_LIGHT, color: BRAND_BLUE });
  rangeBorder(ws, 8, 1, 8, 8);

  merge(ws, 9, 1, 9, 4);
  cell(ws, 9, 1, invoiceData.customerName || '—', { bold: true, color: BRAND_NAVY });
  merge(ws, 9, 5, 9, 8);
  cell(ws, 9, 5, `Invoice Number: ${invoiceData.invoiceNumber || invoiceNumber || '—'}`, { bold: true });

  merge(ws, 10, 1, 10, 4);
  cell(ws, 10, 1, invoiceData.hasGuestGstin ? `GSTIN: ${invoiceData.guestGstin}` : 'Customer GST: Unregistered / None');
  merge(ws, 10, 5, 10, 8);
  cell(ws, 10, 5, `Invoice Date: ${dateDisplay}`);

  merge(ws, 11, 1, 11, 4);
  const totalGuests = (invoiceData.members || 0) + (invoiceData.children || 0) + (invoiceData.free || 0);
  cell(ws, 11, 1, `Total Guests: ${totalGuests} (${invoiceData.members || 0} Adults + ${invoiceData.children || 0} Children${invoiceData.free > 0 ? ` + ${invoiceData.free} Free` : ''})`);
  merge(ws, 11, 5, 11, 8);
  cell(ws, 11, 5, `Place of Supply: ${invoiceData.seller?.stateName || ''} (${invoiceData.seller?.stateCode || ''})`);

  merge(ws, 12, 1, 12, 4);
  cell(ws, 12, 1, `Package: ${invoiceData.packageLabel || '—'}`);
  merge(ws, 12, 5, 12, 8);
  cell(ws, 12, 5, `Rate per Member: ${formatINR2Export(t.packageRate)} / adult`);
  rangeBorder(ws, 8, 1, 12, 8);

  let row = 14;
  row = itemsBlock(ws, row, 'Stay & Package Breakdown', [
    { name: `${invoiceData.packageLabel} Package (Adults)`, qty: invoiceData.members, rate: t.packageRate },
    ...(invoiceData.children > 0 ? [{ name: 'Children (50% Rate)', qty: invoiceData.children, rate: t.childRate }] : []),
    ...(invoiceData.free > 0 ? [{ name: 'Complimentary Free Guests', qty: invoiceData.free, rate: 0 }] : [])
  ], t.packageTotal, 'Description');
  row++;

  if (invoiceData.extraFood && invoiceData.extraFood.length) {
    row = itemsBlock(ws, row, 'Additional Food & Beverages', invoiceData.extraFood, t.extraFoodTotal, 'Item Description');
    row++;
  }
  if (invoiceData.iceCreamItems && invoiceData.iceCreamItems.length) {
    row = itemsBlock(ws, row, 'Ice Cream Orders', invoiceData.iceCreamItems, t.iceCreamTotal, 'Flavor / Item');
    row++;
  }
  if (invoiceData.coolDrinkItems && invoiceData.coolDrinkItems.length) {
    row = itemsBlock(ws, row, 'Soft Drinks & Beverages', invoiceData.coolDrinkItems, t.coolDrinksTotal, 'Beverage Item');
    row++;
  }

  headerBand(ws, row, 'FINANCIAL SETTLEMENT SUMMARY');
  row++;
  summaryRow(ws, row, 'Gross Subtotal', t.grossSubtotal);
  row++;
  summaryRow(
    ws,
    row,
    `Discount (${invoiceData.discountMode === 'percent' ? `${invoiceData.discountValue}%` : 'Fixed'})`,
    t.discountAmount
  );
  row++;
  summaryRow(ws, row, 'Net Taxable Value', t.taxableAmount, { bold: true });
  row++;
  summaryRow(ws, row, `Central GST (CGST) @ ${(t.gstPercent / 2).toFixed(2)}%`, t.cgst);
  row++;
  summaryRow(ws, row, `State GST (SGST) @ ${(t.gstPercent / 2).toFixed(2)}%`, t.sgst);
  row++;
  summaryRow(ws, row, 'Total GST Output', t.gstAmount);
  row++;
  summaryRow(ws, row, 'GRAND TOTAL INVOICE VALUE', t.grandTotal, { bold: true, fill: BRAND_NAVY });
  row++;
  summaryRow(ws, row, 'Amount Received / Paid', t.received, { bold: true, color: SUCCESS_GREEN });
  row++;
  summaryRow(ws, row, 'Outstanding Balance Due', t.balance, { bold: true, color: (t.balance || 0) > 0 ? DANGER_RED : SUCCESS_GREEN });
  row++;
  row++;

  merge(ws, row, 1, row, 8);
  cell(ws, row, 1, `Amount in Words: ${numberToWords(t.grandTotal || 0)}`, {
    bold: true,
    color: BRAND_NAVY,
    border: false,
    wrap: true,
    height: 28
  });
  row++;
  row++;

  if (invoiceData.showSignatory) {
    merge(ws, row, 5, row, 8);
    cell(ws, row, 5, `For ${invoiceData.seller?.name || 'Moon Light Resort'}`, { bold: true, color: BRAND_NAVY, border: false });
    row += 3;
    merge(ws, row, 5, row, 8);
    cell(ws, row, 5, 'Authorized Signatory', { border: false, color: TEXT_MUTED });
    row++;
    merge(ws, row, 5, row, 8);
    cell(ws, row, 5, invoiceData.signatoryName || 'Authorized Signatory', { bold: true, color: BRAND_BLUE, border: false });
  }
  row++;
  row++;

  merge(ws, row, 1, row, 8);
  cell(ws, row, 1, `MOON LIGHT RESORT  •  GSTIN ${invoiceData.seller?.gstin || ''}  •  ${invoiceData.seller?.stateCode || ''} - ${invoiceData.seller?.stateName || ''}`, {
    bold: true,
    color: BRAND_NAVY,
    size: 9.5,
    fill: BRAND_BLUE_LIGHT,
    border: false,
    align: 'center',
    height: 22
  });

  ws.pageSetup = {
    orientation: 'portrait',
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
  };
  ws.pageSetup.printArea = `A1:H${row}`;
  ws.views = [{ showGridLines: false }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = downloadFileName(invoiceNumber || invoiceData.invoiceNumber || 'NEW', invoiceData.customerName, 'xlsx');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return a.download;
}

function formatINR2Export(n) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
}