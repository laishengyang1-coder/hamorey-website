// ============================================================
// 和膜 HAMOREY — 三大高定 3D 展厅场景（暗夜柔光影棚 / 极简白棚展厅 / 黄金落日天际）
// 告别球面贴图地面畸变：全部采用真实平整 3D 地面 + 建筑级穹顶灯光 / CC0 实拍 360° 落日天穹
// ============================================================

import * as THREE from 'three';
import type { StudioLightingPreset, StudioViewMode } from '../../config/colorStudio';

type WebGLViewMode = Exclude<StudioViewMode, 'swatch'>;

const SUNSET_SKY_URL = '/color-studio/scenes/sunset-360.jpg?v=20261123b';

function createStudioCycloramaTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0.0, '#07080c');
    bg.addColorStop(0.32, '#0e1017');
    bg.addColorStop(0.50, '#181b24');
    bg.addColorStop(0.62, '#0c0d12');
    bg.addColorStop(1.0, '#050608');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const horizonGlow = ctx.createLinearGradient(0, h * 0.38, 0, h * 0.60);
    horizonGlow.addColorStop(0, 'rgba(201, 168, 106, 0)');
    horizonGlow.addColorStop(0.5, 'rgba(201, 168, 106, 0.08)');
    horizonGlow.addColorStop(1, 'rgba(201, 168, 106, 0)');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, h * 0.38, w, h * 0.22);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 保时捷 / 小米 EV 官方选车器风格：极简无影白棚建筑穹顶（零畸变、零杂物、高级冷白银渐变）
 */
function createWhiteShowroomCycloramaTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0.0, '#f3f5f8');
    bg.addColorStop(0.28, '#e8ecf2');
    bg.addColorStop(0.49, '#dce2ea');
    bg.addColorStop(0.52, '#d2d8e2');
    bg.addColorStop(0.76, '#dbe0e8');
    bg.addColorStop(1.0, '#c8cfd9');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // 柔和环形展厅漫射天光带
    const band = ctx.createLinearGradient(0, h * 0.24, 0, h * 0.48);
    band.addColorStop(0, 'rgba(255, 255, 255, 0)');
    band.addColorStop(0.5, 'rgba(255, 255, 255, 0.42)');
    band.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, h * 0.24, w, h * 0.24);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.needsUpdate = true;
  return tex;
}

export interface StudioSceneManager {
  applyPreset: (preset: StudioLightingPreset, viewMode: WebGLViewMode) => void;
  dispose: () => void;
}

