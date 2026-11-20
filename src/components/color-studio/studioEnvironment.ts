// ============================================================
// 和膜 HAMOREY — 真 16-bit HalfFloat HDR 汽车影棚环境光 & 512x512 微晶金属法线贴图
// 支持三档影棚照明切换：暗夜光廊 (studio) / 极昼展厅 (gallery) / 落日金辉 (sunset)
// ============================================================

import * as THREE from 'three';
import logoNegativeUrl from '../../assets/hamorey/logo-negative.png';
import type { StudioLightingPreset } from '../../config/colorStudio';

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * 评估指定 3D 矩形软灯箱光带对方向向量 (dx, dy, dz) 的线性 HDR 辐射贡献
 */
function sampleSoftboxStrip(
  dx: number,
  dy: number,
  dz: number,
  cx: number,
  cy: number,
  cz: number,
  ux: number,
  uy: number,
  uz: number,
  halfLen: number,
  halfWid: number,
  edgeSoftness: number,
): number {
  // 中心法向量
  const cLen = Math.hypot(cx, cy, cz) || 1;
  const ncx = cx / cLen;
  const ncy = cy / cLen;
  const ncz = cz / cLen;

  // 若在灯箱背面则直接返回 0
  const forwardDot = dx * ncx + dy * ncy + dz * ncz;
  if (forwardDot <= 0.05) return 0;

  // 构造灯箱局部正交基 (U, V, N)
  const uDot = ux * ncx + uy * ncy + uz * ncz;
  let tux = ux - uDot * ncx;
  let tuy = uy - uDot * ncy;
  let tuz = uz - uDot * ncz;
  const tLen = Math.hypot(tux, tuy, tuz) || 1;
  tux /= tLen;
  tuy /= tLen;
  tuz /= tLen;

  // V = N × U
  const tvx = ncy * tuz - ncz * tuy;
  const tvy = ncz * tux - ncx * tuz;
  const tvz = ncx * tuy - ncy * tux;

  // 投影到切平面的角度偏移
  const pu = (dx * tux + dy * tuy + dz * tuz) / Math.max(0.2, forwardDot);
  const pv = (dx * tvx + dy * tvy + dz * tvz) / Math.max(0.2, forwardDot);

  const maskU = 1 - smoothstep(halfLen - edgeSoftness, halfLen + edgeSoftness, Math.abs(pu));
  const maskV = 1 - smoothstep(halfWid - edgeSoftness, halfWid + edgeSoftness, Math.abs(pv));
  return maskU * maskV;
}

/**
 * 生成 16-bit HalfFloat 真高动态范围（HDR）全景贴图并转换为 PMREM 环境光
 */
