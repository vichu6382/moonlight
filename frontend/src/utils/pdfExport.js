import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { downloadFileName } from './format';

if (typeof window !== 'undefined') {
  window.html2canvasExport = html2canvas;
}

function triggerDownload(pdf, filename) {
  try {
    pdf.save(filename);
  } catch (err) {
    console.warn('pdf.save failed, triggering fallback download:', err);
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

export async function exportInvoiceToPDF(element, invoiceNumber, onProgress, customerName = '') {
  if (!element) {
    const fallbackSheet = document.querySelector('.invoice-sheet');
    if (fallbackSheet) {
      element = fallbackSheet;
    } else {
      throw new Error('Invoice preview element not found');
    }
  }

  onProgress && onProgress('Capturing invoice…');

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready.catch(() => {});
  }

  // Pre-load all images
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 2000);
      });
    })
  );

  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFFFF',
    logging: false,
    onclone: (clonedDoc, clonedElement) => {
      if (clonedElement) {
        clonedElement.style.transform = 'none';
        clonedElement.style.width = '794px';
        clonedElement.style.minWidth = '794px';
        clonedElement.style.maxWidth = '794px';
        clonedElement.style.margin = '0 auto';
        clonedElement.style.boxShadow = 'none';
      }
      // Reset any preview-scale wrapper in cloned doc
      const innerScale = clonedDoc.querySelector('.preview-scale-inner');
      if (innerScale) {
        innerScale.style.transform = 'none';
        innerScale.style.width = '794px';
        innerScale.style.height = 'auto';
      }
    }
  });

  onProgress && onProgress('Building PDF…');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 0;

  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(
    canvas.toDataURL('image/jpeg', 0.95),
    'JPEG',
    margin,
    position,
    imgWidth,
    imgHeight,
    undefined,
    'FAST'
  );
  heightLeft -= pageHeight;

  while (heightLeft > 2) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.95),
      'JPEG',
      margin,
      position,
      imgWidth,
      imgHeight,
      undefined,
      'FAST'
    );
    heightLeft -= pageHeight;
  }

  const filename = downloadFileName(invoiceNumber || 'NEW', customerName, 'pdf');
  triggerDownload(pdf, filename);
  return filename;
}