const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const SIZE = 512;
const SS = 4;
const INDIGO = [79, 70, 229];
const GOLD = [251, 191, 36];
const STARS = [
  [176, 138, 11],
  [138, 210, 6],
  [205, 92, 5],
  [352, 148, 5],
  [384, 292, 7],
  [298, 372, 6],
  [120, 300, 5],
  [250, 108, 4]
];

function sampleColor(x, y) {
  const dx = x - 256;
  const dy = y - 256;
  if (dx * dx + dy * dy > 240 * 240) return null;
  let col = INDIGO;
  const d1 = Math.hypot(x - 268, y - 252);
  const d2 = Math.hypot(x - 302, y - 218);
  if (d1 <= 112 && d2 > 97) col = GOLD;
  for (let i = 0; i < STARS.length; i++) {
    const s = STARS[i];
    if (Math.hypot(x - s[0], y - s[1]) <= s[2]) col = [255, 255, 255];
  }
  return col;
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const pixels = Buffer.alloc(SIZE * SIZE * 4);
const samples = SS * SS;
for (let py = 0; py < SIZE; py++) {
  for (let px = 0; px < SIZE; px++) {
    let r = 0, g = 0, b = 0, a = 0, hits = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const c = sampleColor(px + (sx + 0.5) / SS, py + (sy + 0.5) / SS);
        if (c) {
          r += c[0];
          g += c[1];
          b += c[2];
          a += 255;
          hits++;
        }
      }
    }
    const i = (py * SIZE + px) * 4;
    if (hits) {
      pixels[i] = Math.round(r / hits);
      pixels[i + 1] = Math.round(g / hits);
      pixels[i + 2] = Math.round(b / hits);
      pixels[i + 3] = Math.round(a / samples);
    }
  }
}

const stride = SIZE * 4 + 1;
const raw = Buffer.alloc(SIZE * stride);
for (let y = 0; y < SIZE; y++) {
  raw[y * stride] = 0;
  pixels.copy(raw, y * stride + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);

const out = path.join(__dirname, '..', 'src', 'assets', 'moon-light-resort-logo.png');
fs.writeFileSync(out, png);
console.log('Logo written:', out, png.length, 'bytes');