export function createAutomotiveStudioEnvMap(
  renderer: THREE.WebGLRenderer,
  preset: StudioLightingPreset = 'studio',
): THREE.Texture {
  const width = 512;
  const height = 256;
  const data = new Uint16Array(width * height * 4);
  const oneHalf = THREE.DataUtils.toHalfFloat(1.0);

  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    const lat = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);
    const dy = Math.sin(lat);

    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const theta = (u - 0.5) * Math.PI * 2;
      const dx = cosLat * Math.cos(theta);
      const dz = cosLat * Math.sin(theta);

      let r = 0.012;
      let g = 0.014;
      let b = 0.018;

      // 地面半球：真实影棚深色地坪，令车身下半部与裙边自然压暗（真实感关键）
      const floorShade = dy < 0 ? 0.35 + 0.65 * smoothstep(-0.35, 0.0, dy) : 1.0;

      if (preset === 'studio') {
        // 1. 深灰影棚墙面基底（低亮度，不再大面积铺满高光）
        const wall = smoothstep(-0.05, 0.65, dy);
        r = 0.016 + wall * 0.022;
        g = 0.017 + wall * 0.024;
        b = 0.02 + wall * 0.028;

        // 2. 顶部单块有边界的大型柔光箱（矩形、羽化边缘）——车顶/机盖上一条干净的柔光带
        const overhead = sampleSoftboxStrip(dx, dy, dz, 0.0, 1.0, 0.08, 1, 0, 0, 0.95, 0.34, 0.16);
        r += overhead * 3.1;
        g += overhead * 3.15;
        b += overhead * 3.25;

        // 3. 左右 45° 竖向条形柔光（勾勒腰线与肩线）
        const sideL = sampleSoftboxStrip(dx, dy, dz, -0.72, 0.42, 0.42, 0, 1, 0, 0.55, 0.11, 0.08);
        const sideR = sampleSoftboxStrip(dx, dy, dz, 0.7, 0.4, -0.45, 0, 1, 0, 0.55, 0.11, 0.08);
        r += sideL * 1.9 + sideR * 2.1;
        g += sideL * 1.95 + sideR * 2.0;
        b += sideL * 2.1 + sideR * 1.9;

        // 4. 前方低位柔光（车头 / 样板正面的柔和高光）
        const frontKey = sampleSoftboxStrip(dx, dy, dz, 0.22, 0.3, 0.92, 1, 0.1, -0.2, 0.7, 0.16, 0.12);
        r += frontKey * 1.6;
        g += frontKey * 1.62;
        b += frontKey * 1.68;

        // 5. 极淡的地平线漫反射，避免下沿死黑
        const horizon = Math.exp(-Math.pow((dy - 0.03) / 0.07, 2)) * 0.05;
        r += horizon;
        g += horizon;
        b += horizon * 1.05;
      } else if (preset === 'gallery') {
        // 极昼展厅：明亮但有层次的室内日光，天花漫射 + 两条天窗
        const wall = smoothstep(-0.1, 0.7, dy);
        r = 0.05 + wall * 0.07;
        g = 0.052 + wall * 0.073;
        b = 0.058 + wall * 0.08;

        const skylightA = sampleSoftboxStrip(dx, dy, dz, 0, 0.96, 0.26, 1, 0, 0, 1.1, 0.2, 0.14);
        const skylightB = sampleSoftboxStrip(dx, dy, dz, 0, 0.93, -0.32, 1, 0, 0, 1.1, 0.2, 0.14);
        const frontWindow = sampleSoftboxStrip(dx, dy, dz, 0.2, 0.3, 0.92, 0.95, 0.2, -0.2, 1.0, 0.26, 0.16);
        const lum = skylightA * 2.6 + skylightB * 2.3 + frontWindow * 1.8;
        r += lum * 0.99;
        g += lum;
        b += lum * 1.02;
      } else {
        // 落日金辉：暮蓝天空 + 低角度暖金斜阳（有边界，不铺满）
        const sky = smoothstep(-0.05, 0.75, dy);
        r = 0.02 + sky * 0.04;
        g = 0.024 + sky * 0.06;
        b = 0.04 + sky * 0.13;

        const horizonSunset =
          Math.exp(-Math.pow((dy - 0.06) / 0.14, 2)) * (0.25 + 0.5 * Math.max(0, dz));
        r += horizonSunset * 0.55;
        g += horizonSunset * 0.27;
        b += horizonSunset * 0.1;

        const sun = sampleSoftboxStrip(dx, dy, dz, 0.42, 0.24, 0.87, 0.85, 0.15, -0.45, 0.45, 0.14, 0.1);
        r += sun * 5.2;
        g += sun * 2.9;
        b += sun * 1.1;

        const coolSky = sampleSoftboxStrip(dx, dy, dz, -0.82, 0.38, -0.4, 0.3, 0.1, 0.9, 0.9, 0.2, 0.14);
        r += coolSky * 0.6;
        g += coolSky * 0.95;
        b += coolSky * 1.7;
      }

      r *= floorShade;
      g *= floorShade;
      b *= floorShade;

      const idx = (y * width + x) * 4;
      data[idx] = THREE.DataUtils.toHalfFloat(r);
      data[idx + 1] = THREE.DataUtils.toHalfFloat(g);
      data[idx + 2] = THREE.DataUtils.toHalfFloat(b);
      data[idx + 3] = oneHalf;
    }
  }

  const hdrTex = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RGBAFormat,
    THREE.HalfFloatType,
  );
  hdrTex.mapping = THREE.EquirectangularReflectionMapping;
  hdrTex.colorSpace = THREE.LinearSRGBColorSpace;
  hdrTex.magFilter = THREE.LinearFilter;
  hdrTex.minFilter = THREE.LinearFilter;
  hdrTex.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envTarget = pmrem.fromEquirectangular(hdrTex);

  hdrTex.dispose();
  pmrem.dispose();

  return envTarget.texture;
}

