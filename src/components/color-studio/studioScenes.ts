// ============================================================
// 和膜 HAMOREY — 三大沉浸式 3D 实景展厅（柔光影棚 / 极昼展厅 / 海岸落日）
// 全程序化 360° 环景穹顶 + 轻量建筑装置，零外部贴图依赖，60fps 丝滑切换
// ============================================================

import * as THREE from 'three';
import type { StudioLightingPreset, StudioViewMode } from '../../config/colorStudio';

type WebGLViewMode = Exclude<StudioViewMode, 'swatch'>;

function createStudioDomeTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 深邃暗夜影棚无影墙渐变
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0.0, '#07080c');
    bg.addColorStop(0.32, '#0e1017');
    bg.addColorStop(0.52, '#171922');
    bg.addColorStop(0.64, '#0c0d12');
    bg.addColorStop(1.0, '#050608');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // 环绕影棚柔和地平线柔光漫射带
    const horizonGlow = ctx.createLinearGradient(0, h * 0.38, 0, h * 0.62);
    horizonGlow.addColorStop(0, 'rgba(201, 168, 106, 0)');
    horizonGlow.addColorStop(0.5, 'rgba(201, 168, 106, 0.09)');
    horizonGlow.addColorStop(1, 'rgba(201, 168, 106, 0)');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, h * 0.38, w, h * 0.24);

    // 影棚穹顶柔光漫射光斑
    for (const cx of [w * 0.22, w * 0.5, w * 0.78]) {
      const grad = ctx.createRadialGradient(cx, h * 0.22, 8, cx, h * 0.22, 160);
      grad.addColorStop(0, 'rgba(245, 240, 232, 0.16)');
      grad.addColorStop(0.5, 'rgba(205, 212, 228, 0.05)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - 180, 0, 360, h * 0.45);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.needsUpdate = true;
  return tex;
}

function createGalleryDomeTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 极昼现代美术馆：优雅银白建筑穹顶与柔灰微水泥墙面
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0.0, '#e6ebf2');
    bg.addColorStop(0.28, '#d8dfe9');
    bg.addColorStop(0.49, '#c7d0dd');
    bg.addColorStop(0.52, '#bbc4d2');
    bg.addColorStop(0.75, '#c4ccd8');
    bg.addColorStop(1.0, '#adb6c4');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // 建筑立面落地高窗柔光幕墙（8 段对称建筑韵律）
    const panels = 8;
    const panelW = w / panels;
    for (let i = 0; i < panels; i++) {
      const x = i * panelW;
      ctx.fillStyle = 'rgba(72, 84, 104, 0.14)';
      ctx.fillRect(x, h * 0.16, 3, h * 0.36);

      const winX = x + panelW * 0.18;
      const winW = panelW * 0.64;
      const winGrad = ctx.createLinearGradient(0, h * 0.18, 0, h * 0.49);
      winGrad.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
      winGrad.addColorStop(0.65, 'rgba(244, 248, 255, 0.38)');
      winGrad.addColorStop(1, 'rgba(232, 238, 246, 0.06)');
      ctx.fillStyle = winGrad;
      ctx.fillRect(winX, h * 0.18, winW, h * 0.31);
    }

    const baseboard = ctx.createLinearGradient(0, h * 0.49, 0, h * 0.525);
    baseboard.addColorStop(0, 'rgba(60, 68, 82, 0.0)');
    baseboard.addColorStop(0.45, 'rgba(60, 68, 82, 0.22)');
    baseboard.addColorStop(1, 'rgba(60, 68, 82, 0.0)');
    ctx.fillStyle = baseboard;
    ctx.fillRect(0, h * 0.49, w, h * 0.035);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function createSunsetDomeTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 海岸落日黄金时刻（2048x1024 高清平滑渐变）：暮色靛蓝 -> 玫瑰紫霞 -> 落日熔金 -> 暮色海面
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0.0, '#0e1630');
    sky.addColorStop(0.26, '#26254b');
    sky.addColorStop(0.37, '#643252');
    sky.addColorStop(0.445, '#cc5c36');
    sky.addColorStop(0.495, '#ffbe6b');
    sky.addColorStop(0.515, '#ba5431');
    sky.addColorStop(0.58, '#321e26');
    sky.addColorStop(0.75, '#191217');
    sky.addColorStop(1.0, '#0d0a0e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // 落日主太阳光晕与低垂红日
    const sunX = w * 0.34;
    const sunY = h * 0.476;
    const outerHalo = ctx.createRadialGradient(sunX, sunY, 18, sunX, sunY, 440);
    outerHalo.addColorStop(0.0, 'rgba(255, 245, 214, 0.96)');
    outerHalo.addColorStop(0.11, 'rgba(255, 206, 128, 0.72)');
    outerHalo.addColorStop(0.35, 'rgba(242, 114, 56, 0.30)');
    outerHalo.addColorStop(1.0, 'rgba(242, 114, 56, 0)');
    ctx.fillStyle = outerHalo;
    ctx.fillRect(0, h * 0.16, w, h * 0.58);

    // 柔和晚霞云层丝带
    ctx.save();
    for (let i = 0; i < 10; i++) {
      const cy = h * (0.31 + i * 0.019);
      const cx = (i * 314 + 180) % w;
      const cw = 420 + (i % 3) * 180;
      const ch = 18 + (i % 2) * 14;
      const cloudGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, cw * 0.5);
      cloudGrad.addColorStop(0, i % 2 === 0 ? 'rgba(255, 198, 124, 0.22)' : 'rgba(245, 134, 92, 0.16)');
      cloudGrad.addColorStop(1, 'rgba(245, 134, 92, 0)');
      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cw * 0.5, ch, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 远景海岸群山剪影（2px 超细步长 + 大气薄雾柔化，彻底消除锯齿）
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h * 0.506);
    for (let x = 0; x <= w; x += 2) {
      const t = (x / w) * Math.PI * 2;
      const sunGap = 1 - 0.88 * Math.exp(-Math.pow((x - sunX) / 230, 2));
      const ridge =
        (Math.sin(t * 2.0 + 0.6) * 0.45 +
          Math.sin(t * 5.0 - 1.1) * 0.28 +
          Math.cos(t * 9.0 + 0.4) * 0.12 +
          0.9) *
        30 *
        sunGap;
      ctx.lineTo(x, h * 0.506 - Math.max(0, ridge));
    }
    ctx.lineTo(w, h * 0.52);
    ctx.lineTo(0, h * 0.52);
    ctx.closePath();
    const mountainGrad = ctx.createLinearGradient(0, h * 0.47, 0, h * 0.52);
    mountainGrad.addColorStop(0, '#2a1822');
    mountainGrad.addColorStop(1, '#181016');
    ctx.fillStyle = mountainGrad;
    ctx.fill();
    ctx.restore();

    // 地平线金色大气薄雾，使山脊边缘与天空柔和融合
    const horizonMist = ctx.createLinearGradient(0, h * 0.485, 0, h * 0.52);
    horizonMist.addColorStop(0, 'rgba(255, 168, 96, 0)');
    horizonMist.addColorStop(0.55, 'rgba(255, 152, 82, 0.24)');
    horizonMist.addColorStop(1, 'rgba(40, 22, 28, 0)');
    ctx.fillStyle = horizonMist;
    ctx.fillRect(0, h * 0.485, w, h * 0.035);

    // 海面落日金光倒影碎波
    for (let r = 0; r < 16; r++) {
      const ry = h * (0.512 + r * 0.0085);
      const rw = Math.max(28, 250 - r * 14);
      const alpha = Math.max(0.05, 0.40 - r * 0.022);
      ctx.fillStyle = `rgba(255, 204, 126, ${alpha.toFixed(3)})`;
      ctx.fillRect(sunX - rw * 0.5 + Math.sin(r * 2.1) * 16, ry, rw, 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export interface StudioSceneManager {
  applyPreset: (preset: StudioLightingPreset, viewMode: WebGLViewMode) => void;
  dispose: () => void;
}

export function createStudioSceneManager(
  scene: THREE.Scene,
  floorMat: THREE.MeshStandardMaterial,
  floorGlowMat: THREE.MeshBasicMaterial,
  shadowPlaneMat: THREE.MeshBasicMaterial,
): StudioSceneManager {
  const domeTextures: Record<StudioLightingPreset, THREE.CanvasTexture> = {
    studio: createStudioDomeTexture(),
    gallery: createGalleryDomeTexture(),
    sunset: createSunsetDomeTexture(),
  };

  // 共享 360° 实景穹顶（单 DrawCall，不受雾效遮蔽）
  const skyGeo = new THREE.SphereGeometry(28, 48, 28);
  const skyMat = new THREE.MeshBasicMaterial({
    map: domeTextures.studio,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.renderOrder = -10;
  scene.add(skyMesh);

  const disposablesGeo: THREE.BufferGeometry[] = [skyGeo];
  const disposablesMat: THREE.Material[] = [skyMat];

  // --- 场景 A：暗夜柔光影棚装置（悬吊柔光灯箱 + 地面香槟金同心光环） ---
  const studioProps = new THREE.Group();
  const softboxGeo = new THREE.BoxGeometry(5.6, 0.08, 0.52);
  const softboxMat = new THREE.MeshBasicMaterial({ color: '#f3eee6', fog: false });
  disposablesGeo.push(softboxGeo);
  disposablesMat.push(softboxMat);
  for (const zPos of [-1.85, 0, 1.85]) {
    const bar = new THREE.Mesh(softboxGeo, softboxMat);
    bar.position.set(0, 5.2, zPos);
    studioProps.add(bar);
  }
  const studioRingGeo = new THREE.RingGeometry(3.12, 3.16, 96);
  studioRingGeo.rotateX(-Math.PI / 2);
  const studioRingMat = new THREE.MeshBasicMaterial({
    color: '#c9a86a',
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  disposablesGeo.push(studioRingGeo);
  disposablesMat.push(studioRingMat);
  const studioRing = new THREE.Mesh(studioRingGeo, studioRingMat);
  studioRing.position.y = 0.003;
  studioProps.add(studioRing);
  scene.add(studioProps);

  // --- 场景 B：极昼现代美术馆展厅装置（极简建筑圆柱廊 + 顶部环形天窗 + 展台银线） ---
  const galleryProps = new THREE.Group();
  const pillarGeo = new THREE.CylinderGeometry(0.28, 0.3, 8.2, 24);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: '#dce0e8',
    roughness: 0.72,
    metalness: 0.04,
  });
  disposablesGeo.push(pillarGeo);
  disposablesMat.push(pillarMat);
  const pillarCount = 10;
  for (let i = 0; i < pillarCount; i++) {
    const angle = (i / pillarCount) * Math.PI * 2 + 0.16;
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(Math.cos(angle) * 11.2, 4.05, Math.sin(angle) * 11.2);
    galleryProps.add(pillar);
  }
  const skylightGeo = new THREE.TorusGeometry(4.4, 0.1, 16, 72);
  skylightGeo.rotateX(Math.PI / 2);
  const skylightMat = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false });
  disposablesGeo.push(skylightGeo);
  disposablesMat.push(skylightMat);
  const skylight = new THREE.Mesh(skylightGeo, skylightMat);
  skylight.position.y = 5.6;
  galleryProps.add(skylight);

  const galleryRingGeo = new THREE.RingGeometry(3.22, 3.27, 96);
  galleryRingGeo.rotateX(-Math.PI / 2);
  const galleryRingMat = new THREE.MeshBasicMaterial({
    color: '#8f99a8',
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  disposablesGeo.push(galleryRingGeo);
  disposablesMat.push(galleryRingMat);
  const galleryRing = new THREE.Mesh(galleryRingGeo, galleryRingMat);
  galleryRing.position.y = 0.003;
  galleryProps.add(galleryRing);
  galleryProps.visible = false;
  scene.add(galleryProps);

  // --- 场景 C：海岸落日观景台装置（远景暖金观景台边沿光带） ---
  const sunsetProps = new THREE.Group();
  const deckRingGeo = new THREE.RingGeometry(9.6, 9.74, 96);
  deckRingGeo.rotateX(-Math.PI / 2);
  const deckRingMat = new THREE.MeshBasicMaterial({
    color: '#ffb46e',
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  disposablesGeo.push(deckRingGeo);
  disposablesMat.push(deckRingMat);
  const deckRing = new THREE.Mesh(deckRingGeo, deckRingMat);
  deckRing.position.y = 0.004;
  sunsetProps.add(deckRing);

  const innerSunsetRingGeo = new THREE.RingGeometry(3.25, 3.29, 96);
  innerSunsetRingGeo.rotateX(-Math.PI / 2);
  const innerSunsetRingMat = new THREE.MeshBasicMaterial({
    color: '#ff9e57',
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
  });
  disposablesGeo.push(innerSunsetRingGeo);
  disposablesMat.push(innerSunsetRingMat);
  const innerSunsetRing = new THREE.Mesh(innerSunsetRingGeo, innerSunsetRingMat);
  innerSunsetRing.position.y = 0.003;
  sunsetProps.add(innerSunsetRing);
  sunsetProps.visible = false;
  scene.add(sunsetProps);

  const applyPreset = (preset: StudioLightingPreset, viewMode: WebGLViewMode) => {
    skyMat.map = domeTextures[preset];
    skyMat.needsUpdate = true;

    const showCarProps = viewMode === 'car' || viewMode === 'closeup';
    studioProps.visible = showCarProps && preset === 'studio';
    galleryProps.visible = showCarProps && preset === 'gallery';
    sunsetProps.visible = showCarProps && preset === 'sunset';

    if (preset === 'gallery') {
      floorMat.color.set('#cfd5df');
      floorMat.roughness = 0.34;
      floorMat.metalness = 0.06;
      floorMat.envMapIntensity = 0.42;
      floorGlowMat.opacity = 0.08;
      shadowPlaneMat.opacity = 0.62;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.set('#d5dae3');
        scene.fog.density = 0.022;
      }
    } else if (preset === 'sunset') {
      floorMat.color.set('#1f171a');
      floorMat.roughness = 0.32;
      floorMat.metalness = 0.16;
      floorMat.envMapIntensity = 0.58;
      floorGlowMat.opacity = 0.24;
      shadowPlaneMat.opacity = 0.84;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.set('#3b222a');
        scene.fog.density = 0.026;
      }
    } else {
      floorMat.color.set('#08090d');
      floorMat.roughness = 0.58;
      floorMat.metalness = 0.05;
      floorMat.envMapIntensity = 0.24;
      floorGlowMat.opacity = 0.22;
      shadowPlaneMat.opacity = 0.86;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.set('#0b0c12');
        scene.fog.density = 0.032;
      }
    }
    floorMat.needsUpdate = true;
  };

  const dispose = () => {
    Object.values(domeTextures).forEach((t) => t.dispose());
    disposablesGeo.forEach((g) => g.dispose());
    disposablesMat.forEach((m) => m.dispose());
    scene.remove(skyMesh);
    scene.remove(studioProps);
    scene.remove(galleryProps);
    scene.remove(sunsetProps);
  };

  return { applyPreset, dispose };
}
