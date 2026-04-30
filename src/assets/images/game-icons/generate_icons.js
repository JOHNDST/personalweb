/**
 * Pixel art icon generator for Game.js overlay buttons.
 * Run with: node generate_icons.js
 * Edit the pixel grids below (16 chars per row, 16 rows) and re-run to update icons.
 *
 * Color key:
 *   .  white    (255, 255, 255)
 *   #  black    (  0,   0,   0)
 *   R  red      (220,  80,  50)
 *   B  blue     ( 60, 120, 220)
 *   G  green    ( 60, 180,  60)
 *   L  lt green (100, 220, 100)
 */

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC-32 ────────────────────────────────────────────────────────────────────
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const l = Buffer.alloc(4); l.writeUInt32BE(data.length);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([l, t, data, c]);
}

// ── PNG encoder ───────────────────────────────────────────────────────────────
// '.' is fully transparent; all other colors are opaque [R, G, B, A]
const PALETTE = {
  '.': [  0,   0,   0,   0], // transparent
  '#': [  0,   0,   0, 255],
  'R': [220,  80,  50, 255],
  'B': [ 60, 120, 220, 255],
  'G': [ 60, 180,  60, 255],
  'L': [100, 220, 100, 255],
  'Y': [230, 175,  30, 255], // gold
  'y': [200, 140,  10, 255], // dark gold (shadow)
};

function makePNG(rows) {
  const W = 16, H = 16;
  const raw = Buffer.alloc(H * (1 + W * 4)); // RGBA: 4 bytes per pixel
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 4)] = 0; // filter: None
    for (let x = 0; x < W; x++) {
      const [r, g, b, a] = PALETTE[rows[y][x]] || [0, 0, 0, 0];
      const i = y * (1 + W * 4) + 1 + x * 4;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Icon pixel grids (16 × 16) ────────────────────────────────────────────────
const ICONS = {
  'icon_temperature.png': [
    '................',
    '......###.......',
    '......#.#.......',
    '......#.#.......',
    '......#.#.......',
    '......#R#.......',
    '......#R#.......',
    '.....##R##......',
    '....#RRRRR#.....',
    '....#RRRRR#.....',
    '....#RRRRR#.....',
    '.....#####......',
    '................',
    '................',
    '................',
    '................',
  ],
  'icon_runoff.png': [
    '................',
    '........#.......',
    '.......###......',
    '......#BBB#.....',
    '.....#BBBBB#....',
    '.....#BBBBB#....',
    '....#BBBBBBB#...',
    '....#BBBBBBB#...',
    '....#BBBBBBB#...',
    '.....#BBBBB#....',
    '......#BBB#.....',
    '.......###......',
    '................',
    '................',
    '................',
    '................',
  ],
  'icon_access.png': [
    '................',
    '.......#........',
    '......###.......',
    '.....#GGG#......',
    '....#GGGGG#.....',
    '...#GGGGGGG#....',
    '....#GGGGG#.....',
    '.....#GGG#......',
    '......###.......',
    '.......#........',
    '.......#........',
    '.......#........',
    '................',
    '................',
    '................',
    '................',
  ],
  'icon_grow.png': [
    '................',
    '.......#........',
    '......###.......',
    '.....#####......',
    '.......#........',
    '.......#........',
    '.....#LLL#......',
    '....#LLLLL#.....',
    '....#LLLLL#.....',
    '.....#LLL#......',
    '......###.......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  'icon_coin.png': [
    '................',
    '.....#####......',
    '....#YYYYY#.....',
    '...#YYYYYYY#....',
    '...#YYY#YYY#....',
    '...#YY###YY#....',
    '...#YYY#YYY#....',
    '...#YY###YY#....',
    '...#YYY#YYY#....',
    '...#YYYYYYY#....',
    '....#yyyyy#.....',
    '.....#####......',
    '................',
    '................',
    '................',
    '................',
  ],
};

// ── Write files ───────────────────────────────────────────────────────────────
const outDir = __dirname;
for (const [filename, rows] of Object.entries(ICONS)) {
  const fp = path.join(outDir, filename);
  fs.writeFileSync(fp, makePNG(rows));
  console.log('Created:', fp);
}