/**
 * 生成 512x512 细腻微米圆片金属颗粒法线贴图（消除噪点锯齿，展现真实金属烤漆质感）
 */
export function createMetallicFlakeNormalMap(): THREE.DataTexture {
  const size = 512;
  const nxArr = new Float32Array(size * size);
  const nyArr = new Float32Array(size * size);

  // 基础平滑法线 (0, 0, 1)
  let seed = 48271;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // 在可环绕平面分布 16,000 颗微米级扁平圆片金属晶片（半径 1.4 ~ 2.1 px）
  const flakeCount = 16000;
  for (let f = 0; f < flakeCount; f++) {
    const cx = nextRand() * size;
    const cy = nextRand() * size;
    const radius = 1.2 + nextRand() * 1.05;
    const angle = nextRand() * Math.PI * 2;
    const tilt = 0.22 + nextRand() * 0.45;
    const fx = Math.cos(angle) * tilt;
    const fy = Math.sin(angle) * tilt;

    const minX = Math.floor(cx - radius);
    const maxX = Math.ceil(cx + radius);
    const minY = Math.floor(cy - radius);
    const maxY = Math.ceil(cy + radius);

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const dist = Math.hypot(px - cx, py - cy);
        if (dist <= radius) {
          const wx = ((px % size) + size) % size;
          const wy = ((py % size) + size) % size;
          const idx = wy * size + wx;
          const weight = 1 - dist / (radius + 0.15);
          nxArr[idx] = nxArr[idx] * (1 - weight) + fx * weight;
          nyArr[idx] = nyArr[idx] * (1 - weight) + fy * weight;
        }
      }
    }
  }

  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const nx = Math.max(-0.85, Math.min(0.85, nxArr[i]));
    const ny = Math.max(-0.85, Math.min(0.85, nyArr[i]));
    const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx - ny * ny));
    const p = i * 4;
    data[p] = Math.round((nx * 0.5 + 0.5) * 255);
    data[p + 1] = Math.round((ny * 0.5 + 0.5) * 255);
    data[p + 2] = Math.round((nz * 0.5 + 0.5) * 255);
    data[p + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.anisotropy = 8;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * 生成「和膜 HAMOREY」极简高定原厂展车牌照贴图（纯黑钢琴漆底 + 官方白标，无多余边框与杂字）
 */
export function createHamoreyPlateTexture(): THREE.CanvasTexture {
  const width = 1200;
  const height = 294;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const drawBasePlate = (logoImg?: HTMLImageElement) => {
    if (!ctx) return;
    // 1. 极简曜石钢琴黑渐变底（媲美保时捷/特斯拉官方展车黑牌）
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#14151a');
    bg.addColorStop(0.45, '#0b0c10');
    bg.addColorStop(1, '#07080b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // 顶部极淡棚拍柔光反光带（提升烤漆玻璃感）
    const topSheen = ctx.createLinearGradient(0, 0, 0, height * 0.42);
    topSheen.addColorStop(0, 'rgba(255, 255, 255, 0.065)');
    topSheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = topSheen;
    ctx.fillRect(0, 0, width, height * 0.42);

    // 极细暗银内倒角线（1.5px，低调克制，无土气金框）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // 2. 居中纯白官方「HAMOREY 和膜」Logo（大留白高定呼吸感）
    if (logoImg && logoImg.naturalWidth > 0) {
      const maxW = width * 0.56;
      const maxH = height * 0.60;
      const scale = Math.min(maxW / logoImg.naturalWidth, maxH / logoImg.naturalHeight);
      const drawW = logoImg.naturalWidth * scale;
      const drawH = logoImg.naturalHeight * scale;
      const dx = (width - drawW) / 2;
      const dy = (height - drawH) / 2;
      ctx.drawImage(logoImg, dx, dy, drawW, drawH);
    } else {
      ctx.fillStyle = '#F5F6F8';
      ctx.font = '600 84px "HarmonyOS Sans SC", "PingFang SC", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HAMOREY', width / 2, height / 2);
    }
  };

  drawBasePlate();

  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = true;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;

  if (typeof Image !== 'undefined') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      drawBasePlate(img);
      tex.needsUpdate = true;
    };
    img.src = logoNegativeUrl;
  }

  return tex;
}
