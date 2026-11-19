// ============================================================
// 和膜 HAMOREY — 五合一高定 3D 选色工坊舞台 V2
// HalfFloat 真 HDR 影棚光影 · 3D 悬浮流光样板廊 · 精确落地超跑展台
// ============================================================

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {
  STUDIO_VEHICLES,
  type ColorFilmItem,
  type StudioLightingPreset,
  type StudioVehicleId,
  type StudioViewMode,
} from '../../config/colorStudio';
import {
  createAutomotiveStudioEnvMap,
  createMetallicFlakeNormalMap,
} from './studioEnvironment';
import { createFilmMaterialController, type FilmMaterialController } from './filmMaterial';
import {
  createSpeedformGallery,
  type SpeedformGalleryResources,
} from './speedformBuilder';

export type CarModelLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ColorStudioCanvasProps {
  swatches: ColorFilmItem[];
  activeSwatch: ColorFilmItem;
  viewMode: StudioViewMode;
  lightingPreset: StudioLightingPreset;
  vehicleId: StudioVehicleId;
  lang: 'zh' | 'en';
  pickedUp: boolean;
  onSelectSwatchByIndex: (index: number) => void;
  onStepSwatch: (delta: number) => void;
  onTogglePickedUp: () => void;
  onModelStatusChange?: (status: CarModelLoadStatus, progress: number) => void;
}

interface CameraPreset {
  pos: THREE.Vector3;
  target: THREE.Vector3;
}

const CAMERA_PRESETS: Record<StudioViewMode, CameraPreset> = {
  swatch: { pos: new THREE.Vector3(0, 0.06, 5.05), target: new THREE.Vector3(0, -0.16, 0) },
  sphere: { pos: new THREE.Vector3(2.25, 0.96, 2.78), target: new THREE.Vector3(0, 0.02, 0) },
  macro: { pos: new THREE.Vector3(0, 0.16, 2.35), target: new THREE.Vector3(0, 0.02, 0) },
  car: { pos: new THREE.Vector3(3.85, 1.28, 4.35), target: new THREE.Vector3(0, 0.42, 0) },
  closeup: { pos: new THREE.Vector3(1.95, 0.96, 2.05), target: new THREE.Vector3(0.28, 0.56, 0.48) },
};

function getResponsiveCameraPreset(mode: StudioViewMode, aspect: number): CameraPreset {
  const base = CAMERA_PRESETS[mode];
  if (aspect < 0.85 && (mode === 'car' || mode === 'swatch' || mode === 'sphere')) {
    const scale = mode === 'car' ? 2.08 : mode === 'swatch' ? 1.32 : 1.36;
    const target = base.target.clone();
    if (mode === 'swatch') {
      // 竖屏将视点略上抬，使样板下移到顶部浮层与底部导航正中间的空白区域
      target.y = 0.08;
    }
    const offset = base.pos.clone().sub(base.target).multiplyScalar(scale);
    return {
      pos: target.clone().add(offset),
      target,
    };
  }
  return { pos: base.pos.clone(), target: base.target.clone() };
}

function computeStudioMoodColor(
  hex: string,
  lightingPreset: StudioLightingPreset,
): THREE.Color {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const baseL =
    lightingPreset === 'gallery'
      ? 0.055
      : lightingPreset === 'sunset'
        ? 0.032
        : 0.024;
  const targetS = hsl.s < 0.08 ? 0.08 : Math.min(0.55, hsl.s * 0.55);
  return new THREE.Color().setHSL(hsl.h, targetS, baseL);
}

function computeSpotlightGlowColor(hex: string): THREE.Color {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return new THREE.Color().setHSL(
    hsl.h,
    Math.min(0.85, Math.max(0.15, hsl.s)),
    Math.max(0.38, Math.min(0.62, hsl.l + 0.15)),
  );
}

function createStudioFloorAlphaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(256, 256, 28, 256, 256, 250);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.42, '#b0b0b0');
    grad.addColorStop(0.78, '#282828');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function createRadialGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 250);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
    grad.addColorStop(0.38, 'rgba(255, 255, 255, 0.42)');
    grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(256, 256, 24, 256, 256, 248);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.54)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildMacroWaveGeometry(): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(4.8, 3.3, 64, 44);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z =
      Math.cos(x * 0.88) * 0.25 +
      Math.sin(y * 1.1) * 0.14 -
      (x * x + y * y) * 0.028;
    pos.setZ(i, z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function ColorStudioCanvas({
  swatches,
  activeSwatch,
  viewMode,
  lightingPreset,
  vehicleId,
  lang,
  pickedUp,
  onSelectSwatchByIndex,
  onStepSwatch,
  onTogglePickedUp,
  onModelStatusChange,
}: ColorStudioCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({
    swatches,
    activeSwatch,
    viewMode,
    lightingPreset,
    vehicleId,
    lang,
    pickedUp,
    onSelectSwatchByIndex,
    onStepSwatch,
    onTogglePickedUp,
    onModelStatusChange,
  });
  stateRef.current = {
    swatches,
    activeSwatch,
    viewMode,
    lightingPreset,
    vehicleId,
    lang,
    pickedUp,
    onSelectSwatchByIndex,
    onStepSwatch,
    onTogglePickedUp,
    onModelStatusChange,
  };

  const runtimeRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    envMap: THREE.Texture | null;
    filmController: FilmMaterialController | null;
    speedformGallery: SpeedformGalleryResources | null;
    sphereGroup: THREE.Group | null;
    macroMesh: THREE.Mesh | null;
    carGroup: THREE.Group | null;
    carAnchor: THREE.Group | null;
    floorGlowMat: THREE.MeshBasicMaterial | null;
    hemiLight: THREE.HemisphereLight | null;
    keyLight: THREE.DirectionalLight | null;
    rimLight: THREE.DirectionalLight | null;
    pianoBlackMat: THREE.MeshPhysicalMaterial | null;
    targetMoodColor: THREE.Color;
    targetGlowColor: THREE.Color;
    transitionCamera: boolean;
    desiredCameraPos: THREE.Vector3;
    desiredTarget: THREE.Vector3;
    controls: OrbitControls | null;
    switchVehicle: ((id: StudioVehicleId) => void) | null;
    shadowDirtyFrames: number;
  }>({
    renderer: null,
    scene: null,
    envMap: null,
    filmController: null,
    speedformGallery: null,
    sphereGroup: null,
    macroMesh: null,
    carGroup: null,
    carAnchor: null,
    floorGlowMat: null,
    hemiLight: null,
    keyLight: null,
    rimLight: null,
    pianoBlackMat: null,
    targetMoodColor: computeStudioMoodColor(activeSwatch.hex, lightingPreset),
    targetGlowColor: computeSpotlightGlowColor(activeSwatch.shiftHex || activeSwatch.hex),
    transitionCamera: false,
    desiredCameraPos: CAMERA_PRESETS[viewMode].pos.clone(),
    desiredTarget: CAMERA_PRESETS[viewMode].target.clone(),
    controls: null,
    switchVehicle: null,
    shadowDirtyFrames: 4,
  });

  // 1. 初始化 WebGL 场景与三大 3D 展示载体
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    // 自适应像素比：Retina 屏不再强制 2x（4 倍像素量），按实际帧耗动态升降
    const deviceDpr = window.devicePixelRatio || 1;
    const maxDpr = Math.min(deviceDpr, 1.75);
    const minDpr = Math.min(deviceDpr, 1);
    let currentDpr = Math.min(deviceDpr, 1.5);
    renderer.setPixelRatio(currentDpr);
    renderer.setSize(width, height);
    // Khronos PBR Neutral：专为产品色彩还原设计，高光不发白、不偏色
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 阴影按需更新：车辆静止时不再每帧重绘 20 万面阴影
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);
    runtimeRef.current.renderer = renderer;

    const scene = new THREE.Scene();
    runtimeRef.current.scene = scene;
    const initialMood = computeStudioMoodColor(
      stateRef.current.activeSwatch.hex,
      stateRef.current.lightingPreset,
    );
    scene.background = initialMood.clone();
    scene.fog = new THREE.FogExp2(initialMood.getHex(), 0.04);

    const envMap = createAutomotiveStudioEnvMap(
      renderer,
      stateRef.current.lightingPreset,
    );
    scene.environment = envMap;
    runtimeRef.current.envMap = envMap;

    const flakeNormalMap = createMetallicFlakeNormalMap();
    const filmController = createFilmMaterialController(
      stateRef.current.activeSwatch,
      flakeNormalMap,
      stateRef.current.viewMode,
    );
    runtimeRef.current.filmController = filmController;

    const pianoBlackMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#060709'),
      metalness: 0.14,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.015,
      reflectivity: 1.0,
      envMapIntensity: 1.0,
      side: THREE.DoubleSide,
    });
    runtimeRef.current.pianoBlackMat = pianoBlackMat;

    // 真实棚拍布光：环境 HDR 主导反射，直射光只做轻度塑形，避免整面漫反射泛白
    const hemiLight = new THREE.HemisphereLight('#e8eefc', '#0b0c10', 0.12);
    scene.add(hemiLight);
    runtimeRef.current.hemiLight = hemiLight;

    const keyLight = new THREE.DirectionalLight('#fff8f0', 0.75);
    keyLight.position.set(4.5, 7.8, 5.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);
    runtimeRef.current.keyLight = keyLight;

    const fillLight = new THREE.DirectionalLight('#eef2ff', 0.14);
    fillLight.position.set(-4.4, 4.6, 4.8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#dbe8ff', 0.3);
    rimLight.position.set(-5.2, 3.4, -4.4);
    scene.add(rimLight);
    runtimeRef.current.rimLight = rimLight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    const startPreset = getResponsiveCameraPreset(
      stateRef.current.viewMode,
      width / Math.max(1, height),
    );
    camera.position.copy(startPreset.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(startPreset.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = 1.65;
    controls.maxDistance = 14.5;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minPolarAngle = 0.16;
    controls.enabled = stateRef.current.viewMode !== 'swatch';
    runtimeRef.current.controls = controls;

    const handleControlStart = () => {
      runtimeRef.current.transitionCamera = false;
    };
    controls.addEventListener('start', handleControlStart);

    // === 实景 1：3D 悬浮流光曲率样板廊（原创雕塑 Speedform）===
    const initialIdx = Math.max(
      0,
      stateRef.current.swatches.findIndex(
        (s) => s.code === stateRef.current.activeSwatch.code,
      ),
    );
    const speedformGallery = createSpeedformGallery(
      filmController.material,
      stateRef.current.swatches,
      initialIdx,
      stateRef.current.lang,
    );
    speedformGallery.rootGroup.visible = stateRef.current.viewMode === 'swatch';
    scene.add(speedformGallery.rootGroup);
    runtimeRef.current.speedformGallery = speedformGallery;

    // === 实景 2：高定测试光影球体 ===
    const sphereGroup = new THREE.Group();
    const sphereGeo = new THREE.SphereGeometry(1.1, 72, 56);
    const sphereMesh = new THREE.Mesh(sphereGeo, filmController.material);
    sphereMesh.position.y = 0.14;
    sphereMesh.castShadow = true;
    sphereGroup.add(sphereMesh);

    const ringGeo = new THREE.TorusGeometry(0.76, 0.036, 20, 72);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#C9A86A'),
      metalness: 0.94,
      roughness: 0.18,
      envMapIntensity: 1.5,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = -1.04;
    sphereGroup.add(ringMesh);
    sphereGroup.visible = stateRef.current.viewMode === 'sphere';
    scene.add(sphereGroup);
    runtimeRef.current.sphereGroup = sphereGroup;

    // === 实景 3：微距曲面 ===
    const macroGeo = buildMacroWaveGeometry();
    const macroMesh = new THREE.Mesh(macroGeo, filmController.material);
    macroMesh.rotation.x = -0.16;
    macroMesh.visible = stateRef.current.viewMode === 'macro';
    scene.add(macroMesh);
    runtimeRef.current.macroMesh = macroMesh;

    // === 实景 4：整车 / 近景暗夜聚光展台 ===
    const carGroup = new THREE.Group();
    const floorAlphaTex = createStudioFloorAlphaTexture();
    const floorGeo = new THREE.CircleGeometry(15, 72);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#07080b'),
      roughness: 0.62,
      metalness: 0.04,
      envMapIntensity: 0.22,
      alphaMap: floorAlphaTex,
      transparent: true,
      depthWrite: false,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.004;
    floorMesh.receiveShadow = true;
    carGroup.add(floorMesh);

    // 展车下方同色系柔和地灯氛围光晕
    const glowTex = createRadialGlowTexture();
    const floorGlowGeo = new THREE.PlaneGeometry(7.8, 7.8);
    floorGlowGeo.rotateX(-Math.PI / 2);
    const floorGlowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      color: computeSpotlightGlowColor(
        stateRef.current.activeSwatch.shiftHex || stateRef.current.activeSwatch.hex,
      ),
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const floorGlowMesh = new THREE.Mesh(floorGlowGeo, floorGlowMat);
    floorGlowMesh.position.y = 0.001;
    carGroup.add(floorGlowMesh);
    runtimeRef.current.floorGlowMat = floorGlowMat;

    const shadowTex = createContactShadowTexture();
    const shadowPlaneGeo = new THREE.PlaneGeometry(5.6, 5.6);
    shadowPlaneGeo.rotateX(-Math.PI / 2);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.position.y = 0.002;
    carGroup.add(shadowPlane);

    const carAnchor = new THREE.Group();
    carGroup.add(carAnchor);
    carGroup.visible =
      stateRef.current.viewMode === 'car' || stateRef.current.viewMode === 'closeup';
    scene.add(carGroup);
    runtimeRef.current.carGroup = carGroup;
    runtimeRef.current.carAnchor = carAnchor;

    // 后台异步加载与缓存双车型 3D 模型（Model 3 焕新版 / Model Y 焕新版）
    let disposed = false;
    const extraCarMaterials: THREE.Material[] = [];
    const loadedVehicles = new Map<StudioVehicleId, THREE.Group>();
    const loadingVehicles = new Set<StudioVehicleId>();
    let activeLoadToken = 0;

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#05070b'),
      metalness: 0.0,
      roughness: 0.04,
      ior: 1.52,
      transparent: true,
      opacity: 0.9,
      envMapIntensity: 1.05,
      side: THREE.FrontSide,
    });
    const tireRubberMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#141519'),
      roughness: 0.85,
      metalness: 0.04,
      envMapIntensity: 0.35,
    });
    const alloyRimMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#272a31'),
      metalness: 0.82,
      roughness: 0.24,
      clearcoat: 0.45,
      envMapIntensity: 1.0,
    });
    const frontDrlMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f4f8ff'),
      emissive: new THREE.Color('#dbeafe'),
      emissiveIntensity: 0.95,
      roughness: 0.12,
      metalness: 0.1,
    });
    const headlightLensMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#dce8f8'),
      metalness: 0.08,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      envMapIntensity: 1.0,
    });
    const rearLightBarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#b91c1c'),
      emissive: new THREE.Color('#dc2626'),
      emissiveIntensity: 1.05,
      roughness: 0.15,
      metalness: 0.12,
    });
    extraCarMaterials.push(
      glassMat,
      tireRubberMat,
      alloyRimMat,
      frontDrlMat,
      headlightLensMat,
      rearLightBarMat,
    );

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    const showLoadedVehicle = (id: StudioVehicleId) => {
      for (const [vid, group] of loadedVehicles.entries()) {
        group.visible = vid === id;
      }
      runtimeRef.current.shadowDirtyFrames = 3;
    };

    const bindVehicleMaterials = (root: THREE.Group, id: StudioVehicleId) => {
      root.traverse((obj) => {
        if (!(obj as THREE.Mesh).isMesh) return;
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const mapSingleMaterial = (mat: THREE.Material): THREE.Material => {
          const matName = (mat.name || '').trim();
          if (id === 'model3') {
            // Model 3 焕新版 (Highland)
            if (matName === 'Geohoodsub00021Mtl') {
              return filmController.material;
            }
            if (
              matName === 'Geoextwindow0021Mtl' ||
              matName === 'Geodoorl2sub31Mtl' ||
              matName === 'Geodoorr2sub31Mtl'
            ) {
              return glassMat;
            }
            if (matName === 'Tire1Mtl') {
              return tireRubberMat;
            }
            if (matName === 'Georimblurlfsub021Mtl') {
              return alloyRimMat;
            }
            if (matName === 'Ln12Mtl') {
              return rearLightBarMat;
            }
            return mat;
          }

          // Model Y 焕新版 (Juniper 2026)
          if (matName === 'paint') {
            return filmController.material;
          }
          if (matName === 'glass_base') {
            mesh.castShadow = false;
            return glassMat;
          }
          if (matName === 'glass_headlight' || matName === 'glass_headlight77') {
            // 剥离 KHR_materials_transmission，避免 Three.js 每帧二次全屏离屏渲染导致拖拽卡顿
            mesh.castShadow = false;
            return headlightLensMat;
          }
          if (matName === 'Rubber_Rough') {
            return tireRubberMat;
          }
          if (matName === 'front_white_light') {
            mesh.castShadow = false;
            return frontDrlMat;
          }
          if (matName === 'back_red_Light') {
            mesh.castShadow = false;
            return rearLightBarMat;
          }
          // 兜底清除任何残留 transmission 属性，保证 60fps 丝滑旋转
          const phys = mat as THREE.MeshPhysicalMaterial;
          if (typeof phys.transmission === 'number' && phys.transmission > 0) {
            phys.transmission = 0;
            phys.transparent = true;
            phys.opacity = Math.min(phys.opacity || 0.35, 0.35);
            phys.needsUpdate = true;
          }
          return mat;
        };

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(mapSingleMaterial);
        } else if (mesh.material) {
          mesh.material = mapSingleMaterial(mesh.material);
        }
      });
    };

    const loadOrSwitchVehicle = (id: StudioVehicleId) => {
      const existing = loadedVehicles.get(id);
      if (existing) {
        showLoadedVehicle(id);
        stateRef.current.onModelStatusChange?.('ready', 100);
        return;
      }

      const spec = STUDIO_VEHICLES.find((v) => v.id === id) ?? STUDIO_VEHICLES[0];
      const token = ++activeLoadToken;
      stateRef.current.onModelStatusChange?.('loading', 8);

      if (loadingVehicles.has(id)) return;
      loadingVehicles.add(id);

      loader.load(
        spec.modelUrl,
        (gltf) => {
          loadingVehicles.delete(id);
          if (disposed) return;

          const wrapper = new THREE.Group();
          const root = gltf.scene;
          if (spec.rotationY !== 0) {
            root.rotation.y = spec.rotationY;
          }
          wrapper.add(root);

          // 按世界坐标真实顶点计算精确包围盒，使四轮精确贴合地面 y=0
          wrapper.updateMatrixWorld(true);
          const rawBox = new THREE.Box3();
          const tempVec = new THREE.Vector3();
          root.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const m = obj as THREE.Mesh;
              const pos = m.geometry.getAttribute('position');
              if (pos) {
                for (let i = 0; i < pos.count; i++) {
                  tempVec.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
                  rawBox.expandByPoint(tempVec);
                }
              }
            }
          });
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          rawBox.getSize(size);
          rawBox.getCenter(center);

          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const normScale = spec.targetLength / maxDim;
          wrapper.scale.setScalar(normScale);
          wrapper.position.set(
            -center.x * normScale,
            -rawBox.min.y * normScale,
            -center.z * normScale,
          );

          bindVehicleMaterials(root, id);
          loadedVehicles.set(id, wrapper);
          carAnchor.add(wrapper);

          const isCurrent = stateRef.current.vehicleId === id;
          wrapper.visible = isCurrent;
          if (isCurrent || token === activeLoadToken) {
            showLoadedVehicle(stateRef.current.vehicleId);
            stateRef.current.onModelStatusChange?.('ready', 100);
          }
        },
        (evt) => {
          if (disposed || !evt.total || stateRef.current.vehicleId !== id) return;
          const pct = Math.min(98, Math.round((evt.loaded / evt.total) * 100));
          stateRef.current.onModelStatusChange?.('loading', pct);
        },
        () => {
          loadingVehicles.delete(id);
          if (disposed || stateRef.current.vehicleId !== id) return;
          stateRef.current.onModelStatusChange?.('error', 0);
        },
      );
    };

    runtimeRef.current.switchVehicle = loadOrSwitchVehicle;
    const preloadTimer = window.setTimeout(
      () => loadOrSwitchVehicle(stateRef.current.vehicleId),
      220,
    );

    // === 流光样板廊交互手势（横向切色 / 纵向倾角曲率看折光 / 点击邻位 / 双击特写）===
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    let isDraggingPlaque = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastStepX = 0;
    let dragMovedDist = 0;
    let targetFlex = 0;
    let currentFlex = 0;
    let targetPlaqueRotY = 0.14;
    let currentPlaqueRotY = 0.14;
    let targetPlaqueRotX = -0.05;
    let currentPlaqueRotX = -0.05;
    let hoverTiltX = 0;
    let hoverTiltY = 0;
    let lastTapTime = 0;

    const getCanvasRect = () => renderer.domElement.getBoundingClientRect();

    const onPointerDown = (e: PointerEvent) => {
      if (stateRef.current.viewMode !== 'swatch') return;
      isDraggingPlaque = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      lastStepX = e.clientX;
      dragMovedDist = 0;
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (stateRef.current.viewMode !== 'swatch') return;
      const rect = getCanvasRect();
      hoverTiltY = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 0.34;
      hoverTiltX = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 0.2;

      if (!isDraggingPlaque) return;

      const dxTotal = e.clientX - dragStartX;
      const dyTotal = e.clientY - dragStartY;
      dragMovedDist = Math.max(dragMovedDist, Math.hypot(dxTotal, dyTotal));

      // 1) 横向滑动切换邻位样板（若非明显纵向观察）
      const dxSinceStep = e.clientX - lastStepX;
      targetPlaqueRotY = THREE.MathUtils.clamp(dxSinceStep * 0.008, -0.55, 0.55);

      if (Math.abs(dxSinceStep) > 62 && Math.abs(dxSinceStep) > Math.abs(dyTotal) * 0.45) {
        const step = dxSinceStep < 0 ? 1 : -1;
        stateRef.current.onStepSwatch(step);
        lastStepX = e.clientX;
        currentPlaqueRotY = -step * 0.35;
      }

      // 2) 纵向拖拽：同时微倾样板俯仰角并柔和调整曲率，驱动流光灯带滑过中脊与腰线
      targetPlaqueRotX = THREE.MathUtils.clamp(-0.05 + dyTotal * 0.0022, -0.35, 0.32);
      targetFlex = THREE.MathUtils.clamp(dyTotal / 220, -0.58, 0.58);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDraggingPlaque) return;
      isDraggingPlaque = false;
      targetPlaqueRotY = 0.14;
      targetPlaqueRotX = -0.05;
      targetFlex = 0;

      if (dragMovedDist < 10 && stateRef.current.viewMode === 'swatch') {
        const now = performance.now();
        const rect = getCanvasRect();
        pointerNdc.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);

        const sideMeshes = speedformGallery.sidePlaques.map((p) => p.mesh);
        const sideHits = raycaster.intersectObjects(sideMeshes, false);
        const activeHits = raycaster.intersectObject(speedformGallery.activePlaqueMesh, false);

        if (
          sideHits.length > 0 &&
          (activeHits.length === 0 || sideHits[0].distance < activeHits[0].distance)
        ) {
          const targetIdx = sideHits[0].object.userData?.swatchIndex;
          if (typeof targetIdx === 'number') {
            stateRef.current.onSelectSwatchByIndex(targetIdx);
            lastTapTime = 0;
            return;
          }
        }

        if (now - lastTapTime < 320) {
          stateRef.current.onTogglePickedUp();
          lastTapTime = 0;
        } else {
          lastTapTime = now;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);

    let lastIsPortrait = width / Math.max(1, height) < 0.85;
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const aspect = w / Math.max(1, h);
      const isPortrait = aspect < 0.85;
      camera.aspect = aspect;
      camera.fov = w < 640 ? 45 : 40;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      if (isPortrait !== lastIsPortrait) {
        lastIsPortrait = isPortrait;
        const preset = getResponsiveCameraPreset(stateRef.current.viewMode, aspect);
        runtimeRef.current.desiredCameraPos.copy(preset.pos);
        runtimeRef.current.desiredTarget.copy(preset.target);
        runtimeRef.current.transitionCamera = true;
      }
    };
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let rafId = 0;
    let lastTime = performance.now();
    const clockStart = lastTime;

    const animate = (now: number) => {
      if (disposed) return;
      rafId = window.requestAnimationFrame(animate);

      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const elapsed = (now - clockStart) / 1000;
      const { viewMode: curMode, pickedUp: isPicked } = stateRef.current;

      // 1) 同色调影棚氛围空间渐变
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(runtimeRef.current.targetMoodColor, Math.min(1, dt * 4.5));
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.copy(scene.background);
        }
        floorMat.color.copy(scene.background).multiplyScalar(0.55);
      }
      if (runtimeRef.current.floorGlowMat) {
        runtimeRef.current.floorGlowMat.color.lerp(
          runtimeRef.current.targetGlowColor,
          Math.min(1, dt * 4.5),
        );
      }

      // 2) 模式切换相机平滑过渡
      if (runtimeRef.current.transitionCamera) {
        const lerpAlpha = Math.min(1, dt * 6.5);
        camera.position.lerp(runtimeRef.current.desiredCameraPos, lerpAlpha);
        controls.target.lerp(runtimeRef.current.desiredTarget, lerpAlpha);
        if (
          camera.position.distanceTo(runtimeRef.current.desiredCameraPos) < 0.015 &&
          controls.target.distanceTo(runtimeRef.current.desiredTarget) < 0.015
        ) {
          camera.position.copy(runtimeRef.current.desiredCameraPos);
          controls.target.copy(runtimeRef.current.desiredTarget);
          runtimeRef.current.transitionCamera = false;
        }
      }

      // 3) 分模式微动效
      if (curMode === 'swatch') {
        const idleSwayY = !isDraggingPlaque ? Math.sin(elapsed * 0.72) * 0.09 : 0;
        const idleFlex = !isDraggingPlaque && Math.abs(targetFlex) < 0.001
          ? Math.sin(elapsed * 1.1) * 0.025
          : 0;

        currentFlex = THREE.MathUtils.lerp(currentFlex, targetFlex + idleFlex, Math.min(1, dt * 10));
        speedformGallery.setFlex(currentFlex);

        currentPlaqueRotY = THREE.MathUtils.lerp(
          currentPlaqueRotY,
          targetPlaqueRotY + idleSwayY + hoverTiltY * (isPicked ? 0.95 : 0.45),
          Math.min(1, dt * 7),
        );
        currentPlaqueRotX = THREE.MathUtils.lerp(
          currentPlaqueRotX,
          targetPlaqueRotX + hoverTiltX * (isPicked ? 0.6 : 0.3),
          Math.min(1, dt * 7),
        );

        speedformGallery.activeGroup.rotation.y = currentPlaqueRotY;
        speedformGallery.activeGroup.rotation.x = currentPlaqueRotX;

        const targetActiveZ = isPicked ? 1.18 : 0.16;
        const targetActiveScale = isPicked ? 1.14 : 1.0;
        speedformGallery.activeGroup.position.z = THREE.MathUtils.lerp(
          speedformGallery.activeGroup.position.z,
          targetActiveZ,
          Math.min(1, dt * 7),
        );
        const sVal = THREE.MathUtils.lerp(
          speedformGallery.activeGroup.scale.x,
          targetActiveScale,
          Math.min(1, dt * 7),
        );
        speedformGallery.activeGroup.scale.setScalar(sVal);

        // 拿起特写时，两侧画廊样板柔和后退，聚焦中心样板
        for (const item of speedformGallery.sidePlaques) {
          const absOff = Math.abs(item.offsetIndex);
          const restZ = -Math.pow(absOff, 1.32) * 0.62;
          const targetZ = isPicked ? restZ - 1.1 : restZ;
          const restX = item.offsetIndex * 1.42;
          const targetX = isPicked ? item.offsetIndex * 1.68 : restX;

          item.pivot.position.z = THREE.MathUtils.lerp(
            item.pivot.position.z,
            targetZ,
            Math.min(1, dt * 6.5),
          );
          item.pivot.position.x = THREE.MathUtils.lerp(
            item.pivot.position.x,
            targetX,
            Math.min(1, dt * 6.5),
          );
        }
      } else if (curMode === 'macro') {
        fillLight.position.x = Math.sin(elapsed * 0.7) * 3.2;
        fillLight.position.y = 3.8 + Math.cos(elapsed * 0.6) * 0.8;
      } else if (fillLight.position.x !== -4.4) {
        fillLight.position.set(-4.4, 4.6, 4.8);
      }

      // 4) 阴影按需刷新：样板廊有动画时实时更新；整车静止只在切车/切模式后刷新几帧
      if (curMode === 'swatch' || curMode === 'sphere') {
        renderer.shadowMap.needsUpdate = true;
      } else if (runtimeRef.current.shadowDirtyFrames > 0) {
        runtimeRef.current.shadowDirtyFrames -= 1;
        renderer.shadowMap.needsUpdate = true;
      }

      controls.update();
      renderer.render(scene, camera);

      // 5) 自适应像素比：持续掉帧自动降分辨率，帧率富余再回升（2 秒冷却）
      frameSamples += 1;
      frameAccum += now - lastPerfStamp;
      lastPerfStamp = now;
      if (frameSamples >= 45 && now - lastDprChange > 2000) {
        const avg = frameAccum / frameSamples;
        frameSamples = 0;
        frameAccum = 0;
        let next = currentDpr;
        if (avg > 21 && currentDpr > minDpr) next = Math.max(minDpr, currentDpr - 0.25);
        else if (avg < 12.5 && currentDpr < maxDpr) next = Math.min(maxDpr, currentDpr + 0.25);
        if (next !== currentDpr) {
          currentDpr = next;
          lastDprChange = now;
          renderer.setPixelRatio(currentDpr);
          renderer.setSize(
            container.clientWidth || window.innerWidth,
            container.clientHeight || window.innerHeight,
          );
        }
      } else if (frameSamples >= 45) {
        frameSamples = 0;
        frameAccum = 0;
      }
    };

    let frameSamples = 0;
    let frameAccum = 0;
    let lastPerfStamp = performance.now();
    let lastDprChange = performance.now();

    rafId = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.clearTimeout(preloadTimer);
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', handleControlStart);
      controls.dispose();

      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);

      speedformGallery.dispose();
      filmController.dispose();
      pianoBlackMat.dispose();
      runtimeRef.current.envMap?.dispose();
      flakeNormalMap.dispose();

      sphereGeo.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      macroGeo.dispose();
      floorAlphaTex.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      glowTex.dispose();
      floorGlowGeo.dispose();
      floorGlowMat.dispose();
      shadowTex.dispose();
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();

      for (const mat of extraCarMaterials) mat.dispose();
      const extraMatSet = new Set<THREE.Material>(extraCarMaterials);
      carAnchor.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          for (const mat of mats) {
            if (
              mat &&
              mat !== filmController.material &&
              mat !== pianoBlackMat &&
              !extraMatSet.has(mat)
            ) {
              mat.dispose();
            }
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 2. 实时切换三档 HDR 影棚环境光
  useEffect(() => {
    const rt = runtimeRef.current;
    if (!rt.renderer || !rt.scene) return;
    const nextEnv = createAutomotiveStudioEnvMap(rt.renderer, lightingPreset);
    const prevEnv = rt.envMap;
    rt.scene.environment = nextEnv;
    rt.envMap = nextEnv;
    if (prevEnv && prevEnv !== nextEnv) {
      prevEnv.dispose();
    }

    if (rt.hemiLight && rt.keyLight && rt.rimLight) {
      if (lightingPreset === 'gallery') {
        rt.hemiLight.intensity = 0.22;
        rt.keyLight.color.set('#ffffff');
        rt.keyLight.intensity = 0.7;
        rt.rimLight.color.set('#e2edff');
      } else if (lightingPreset === 'sunset') {
        rt.hemiLight.intensity = 0.1;
        rt.keyLight.color.set('#ffcf98');
        rt.keyLight.intensity = 0.85;
        rt.rimLight.color.set('#93c5fd');
      } else {
        rt.hemiLight.intensity = 0.12;
        rt.keyLight.color.set('#fff8f0');
        rt.keyLight.intensity = 0.75;
        rt.rimLight.color.set('#dbe8ff');
      }
    }
    rt.targetMoodColor = computeStudioMoodColor(activeSwatch.hex, lightingPreset);
  }, [lightingPreset, activeSwatch.hex]);

  // 3. 同步色号 / 语言变化
  useEffect(() => {
    const rt = runtimeRef.current;
    rt.targetMoodColor = computeStudioMoodColor(activeSwatch.hex, lightingPreset);
    rt.targetGlowColor = computeSpotlightGlowColor(activeSwatch.shiftHex || activeSwatch.hex);
    rt.filmController?.update(activeSwatch, viewMode);

    if (rt.speedformGallery) {
      const idx = Math.max(
        0,
        swatches.findIndex((s) => s.code === activeSwatch.code),
      );
      rt.speedformGallery.updateGalleryColors(swatches, idx, lang);
    }
  }, [activeSwatch, swatches, lang, viewMode, lightingPreset]);

  // 4. 同步视图模式切换
  useEffect(() => {
    const rt = runtimeRef.current;
    if (rt.speedformGallery) rt.speedformGallery.rootGroup.visible = viewMode === 'swatch';
    if (rt.sphereGroup) rt.sphereGroup.visible = viewMode === 'sphere';
    if (rt.macroMesh) rt.macroMesh.visible = viewMode === 'macro';
    if (rt.carGroup) rt.carGroup.visible = viewMode === 'car' || viewMode === 'closeup';
    rt.shadowDirtyFrames = 3;

    const aspect =
      (containerRef.current?.clientWidth || window.innerWidth) /
      Math.max(1, containerRef.current?.clientHeight || window.innerHeight);
    const preset = getResponsiveCameraPreset(viewMode, aspect);
    rt.desiredCameraPos.copy(preset.pos);
    rt.desiredTarget.copy(preset.target);
    rt.transitionCamera = true;

    if (rt.controls) {
      if (viewMode === 'swatch') {
        rt.controls.enabled = false;
        rt.controls.autoRotate = false;
      } else {
        rt.controls.enabled = true;
        rt.controls.autoRotate = viewMode === 'sphere' || viewMode === 'car';
        rt.controls.autoRotateSpeed = viewMode === 'sphere' ? 1.4 : 0.55;
        rt.controls.minDistance = viewMode === 'macro' ? 1.45 : viewMode === 'closeup' ? 1.65 : 2.3;
        rt.controls.maxDistance = viewMode === 'macro' ? 3.5 : 14.5;
      }
    }
  }, [viewMode]);

  // 5. 同步切换展车车型（Model 3 焕新版 / Model Y 焕新版）
  useEffect(() => {
    runtimeRef.current.switchVehicle?.(vehicleId);
  }, [vehicleId]);

  // 6. 键盘左右键切色
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'ArrowRight') onStepSwatch(1);
      else if (e.key === 'ArrowLeft') onStepSwatch(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStepSwatch]);

  return <div ref={containerRef} className="w-full h-full select-none" />;
}
