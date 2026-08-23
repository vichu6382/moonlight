import fs from 'fs';
import path from 'path';

const dir = 'C:\\Users\\VICHU\\AppData\\Local\\Temp\\opencode\\mlr-downloads';
const files = fs.readdirSync(dir).filter((f) => !f.endsWith('.crdownload'));
for (const f of files) {
  console.log('===', f, fs.statSync(path.join(dir, f)).size, 'bytes');
}

async function unzipToText(file) {
  const { default: AdmZip } = await import('adm-zip');
  const zip = new AdmZip(path.join(dir, file));
  const names = zip.getEntries().map((e) => e.entryName);
  return { zip, names };
}

function checkDocx(file, checks) {
  const { zip } = awaitUnzip(file);
  const xml = zip.readAsText('word/document.xml');
  const results = {};
  for (const [label, needle] of Object.entries(checks)) {
    results[label] = xml.includes(needle);
  }
  console.log('DOCX checks:', JSON.stringify(results));
}

function checkXlsx(file, checks) {
  const { zip } = awaitUnzip(file);
  let text = '';
  const names = zip.getEntries().map((e) => e.entryName);
  for (const n of names) {
    if (n.endsWith('.xml') && !n.includes('_rels')) {
      text += zip.readAsText(n);
    }
  }
  const results = {};
  for (const [label, needle] of Object.entries(checks)) {
    results[label] = text.includes(needle);
  }
  console.log('XLSX checks:', JSON.stringify(results));
  console.log('XLSX sheets:', names.filter((n) => n.includes('worksheets')).join(','));
}

function checkPdf(file) {
  const buf = fs.readFileSync(path.join(dir, file));
  const head = buf.subarray(0, 8).toString();
  const pageCount = (buf.toString('latin1').match(/\/Count\s+(\d+)/) || [])[1];
  const size = buf.toString('latin1').match(/\/MediaBox\s+\[([^\]]+)\]/);
  console.log('PDF head:', head, '| pages:', pageCount, '| MediaBox:', size ? size[1] : 'n/a');
}

const xlsxFile = files.find((f) => f.endsWith('.xlsx'));
const pdfFile = files.find((f) => f.endsWith('.pdf'));

const xlsxChecks = {
  'resort name': 'MOON LIGHT RESORT',
  'customer E3 INNOVATIONS': 'E3 INNOVATIONS',
  'guest GSTIN': '33AACCC1234Q1Z8',
  'invoice number MLR-2026-0002': 'MLR-2026-0002',
  'food biriyani': 'Chicken Biriyani',
  'ice cream chocolate': 'Chocolate',
  'cool drink coke': 'Coke',
  'terms': 'Thank you for doing business with us.',
  'signatory manager': 'Manager'
};

const { zip: zx, names: xn } = await unzipToText(xlsxFile);
let xtext = '';
for (const n of xn) {
  if (n.endsWith('.xml') && !n.includes('_rels')) xtext += zx.readAsText(n);
}
const xlsxResults = {};
for (const [label, needle] of Object.entries(xlsxChecks)) xlsxResults[label] = xtext.includes(needle);
const hasFormula = xtext.includes('<f>');
const hasCurrencyFormat = xtext.includes('"₹"#,##0.00') || xtext.includes('&quot;₹&quot;#,##0.00');
const hasThemeFills = ['4338CA', 'F59E0B', 'EEF2FF', 'FFFBEB', '312E81'].every((c) => xtext.includes(c));
console.log('XLSX checks:', JSON.stringify(xlsxResults, null, 1));
console.log('XLSX formulas present:', hasFormula, '| currency format present:', hasCurrencyFormat, '| theme fills present:', hasThemeFills);
console.log('XLSX worksheets:', xn.filter((n) => n.includes('worksheets')).join(','));

checkPdf(pdfFile);