export function createStudioSceneManager(
  scene: THREE.Scene,
  floorMesh: THREE.Mesh,
  floorMat: THREE.MeshStandardMaterial,
  floorGlowMat: THREE.MeshBasicMaterial,
  shadowPlaneMat: THREE.MeshBasicMaterial,
): StudioSceneManager {
  let disposed = false;
  let currentPreset: StudioLightingPreset = 'studio';
  let currentMode: WebGLViewMode = 'car';

  const studioDomeTex = createStudioCycloramaTexture();
  const galleryDomeTex = createWhiteShowroomCycloramaTexture();
  let sunsetSkyTex: THREE.Texture | null = null;
  let sunsetLoading = false;

  // 共享 360° 无畸变远景穹顶（地面由真实平整 3D 地板承载，绝不产生球面漩涡畸变）
  const skyGeo = new THREE.SphereGeometry(40, 48, 28);
  const skyMat = new THREE.MeshBasicMaterial({
    map: studioDomeTex,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.renderOrder = -10;
  scene.add(skyMesh);

  const disposablesGeo: THREE.BufferGeometry[] = [skyGeo];
  const disposablesMat: THREE.Material[] = [skyMat];

  // --- 场景 1：暗夜柔光影棚装置（3 道悬吊磨砂柔光灯箱 + 地面香槟金转盘细环） ---
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

  // --- 场景 2：极简白棚美术馆装置（顶部 5 道建筑线性天窗灯阵 + 地面拉丝钛银圆盘镶线） ---
  const galleryProps = new THREE.Group();
  const louverGeo = new THREE.BoxGeometry(6.8, 0.07, 0.46);
  const louverMat = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false });
  const louverFrameGeo = new THREE.BoxGeometry(7.0, 0.09, 0.56);
  const louverFrameMat = new THREE.MeshStandardMaterial({
    color: '#c4cbd6',
    roughness: 0.55,
    metalness: 0.15,
  });
  disposablesGeo.push(louverGeo, louverFrameGeo);
  disposablesMat.push(louverMat, louverFrameMat);
  for (const zPos of [-3.2, -1.6, 0, 1.6, 3.2]) {
    const frame = new THREE.Mesh(louverFrameGeo, louverFrameMat);
    frame.position.set(0, 5.45, zPos);
    galleryProps.add(frame);
    const panel = new THREE.Mesh(louverGeo, louverMat);
    panel.position.set(0, 5.40, zPos);
    galleryProps.add(panel);
  }
  // 精致的展车圆形转盘双银线（克制高定，无任何突兀几何体）
  const galleryOuterRingGeo = new THREE.RingGeometry(3.26, 3.30, 128);
  galleryOuterRingGeo.rotateX(-Math.PI / 2);
  const galleryOuterRingMat = new THREE.MeshBasicMaterial({
    color: '#9aa4b2',
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const galleryInnerRingGeo = new THREE.RingGeometry(2.96, 2.98, 128);
  galleryInnerRingGeo.rotateX(-Math.PI / 2);
  const galleryInnerRingMat = new THREE.MeshBasicMaterial({
    color: '#b5becb',
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  disposablesGeo.push(galleryOuterRingGeo, galleryInnerRingGeo);
  disposablesMat.push(galleryOuterRingMat, galleryInnerRingMat);
  const gOuter = new THREE.Mesh(galleryOuterRingGeo, galleryOuterRingMat);
  gOuter.position.y = 0.003;
  const gInner = new THREE.Mesh(galleryInnerRingGeo, galleryInnerRingMat);
  gInner.position.y = 0.003;
  galleryProps.add(gOuter, gInner);
  galleryProps.visible = false;
  scene.add(galleryProps);

  // 展厅/落日下的真实方向光阴影接收层
  const shadowCatcherGeo = new THREE.PlaneGeometry(14, 14);
  shadowCatcherGeo.rotateX(-Math.PI / 2);
  const shadowCatcherMat = new THREE.ShadowMaterial({
    opacity: 0.24,
    depthWrite: false,
  });
  disposablesGeo.push(shadowCatcherGeo);
  disposablesMat.push(shadowCatcherMat);
  const shadowCatcher = new THREE.Mesh(shadowCatcherGeo, shadowCatcherMat);
  shadowCatcher.position.y = 0.001;
  shadowCatcher.receiveShadow = true;
  shadowCatcher.visible = false;
  scene.add(shadowCatcher);

  const textureLoader = new THREE.TextureLoader();

  const syncScene = () => {
    const showCarProps = currentMode === 'car' || currentMode === 'closeup';
    floorMesh.visible = true;
    studioProps.visible = showCarProps && currentPreset === 'studio';
    galleryProps.visible = showCarProps && currentPreset === 'gallery';
    shadowCatcher.visible = showCarProps && currentPreset !== 'studio';

    if (currentPreset === 'gallery') {
      skyMat.map = galleryDomeTex;
      skyMesh.rotation.y = 0;
      floorMat.color.set('#dce2ea');
      floorMat.roughness = 0.36;
      floorMat.metalness = 0.04;
      floorMat.envMapIntensity = 0.38;
      floorGlowMat.opacity = 0.04;
      shadowPlaneMat.opacity = 0.52;
      shadowCatcherMat.opacity = 0.22;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.set('#dce2ea');
        scene.fog.density = 0.022;
      }
    } else if (currentPreset === 'sunset') {
      skyMat.map = sunsetSkyTex ?? studioDomeTex;
      // 调整实拍落日天穹方位，让默认 3/4 车头机位正好看到柔和落日金辉地平线
      skyMesh.rotation.y = Math.PI * 0.42;
      // 平整深蓝灰倒影沥青/盐湖质感地面，自然融入落日天际线
      floorMat.color.set('#2b3242');
      floorMat.roughness = 0.22;
      floorMat.metalness = 0.28;
      floorMat.envMapIntensity = 0.85;
      floorGlowMat.opacity = 0.14;
      shadowPlaneMat.opacity = 0.72;
      shadowCatcherMat.opacity = 0.34;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.set('#58657d');
        scene.fog.density = 0.018;
      }
    } else {
      skyMat.map = studioDomeTex;
      skyMesh.rotation.y = 0;
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
    skyMat.needsUpdate = true;
    floorMat.needsUpdate = true;
  };

  const ensureSunsetSky = () => {
    if (sunsetSkyTex || sunsetLoading) return;
    sunsetLoading = true;
    textureLoader.load(
      SUNSET_SKY_URL,
      (tex) => {
        sunsetLoading = false;
        if (disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.mapping = THREE.EquirectangularReflectionMapping;
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        sunsetSkyTex = tex;
        syncScene();
      },
      undefined,
      () => {
        sunsetLoading = false;
      },
    );
  };

  const applyPreset = (preset: StudioLightingPreset, viewMode: WebGLViewMode) => {
    currentPreset = preset;
    currentMode = viewMode;
    if (preset === 'sunset') {
      ensureSunsetSky();
    }
    syncScene();
  };

  const dispose = () => {
    disposed = true;
    studioDomeTex.dispose();
    galleryDomeTex.dispose();
    sunsetSkyTex?.dispose();
    disposablesGeo.forEach((g) => g.dispose());
    disposablesMat.forEach((m) => m.dispose());
    scene.remove(skyMesh);
    scene.remove(studioProps);
    scene.remove(galleryProps);
    scene.remove(shadowCatcher);
  };

  return { applyPreset, dispose };
}
