// ============================================================
// 和膜 HAMOREY — 1024x512 真 16-bit HalfFloat 高锐度镜面影棚 HDR 环境光
// 360° 全向硬边光学灯廊 + 锐利天地平线反差切线，赋予水晶/亮面改色膜真实 8.0 mil 湿润镜面玻璃感
// ============================================================

import * as THREE from 'three';
import logoNegativeUrl from '../../assets/hamorey/logo-negative.png';
import type { StudioLightingPreset } from '../../config/colorStudio';

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * 评估真实汽车摄影棚「非对称渐变柔光天幕（Feathered Scrim）」：
 * 一侧保留干净利落的轮廓切边（勾勒车身腰线清漆感），另一侧呈宽幅奶油般丝滑过渡（消除生硬灯条与塑料感）
 */
function sampleFeatheredScrim(
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
  crispEdge: number,
  softEdge: number,
): number {
  const cLen = Math.hypot(cx, cy, cz) || 1;
  const ncx = cx / cLen;
  const ncy = cy / cLen;
  const ncz = cz / cLen;

  const forwardDot = dx * ncx + dy * ncy + dz * ncz;
  if (forwardDot <= 0.04) return 0;

  const uDot = ux * ncx + uy * ncy + uz * ncz;
  let tux = ux - uDot * ncx;
  let tuy = uy - uDot * ncy;
  let tuz = uz - uDot * ncz;
  const tLen = Math.hypot(tux, tuy, tuz) || 1;
  tux /= tLen;
  tuy /= tLen;
  tuz /= tLen;

  const tvx = ncy * tuz - ncz * tuy;
  const tvy = ncz * tux - ncx * tuz;
  const tvz = ncx * tuy - ncy * tux;

  const invF = 1 / Math.max(0.20, forwardDot);
  const pu = (dx * tux + dy * tuy + dz * tuz) * invF;
  const pv = (dx * tvx + dy * tvy + dz * tvz) * invF;

  const maxSpanU = halfLen + softEdge * 1.4;
  if (Math.abs(pu) >= maxSpanU || pv < -(halfWid + crispEdge) || pv > halfWid + softEdge) {
    return 0;
  }

  // 纵向两端宽幅柔和收光，绝不出现生硬截断块
  const endFade = 1 - smoothstep(halfLen * 0.55, maxSpanU, Math.abs(pu));
  // 横向非对称专业棚拍渐变：负向侧干净清晰，正向侧如丝绸般宽幅晕开
  const crispSide = smoothstep(-(halfWid + crispEdge), -(halfWid - crispEdge * 0.8), pv);
  const softSide = 1 - smoothstep(halfWid * 0.15, halfWid + softEdge, pv);
  // 叠加柔和中心余弦光脊，让车漆高光富有呼吸层次
  const normV = Math.max(0, Math.min(1, (pv + halfWid) / Math.max(0.01, halfWid * 2 + softEdge * 0.6)));
  const silkGrad = 0.42 + 0.58 * Math.pow(1 - normV * 0.72, 1.35);

  return endFade * crispSide * softSide * silkGrad;
}

/**
 * 生成 1024x512 16-bit HalfFloat 真高动态范围（HDR）汽车摄影柔光天幕全景图并转换为 PMREM 环境光
 */
