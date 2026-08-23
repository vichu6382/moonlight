import puppeteer from 'puppeteer-core';
import { PNG } from 'pngjs';
import fs from 'fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept());
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));

  const setVal = async (label, val) => {
    await page.evaluate(
      ([l, v]) => {
        const lab = Array.from(document.querySelectorAll('label')).find((x) => x.textContent.includes(l));
        const input = lab.closest('.field').querySelector('input');
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, v);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      },
      [label, String(val)]
    );
  };
  const clickT = async (t) => {
    await page.evaluate((t) => {
      Array.from(document.querySelectorAll('button')).find((x) => x.textContent.trim().startsWith(t)).click();
    }, t);
    await new Promise((r) => setTimeout(r, 150));
  };
  const openSec = async (t) => {
    await page.evaluate((t) => {
      const b = Array.from(document.querySelectorAll('.form-section-header')).find((x) => x.textContent.includes(t));
      if (b && !b.nextElementSibling) b.click();
    }, t);
    await new Promise((r) => setTimeout(r, 200));
  };

  await setVal('Customer Name', 'E3 INNOVATIONS');
  await setVal('Head Count (Adults)', 10);
  await openSec('Extra Food');
  await clickT('+ Add Item');
  await page.evaluate(() => {
    const i = Array.from(document.querySelectorAll('input')).find((x) => x.placeholder.includes('Chicken Biriyani'));
    const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    s.call(i, 'Chicken Biriyani');
    i.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await openSec('Ice Cream');
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('label')).find((x) => x.textContent.includes('ice cream billing')).click();
  });
  await new Promise((r) => setTimeout(r, 150));
  await clickT('+ Add Ice Cream');
  await page.evaluate(() => {
    const sel = Array.from(document.querySelectorAll('select')).find((s) =>
      Array.from(s.options).some((o) => o.value === 'Chocolate')
    );
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, 'Chocolate');
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await openSec('Cool Drinks');
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('label')).find((x) => x.textContent.includes('cool drinks billing')).click();
  });
  await new Promise((r) => setTimeout(r, 150));
  await clickT('+ Add Cool Drink');
  await page.evaluate(() => {
    const sel = Array.from(document.querySelectorAll('select')).find((s) =>
      Array.from(s.options).some((o) => o.value === 'Coke')
    );
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, 'Coke');
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 500));

  const pngData = await page.evaluate(async () => {
    document.body.classList.add('export-capture');
    await new Promise((r) => setTimeout(r, 80));
    const sheet = document.querySelector('.invoice-sheet');
    const canvas = await window.html2canvasExport(sheet);
    document.body.classList.remove('export-capture');
    return canvas.toDataURL('image/png');
  });

  const buf = Buffer.from(pngData.split(',')[1], 'base64');
  const png = PNG.sync.read(buf);
  let white = 0;
  let indigo = 0;
  let gold = 0;
  let dark = 0;
  let total = png.width * png.height;
  for (let i = 0; i < total; i++) {
    const r = png.data[i * 4];
    const g = png.data[i * 4 + 1];
    const b = png.data[i * 4 + 2];
    if (r > 245 && g > 245 && b > 245) white++;
    if (Math.abs(r - 67) < 25 && Math.abs(g - 60) < 25 && Math.abs(b - 202) < 25) indigo++;
    if (r > 230 && g > 170 && b < 110) gold++;
    if (r < 60 && g < 60 && b < 60) dark++;
  }
  console.log('CANVAS:', png.width, 'x', png.height);
  console.log(
    'white:',
    ((white / total) * 100).toFixed(1) + '%',
    '| indigo:',
    ((indigo / total) * 100).toFixed(2) + '%',
    '| gold(logo):',
    ((gold / total) * 100).toFixed(2) + '%',
    '| dark text:',
    ((dark / total) * 100).toFixed(2) + '%'
  );
  const ok = white > 50 && indigo > 2 && gold > 0.05 && dark > 0.3;
  console.log('VISUAL CHECK:', ok ? 'PASS' : 'FAIL');
  await browser.close();
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error('VISUAL CHECK ERROR:', e.message);
  process.exit(1);
});