// ============================================================
// 和膜 HAMOREY — 三大沉浸式 3D 实景展厅（柔光影棚 / 极昼美术馆 / 海岸落日）
// 展厅与落日采用 Three.js 官方 GroundedSkybox 地面投影实景穹顶，车轮直落真实地面
// ============================================================

import * as THREE from 'three';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';
import type { StudioLightingPreset, StudioViewMode } from '../../config/colorStudio';

type WebGLViewMode = Exclude<StudioViewMode, 'swatch'>;

const SCENE_PANORAMA_URLS: Record<'gallery' | 'sunset', string> = {
  gallery: '/color-studio/scenes/gallery-360.jpg?v=20261123',
  sunset: '/color-studio/scenes/sunset-360.jpg?v=20261123',
};

function createStudioDomeTexture(): THREE.CanvasTexture {
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
    bg.addColorStop(0.52, '#171922');
    bg.addColorStop(0.64, '#0c0d12');
    bg.addColorStop(1.0, '#050608');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const horizonGlow = ctx.createLinearGradient(0, h * 0.38, 0, h * 0.62);
    horizonGlow.addColorStop(0, 'rgba(201, 168, 106, 0)');
    horizonGlow.addColorStop(0.5, 'rgba(201, 168, 106, 0.08)');
    horizonGlow.addColorStop(1, 'rgba(201, 168, 106, 0)');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, h * 0.38, w, h * 0.24);

    for (const cx of [w * 0.22, w * 0.5, w * 0.78]) {
      const grad = ctx.createRadialGradient(cx, h * 0.22, 8, cx, h * 0.22, 160);
      grad.addColorStop(0, 'rgba(245, 240, 232, 0.14)');
      grad.addColorStop(0.5, 'rgba(205, 212, 228, 0.04)');
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

  const studioDomeTex = createStudioDomeTexture();
  const studioSkyGeo = new THREE.SphereGeometry(32, 48, 28);
  const studioSkyMat = new THREE.MeshBasicMaterial({
    map: studioDomeTex,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const studioSkyMesh = new THREE.Mesh(studioSkyGeo, studioSkyMat);
  studioSkyMesh.renderOrder = -10;
  scene.add(studioSkyMesh);

  // 暗夜柔光影棚装置（顶部柔光灯箱 + 地面香槟金细环）
  const studioProps = new THREE.Group();
  const softboxGeo = new THREE.BoxGeometry(5.6, 0.08, 0.52);
  const softboxMat = new THREE.MeshBasicMaterial({ color: '#f3eee6', fog: false });
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
  const studioRing = new THREE.Mesh(studioRingGeo, studioRingMat);
  studioRing.position.y = 0.003;
  studioProps.add(studioRing);
  scene.add(studioProps);

  // 实景地面投影阴影接收层（仅在展厅/落日实景下启用，将车辆真实投影落到微水泥/沥青地面上）
  const shadowCatcherGeo = new THREE.PlaneGeometry(14, 14);
  shadowCatcherGeo.rotateX(-Math.PI / 2);
  const shadowCatcherMat = new THREE.ShadowMaterial({
    opacity: 0.38,
    depthWrite: false,
  });
  const shadowCatcher = new THREE.Mesh(shadowCatcherGeo, shadowCatcherMat);
  shadowCatcher.position.y = 0.001;
  shadowCatcher.receiveShadow = true;
  shadowCatcher.visible = false;
  scene.add(shadowCatcher);

  // 延迟按需加载 360° 实景 GroundedSkybox（极昼美术馆 & 海岸落日）
  const textureLoader = new THREE.TextureLoader();
  const skyboxes: Partial<Record<'gallery' | 'sunset', GroundedSkybox>> = {};
  const loadedTextures: THREE.Texture[] = [];
  const loadingSet = new Set<'gallery' | 'sunset'>();

  const syncVisibility = () => {
    const showCarProps = currentMode === 'car' || currentMode === 'closeup';
    const activeSkybox =
      currentPreset === 'gallery' || currentPreset === 'sunset'
        ? skyboxes[currentPreset]
        : undefined;

    studioSkyMesh.visible = !activeSkybox;
    studioProps.visible = showCarProps && currentPreset === 'studio';
    floorMesh.visible = !activeSkybox;
    shadowCatcher.visible = showCarProps && Boolean(activeSkybox);

    for (const key of ['gallery', 'sunset'] as const) {
      const box = skyboxes[key];
      if (!box) continue;
      const isActive = currentPreset === key;
      box.visible = isActive;
      if (isActive) {
        // 整车模式下将地面精确投影至 y=0；球体/微距模式下略降高度让背景景深居中
        const groundHeight = key === 'gallery' ? 2.4 : 2.15;
        box.position.y = showCarProps ? groundHeight : 1.35;
      }
    }

    if (currentPreset === 'gallery') {
      floorGlowMat.opacity = 0.05;
      shadowPlaneMat.opacity = 0.58;
      shadowCatcherMat.opacity = 0.32;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.set('#cfd4dc');
        scene.fog.density = 0.004;
      }
    } else if (currentPreset === 'sunset') {
      floorGlowMat.opacity = 0.14;
      shadowPlaneMat.opacity = 0.78;
      shadowCatcherMat.opacity = 0.46;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.set('#2a1c22');
        scene.fog.density = 0.005;
      }
    } else {
      floorMat.color.set('#08090d');
      floorMat.roughness = 0.58;
      floorMat.metalness = 0.05;
      floorMat.envMapIntensity = 0.24;
      floorMat.needsUpdate = true;
      floorGlowMat.opacity = 0.22;
      shadowPlaneMat.opacity = 0.86;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.set('#0b0c12');
        scene.fog.density = 0.032;
      }
    }
  };

  const ensurePhotoSkybox = (key: 'gallery' | 'sunset') => {
    if (skyboxes[key] || loadingSet.has(key)) return;
    loadingSet.add(key);

    textureLoader.load(
      SCENE_PANORAMA_URLS[key],
      (tex) => {
        loadingSet.delete(key);
        if (disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.mapping = THREE.EquirectangularReflectionMapping;
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        loadedTextures.push(tex);

        const groundHeight = key === 'gallery' ? 2.4 : 2.15;
        const skybox = new GroundedSkybox(tex, groundHeight, 34, 64);
        skybox.position.y = groundHeight;
        // 调整初始水平方位角，使默认 3/4 车头机位正对建筑玻璃庭院 / 落日海平面主景
        skybox.rotation.y = key === 'gallery' ? Math.PI * 0.78 : Math.PI * 0.72;
        if (skybox.material instanceof THREE.MeshBasicMaterial) {
          skybox.material.fog = false;
        }
        skybox.renderOrder = -9;
        skybox.visible = false;

        skyboxes[key] = skybox;
        scene.add(skybox);
        syncVisibility();
      },
      undefined,
      () => {
        loadingSet.delete(key);
      },
    );
  };

  const applyPreset = (preset: StudioLightingPreset, viewMode: WebGLViewMode) => {
    currentPreset = preset;
    currentMode = viewMode;
    if (preset === 'gallery' || preset === 'sunset') {
      ensurePhotoSkybox(preset);
    }
    syncVisibility();
  };

  const dispose = () => {
    disposed = true;
    studioDomeTex.dispose();
    studioSkyGeo.dispose();
    studioSkyMat.dispose();
    softboxGeo.dispose();
    softboxMat.dispose();
    studioRingGeo.dispose();
    studioRingMat.dispose();
    shadowCatcherGeo.dispose();
    shadowCatcherMat.dispose();
    loadedTextures.forEach((t) => t.dispose());
    for (const key of ['gallery', 'sunset'] as const) {
      const box = skyboxes[key];
      if (!box) continue;
      box.geometry.dispose();
      if (Array.isArray(box.material)) box.material.forEach((m) => m.dispose());
      else box.material.dispose();
      scene.remove(box);
    }
    scene.remove(studioSkyMesh);
    scene.remove(studioProps);
    scene.remove(shadowCatcher);
  };

  return { applyPreset, dispose };
}
