import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { downloadFileName } from './format';

if (typeof window !== 'undefined') {
  window.html2canvasExport = html2canvas;
}

export async function exportInvoiceToPDF(element, invoiceNumber, onProgress, customerName = '') {
  if (!element) throw new Error('Invoice preview not found');

  onProgress && onProgress('Capturing invoice…');
  await document.fonts.ready;
  await Promise.all(
    Array.from(element.querySelectorAll('img')).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 3000);
          })
    )
  );

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#FFFFFF',
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  onProgress && onProgress('Building PDF…');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 0;

  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 1) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const filename = downloadFileName(invoiceNumber, customerName, 'pdf');
  pdf.save(filename);
  return filename;
}