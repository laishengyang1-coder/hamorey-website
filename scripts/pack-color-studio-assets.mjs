#!/usr/bin/env node
// ============================================================
// 和膜 HAMOREY — 3D 选色工坊色库与车模加密打包工具
// 用法：
//   1) 打包 3D 车模 (.glb -> .hmy)：
//      node scripts/pack-color-studio-assets.mjs pack-model <in.glb> <out.hmy>
//   2) 重新加密色库 JSON -> src/config/colorStudioVault.ts：
//      node scripts/pack-color-studio-assets.mjs pack-swatches <swatches.json>
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MODEL_MAGIC = Buffer.from([0x48, 0x4d, 0x52, 0x59, 0x01, 0x00, 0x26, 0x11]); // "HMRY\x01\x00&\x11"
const SCRAMBLE_LEN = 65536;

function nextPrngByte(stateObj) {
  // xorshift32
  let x = stateObj.s >>> 0;
  x ^= (x << 13) >>> 0;
  x ^= x >>> 17;
  x ^= (x << 5) >>> 0;
  stateObj.s = x >>> 0;
  return stateObj.s & 0xff;
}

export function packGlbToHmy(glbBuf) {
  const out = Buffer.allocUnsafe(MODEL_MAGIC.length + glbBuf.length);
  MODEL_MAGIC.copy(out, 0);
  glbBuf.copy(out, MODEL_MAGIC.length);
  const limit = Math.min(glbBuf.length, SCRAMBLE_LEN);
  const st = { s: 0x7a39c4e1 };
  for (let i = 0; i < limit; i++) {
    out[MODEL_MAGIC.length + i] ^= nextPrngByte(st);
  }
  return out;
}

export function encodeSwatchesToBase64(jsonStr) {
  const raw = Buffer.from(jsonStr, 'utf8');
  const out = Buffer.allocUnsafe(raw.length);
  const st = { s: 0x484d5259 };
  for (let i = 0; i < raw.length; i++) {
    const k = nextPrngByte(st);
    const v = raw[i] ^ k;
    out[i] = ((v << 3) | (v >>> 5)) & 0xff;
  }
  return out.toString('base64');
}

const [, , cmd, arg1, arg2] = process.argv;

if (cmd === 'pack-model' && arg1 && arg2) {
  const src = fs.readFileSync(arg1);
  const packed = packGlbToHmy(src);
  fs.mkdirSync(path.dirname(arg2), { recursive: true });
  fs.writeFileSync(arg2, packed);
  const sha = crypto.createHash('sha256').update(src).digest('hex').slice(0, 16);
  console.log(`Packed ${arg1} (${src.length} B, sha256:${sha}...) -> ${arg2} (${packed.length} B)`);
} else if (cmd === 'pack-swatches' && arg1) {
  const jsonText = fs.readFileSync(arg1, 'utf8');
  const parsed = JSON.parse(jsonText);
  const compact = JSON.stringify(parsed);
  const b64 = encodeSwatchesToBase64(compact);
  const outFile = path.resolve('src/config/colorStudioVault.ts');
  const lines = [];
  for (let i = 0; i < b64.length; i += 120) {
    lines.push(`  '${b64.slice(i, i + 120)}',`);
  }
  const content = `// Auto-generated encrypted swatch vault (${parsed.length} shades).
// Update via: node scripts/pack-color-studio-assets.mjs pack-swatches <swatches.json>

export const STUDIO_VAULT_CHUNKS: readonly string[] = [
${lines.join('\n')}
];
`;
  fs.writeFileSync(outFile, content, 'utf8');
  console.log(`Encoded ${parsed.length} swatches -> ${outFile} (${b64.length} base64 chars)`);
} else if (cmd === 'fnv') {
  for (const host of ['hemoppf.cn', 'hhppf.com', 'localhost', '127.0.0.1']) {
    let h = 0x811c9dc5;
    for (let i = 0; i < host.length; i++) {
      h ^= host.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    console.log(host, '-> 0x' + h.toString(16));
  }
}
