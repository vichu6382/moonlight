import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { getLogoBase64 } from './logoHelper';
import { formatDateDDMMYYYY, downloadFileName } from './format';
import { numberToWords } from './numberToWords';

const INDIGO = '4338CA';
const INDIGO_DARK = '312E81';
const GOLD = 'F59E0B';
const GOLD_TINT = 'FFFBEB';
const LAVENDER = 'EEF2FF';
const LIGHT_BG = 'F8FAFF';
const BORDER = { style: 'thin', color: { argb: 'FFC7CBD9' } };
const CURRENCY = '"₹"#,##0.00';

const COLS = [
  { header: '', key: 'a', width: 30 },
  { header: '', key: 'b', width: 14 },
  { header: '', key: 'c', width: 14 },
  { header: '', key: 'd', width: 16 },
  { header: '', key: 'e', width: 16 },
  { header: '', key: 'f', width: 14 },
  { header: '', key: 'g', width: 14 },
  { header: '', key: 'h', width: 14 }
];

function merge(ws, r1, c1, r2, c2) {
  ws.mergeCells(r1, c1, r2, c2);
}

function cell(ws, row, col, value, opts = {}) {
  const c = ws.getCell(row, col);
  c.value = value;
  const color = (opts.color || '1F2937').replace('#', 'FF');
  c.font = {
    bold: !!opts.bold,
    size: opts.size || 10.5,
    color: { argb: color }
  };
  if (opts.fill) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill.replace('#', 'FF') } };
  c.alignment = {
    horizontal: opts.align || 'left',
    vertical: 'middle',
    wrapText: !!opts.wrap
  };
  if (opts.format) c.numFmt = opts.format;
  if (opts.border !== false) {
    c.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
  }
  if (opts.height) ws.getRow(row).height = opts.height;
  return c;
}

function rangeBorder(ws, r1, c1, r2, c2) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
    }
  }
}

function band(ws, row, fill, height = 4) {
  merge(ws, row, 1, row, 8);
  cell(ws, row, 1, '', { fill, border: false, height });
}

function headerRow(ws, row, text, height = 24) {
  merge(ws, row, 1, row, 8);
  const c = cell(ws, row, 1, text.toUpperCase(), {
    bold: true,
    fill: INDIGO,
    color: 'FFFFFF',
    size: 11,
    height,
    align: 'left'
  });
  rangeBorder(ws, row, 1, row, 8);
  return c;
}

function itemsBlock(ws, startRow, title, items, total, firstLabel = 'Item') {
  let row = startRow;
  headerRow(ws, row, title.toUpperCase());
  row++;
  merge(ws, row, 1, row, 3);
  cell(ws, row, 1, firstLabel, { bold: true, fill: LAVENDER, color: INDIGO_DARK, height: 22 });
  cell(ws, row, 4, 'Qty', { bold: true, fill: LAVENDER, color: INDIGO_DARK, align: 'center' });
  cell(ws, row, 5, 'Rate', { bold: true, fill: LAVENDER, color: INDIGO_DARK, align: 'right' });
  merge(ws, row, 6, row, 8);
  cell(ws, row, 6, 'Amount', { bold: true, fill: LAVENDER, color: INDIGO_DARK, align: 'right' });
  rangeBorder(ws, row, 1, row, 8);
  row++;

  items.forEach((item, idx) => {
    merge(ws, row, 1, row, 3);
    cell(ws, row, 1, item.name || `Item ${idx + 1}`);
    cell(ws, row, 4, Number(item.qty) || 0, { align: 'center' });
    cell(ws, row, 5, Number(item.rate) || 0, { align: 'right', format: CURRENCY });
    merge(ws, row, 6, row, 8);
    cell(ws, row, 6, { formula: `=D${row}*E${row}` }, { align: 'right', format: CURRENCY });
    rangeBorder(ws, row, 1, row, 8);
    row++;
  });

  merge(ws, row, 1, row, 5);
  cell(ws, row, 1, `${title} Total`, { bold: true, fill: GOLD_TINT, color: '78350F', align: 'right' });
  merge(ws, row, 6, row, 8);
  const firstData = startRow + 2;
  cell(ws, row, 6, { formula: `=SUM(F${firstData}:F${row - 1})` }, {
    bold: true,
    fill: GOLD_TINT,
    color: '78350F',
    align: 'right',
    format: CURRENCY
  });
  rangeBorder(ws, row, 1, row, 8);
  row++;
  return row;
}

