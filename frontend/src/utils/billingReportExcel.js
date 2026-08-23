import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { formatDateDDMMYYYY, formatINR } from './format';

const INDIGO = '4338CA';
const SLATE = '374151';
const GRAY = '6B7280';
const GREEN = '16A34A';
const RED = 'DC2626';
const AMBER = 'D97706';
const LIGHT = 'EEF2FF';
const BORDER = { style: 'thin', color: { argb: 'FFC7CBD9' } };
const CURRENCY = '"Rs "#,##0.00';

function cell(ws, row, col, value, opts = {}) {
  const c = ws.getCell(row, col);
  c.value = value;
  const color = (opts.color || '1F2937').replace('#', 'FF');
  c.font = { bold: !!opts.bold, size: opts.size || 10, color: { argb: color } };
  if (opts.fill) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill.replace('#', 'FF') } };
  c.alignment = { horizontal: opts.align || 'left', vertical: 'middle', wrapText: !!opts.wrap };
  if (opts.format) c.numFmt = opts.format;
  if (opts.border !== false) c.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
}

function merge(ws, r1, c1, r2, c2) {
  ws.mergeCells(r1, c1, r2, c2);
}

const colLetter = (i) => String.fromCharCode(64 + i);

export async function exportBillingReportExcel(invoices, filters = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Moon Light Resort Billing System';
  workbook.created = new Date();
  const ws = workbook.addWorksheet('Billing Report');

  ws.columns = [
    { header: 'Invoice No', key: 'invoiceNo', width: 20 },
    { header: 'Date', key: 'date', width: 13 },
    { header: 'Customer Name', key: 'customer', width: 26 },
    { header: 'Members', key: 'members', width: 10 },
    { header: 'Total Amount', key: 'grandTotal', width: 16 },
    { header: 'Amount Received', key: 'received', width: 16 },
    { header: 'Balance', key: 'balance', width: 15 },
    { header: 'Status', key: 'status', width: 12 }
  ];
  const LAST_COL = 8;

  ws.getRow(1).height = 28;
  merge(ws, 1, 1, 1, LAST_COL);
  cell(ws, 1, 1, 'MOON LIGHT RESORT — BILLING REPORT', { bold: true, color: 'FFFFFF', size: 14, fill: INDIGO, align: 'center', border: false });

  ws.getRow(2).height = 16;
  merge(ws, 2, 1, 2, LAST_COL);
  const filterParts = [];
  if (filters.year && filters.year !== 'all') filterParts.push(`Year: ${filters.year}`);
  if (filters.month && filters.month !== 'all') filterParts.push(`Month: ${filters.month}`);
  if (filters.status && filters.status !== 'all') filterParts.push(`Status: ${filters.status.toUpperCase()}`);
  cell(ws, 2, 1, `Generated: ${formatDateDDMMYYYY(new Date().toISOString())}${filterParts.length ? '   |   ' + filterParts.join('  |  ') : ''}   |   Total Invoices: ${invoices.length}`, { color: GRAY, size: 9, border: false, align: 'center' });

  const totals = {
    sales: invoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0),
    received: invoices.reduce((s, i) => s + (i.totals?.received || 0), 0)
  };
  totals.pending = totals.sales - totals.received;

  ws.getRow(3).height = 18;
  merge(ws, 3, 1, 3, LAST_COL);
  cell(ws, 3, 1, `Total Bills: ${invoices.length}     |     Total Sales: ${formatINR(totals.sales)}     |     Amount Received: ${formatINR(totals.received)}     |     Balance Pending: ${formatINR(totals.pending)}`, { bold: true, color: INDIGO, size: 10, border: false, align: 'center' });

  const headerRow = 4;
  ws.getRow(headerRow).height = 22;
  ws.getRow(headerRow).eachCell((c) => {
    c.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + INDIGO } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
  });

  invoices.forEach((inv, idx) => {
    const row = idx + 5;
    ws.addRow([
      inv.invoiceNumber || '',
      formatDateDDMMYYYY(inv.invoiceDate),
      inv.customer?.name || '',
      (inv.membersCount || 0) + (inv.childCount || 0) + (inv.freeCount || 0),
      inv.totals?.grandTotal || 0,
      inv.totals?.received || 0,
      inv.totals?.balance || 0,
      (inv.paymentStatus || 'unpaid').toUpperCase()
    ]);

    const r = ws.getRow(row);
    r.height = 18;
    r.eachCell((c, ci) => {
      c.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
      if (idx % 2 === 0) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFF' } };
      if (ci <= 3) c.alignment = { horizontal: 'left', vertical: 'middle' };
      else if (ci >= 5 && ci <= 7) {
        c.numFmt = CURRENCY;
        c.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        c.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    const statusCell = r.getCell(8);
    statusCell.font = {
      bold: true,
      color: { argb: inv.paymentStatus === 'paid' ? 'FF' + GREEN : inv.paymentStatus === 'partial' ? 'FF' + AMBER : 'FF' + RED }
    };
  });

  const totalRow = invoices.length + 5;
  ws.addRow([]);
  merge(ws, totalRow, 1, totalRow, 4);
  cell(ws, totalRow, 1, 'TOTAL', { bold: true, fill: LIGHT, color: INDIGO, align: 'right', size: 11 });
  for (let ci = 5; ci <= 7; ci++) {
    const L = colLetter(ci);
    cell(ws, totalRow, ci, { formula: `=SUM(${L}5:${L}${totalRow - 1})` }, { bold: true, fill: LIGHT, color: INDIGO, format: CURRENCY, align: 'right' });
  }
  cell(ws, totalRow, 8, '', { fill: LIGHT });
  ws.getRow(totalRow).height = 22;

  const footerRow = totalRow + 2;
  ws.getRow(footerRow).height = 16;
  merge(ws, footerRow, 1, footerRow, LAST_COL);
  cell(ws, footerRow, 1, 'Prepared by Moon Light Resort — Billing Management System', { color: GRAY, size: 9, border: false, align: 'center' });

  ws.autoFilter = { from: 'A4', to: `${colLetter(LAST_COL)}${totalRow - 1}` };
  ws.views = [{ state: 'frozen', ySplit: 4 }];

  ws.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  a.download = `Moon-Light-Resort-Billing-Report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return a.download;
}