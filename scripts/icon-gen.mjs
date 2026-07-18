// 生成 BTW Chat 应用图标：圆角渐变方块 + 矢量方块字 "BTW"
// 输出 build/icon.png (512) / icon-1024.png / icon.ico (多尺寸)
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = __dirname + '/../build';
mkdirSync(OUT, { recursive: true });

// 5x7 方块字位图（1=填充）
const B = ['11110', '10001', '10001', '11110', '10001', '10001', '11110'];
const T = ['11111', '00100', '00100', '00100', '00100', '00100', '00100'];
const W = ['10001', '10001', '10001', '10101', '10101', '10101', '01010'];

function makeSvg(size) {
  const u = size / 1024 * 44;          // 单元格
  const gap = u;                        // 字母间距 = 1 单元
  const cols = 5 + 1 + 5 + 1 + 5;       // 17
  const rows = 7;
  const blockW = cols * u;
  const blockH = rows * u;
  const x0 = (1024 - blockW) / 2;
  const y0 = (1024 - blockH) / 2;
  const letters = [
    { bmp: B, col: 0 },
    { bmp: T, col: 6 },
    { bmp: W, col: 12 },
  ];
  let cells = '';
  for (const L of letters) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 5; c++) {
        if (L.bmp[r][c] === '1') {
          const x = x0 + (L.col + c) * u;
          const y = y0 + r * u;
          const s = (size / 1024);
          cells += `<rect x="${x}" y="${y}" width="${u}" height="${u}" rx="${u * 0.18}"/>`;
        }
      }
    }
  }
  const r = (size / 1024); // 缩放占位（svg 内部固定 1024 坐标）
  void r;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a84ff"/>
      <stop offset="0.55" stop-color="#5b5cf6"/>
      <stop offset="1" stop-color="#bf5af2"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.32"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1024" height="1024" rx="228" fill="url(#bg)"/>
  <rect x="0" y="0" width="1024" height="512" rx="228" fill="url(#gloss)"/>
  <g fill="#ffffff">${cells}</g>
</svg>`;
}

async function renderPng(size) {
  const svg = Buffer.from(makeSvg(size));
  // 不要传 density：SVG 自带 width/height，density 会被按 384/72≈5.33x 放大，
  // 导致 renderPng(512) 实际输出 2731x2731，被 electron-builder 原样放进
  // hicolor/2731x2731/ —— GNOME/KDE 只认标准尺寸目录，图标就不显示了。
  return sharp(svg).png().toBuffer();
}

// 渲染某个尺寸的原始 RGBA（先按 1024 渲染再缩放到精确目标尺寸）
async function renderRaw(size) {
  const svg = Buffer.from(makeSvg(1024));
  const { data, info } = await sharp(svg)
    .resize(size, size, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.width !== size || info.height !== size) {
    throw new Error(`渲染尺寸不对: 期望 ${size}, 得到 ${info.width}x${info.height}`);
  }
  return { data, width: info.width, height: info.height };
}

// 多尺寸 BMP-ICO 编码器（传统格式，兼容所有工具/旧 Windows）
async function buildIco(sizes) {
  const entries = [];
  for (const s of sizes) {
    const { data: rgba, width, height } = await renderRaw(s);
    const xorRowSize = width * 4;                 // 32bpp，无需补齐
    const andRowSize = Math.ceil(width / 8 / 4) * 4; // 1bpp 行补齐到 4 字节
    const xorSize = xorRowSize * height;
    const andSize = andRowSize * height;
    const imageSize = 40 + xorSize + andSize;

    // BITMAPINFOHEADER
    const bih = Buffer.alloc(40);
    bih.writeUInt32LE(40, 0);       // biSize
    bih.writeInt32LE(width, 4);     // biWidth
    bih.writeInt32LE(height * 2, 8);// biHeight（含 AND 掩码，×2）
    bih.writeUInt16LE(1, 12);       // planes
    bih.writeUInt16LE(32, 14);      // bitCount
    bih.writeUInt32LE(0, 16);       // compression
    bih.writeUInt32LE(xorSize + andSize, 20); // biSizeImage
    // 24..40 留 0

    // XOR 像素：RGBA→BGRA，且自底向上
    const xor = Buffer.alloc(xorSize);
    for (let y = 0; y < height; y++) {
      const srcRow = (height - 1 - y);           // 翻转
      for (let x = 0; x < width; x++) {
        const si = (srcRow * width + x) * 4;
        const di = (y * width + x) * 4;
        xor[di] = rgba[si + 2];    // B
        xor[di + 1] = rgba[si + 1];// G
        xor[di + 2] = rgba[si];    // R
        xor[di + 3] = rgba[si + 3];// A
      }
    }
    // AND 掩码：全 0（32bpp 下不影响显示，表不透明）
    const and = Buffer.alloc(andSize);

    entries.push({
      size: s,
      blob: Buffer.concat([bih, xor, and]),
      bytes: imageSize,
    });
  }

  const headerSize = 6 + entries.length * 16;
  let dataOffset = headerSize;
  const parts = [];
  // ICONDIR
  parts.push(Buffer.from([0, 0, 1, 0]));
  parts.push(buf16(entries.length));
  // ICONDIRENTRY
  for (const e of entries) {
    const wh = e.size >= 256 ? 0 : e.size;
    parts.push(Buffer.from([wh, wh, 0, 0, 1, 0, 32, 0]));
    parts.push(buf32(e.bytes));
    parts.push(buf32(dataOffset));
    dataOffset += e.bytes;
  }
  for (const e of entries) parts.push(e.blob);
  return Buffer.concat(parts);
}
function buf16(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; }
function buf32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; }

// 运行
const png512 = await renderPng(512);
const png1024 = await renderPng(1024);
writeFileSync(OUT + '/icon.png', png512);
writeFileSync(OUT + '/icon-1024.png', png1024);
const ico = await buildIco([256, 128, 64, 48, 32, 16]);
writeFileSync(OUT + '/icon.ico', ico);
console.log('✓ icon.png (512), icon-1024.png, icon.ico 已生成于 build/');
console.log('  ico 大小:', ico.length, 'bytes');
