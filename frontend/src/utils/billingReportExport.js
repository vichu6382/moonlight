import jsPDF from 'jspdf';
import { formatDateDDMMYYYY, formatINR } from './format';

const INDIGO = [67, 56, 202];
const INDIGO_DARK = [49, 46, 129];
const SLATE = [51, 65, 85];
const GRAY = [107, 114, 128];
const GREEN = [16, 185, 129];
const RED = [239, 68, 68];
const AMBER = [245, 158, 11];
const BG_ROW = [248, 250, 255];

export function exportBillingReportPDF(invoices, filters = {}) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;
  let pageNum = 1;

  const addPage = () => {
    pdf.addPage();
    pageNum += 1;
    y = margin;
    drawFooter();
  };

  const checkPage = (needed) => {
    if (y + needed > 272) addPage();
  };

  const statusColor = (status) => {
    if (status === 'paid') return GREEN;
    if (status === 'partial') return AMBER;
    return RED;
  };

  const drawHeader = () => {
    pdf.setFillColor(INDIGO[0], INDIGO[1], INDIGO[2]);
    pdf.rect(0, 0, pageWidth, 34, 'F');
    pdf.setFillColor(99, 102, 241);
    pdf.rect(0, 34, pageWidth, 1, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('MOON LIGHT RESORT', pageWidth / 2, 13, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(199, 210, 254);
    pdf.text('Resort Billing Management System', pageWidth / 2, 18.5, { align: 'center' });

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.2);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(INDIGO[0], INDIGO[1], INDIGO[2]);
    const badgeW = 40;
    pdf.roundedRect(pageWidth / 2 - badgeW / 2, 21.5, badgeW, 6.5, 3.25, 3.25, 'FD');
    pdf.text('BILLING REPORT', pageWidth / 2, 26, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(224, 231, 255);
    pdf.text(`Generated: ${formatDateDDMMYYYY(new Date().toISOString())}`, pageWidth - margin, 31.5, { align: 'right' });

    const filterParts = [];
    if (filters.year && filters.year !== 'all') filterParts.push(`Year: ${filters.year}`);
    if (filters.month && filters.month !== 'all') filterParts.push(`Month: ${filters.month}`);
    if (filters.status && filters.status !== 'all') filterParts.push(`Status: ${filters.status.toUpperCase()}`);
    if (filterParts.length) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(filterParts.join('   |   '), margin, 31.5, { align: 'left' });
    }
  };

  const drawFooter = () => {
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);
    pdf.line(margin, 287, pageWidth - margin, 287);
    pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Moon Light Resort — Billing Management System', margin, 291.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Page ${pageNum}`, pageWidth - margin, 291.5, { align: 'right' });
  };

  drawHeader();
  drawFooter();
  y = 42;

  const totals = {
    bills: invoices.length,
    sales: invoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0),
    received: invoices.reduce((s, i) => s + (i.totals?.received || 0), 0),
    gst: invoices.reduce((s, i) => s + (i.gst?.total || 0), 0)
  };
  totals.pending = totals.sales - totals.received;

  const summaryItems = [
    { label: 'Total Bills', value: String(totals.bills), color: INDIGO },
    { label: 'Total Sales', value: formatINR(totals.sales), color: INDIGO_DARK },
    { label: 'GST Collected', value: formatINR(totals.gst), color: [37, 99, 235] },
    { label: 'Received', value: formatINR(totals.received), color: GREEN },
    { label: 'Pending', value: formatINR(totals.pending), color: totals.pending > 0 ? RED : GREEN }
  ];

  const cardGap = 2.5;
  const cardW = (contentWidth - cardGap * (summaryItems.length - 1)) / summaryItems.length;
  summaryItems.forEach((item, i) => {
    const x = margin + i * (cardW + cardGap);
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, cardW, 18.5, 2.5, 2.5, 'FD');
    pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
    pdf.roundedRect(x, y, 1.3, 18.5, 0.65, 0.65, 'F');
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    pdf.text(item.label.toUpperCase(), x + cardW / 2 + 0.6, y + 6.5, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(item.value, x + cardW / 2 + 0.6, y + 14, { align: 'center' });
  });

  y += 26;

  const cols = [
    { label: 'Invoice No', w: 24, align: 'left' },
    { label: 'Date', w: 17, align: 'left' },
    { label: 'Customer', w: 33, align: 'left' },
    { label: 'GSTIN', w: 22, align: 'left' },
    { label: 'Members', w: 11, align: 'center' },
    { label: 'Total (Rs)', w: 18, align: 'right' },
    { label: 'Received', w: 18, align: 'right' },
    { label: 'Balance', w: 18, align: 'right' },
    { label: 'Status', w: 19, align: 'center' }
  ];

  const colX = [];
  let cx = margin;
  cols.forEach((c) => {
    colX.push(cx);
    cx += c.w;
  });

  checkPage(12);
  pdf.setFillColor(INDIGO[0], INDIGO[1], INDIGO[2]);
  pdf.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  cols.forEach((col, i) => {
    const tx = col.align === 'right' ? colX[i] + col.w - 2 : col.align === 'center' ? colX[i] + col.w / 2 : colX[i] + 2;
    pdf.text(col.label, tx, y + 5.2, { align: col.align });
  });
  y += 8;

  pdf.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);

  if (invoices.length === 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    pdf.text('No invoices found for the selected filters.', pageWidth / 2, y + 10, { align: 'center' });
    y += 20;
  }

  invoices.forEach((inv, idx) => {
    checkPage(8);
    if (idx % 2 === 0) {
      pdf.setFillColor(BG_ROW[0], BG_ROW[1], BG_ROW[2]);
      pdf.rect(margin, y, contentWidth, 7.5, 'F');
    }
    pdf.setDrawColor(241, 245, 249);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

    const rowData = [
      { v: inv.invoiceNumber || '', align: 'left' },
      { v: formatDateDDMMYYYY(inv.invoiceDate), align: 'left' },
      { v: (inv.customer?.name || '').slice(0, 26), align: 'left' },
      { v: (inv.customer?.gstNumber || '').slice(0, 15), align: 'left' },
      { v: String((inv.membersCount || 0) + (inv.childCount || 0) + (inv.freeCount || 0)), align: 'center' },
      { v: formatINR(inv.totals?.grandTotal), align: 'right' },
      { v: formatINR(inv.totals?.received), align: 'right' },
      { v: formatINR(inv.totals?.balance), align: 'right' }
    ];

    rowData.forEach((cell, ci) => {
      const tx = cell.align === 'right' ? colX[ci] + cols[ci].w - 2 : cell.align === 'center' ? colX[ci] + cols[ci].w / 2 : colX[ci] + 2;
      pdf.text(String(cell.v), tx, y + 5, { align: cell.align });
    });

    const status = (inv.paymentStatus || 'unpaid').toUpperCase();
    const sColor = statusColor(inv.paymentStatus);
    pdf.setFillColor(sColor[0], sColor[1], sColor[2]);
    const sw = 16;
    pdf.roundedRect(colX[8] + (cols[8].w - sw) / 2, y + 1.5, sw, 4.6, 2.3, 2.3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.text(status, colX[8] + cols[8].w / 2, y + 4.5, { align: 'center' });
    pdf.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);

    y += 7.5;
  });

  checkPage(30);
  y += 7;

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, contentWidth, 44, 3, 3, 'FD');

  pdf.setFillColor(INDIGO[0], INDIGO[1], INDIGO[2]);
  pdf.roundedRect(margin, y, contentWidth, 8, 3, 3, 'F');
  pdf.setFillColor(INDIGO[0], INDIGO[1], INDIGO[2]);
  pdf.rect(margin, y + 4, contentWidth, 4, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text('REPORT SUMMARY', pageWidth / 2, y + 5.5, { align: 'center' });

  const sumItems = [
    { label: 'Total Bills', value: String(totals.bills), color: INDIGO },
    { label: 'Total Sales', value: formatINR(totals.sales), color: INDIGO_DARK },
    { label: 'Total GST', value: formatINR(totals.gst), color: [37, 99, 235] },
    { label: 'Total Received', value: formatINR(totals.received), color: GREEN },
    { label: 'Total Pending', value: formatINR(totals.pending), color: totals.pending > 0 ? RED : GREEN }
  ];

  const scardGap = 3;
  const scardW = (contentWidth - 14) / 5 - scardGap;
  const sy = y + 13;
  sumItems.forEach((item, i) => {
    const x = margin + 7 + i * (scardW + scardGap);
    pdf.setFillColor(248, 250, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(x, sy, scardW, 16, 2, 2, 'FD');
    pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
    pdf.roundedRect(x, sy, scardW, 1.2, 0.6, 0.6, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    pdf.text(item.label.toUpperCase(), x + scardW / 2, sy + 6, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(item.value, x + scardW / 2, sy + 12.5, { align: 'center' });
  });

  const pendingBg = totals.pending > 0 ? [254, 242, 242] : [236, 253, 245];
  const pendingBorder = totals.pending > 0 ? [254, 202, 202] : [187, 247, 212];
  pdf.setFillColor(pendingBg[0], pendingBg[1], pendingBg[2]);
  pdf.setDrawColor(pendingBorder[0], pendingBorder[1], pendingBorder[2]);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(margin + 7, sy + 19.5, contentWidth - 14, 7.5, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(totals.pending > 0 ? RED[0] : GREEN[0], totals.pending > 0 ? RED[1] : GREEN[1], totals.pending > 0 ? RED[2] : GREEN[2]);
  pdf.text(totals.pending > 0 ? 'PENDING BALANCE' : 'ALL PAYMENTS COMPLETED', margin + 12, sy + 24.3);
  pdf.text(formatINR(totals.pending), pageWidth - margin - 12, sy + 24.3, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  pdf.text(
    totals.pending > 0
      ? `${invoices.length} invoice(s) — ${invoices.filter((i) => (i.paymentStatus || 'unpaid') === 'paid').length} paid, ${invoices.filter((i) => (i.paymentStatus || 'unpaid') === 'partial').length} partial, ${invoices.filter((i) => (i.paymentStatus || 'unpaid') === 'unpaid').length} unpaid`
      : 'All invoices have been fully settled.',
    margin + 7,
    sy + 37
  );

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(INDIGO_DARK[0], INDIGO_DARK[1], INDIGO_DARK[2]);
  pdf.text('MOON LIGHT RESORT', pageWidth - margin - 7, sy + 37, { align: 'right' });

  const now = new Date();
  const filename = `Moon-Light-Resort-Billing-Report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.pdf`;
  pdf.save(filename);
  return filename;
}