function summaryRow(ws, row, label, valueOrFormula, opts = {}) {
  const grand = opts.fill === INDIGO_DARK;
  merge(ws, row, 1, row, 5);
  cell(ws, row, 1, label, {
    bold: grand || opts.bold || opts.fill === GOLD_TINT,
    fill: opts.fill || (opts.bold && !grand ? GOLD_TINT : null),
    color: grand ? 'FFFFFF' : opts.fill === GOLD_TINT ? '78350F' : TEXT_COLOR,
    align: 'right',
    height: grand ? 22 : null
  });
  merge(ws, row, 6, row, 8);
  const v =
    typeof valueOrFormula === 'object' && valueOrFormula.formula
      ? { formula: valueOrFormula.formula }
      : valueOrFormula;
  cell(ws, row, 6, v, {
    bold: grand || opts.bold || opts.fill === GOLD_TINT,
    fill: opts.fill || (opts.bold && !grand ? GOLD_TINT : null),
    color: grand ? 'FFFFFF' : opts.fill === GOLD_TINT ? '78350F' : TEXT_COLOR,
    align: 'right',
    format: CURRENCY
  });
  rangeBorder(ws, row, 1, row, 8);
}

const TEXT_COLOR = '1F2937';

export async function exportInvoiceToExcel(invoiceData, invoiceNumber) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Moon Light Resort Billing System';
  const ws = workbook.addWorksheet('Invoice');
  ws.columns = COLS;

  const t = invoiceData.totals;
  const dateDisplay = formatDateDDMMYYYY(invoiceData.dateISO);
  const logo = await getLogoBase64();

  ws.getRow(1).height = 30;
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 22;

  merge(ws, 1, 1, 3, 1);
  if (logo) {
    const imgId = workbook.addImage({ base64: logo, extension: 'png' });
    ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 78, height: 78 } });
  }
  merge(ws, 1, 2, 1, 8);
  cell(ws, 1, 2, invoiceData.seller.name, { bold: true, color: 'FFFFFF', size: 20, align: 'center', border: false });
  merge(ws, 2, 2, 2, 8);
  cell(ws, 2, 2, 'BOOKING & HOSPITALITY SERVICES', {
    bold: true,
    color: GOLD,
    size: 9.5,
    align: 'center',
    border: false
  });
  merge(ws, 3, 2, 3, 8);
  cell(ws, 3, 2, `${invoiceData.seller.addressLine1} ${invoiceData.seller.addressLine2}`, {
    color: 'E0E7FF',
    size: 9.5,
    align: 'center',
    border: false,
    wrap: true
  });
  ws.getRow(3).height = 32;
  merge(ws, 4, 2, 4, 8);
  cell(ws, 4, 2, `GSTIN: ${invoiceData.seller.gstin}    State: ${invoiceData.seller.stateCode} - ${invoiceData.seller.stateName}`, {
    bold: true,
    color: 'FFFFFF',
    size: 10,
    align: 'center',
    border: false
  });
  ws.getRow(4).height = 20;
  rangeFill(ws, 1, 1, 4, 8, INDIGO);

  ws.getRow(5).height = 5;
  band(ws, 5, GOLD);

  ws.getRow(6).height = 26;
  headerRow(ws, 6, 'TAX INVOICE');

  merge(ws, 8, 1, 8, 4);
  cell(ws, 8, 1, 'BILL TO', { bold: true, fill: LAVENDER, color: INDIGO_DARK, height: 22 });
  merge(ws, 8, 5, 8, 8);
  cell(ws, 8, 5, 'INVOICE DETAILS', { bold: true, fill: LAVENDER, color: INDIGO_DARK });
  rangeBorder(ws, 8, 1, 8, 8);

  merge(ws, 9, 1, 9, 4);
  cell(ws, 9, 1, invoiceData.customerName || '—', { bold: true, color: INDIGO_DARK });
  merge(ws, 9, 5, 9, 8);
  cell(ws, 9, 5, `Invoice No: ${invoiceData.invoiceNumber}`, { bold: true });

  merge(ws, 10, 1, 10, 4);
  cell(ws, 10, 1, invoiceData.hasGuestGstin ? `GSTIN: ${invoiceData.guestGstin}` : 'GST: Unregistered / No GST');
  merge(ws, 10, 5, 10, 8);
  cell(ws, 10, 5, `Date: ${dateDisplay}`);

  merge(ws, 11, 1, 11, 4);
  cell(ws, 11, 1, `Heads: ${invoiceData.members + invoiceData.children} (${invoiceData.members} Adults + ${invoiceData.children} Children${invoiceData.free > 0 ? ` + ${invoiceData.free} Free` : ''})`);
  merge(ws, 11, 5, 11, 8);
  cell(ws, 11, 5, `Place of Supply: ${invoiceData.seller.stateName} (${invoiceData.seller.stateCode})`);

  merge(ws, 12, 1, 12, 4);
  cell(ws, 12, 1, `Package Type: ${invoiceData.packageLabel}`);
  merge(ws, 12, 5, 12, 8);
  cell(ws, 12, 5, `Package Rate: ${formatINR2Export(t.packageRate)} / member`);
  rangeBorder(ws, 8, 1, 12, 8);

  let row = 14;
  row = itemsBlock(ws, row, 'Booking / Package Details', [
    { name: `${invoiceData.packageLabel} Package (Adults)`, qty: invoiceData.members, rate: t.packageRate },
    ...(invoiceData.children > 0
      ? [{ name: 'Children (50% rate)', qty: invoiceData.children, rate: t.childRate }]
      : []),
    ...(invoiceData.free > 0
      ? [{ name: 'Complimentary (Free)', qty: invoiceData.free, rate: 0 }]
      : [])
  ], t.packageTotal, 'Description');
  row++;

  if (invoiceData.extraFood && invoiceData.extraFood.length) {
    row = itemsBlock(ws, row, 'Extra Food', invoiceData.extraFood, t.extraFoodTotal, 'Item');
    row++;
  }
  if (invoiceData.iceCreamItems && invoiceData.iceCreamItems.length) {
    row = itemsBlock(ws, row, 'Ice Cream', invoiceData.iceCreamItems, t.iceCreamTotal, 'Item');
    row++;
  }
  if (invoiceData.coolDrinkItems && invoiceData.coolDrinkItems.length) {
    row = itemsBlock(ws, row, 'Cool Drinks', invoiceData.coolDrinkItems, t.coolDrinksTotal, 'Item');
    row++;
  }

  headerRow(ws, row, 'PRICE SUMMARY');
  row++;
  summaryRow(ws, row, 'Subtotal (Package + Food + Ice Cream + Cool Drinks)', t.grossSubtotal);
  row++;
  summaryRow(
    ws,
    row,
    `Discount (${invoiceData.discountMode === 'percent' ? `${invoiceData.discountValue}%` : 'Fixed'})`,
    t.discountAmount
  );
  row++;
  summaryRow(ws, row, 'Taxable Amount', t.taxableAmount, { bold: true });
  row++;
  summaryRow(ws, row, `CGST @ ${(t.gstPercent / 2).toFixed(2)}%`, t.cgst);
  row++;
  summaryRow(ws, row, `SGST @ ${(t.gstPercent / 2).toFixed(2)}%`, t.sgst);
  row++;
  summaryRow(ws, row, 'Total GST', t.gstAmount);
  row++;
  summaryRow(ws, row, 'Grand Total', t.grandTotal, { bold: true, fill: INDIGO_DARK });
  row++;
  summaryRow(ws, row, 'Received Amount', t.received, { bold: true });
  row++;
  summaryRow(ws, row, 'Balance', t.balance, { bold: true });
  row++;
  row++;

  merge(ws, row, 1, row, 8);
  cell(ws, row, 1, `Amount in Words: ${numberToWords(t.grandTotal)}`, {
    bold: true,
    color: INDIGO_DARK,
    border: false,
    wrap: true,
    height: 30
  });
  row++;
  row++;

  merge(ws, row, 1, row, 8);
  cell(ws, row, 1, 'TERMS AND CONDITIONS', { bold: true, color: INDIGO_DARK, border: false });
  row++;
  merge(ws, row, 1, row, 8);
  cell(ws, row, 1, 'Thank you for doing business with us.', { border: false });
  row++;
  row++;

  if (invoiceData.showSignatory) {
    merge(ws, row, 5, row, 8);
    cell(ws, row, 5, `For ${invoiceData.seller.name}`, { bold: true, color: INDIGO_DARK, border: false });
    row += 3;
    merge(ws, row, 5, row, 8);
    const sigCell = cell(ws, row, 5, 'Authorized Signatory', { border: false, color: '6B7280' });
    row++;
    merge(ws, row, 5, row, 8);
    cell(ws, row, 5, invoiceData.signatoryName, { bold: true, color: INDIGO, border: false });
  }
  row++;
  row++;

  const footerStart = row;
  merge(ws, row, 1, row, 8);
  cell(ws, row, 1, `MOON LIGHT RESORT  •  GSTIN ${invoiceData.seller.gstin}  •  ${invoiceData.seller.stateCode} - ${invoiceData.seller.stateName}`, {
    bold: true,
    color: INDIGO_DARK,
    size: 9.5,
    fill: LAVENDER,
    border: false,
    align: 'center',
    height: 20
  });
  row++;
  merge(ws, row, 1, row, 8);
  cell(ws, row, 1, `${invoiceData.seller.addressLine1} ${invoiceData.seller.addressLine2}`, {
    color: '6B7280',
    size: 9,
    fill: LAVENDER,
    border: false,
    align: 'center',
    height: 16
  });
  const topCell = ws.getCell(footerStart, 1);
  topCell.border = { ...topCell.border, top: { style: 'medium', color: { argb: 'FFF59E0B' } } };

  ws.pageSetup = {
    orientation: 'portrait',
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.2, footer: 0.2 }
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
  a.download = downloadFileName(invoiceNumber, invoiceData.customerName, 'xlsx');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return a.download;
}

function rangeFill(ws, r1, c1, r2, c2, fill) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill.replace('#', 'FF') } };
    }
  }
}

function formatINR2Export(n) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
}