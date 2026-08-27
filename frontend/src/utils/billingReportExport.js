import jsPDF from 'jspdf';
import { formatDateDDMMYYYY, formatINR } from './format';

// Modern Coastal Calm Brand Palette for PDF
const BRAND_NAVY = [15, 23, 42];        // #0F172A
const BRAND_BLUE = [37, 99, 235];       // #2563EB
const BRAND_LIGHT_BG = [248, 250, 252]; // #F8FAFC
const BRAND_CARD_BG = [255, 255, 255];
const BORDER_COLOR = [226, 232, 240];    // #E2E8F0
const TEXT_MAIN = [15, 23, 42];          // Slate 900
const TEXT_MUTED = [100, 116, 139];      // Slate 500

const STATUS_GREEN = [5, 150, 105];      // #059669
const STATUS_GREEN_BG = [236, 253, 245];
const STATUS_AMBER = [217, 119, 6];      // #D97706
const STATUS_AMBER_BG = [255, 251, 235];
const STATUS_RED = [220, 38, 38];        // #DC2626
const STATUS_RED_BG = [254, 242, 242];

function triggerDownload(pdf, filename) {
  try {
    pdf.save(filename);
  } catch (err) {
    console.warn('pdf.save failed, trying blob trigger fallback:', err);
    try {
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (fallbackErr) {
      console.error('All PDF download mechanisms failed:', fallbackErr);
      throw fallbackErr;
    }
  }
}

export function exportBillingReportPDF(invoices = [], filters = {}) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;
  let pageNum = 1;

  const addPage = () => {
    pdf.addPage();
    pageNum += 1;
    y = margin;
    drawHeader(false);
    drawFooter();
  };

  const checkPage = (needed) => {
    if (y + needed > 275) addPage();
  };

  const getStatusTokens = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return { color: STATUS_GREEN, bg: STATUS_GREEN_BG, label: 'PAID' };
    if (s === 'partial') return { color: STATUS_AMBER, bg: STATUS_AMBER_BG, label: 'PARTIAL' };
    return { color: STATUS_RED, bg: STATUS_RED_BG, label: 'UNPAID' };
  };

  const drawHeader = (isFirstPage = true) => {
    if (isFirstPage) {
      // Main Executive Header Band
      pdf.setFillColor(BRAND_NAVY[0], BRAND_NAVY[1], BRAND_NAVY[2]);
      pdf.rect(0, 0, pageWidth, 36, 'F');

      // Electric blue accent bar
      pdf.setFillColor(BRAND_BLUE[0], BRAND_BLUE[1], BRAND_BLUE[2]);
      pdf.rect(0, 36, pageWidth, 1.5, 'F');

      // Title & Branding
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(17);
      pdf.text('MOON LIGHT RESORT', margin, 14);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Luxury Hospitality & Resort Billing Report', margin, 19.5);

      // Report Pill Badge (Top Right)
      const badgeW = 38;
      pdf.setFillColor(BRAND_BLUE[0], BRAND_BLUE[1], BRAND_BLUE[2]);
      pdf.roundedRect(pageWidth - margin - badgeW, 9, badgeW, 7, 3.5, 3.5, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      pdf.text('BILLING REPORT', pageWidth - margin - badgeW / 2, 13.8, { align: 'center' });

      // Metadata Info Line
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(203, 213, 225);
      pdf.text(`Date Generated: ${formatDateDDMMYYYY(new Date().toISOString())}`, pageWidth - margin, 21, { align: 'right' });

      // Filter chips
      const filterParts = [];
      if (filters.year && filters.year !== 'all') filterParts.push(`Year: ${filters.year}`);
      if (filters.month && filters.month !== 'all') filterParts.push(`Month: ${filters.month}`);
      if (filters.status && filters.status !== 'all') filterParts.push(`Status: ${filters.status.toUpperCase()}`);
      if (filters.range) filterParts.push(`Range: ${filters.range}`);
      
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      if (filterParts.length) {
        pdf.text(`Scope: ${filterParts.join('  •  ')}`, margin, 31);
      } else {
        pdf.text('Scope: Full Lifetime History', margin, 31);
      }
      pdf.text(`Total Records: ${invoices.length}`, pageWidth - margin, 31, { align: 'right' });
    } else {
      // Compact continuation header for pages 2+
      pdf.setFillColor(BRAND_NAVY[0], BRAND_NAVY[1], BRAND_NAVY[2]);
      pdf.rect(0, 0, pageWidth, 12, 'F');
      pdf.setFillColor(BRAND_BLUE[0], BRAND_BLUE[1], BRAND_BLUE[2]);
      pdf.rect(0, 12, pageWidth, 0.8, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('MOON LIGHT RESORT — BILLING REPORT', margin, 7.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Continuation — Page ${pageNum}`, pageWidth - margin, 7.5, { align: 'right' });
      y = 18;
    }
  };

  const drawFooter = () => {
    pdf.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    pdf.setLineWidth(0.2);
    pdf.line(margin, 287, pageWidth - margin, 287);

    pdf.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Moon Light Resort Management System  •  Confidential Billing Document', margin, 291.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Page ${pageNum}`, pageWidth - margin, 291.5, { align: 'right' });
  };

  drawHeader(true);
  drawFooter();
  y = 44;

  // Calculate totals
  const totals = {
    bills: invoices.length,
    sales: invoices.reduce((s, i) => s + (i.totals?.grandTotal || 0), 0),
    received: invoices.reduce((s, i) => s + (i.totals?.received || 0), 0),
    gst: invoices.reduce((s, i) => s + (i.gst?.total || 0), 0)
  };
  totals.pending = totals.sales - totals.received;

  // KPI Summary Cards
  const summaryItems = [
    { label: 'Total Invoices', value: String(totals.bills), color: BRAND_NAVY },
    { label: 'Gross Revenue', value: formatINR(totals.sales), color: BRAND_BLUE },
    { label: 'Total GST', value: formatINR(totals.gst), color: [99, 102, 241] },
    { label: 'Collected Amount', value: formatINR(totals.received), color: STATUS_GREEN },
    { label: 'Pending Balance', value: formatINR(totals.pending), color: totals.pending > 0 ? STATUS_RED : STATUS_GREEN }
  ];

  const cardGap = 2.5;
  const cardW = (contentWidth - cardGap * (summaryItems.length - 1)) / summaryItems.length;
  summaryItems.forEach((item, i) => {
    const x = margin + i * (cardW + cardGap);
    pdf.setFillColor(BRAND_CARD_BG[0], BRAND_CARD_BG[1], BRAND_CARD_BG[2]);
    pdf.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    pdf.setLineWidth(0.25);
    pdf.roundedRect(x, y, cardW, 19, 2, 2, 'FD');

    pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
    pdf.roundedRect(x, y, 1.2, 19, 0.6, 0.6, 'F');

    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    pdf.text(item.label.toUpperCase(), x + 4, y + 6.5);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
    pdf.text(item.value, x + 4, y + 14);
  });

  y += 26;

  // Data Table Columns
  const cols = [
    { label: 'Invoice No', w: 24, align: 'left' },
    { label: 'Date', w: 18, align: 'left' },
    { label: 'Customer Name', w: 35, align: 'left' },
    { label: 'GSTIN', w: 22, align: 'left' },
    { label: 'Guests', w: 12, align: 'center' },
    { label: 'Gross (Rs)', w: 18, align: 'right' },
    { label: 'Received', w: 18, align: 'right' },
    { label: 'Balance', w: 18, align: 'right' },
    { label: 'Status', w: 17, align: 'center' }
  ];

  const colX = [];
  let cx = margin;
  cols.forEach((c) => {
    colX.push(cx);
    cx += c.w;
  });

  // Draw Table Header
  checkPage(12);
  pdf.setFillColor(BRAND_NAVY[0], BRAND_NAVY[1], BRAND_NAVY[2]);
  pdf.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  cols.forEach((col, i) => {
    const tx = col.align === 'right' ? colX[i] + col.w - 2 : col.align === 'center' ? colX[i] + col.w / 2 : colX[i] + 2;
    pdf.text(col.label, tx, y + 5.2, { align: col.align });
  });
  y += 8;

  if (invoices.length === 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    pdf.text('No invoices found matching the selected report filters.', pageWidth / 2, y + 12, { align: 'center' });
    y += 24;
  }

  // Draw Invoices Rows
  invoices.forEach((inv, idx) => {
    checkPage(8);
    if (idx % 2 === 0) {
      pdf.setFillColor(BRAND_LIGHT_BG[0], BRAND_LIGHT_BG[1], BRAND_LIGHT_BG[2]);
      pdf.rect(margin, y, contentWidth, 7.5, 'F');
    }
    pdf.setDrawColor(241, 245, 249);
    pdf.setLineWidth(0.15);
    pdf.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

    const totalGuests = (inv.membersCount || 0) + (inv.childCount || 0) + (inv.freeCount || 0);

    const rowData = [
      { v: inv.invoiceNumber || '—', align: 'left' },
      { v: formatDateDDMMYYYY(inv.invoiceDate), align: 'left' },
      { v: (inv.customer?.name || '—').slice(0, 26), align: 'left' },
      { v: (inv.customer?.gstNumber || '—').slice(0, 15), align: 'left' },
      { v: String(totalGuests), align: 'center' },
      { v: formatINR(inv.totals?.grandTotal), align: 'right' },
      { v: formatINR(inv.totals?.received), align: 'right' },
      { v: formatINR(inv.totals?.balance), align: 'right' }
    ];

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    pdf.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);

    rowData.forEach((cell, ci) => {
      const tx = cell.align === 'right' ? colX[ci] + cols[ci].w - 2 : cell.align === 'center' ? colX[ci] + cols[ci].w / 2 : colX[ci] + 2;
      pdf.text(String(cell.v), tx, y + 5, { align: cell.align });
    });

    // Payment Status Pill
    const token = getStatusTokens(inv.paymentStatus);
    pdf.setFillColor(token.bg[0], token.bg[1], token.bg[2]);
    const sw = 15;
    pdf.roundedRect(colX[8] + (cols[8].w - sw) / 2, y + 1.6, sw, 4.4, 2.2, 2.2, 'F');
    pdf.setTextColor(token.color[0], token.color[1], token.color[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.8);
    pdf.text(token.label, colX[8] + cols[8].w / 2, y + 4.6, { align: 'center' });

    y += 7.5;
  });

  // Executive Report Summary Section at bottom
  checkPage(38);
  y += 6;

  pdf.setFillColor(BRAND_CARD_BG[0], BRAND_CARD_BG[1], BRAND_CARD_BG[2]);
  pdf.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, contentWidth, 38, 3, 3, 'FD');

  pdf.setFillColor(BRAND_NAVY[0], BRAND_NAVY[1], BRAND_NAVY[2]);
  pdf.roundedRect(margin, y, contentWidth, 7, 3, 3, 'F');
  pdf.rect(margin, y + 3, contentWidth, 4, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('EXECUTIVE SETTLEMENT OVERVIEW', pageWidth / 2, y + 4.8, { align: 'center' });

  // Summary Metrics inside box
  const sumItems = [
    { label: 'Total Invoices', value: String(totals.bills), color: BRAND_NAVY },
    { label: 'Total Sales', value: formatINR(totals.sales), color: BRAND_BLUE },
    { label: 'Total GST', value: formatINR(totals.gst), color: [99, 102, 241] },
    { label: 'Settled Amount', value: formatINR(totals.received), color: STATUS_GREEN },
    { label: 'Pending Balance', value: formatINR(totals.pending), color: totals.pending > 0 ? STATUS_RED : STATUS_GREEN }
  ];

  const scardGap = 2.5;
  const scardW = (contentWidth - 12) / 5 - scardGap;
  const sy = y + 10;
  sumItems.forEach((item, i) => {
    const x = margin + 6 + i * (scardW + scardGap);
    pdf.setFillColor(BRAND_LIGHT_BG[0], BRAND_LIGHT_BG[1], BRAND_LIGHT_BG[2]);
    pdf.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(x, sy, scardW, 14, 2, 2, 'FD');
    pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
    pdf.roundedRect(x, sy, scardW, 1, 0.5, 0.5, 'F');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    pdf.text(item.label.toUpperCase(), x + scardW / 2, sy + 5, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
    pdf.text(item.value, x + scardW / 2, sy + 10.5, { align: 'center' });
  });

  // Pending ribbon bar
  const isPending = totals.pending > 0;
  const ribbonBg = isPending ? STATUS_RED_BG : STATUS_GREEN_BG;
  const ribbonColor = isPending ? STATUS_RED : STATUS_GREEN;
  pdf.setFillColor(ribbonBg[0], ribbonBg[1], ribbonBg[2]);
  pdf.roundedRect(margin + 6, sy + 16.5, contentWidth - 12, 7, 2, 2, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(ribbonColor[0], ribbonColor[1], ribbonColor[2]);
  pdf.text(isPending ? 'OUTSTANDING PENDING BALANCE' : 'ALL INVOICES FULLY SETTLED', margin + 10, sy + 21);
  pdf.text(formatINR(totals.pending), pageWidth - margin - 10, sy + 21, { align: 'right' });

  const now = new Date();
  const filename = `Moon-Light-Resort-Billing-Report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.pdf`;
  
  triggerDownload(pdf, filename);
  return filename;
}