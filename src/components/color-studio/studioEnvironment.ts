// ============================================================
// 和膜 HAMOREY — 真 16-bit HalfFloat HDR 汽车影棚环境光 & 512x512 微晶金属法线贴图
// 支持三档影棚照明切换：暗夜光廊 (studio) / 极昼展厅 (gallery) / 落日金辉 (sunset)
// ============================================================

import * as THREE from 'three';
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

      if (preset === 'studio') {
        // 1. 深邃影棚基底（上方极暗蓝灰 -> 地平微光 -> 地面极暗）
        const skyFactor = smoothstep(-0.1, 0.55, dy);
        r = 0.008 + skyFactor * 0.016;
        g = 0.01 + skyFactor * 0.018;
        b = 0.014 + skyFactor * 0.026;

        // 2. 顶部双排高反差软灯箱长条（峰值辐射 ~11.0，打造锐利镜面清漆灯带）
        const topBar1 = sampleSoftboxStrip(dx, dy, dz, -0.22, 0.92, 0.32, 0.85, 0, 0.45, 1.35, 0.14, 0.06);
        const topBar2 = sampleSoftboxStrip(dx, dy, dz, 0.28, 0.88, -0.38, 0.85, 0, 0.45, 1.25, 0.12, 0.06);
        const topIntensity = topBar1 * 11.2 + topBar2 * 9.5;
        r += topIntensity * 0.98;
        g += topIntensity * 0.99;
        b += topIntensity * 1.02;

        // 3. 前上方 38° 斜向柔光主灯带（让直立流光样板与车头获得立体的流光掠影）
        const frontKey = sampleSoftboxStrip(dx, dy, dz, 0.26, 0.48, 0.84, 0.92, 0.36, -0.15, 0.92, 0.16, 0.09);
        r += frontKey * 6.8;
        g += frontKey * 7.0;
        b += frontKey * 7.3;

        // 4. 左右腰线冷暖轮廓光带
        const leftRim = sampleSoftboxStrip(dx, dy, dz, -0.92, 0.24, 0.28, 0.1, 0.2, 0.95, 1.05, 0.09, 0.06);
        r += leftRim * 2.6;
        g += leftRim * 3.1;
        b += leftRim * 3.8;

        const rightRim = sampleSoftboxStrip(dx, dy, dz, 0.92, 0.22, -0.2, 0.1, -0.15, 0.96, 0.95, 0.09, 0.06);
        r += rightRim * 3.2;
        g += rightRim * 2.95;
        b += rightRim * 2.65;

        // 5. 地平线极细轮廓反光带
        const horizonGlow = Math.exp(-Math.pow((dy - 0.02) / 0.045, 2)) * 0.18;
        r += horizonGlow;
        g += horizonGlow * 1.02;
        b += horizonGlow * 1.08;
      } else if (preset === 'gallery') {
        // 极昼展厅：大面积白色建筑天窗 + 格栅轮廓反光
        const baseSky = smoothstep(-0.2, 0.6, dy);
        r = 0.045 + baseSky * 0.09;
        g = 0.05 + baseSky * 0.095;
        b = 0.06 + baseSky * 0.11;

        const ceilingPanelA = sampleSoftboxStrip(dx, dy, dz, 0, 0.96, 0.25, 1, 0, 0, 1.5, 0.22, 0.08);
        const ceilingPanelB = sampleSoftboxStrip(dx, dy, dz, 0, 0.92, -0.35, 1, 0, 0, 1.5, 0.22, 0.08);
        const frontWindow = sampleSoftboxStrip(dx, dy, dz, 0.18, 0.35, 0.92, 0.95, 0.2, -0.2, 1.2, 0.28, 0.12);
        const sideWindow = sampleSoftboxStrip(dx, dy, dz, -0.94, 0.28, 0.15, 0, 0.1, 1, 1.2, 0.24, 0.1);

        const lum = ceilingPanelA * 7.2 + ceilingPanelB * 6.5 + frontWindow * 5.2 + sideWindow * 4.4;
        r += lum * 0.97;
        g += lum * 0.99;
        b += lum * 1.03;
      } else {
        // sunset 落日金辉：暮蓝苍穹 + 低角度炽热暖金斜阳
        const skyBlend = smoothstep(-0.15, 0.7, dy);
        r = 0.02 + skyBlend * 0.055;
        g = 0.024 + skyBlend * 0.085;
        b = 0.045 + skyBlend * 0.22;

        // 地平暖橘霞光
        const horizonSunset = Math.exp(-Math.pow((dy - 0.06) / 0.18, 2)) * (0.4 + 0.6 * Math.max(0, dz));
        r += horizonSunset * 0.78;
        g += horizonSunset * 0.36;
        b += horizonSunset * 0.14;

        // 炽热落日长焦光带（斜前方）
        const sunStrip = sampleSoftboxStrip(dx, dy, dz, 0.42, 0.28, 0.86, 0.85, 0.15, -0.45, 0.68, 0.18, 0.1);
        r += sunStrip * 12.2;
        g += sunStrip * 6.4;
        b += sunStrip * 2.1;

        // 对侧冷蓝暮光轮廓光
        const coolSky = sampleSoftboxStrip(dx, dy, dz, -0.82, 0.38, -0.4, 0.3, 0.1, 0.9, 1.1, 0.22, 0.12);
        r += coolSky * 1.6;
        g += coolSky * 2.5;
        b += coolSky * 4.8;
      }

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
 * 生成「和膜 HAMOREY」曜石黑金高定展车牌照贴图
 * glTF UV 体系使用 flipY = false
 */
export function createHamoreyPlateTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#09090c');
    bg.addColorStop(0.5, '#1b0b0e');
    bg.addColorStop(1, '#09090c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#C9A86A';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.strokeStyle = 'rgba(201, 168, 106, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    ctx.fillStyle = '#F7F3EB';
    ctx.font = 'bold 40px "HarmonyOS Sans SC", "PingFang SC", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('和膜 · HAMOREY', width / 2, height * 0.44);

    ctx.fillStyle = '#C9A86A';
    ctx.font = '600 17px "HarmonyOS Sans SC", system-ui, sans-serif';
    ctx.fillText('ATELIER COLOR PPF', width / 2, height * 0.76);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
