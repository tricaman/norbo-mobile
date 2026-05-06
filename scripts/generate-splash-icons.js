#!/usr/bin/env node
/**
 * One-off generator for splash disc assets.
 *
 * Produces two PNG files (light & dark variants) showing a centered, solid
 * disc on a transparent background. The disc fills the entire image so that
 * `expo-splash-screen`'s `imageWidth` controls its rendered size on screen
 * (1:1 with the disc diameter).
 *
 * Run:
 *   node scripts/generate-splash-icons.js
 *
 * Outputs:
 *   assets/images/splash-disc-light.png
 *   assets/images/splash-disc-dark.png
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ── PNG helpers (no external deps) ───────────────────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// ── Disc renderer ────────────────────────────────────────────────────
function makeCirclePng(size, color) {
  const [r, g, b] = color;
  const radius = size / 2;
  const cx = size / 2 - 0.5;
  const cy = size / 2 - 0.5;

  // RGBA scanlines, each prefixed with a 0 (filter type: None).
  const filtered = Buffer.alloc(size * (1 + size * 4));
  let idx = 0;
  for (let y = 0; y < size; y++) {
    filtered[idx++] = 0;
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      // 1-pixel anti-aliased edge
      let alpha;
      if (d <= radius - 0.5) alpha = 255;
      else if (d >= radius + 0.5) alpha = 0;
      else alpha = Math.round((radius + 0.5 - d) * 255);

      filtered[idx++] = r;
      filtered[idx++] = g;
      filtered[idx++] = b;
      filtered[idx++] = alpha;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idat = zlib.deflateSync(filtered, { level: 9 });
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Output ────────────────────────────────────────────────────────────
const SIZE = 256;
const ASSETS = path.join(__dirname, "..", "assets", "images");

// Match theme.colors.primary in src/theme/index.ts
const LIGHT_PRIMARY = [0x00, 0xb8, 0x4e]; // #00B84E
const DARK_PRIMARY = [0x2e, 0xf0, 0x80]; // #2EF080

fs.writeFileSync(
  path.join(ASSETS, "splash-disc-light.png"),
  makeCirclePng(SIZE, LIGHT_PRIMARY),
);
fs.writeFileSync(
  path.join(ASSETS, "splash-disc-dark.png"),
  makeCirclePng(SIZE, DARK_PRIMARY),
);

console.log("Generated splash discs:");
console.log("  assets/images/splash-disc-light.png");
console.log("  assets/images/splash-disc-dark.png");