export function createAutomotiveStudioEnvMap(
  renderer: THREE.WebGLRenderer,
  preset: StudioLightingPreset = 'studio',
): THREE.Texture {
  const width = 1024;
  const height = 512;
  const data = new Uint16Array(width * height * 4);
  const oneHalf = THREE.DataUtils.toHalfFloat(1.0);

  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    const lat = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(lat);
    const dy = Math.sin(lat);

    // 温润自然的天地环幕过渡（既有真实展厅地平线明暗层次，又无生硬割裂感）
    const horizonCut = smoothstep(-0.045, 0.055, dy);
    const floorReflect = dy < 0 ? 0.14 + 0.28 * smoothstep(-0.48, 0.0, dy) : 1.0;

    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const theta = (u - 0.5) * Math.PI * 2;
      const dx = cosLat * Math.cos(theta);
      const dz = cosLat * Math.sin(theta);

      let r = 0.02;
      let g = 0.022;
      let b = 0.026;

      if (preset === 'studio') {
        // 1. 温润深邃环幕空间基底（保留高定负空间留白，让机盖与门板 75% 区域展现醇厚饱满本色，不发粉发雾）
        const dome = smoothstep(-0.05, 0.92, dy);
        const sideWarmth = 0.5 + 0.5 * Math.cos(theta - 0.6);
        r = 0.026 + dome * 0.042 + sideWarmth * 0.010;
        g = 0.028 + dome * 0.045 + sideWarmth * 0.009;
        b = 0.034 + dome * 0.054 + (1 - sideWarmth) * 0.010;

        // 2. 双翼非对称渐变柔光天幕（中央留出深邃负空间保住机盖浓郁纯色，两侧外缘清透利落、内缘奶油般丝滑羽化）
        const wingL = sampleFeatheredScrim(
          dx, dy, dz,
          -0.40, 0.92, 0.0,
          0, 0, 1,
          1.38, 0.075,
          0.024, 0.14,
        );
        const wingR = sampleFeatheredScrim(
          dx, dy, dz,
          0.40, 0.92, 0.0,
          0, 0, 1,
          1.38, 0.075,
          0.024, 0.14,
        );
        const topLum = (wingL + wingR) * 2.85;
        r += topLum * 1.01;
        g += topLum * 1.0;
        b += topLum * 0.99;

        // 3. 左右双侧非对称羽化腰线柔光幕（上缘利落勾勒门板肩线，向下丝滑衰减融入深色暗部）
        const sideL = sampleFeatheredScrim(
          dx, dy, dz,
          -0.93, 0.27, 0.06,
          0, 0, 1,
          1.18, 0.065,
          0.022, 0.13,
        );
        const sideR = sampleFeatheredScrim(
          dx, dy, dz,
          0.93, 0.27, -0.06,
          0, 0, 1,
          1.18, 0.065,
          0.022, 0.13,
        );
        r += (sideL + sideR) * 2.25;
        g += (sideL + sideR) * 2.30;
        b += (sideL + sideR) * 2.40;

        // 4. 前后对称羽化柔光幕（车头与车尾 C 柱 / 尾门柔顺过渡，清透不生硬）
        const frontScrim = sampleFeatheredScrim(
          dx, dy, dz,
          0.12, 0.36, 0.93,
          1, 0, -0.13,
          0.86, 0.072,
          0.024, 0.14,
        );
        const rearScrim = sampleFeatheredScrim(
          dx, dy, dz,
          -0.12, 0.38, -0.93,
          1, 0, 0.13,
          0.86, 0.072,
          0.024, 0.14,
        );
        const endLum = frontScrim * 2.35 + rearScrim * 2.50;
        r += endLum * 1.0;
        g += endLum * 1.0;
        b += endLum * 1.03;

        // 5. 360° 环幕地平线柔和天光晕（赋予车身下半部温润立体折光）
        const horizonBand =
          horizonCut * (1 - smoothstep(0.02, 0.26, dy)) * (0.72 + 0.28 * Math.cos(theta * 2));
        r += horizonBand * 0.28;
        g += horizonBand * 0.30;
        b += horizonBand * 0.34;
      } else if (preset === 'gallery') {
        // 极简无影美术馆白棚：大面积柔和自然天窗漫射，色彩清透温润不生硬
        const skyGrad = smoothstep(-0.04, 0.92, dy);
        const above = 0.20 + skyGrad * 0.24;
        r = mixVal(0.075, above * 0.99, horizonCut);
        g = mixVal(0.080, above * 1.0, horizonCut);
        b = mixVal(0.090, above * 1.03, horizonCut);

        const skyCanopy = sampleFeatheredScrim(dx, dy, dz, 0, 0.98, 0.0, 0, 0, 1, 1.48, 0.28, 0.045, 0.36);
        const skyLeft = sampleFeatheredScrim(dx, dy, dz, -0.52, 0.85, 0.0, 0, 0, 1, 1.38, 0.12, 0.035, 0.24);
        const skyRight = sampleFeatheredScrim(dx, dy, dz, 0.52, 0.85, 0.0, 0, 0, 1, 1.38, 0.12, 0.035, 0.24);
        const frontGlass = sampleFeatheredScrim(dx, dy, dz, 0.14, 0.34, 0.93, 1, 0, -0.15, 1.02, 0.13, 0.038, 0.24);
        const rearGlass = sampleFeatheredScrim(dx, dy, dz, -0.14, 0.36, -0.93, 1, 0, 0.15, 1.02, 0.13, 0.038, 0.24);
        const lum = skyCanopy * 2.1 + (skyLeft + skyRight) * 1.65 + (frontGlass + rearGlass) * 1.45;
        r += lum * 1.0;
        g += lum * 1.0;
        b += lum * 1.02;

        const galleryHorizon = horizonCut * (1 - smoothstep(0.02, 0.22, dy)) * 0.36;
        r += galleryHorizon * 0.98;
        g += galleryHorizon * 1.0;
        b += galleryHorizon * 1.03;
      } else {
        // 黄金海岸落日：柔美晚霞渐变天际 + 温暖柔化夕阳金辉（不刺眼、不油腻）
        const sky = smoothstep(-0.04, 0.88, dy);
        const skyR = 0.11 + sky * 0.08;
        const skyG = 0.14 + sky * 0.15;
        const skyB = 0.22 + sky * 0.30;
        r = mixVal(0.042, skyR, horizonCut);
        g = mixVal(0.044, skyG, horizonCut);
        b = mixVal(0.055, skyB, horizonCut);

        const sunFacing = Math.max(0, dx * 0.42 + dz * 0.90);
        const horizonGlow =
          horizonCut * (1 - smoothstep(0.01, 0.28, dy)) * (0.55 + 1.25 * sunFacing ** 1.8);
        r += horizonGlow * 0.68;
        g += horizonGlow * 0.39;
        b += horizonGlow * 0.19;

        const sunScrim = sampleFeatheredScrim(dx, dy, dz, 0.40, 0.24, 0.89, 0.90, 0, -0.44, 0.68, 0.12, 0.038, 0.28);
        r += sunScrim * 3.8;
        g += sunScrim * 2.35;
        b += sunScrim * 1.15;

        const zenithRibbon = sampleFeatheredScrim(dx, dy, dz, -0.22, 0.92, -0.25, 0.8, 0, -0.6, 1.35, 0.20, 0.045, 0.32);
        r += zenithRibbon * 1.35;
        g += zenithRibbon * 1.75;
        b += zenithRibbon * 2.55;

        const backCoolWindow = sampleFeatheredScrim(dx, dy, dz, -0.42, 0.34, -0.85, 0.88, 0, -0.46, 0.95, 0.13, 0.038, 0.24);
        r += backCoolWindow * 1.35;
        g += backCoolWindow * 1.75;
        b += backCoolWindow * 2.45;
      }

      if (preset === 'studio') {
        r *= floorReflect;
        g *= floorReflect;
        b *= floorReflect;
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

function mixVal(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 生成 512x512 细腻微米圆片金属颗粒法线贴图（消除噪点锯齿，展现真实金属烤漆质感）
 */
export function createMetallicFlakeNormalMap(): THREE.DataTexture {
  const size = 512;
  const nxArr = new Float32Array(size * size);
  const nyArr = new Float32Array(size * size);

  let seed = 48271;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

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
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#14151a');
    bg.addColorStop(0.45, '#0b0c10');
    bg.addColorStop(1, '#07080b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const topSheen = ctx.createLinearGradient(0, 0, 0, height * 0.42);
    topSheen.addColorStop(0, 'rgba(255, 255, 255, 0.065)');
    topSheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = topSheen;
    ctx.fillRect(0, 0, width, height * 0.42);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, width - 16, height - 16);

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
