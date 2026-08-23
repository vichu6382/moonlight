import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const downloadsDir = process.env.DOWNLOADS_DIR;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage({ acceptDownloads: true });
  const consoleErrors = [];
  const consoleAll = [];
  page.on('console', (msg) => {
    consoleAll.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

  await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 });

  const title = await page.title();
  console.log('Page title:', title);

  await sleep(600);

  const fill = async (label, value) => {
    const el = await page.evaluateHandle((lbl, val) => {
      const labels = Array.from(document.querySelectorAll('label'));
      const lab = labels.find((l) => l.textContent.includes(lbl));
      if (!lab) return null;
      const container = lab.closest('.field') || lab.parentElement;
      const input = container ? container.querySelector('input:not([type=checkbox]), select, textarea') : null;
      if (!input) return null;
      const proto = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return input;
    }, label, String(value));
    if (await el.jsonValue() === null) throw new Error('Field not found: ' + label);
  };

  const fillPlaceholder = async (placeholder, value) => {
    const ok = await page.evaluate((ph, val) => {
      const input = Array.from(document.querySelectorAll('input')).find((i) => i.placeholder === ph);
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }, placeholder, String(value));
    if (!ok) throw new Error('Placeholder input not found: ' + placeholder);
  };

  const clickButtonWithText = async (text) => {
    const clicked = await page.evaluate((txt) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((x) => x.textContent.trim().startsWith(txt));
      if (!b) return false;
      b.click();
      return true;
    }, text);
    if (!clicked) throw new Error('Button not found: ' + text);
  };

  const openSection = async (title) => {
    const ok = await page.evaluate((t) => {
      const btns = Array.from(document.querySelectorAll('.form-section-header'));
      const b = btns.find((x) => x.textContent.includes(t));
      if (!b) return false;
      const body = b.nextElementSibling;
      if (!body || !body.classList.contains('form-section-body')) {
        b.click();
        return true;
      }
      if (body.querySelectorAll('*').length === 0) b.click();
      return true;
    }, title);
    if (!ok) throw new Error('Section not found: ' + title);
    await sleep(200);
  };

  const dialogHandler = async (dialog) => { await dialog.accept(); };
  page.on('dialog', dialogHandler);

  await fill('Customer Name', 'E3 INNOVATIONS');
  await fill('Guest GST Number', '33AACCC1234Q1Z8');
  await fill('Invoice Number', 'MLR-2026-0001');
  await fill('Head Count (Adults)', 10);
  await fill('Package Price', 1500);
  await fill('Discount %', 0);
  await fill('GST %', 18);
  await fill('Received Amount', 20000);

  // Discount as fixed amount mode
  await clickButtonWithText('Fixed Amount');
  await sleep(150);
  await fill('Discount Amount', 1000);

  // Extra food
  await openSection('Extra Food');
  await clickButtonWithText('+ Add Item');
  await sleep(100);
  await fillPlaceholder('e.g. Chicken Biriyani', 'Chicken Biriyani');
  await sleep(100);

  // Ice cream
  await openSection('Ice Cream');
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const l = labels.find((x) => x.textContent.includes('ice cream billing'));
    l.click();
  });
  await sleep(150);
  await clickButtonWithText('+ Add Ice Cream');
  await sleep(100);

  // Cool drinks
  await openSection('Cool Drinks');
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const l = labels.find((x) => x.textContent.includes('cool drinks billing'));
    l.click();
  });
  await sleep(150);
  await clickButtonWithText('+ Add Cool Drink');
  await sleep(100);

  // Ice cream: select Chocolate
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const sel = selects.find((s) => Array.from(s.options).some((o) => o.value === 'Chocolate'));
    if (sel) {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'Chocolate');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  // Cool drink: select Coke
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const sel = selects.find((s) => Array.from(s.options).some((o) => o.value === 'Coke'));
    if (sel) {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'Coke');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(150);

  // Fill qty/rates on the item rows (third qty input, etc.)
  const setRowInputs = async (kind, qtyVal, rateVal) => {
    await page.evaluate(({ k, q, r }) => {
      const editors = Array.from(document.querySelectorAll('.item-editor'));
      const ed = editors.find((e) => {
        const txt = e.querySelector('.item-editor-head span:first-child');
        return txt && txt.textContent.includes(k);
      });
      if (!ed) return false;
      const inputs = ed.querySelectorAll('input[type=number]');
      const names = ed.querySelectorAll('input[type=text]');
      const inputProto = HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(inputProto, 'value').set;
      const fire = (el, v) => { setter.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
      if (names.length && !names[0].value) {
        if (k === 'Food') fire(names[0], 'Chicken Biriyani');
        if (k === 'Ice') fire(names[0], 'Chocolate');
        if (k === 'Cool') fire(names[0], 'Coke');
      }
      if (inputs.length >= 2) {
        fire(inputs[0], q);
        fire(inputs[1], r);
      }
      return true;
    }, { k: kind, q: qtyVal, r: rateVal });
  };

  await setRowInputs('Food', 5, 250);
  await setRowInputs('Ice', 10, 80);
  await setRowInputs('Cool', 10, 50);
  await sleep(400);

  // Read the price summary from the preview
  const summary = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.invoice-summary-table tr'));
    const data = {};
    rows.forEach((tr) => {
      const tds = tr.querySelectorAll('td');
      if (tds.length === 2) data[tds[0].textContent.trim()] = tds[1].textContent.trim();
    });
    const words = document.querySelector('.invoice-amount-words-value');
    const itemsTables = Array.from(document.querySelectorAll('.invoice-table tbody'));
    const packageRow = itemsTables[0] ? itemsTables[0].querySelector('td') : null;
    return {
      summary: data,
      amountInWords: words ? words.textContent.trim() : null,
      packageCell: packageRow ? packageRow.textContent.trim() : null
    };
  });
  console.log('SUMMARY', JSON.stringify(summary, null, 2));

  // Child half-price check: subtotal 17550 + 2 children x 750 (half of 1500) = 19050
  await fill('Child Count', 2);
  await sleep(250);
  const childSubtotal = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.invoice-summary-table tr'));
    const r = rows.find((tr) => tr.querySelector('td')?.textContent.includes('Subtotal'));
    return r ? r.querySelectorAll('td')[1].textContent.trim() : null;
  });
  console.log('CHILD PRICING CHECK: Subtotal with 2 children =', childSubtotal, '| expected ₹19,050.00');
  if (childSubtotal !== '₹19,050.00') throw new Error('Child half-price calculation failed: ' + childSubtotal);
  await fill('Child Count', 0);
  await sleep(250);

  // Extra food line items
  const extraFoodLines = await page.evaluate(() => {
    const heads = Array.from(document.querySelectorAll('.invoice-table thead tr:first-child th'));
    const idx = heads.findIndex((h) => h.textContent.includes('EXTRA FOOD'));
    if (idx < 0) return null;
    const rows = Array.from(document.querySelectorAll('.invoice-table'))[idx].querySelectorAll('tbody tr');
    return Array.from(rows).map((r) => Array.from(r.querySelectorAll('td')).map((td) => td.textContent.trim()));
  });
  console.log('EXTRA FOOD ROWS', JSON.stringify(extraFoodLines));

  // Verify date format
  const dateText = await page.evaluate(() => {
    const p = Array.from(document.querySelectorAll('.invoice-info-col p')).find((x) => x.textContent.startsWith('Date'));
    return p ? p.textContent : null;
  });
  console.log('DATE LINE:', dateText);

  // New invoice test
  await clickButtonWithText('New Invoice');
  await sleep(400);
  const invNo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    return inputs.find((i) => i.value.startsWith('MLR-')) ? inputs.find((i) => i.value.startsWith('MLR-')).value : null;
  });
  console.log('NEW INVOICE NUMBER:', invNo);

  // Fill again for downloads and verify downloads
  await fill('Customer Name', 'E3 INNOVATIONS');
  await fill('Guest GST Number', '33AACCC1234Q1Z8');
  await fill('Head Count (Adults)', 10);
  await fill('Received Amount', 20000);
  await openSection('Extra Food');
  await clickButtonWithText('+ Add Item');
  await sleep(100);
  await fillPlaceholder('e.g. Chicken Biriyani', 'Chicken Biriyani');
  await setRowInputs('Food', 5, 250);
  await openSection('Ice Cream');
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const l = labels.find((x) => x.textContent.includes('ice cream billing'));
    l.click();
  });
  await sleep(150);
  await clickButtonWithText('+ Add Ice Cream');
  await sleep(100);
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const sel = selects.find((s) => Array.from(s.options).some((o) => o.value === 'Chocolate'));
    if (sel) {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'Chocolate');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await setRowInputs('Ice', 10, 80);
  await openSection('Cool Drinks');
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const l = labels.find((x) => x.textContent.includes('cool drinks billing'));
    l.click();
  });
  await sleep(150);
  await clickButtonWithText('+ Add Cool Drink');
  await sleep(100);
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const sel = selects.find((s) => Array.from(s.options).some((o) => o.value === 'Coke'));
    if (sel) {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'Coke');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await setRowInputs('Cool', 10, 50);
  await sleep(500);

  const grandTotal = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.invoice-summary-table tr'));
    const row = rows.find((r) => r.querySelector('td') && r.querySelector('td').textContent.includes('Grand Total'));
    return row ? row.querySelectorAll('td')[1].textContent.trim() : null;
  });
  console.log('GRAND TOTAL (pre-download):', grandTotal);

  const fs = await import('fs');
  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadsDir,
    eventsEnabled: true
  });

  const download = async (buttonText) => {
    const before = new Set(fs.readdirSync(downloadsDir));
    await clickButtonWithText(buttonText);
    let filename = null;
    for (let i = 0; i < 90; i++) {
      await sleep(1000);
      const files = fs.readdirSync(downloadsDir).filter((f) => !f.endsWith('.crdownload'));
      const fresh = files.filter((f) => !before.has(f));
      if (fresh.length) {
        filename = fresh[0];
        break;
      }
      const toast = await page.evaluate(() => {
        const t = document.querySelector('.toast');
        return t ? t.textContent : null;
      });
      if (toast && toast.startsWith('Export failed')) break;
    }
    if (!filename) {
      const toast = await page.evaluate(() => {
        const t = document.querySelector('.toast');
        return t ? t.textContent : null;
      });
      console.log('TOAST at failure:', toast);
      console.log('CONSOLE (last 15):', JSON.stringify(consoleAll.slice(-15), null, 2));
      throw new Error('Download did not appear: ' + buttonText);
    }
    await sleep(1500);
    const size = fs.statSync(`${downloadsDir}\\${filename}`).size;
    console.log(`DOWNLOAD ${buttonText}: name=${filename} size=${size}`);
    return { filename, size };
  };

  const pdf = await download('Download PDF');
  const excel = await download('Download Excel');

  console.log('CONSOLE ERRORS:', consoleErrors.length ? consoleErrors : 'none');
  await browser.close();
}

main().catch((e) => {
  console.error('SMOKE TEST FAILED:', e.message);
  process.exit(1);
});