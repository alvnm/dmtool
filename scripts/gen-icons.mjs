#!/usr/bin/env node
/**
 * Genera los iconos PNG de la PWA (192, 512 y apple-touch-icon) sin dependencias:
 * un d20 dorado sobre fondo de mazmorra, codificado a mano en PNG (zlib).
 *
 * Uso: node scripts/gen-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');
const SS = 4; // supermuestreo para suavizar bordes

// ---------------------------------------------------------------- PNG writer
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
};

const encodePng = (rgba, width, height) => {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filtro None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

// ------------------------------------------------------------- geometría
const BG_A = [11, 12, 16]; // #0b0c10
const BG_B = [26, 29, 38]; // #1a1d26
const GOLD = [245, 158, 11]; // #f59e0b
const GOLD_SOFT = [217, 119, 6];

const distToSegment = (px, py, ax, ay, bx, by) => {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const len2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
  const dx = px - (ax + t * vx);
  const dy = py - (ay + t * vy);
  return Math.hypot(dx, dy);
};

/** Distancia firmada a un polígono regular (negativa dentro). */
const distToPolygon = (px, py, cx, cy, radius, sides, rotation) => {
  let max = -Infinity;
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i * 2 * Math.PI) / sides;
    const nx = Math.cos(a);
    const ny = Math.sin(a);
    // apotema del polígono regular
    const apothem = radius * Math.cos(Math.PI / sides);
    const d = (px - cx) * nx + (py - cy) * ny - apothem;
    if (d > max) max = d;
  }
  return max;
};

/** Distancia firmada a un rectángulo redondeado (negativa dentro). */
const distToRoundRect = (px, py, half, radius) => {
  const qx = Math.abs(px) - (half - radius);
  const qy = Math.abs(py) - (half - radius);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - radius;
};

const renderIcon = (size) => {
  const W = size * SS;
  const buf = Buffer.alloc(W * W * 4);
  const cx = W / 2;
  const cy = W / 2;

  const frameInset = W * 0.055;
  const frameHalf = W / 2 - frameInset;
  const frameRadius = W * 0.15;
  const frameThick = W * 0.022;

  const hexRadius = W * 0.3;
  const triRadius = W * 0.17;
  const stroke = W * 0.026;

  // Vértices (punta hacia arriba): 90°, 210°, 330°
  const angles = [Math.PI / 2, Math.PI * 1.5, Math.PI * 5 / 2];
  const hexVerts = angles.map(a => [cx + hexRadius * Math.cos(a), cy - hexRadius * Math.sin(a)]);
  const triVerts = angles.map(a => [cx + triRadius * Math.cos(a), cy - triRadius * Math.sin(a)]);

  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      // 1) fondo con degradado diagonal
      const t = (x + y) / (2 * W);
      let r = BG_A[0] + (BG_B[0] - BG_A[0]) * t;
      let g = BG_A[1] + (BG_B[1] - BG_A[1]) * t;
      let b = BG_A[2] + (BG_B[2] - BG_A[2]) * t;

      // 2) relleno suave del dado
      const dHex = distToPolygon(x, y, cx, cy, hexRadius, 6, Math.PI / 2);
      if (dHex < 0) {
        const glow = 0.12 * (1 - Math.min(1, -dHex / hexRadius) * 0.4);
        r += (GOLD[0] - r) * glow;
        g += (GOLD[1] - g) * glow;
        b += (GOLD[2] - b) * glow;
      }

      let gold = false;

      // 3) marco
      const dFrame = Math.abs(distToRoundRect(x - cx, y - cy, frameHalf, frameRadius)) - frameThick / 2;
      if (dFrame < 0) gold = true;

      // 4) hexágono (cara del d20)
      if (Math.abs(dHex) - stroke / 2 < 0) gold = true;

      // 5) triángulo interior
      const dTri = distToPolygon(x, y, cx, cy, triRadius, 3, Math.PI / 2);
      if (Math.abs(dTri) - stroke / 2 < 0) gold = true;

      // 6) radios que unen el triángulo con el hexágono
      if (gold === false) {
        for (let i = 0; i < 3; i++) {
          const [ax, ay] = triVerts[i];
          const [bx, by] = hexVerts[i];
          if (distToSegment(x, y, ax, ay, bx, by) - stroke / 2 < 0) {
            gold = true;
            break;
          }
        }
      }

      if (gold) {
        // pequeñísima sombra para dar volumen
        const edge = dFrame >= 0 ? 1 : 0.94;
        r = GOLD_SOFT[0] * edge;
        g = GOLD_SOFT[1] * edge;
        b = GOLD_SOFT[2] * edge;
        // brillo hacia el centro del trazo
        const d = Math.min(Math.abs(dFrame), Math.abs(dHex), stroke);
        const shine = 1 - Math.min(1, d / (stroke * 2));
        r += (GOLD[0] - r) * shine * 0.55;
        g += (GOLD[1] - g) * shine * 0.55;
        b += (GOLD[2] - b) * shine * 0.55;
      }

      const idx = (y * W + x) * 4;
      buf[idx] = Math.max(0, Math.min(255, Math.round(r)));
      buf[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      buf[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      buf[idx + 3] = 255;
    }
  }

  // 7) reducción (promedio de SS×SS píxeles)
  const out = Buffer.alloc(size * size * 4);
  const area = SS * SS;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const idx = ((y * SS + sy) * W + (x * SS + sx)) * 4;
          r += buf[idx];
          g += buf[idx + 1];
          b += buf[idx + 2];
          a += buf[idx + 3];
        }
      }
      const o = (y * size + x) * 4;
      out[o] = Math.round(r / area);
      out[o + 1] = Math.round(g / area);
      out[o + 2] = Math.round(b / area);
      out[o + 3] = Math.round(a / area);
    }
  }
  return encodePng(out, size, size);
};

const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
  ['icon-256.png', 256],
];

mkdirSync(OUT, { recursive: true });
for (const [name, size] of targets) {
  writeFileSync(join(OUT, name), renderIcon(size));
  console.log(`✓ ${name} (${size}x${size})`);
}
