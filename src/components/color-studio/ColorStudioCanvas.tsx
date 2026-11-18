// ============================================================
// 和膜 HAMOREY — 五合一高定 3D 选色工坊舞台 V2
// HalfFloat 真 HDR 影棚光影 · 3D 悬浮流光样板廊 · 精确落地超跑展台
// ============================================================

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type {
  ColorFilmItem,
  StudioLightingPreset,
  StudioViewMode,
} from '../../config/colorStudio';
import {
  createAutomotiveStudioEnvMap,
  createHamoreyPlateTexture,
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
  twoToneRoof: boolean;
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
  car: { pos: new THREE.Vector3(3.45, 1.18, 3.85), target: new THREE.Vector3(0, 0.36, 0) },
  closeup: { pos: new THREE.Vector3(1.82, 0.88, 1.85), target: new THREE.Vector3(0.32, 0.52, 0.52) },
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
  twoToneRoof,
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
    twoToneRoof,
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
    twoToneRoof,
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
    primaryPaintMeshes: THREE.Mesh[];
    accentPaintMeshes: THREE.Mesh[];
    pianoBlackMat: THREE.MeshPhysicalMaterial | null;
    targetMoodColor: THREE.Color;
    targetGlowColor: THREE.Color;
    transitionCamera: boolean;
    desiredCameraPos: THREE.Vector3;
    desiredTarget: THREE.Vector3;
    controls: OrbitControls | null;
    applyPaintBinding: (() => void) | null;
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
    primaryPaintMeshes: [],
    accentPaintMeshes: [],
    pianoBlackMat: null,
    targetMoodColor: computeStudioMoodColor(activeSwatch.hex, lightingPreset),
    targetGlowColor: computeSpotlightGlowColor(activeSwatch.shiftHex || activeSwatch.hex),
    transitionCamera: false,
    desiredCameraPos: CAMERA_PRESETS[viewMode].pos.clone(),
    desiredTarget: CAMERA_PRESETS[viewMode].target.clone(),
    controls: null,
    applyPaintBinding: null,
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
      envMapIntensity: 1.75,
      side: THREE.DoubleSide,
    });
    runtimeRef.current.pianoBlackMat = pianoBlackMat;

    // 低漫射分析光（让高反差 HalfFloat HDR 灯箱主导车漆镜面反光，消除发白粉雾感）
    const hemiLight = new THREE.HemisphereLight('#eef3ff', '#090a0e', 0.18);
    scene.add(hemiLight);
    runtimeRef.current.hemiLight = hemiLight;

    const keyLight = new THREE.DirectionalLight('#ffffff', 0.78);
    keyLight.position.set(4.5, 7.8, 5.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);
    runtimeRef.current.keyLight = keyLight;

    const rimLight = new THREE.DirectionalLight('#d8e6ff', 0.45);
    rimLight.position.set(-5.2, 3.4, -4.4);
    scene.add(rimLight);
    runtimeRef.current.rimLight = rimLight;

    const accentSpot = new THREE.PointLight('#ffffff', 9, 14, 1.5);
    accentSpot.position.set(0, 3.6, 3.2);
    scene.add(accentSpot);

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
      roughness: 0.34,
      metalness: 0.22,
      envMapIntensity: 0.32,
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

    const applyPaintBinding = () => {
      const { twoToneRoof: useTwoTone } = stateRef.current;
      for (const mesh of runtimeRef.current.primaryPaintMeshes) {
        mesh.material = filmController.material;
      }
      for (const mesh of runtimeRef.current.accentPaintMeshes) {
        mesh.material = useTwoTone ? pianoBlackMat : filmController.material;
      }
    };
    runtimeRef.current.applyPaintBinding = applyPaintBinding;

    // 后台异步预加载并清洗 3D 超跑模型
    let disposed = false;
    const plateTex = createHamoreyPlateTexture();
    const extraCarTextures: THREE.Texture[] = [plateTex];
    const extraCarMaterials: THREE.Material[] = [];

    const loadCarModel = () => {
      stateRef.current.onModelStatusChange?.('loading', 8);
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);

      loader.load(
        '/models/hamorey-gt.glb',
        (gltf) => {
          if (disposed) return;
          const root = gltf.scene;

          // 按世界坐标真实顶点计算精确包围盒，使四轮精确贴合地面 y=0
          root.updateMatrixWorld(true);
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
          const normScale = 4.35 / maxDim;
          root.scale.setScalar(normScale);
          root.position.set(
            -center.x * normScale,
            -rawBox.min.y * normScale,
            -center.z * normScale,
          );

          const primaryMeshes: THREE.Mesh[] = [];
          const accentMeshes: THREE.Mesh[] = [];

          const glassMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#070a10'),
            metalness: 0.14,
            roughness: 0.03,
            clearcoat: 1.0,
            clearcoatRoughness: 0.015,
            transparent: true,
            opacity: 0.86,
            envMapIntensity: 1.95,
            side: THREE.DoubleSide,
          });
          const caliperMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#9E1B32'),
            metalness: 0.55,
            roughness: 0.24,
            clearcoat: 0.92,
            envMapIntensity: 1.4,
          });
          extraCarMaterials.push(glassMat, caliperMat);

          root.traverse((obj) => {
            if (!(obj as THREE.Mesh).isMesh) return;
            const mesh = obj as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const rawMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            const firstMat = rawMats[0];
            if (!firstMat) return;
            const matName = (firstMat.name || '').trim();

            if (matName.startsWith('Paint 1')) {
              primaryMeshes.push(mesh);
              return;
            }
            if (matName.startsWith('Paint 2')) {
              accentMeshes.push(mesh);
              return;
            }
            if (matName === 'Glass') {
              mesh.material = glassMat;
              return;
            }
            if (matName === 'Brake') {
              mesh.material = caliperMat;
              return;
            }
            if (matName === 'License') {
              const stdMat = new THREE.MeshStandardMaterial({
                map: plateTex,
                roughness: 0.34,
                metalness: 0.25,
              });
              mesh.material = stdMat;
              extraCarMaterials.push(stdMat);
              return;
            }

            // 彻底剥离原模型徽标与轮胎侧面印字
            for (const m of rawMats) {
              const std = m as THREE.MeshStandardMaterial;
              if (matName === 'Tireside' || matName === 'Tiretread') {
                std.map = null;
                std.color.set('#141519');
                std.roughness = 0.84;
                std.metalness = 0.04;
                std.needsUpdate = true;
              }
              if (
                matName === 'Hardware' ||
                matName === 'Mirror' ||
                matName === 'Rim1' ||
                matName === 'Rim2' ||
                matName === 'Tireside' ||
                matName === 'Tiretread' ||
                matName === '' ||
                matName === 'None'
              ) {
                if (std.emissiveMap) {
                  std.emissiveMap = null;
                  std.emissive.setHex(0x000000);
                  std.emissiveIntensity = 0;
                  std.needsUpdate = true;
                }
              }
            }
          });

          runtimeRef.current.primaryPaintMeshes = primaryMeshes;
          runtimeRef.current.accentPaintMeshes = accentMeshes;
          applyPaintBinding();

          carAnchor.add(root);
          stateRef.current.onModelStatusChange?.('ready', 100);
        },
        (evt) => {
          if (disposed || !evt.total) return;
          const pct = Math.min(98, Math.round((evt.loaded / evt.total) * 100));
          stateRef.current.onModelStatusChange?.('loading', pct);
        },
        () => {
          if (disposed) return;
          stateRef.current.onModelStatusChange?.('error', 0);
        },
      );
    };

    const preloadTimer = window.setTimeout(loadCarModel, 220);

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
        accentSpot.position.x = Math.sin(elapsed * 0.8) * 2.4;
        accentSpot.position.y = 2.2 + Math.cos(elapsed * 0.65) * 0.6;
      } else {
        accentSpot.position.set(0, 3.6, 3.2);
      }

      controls.update();
      renderer.render(scene, camera);
    };

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

      for (const tex of extraCarTextures) tex.dispose();
      for (const mat of extraCarMaterials) mat.dispose();
      carAnchor.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          for (const mat of mats) {
            if (mat && mat !== filmController.material && mat !== pianoBlackMat) {
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
        rt.hemiLight.intensity = 0.32;
        rt.keyLight.color.set('#ffffff');
        rt.keyLight.intensity = 0.85;
        rt.rimLight.color.set('#dbeafe');
      } else if (lightingPreset === 'sunset') {
        rt.hemiLight.intensity = 0.2;
        rt.keyLight.color.set('#ffd29d');
        rt.keyLight.intensity = 0.92;
        rt.rimLight.color.set('#93c5fd');
      } else {
        rt.hemiLight.intensity = 0.18;
        rt.keyLight.color.set('#ffffff');
        rt.keyLight.intensity = 0.78;
        rt.rimLight.color.set('#d8e6ff');
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

  // 5. 同步全车同色 / 悬浮黑顶
  useEffect(() => {
    runtimeRef.current.applyPaintBinding?.();
  }, [twoToneRoof]);

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
