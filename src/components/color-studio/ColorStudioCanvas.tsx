// 和膜 HAMOREY 选色工坊 · 整车、近景、微距和光影球。

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
  createHamoreyPlateTexture,
  createMetallicFlakeNormalMap,
} from './studioEnvironment';
import { createFilmMaterialController, type FilmMaterialController } from './filmMaterial';
import { createLuxuryShaderball } from './shaderballBuilder';
import { unpackHmyModelBuffer } from './studioGuard';
type WebGLViewMode = Exclude<StudioViewMode, 'swatch'>;

export type CarModelLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ColorStudioCanvasProps {
  activeSwatch: ColorFilmItem;
  viewMode: WebGLViewMode;
  lightingPreset: StudioLightingPreset;
  vehicleId: StudioVehicleId;
  paused?: boolean;
  retryToken?: number;
  onStepSwatch: (delta: number) => void;
  onModelStatusChange?: (status: CarModelLoadStatus, progress: number) => void;
}

interface CameraPreset {
  pos: THREE.Vector3;
  target: THREE.Vector3;
}

const CAMERA_PRESETS: Record<WebGLViewMode, CameraPreset> = {
  sphere: { pos: new THREE.Vector3(3.26, 1.32, 4.02), target: new THREE.Vector3(0, -0.46, 0) },
  macro: { pos: new THREE.Vector3(0, 0.16, 2.35), target: new THREE.Vector3(0, 0.02, 0) },
  car: { pos: new THREE.Vector3(3.85, 1.28, 4.35), target: new THREE.Vector3(0, 0.42, 0) },
  closeup: { pos: new THREE.Vector3(1.95, 0.96, 2.05), target: new THREE.Vector3(0.28, 0.56, 0.48) },
};

function getResponsiveCameraPreset(mode: WebGLViewMode, aspect: number): CameraPreset {
  const base = CAMERA_PRESETS[mode];
  if (aspect < 0.85) {
    const scale =
      mode === 'car'
        ? 1.88
        : mode === 'closeup'
          ? 1.32
          : mode === 'sphere'
            ? 1.28
            : 1.15;
    const target = base.target.clone();
    if (mode === 'car') target.y = 0.28;
    else if (mode === 'sphere') target.y = -0.32;
    else if (mode === 'closeup') target.y = 0.48;
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

function vehicleResourceDisposer(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const bitmaps = new Set<ImageBitmap>();

  // 先记录模型原始资源，再为漆面、玻璃和轮辋更换展示材质。
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of meshMaterials) materials.add(material);
  });

  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (!(value instanceof THREE.Texture)) continue;
      textures.add(value);
      const image = value.source.data;
      if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) bitmaps.add(image);
    }
  }
  return () => {
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    bitmaps.forEach((bitmap) => bitmap.close());
  };
}

export function ColorStudioCanvas(props: ColorStudioCanvasProps) {
  const { activeSwatch, viewMode, lightingPreset, vehicleId, retryToken = 0, onStepSwatch } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(props);
  stateRef.current = props;

  const runtimeRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    envMap: THREE.Texture | null;
    filmController: FilmMaterialController | null;
    sphereGroup: THREE.Group | null;
    macroMesh: THREE.Mesh | null;
    carGroup: THREE.Group | null;
    floorGlowMat: THREE.MeshBasicMaterial | null;
    hemiLight: THREE.HemisphereLight | null;
    keyLight: THREE.DirectionalLight | null;
    rimLight: THREE.DirectionalLight | null;
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
    sphereGroup: null,
    macroMesh: null,
    carGroup: null,
    floorGlowMat: null,
    hemiLight: null,
    keyLight: null,
    rimLight: null,
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

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      stateRef.current.onModelStatusChange?.('error', 0);
      return;
    }
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

    const flakeNormalMap = createMetallicFlakeNormalMap();
    const filmController = createFilmMaterialController(
      stateRef.current.activeSwatch,
      flakeNormalMap,
      stateRef.current.viewMode,
    );
    runtimeRef.current.filmController = filmController;

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
    runtimeRef.current.controls = controls;

    const handleControlStart = () => {
      runtimeRef.current.transitionCamera = false;
    };
    controls.addEventListener('start', handleControlStart);

    // 高定车漆雕塑测试球（多曲率球壳 + 黑钛香槟金腰线 + 博物馆级曜石展台）
    const shaderball = createLuxuryShaderball(
      filmController.material,
      computeSpotlightGlowColor(
        stateRef.current.activeSwatch.shiftHex || stateRef.current.activeSwatch.hex,
      ),
    );
    const sphereGroup = shaderball.rootGroup;
    sphereGroup.visible = stateRef.current.viewMode === 'sphere';
    scene.add(sphereGroup);
    runtimeRef.current.sphereGroup = sphereGroup;

    // 微距曲面
    const macroGeo = buildMacroWaveGeometry();
    const macroMesh = new THREE.Mesh(macroGeo, filmController.material);
    macroMesh.rotation.x = -0.16;
    macroMesh.visible = stateRef.current.viewMode === 'macro';
    scene.add(macroMesh);
    runtimeRef.current.macroMesh = macroMesh;

    // 整车与近景共用展台
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

    // 后台异步加载与缓存双车型 3D 模型（Model 3 焕新版 / Model Y 焕新版）
    let disposed = false;
    const extraCarMaterials: THREE.Material[] = [];
    const loadedVehicles = new Map<StudioVehicleId, THREE.Group>();
    const loadingVehicles = new Set<StudioVehicleId>();
    const releaseVehicles: Array<() => void> = [];

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
    const plateTexture = createHamoreyPlateTexture();
    const plateFrameGeo = new THREE.BoxGeometry(0.412, 0.132, 0.012);
    const plateFaceGeo = new THREE.PlaneGeometry(0.396, 0.122);
    const plateFrameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#141317'),
      metalness: 0.78,
      roughness: 0.28,
    });
    const plateFaceMat = new THREE.MeshPhysicalMaterial({
      map: plateTexture,
      roughness: 0.24,
      metalness: 0.18,
      clearcoat: 0.88,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.0,
    });
    extraCarMaterials.push(
      glassMat,
      tireRubberMat,
      alloyRimMat,
      frontDrlMat,
      headlightLensMat,
      rearLightBarMat,
      plateFrameMat,
      plateFaceMat,
    );

    const buildVehicleLicensePlates = (
      vehicleRoot: THREE.Group,
      id: StudioVehicleId,
    ): THREE.Group => {
      const platesGroup = new THREE.Group();
      vehicleRoot.updateMatrixWorld(true);
      const raycaster = new THREE.Raycaster();

      // 自动识别车身主轴方向（X 轴或 Z 轴）及车头/车尾朝向，杜绝车牌贴到车门侧面
      const carBox = new THREE.Box3().setFromObject(vehicleRoot);
      const carSize = new THREE.Vector3();
      carBox.getSize(carSize);
      const alongX = carSize.x > carSize.z;
      const halfLen = (alongX ? carSize.x : carSize.z) * 0.5;

      // 通过对比车身前后 38% 处的垂向高度自动判定车头（前机盖低于后尾箱/溜背）
      const probeTopY = (axisCoord: number): number => {
        const origin = alongX
          ? new THREE.Vector3(axisCoord, 2.6, 0)
          : new THREE.Vector3(0, 2.6, axisCoord);
        raycaster.set(origin, new THREE.Vector3(0, -1, 0));
        const hits = raycaster.intersectObject(vehicleRoot, true);
        return hits.length > 0 ? hits[0].point.y : 2.6;
      };
      const topPos = probeTopY(halfLen * 0.72);
      const topNeg = probeTopY(-halfLen * 0.72);
      const frontSign: 1 | -1 = topPos <= topNeg ? 1 : -1;

      const configs: Array<{ side: 'front' | 'rear'; sign: 1 | -1; y: number }> =
        id === 'modely'
          ? [
              { side: 'front', sign: frontSign, y: 0.43 },
              { side: 'rear', sign: (-frontSign as 1 | -1), y: 0.48 },
            ]
          : [
              { side: 'front', sign: frontSign, y: 0.37 },
              { side: 'rear', sign: (-frontSign as 1 | -1), y: 0.60 },
            ];

      const sampleAxis = (lateral: number, y: number, sign: 1 | -1): number | null => {
        if (alongX) {
          raycaster.set(
            new THREE.Vector3(sign * 4.2, y, lateral),
            new THREE.Vector3(-sign, 0, 0),
          );
        } else {
          raycaster.set(
            new THREE.Vector3(lateral, y, sign * 4.2),
            new THREE.Vector3(0, 0, -sign),
          );
        }
        const hits = raycaster.intersectObject(vehicleRoot, true);
        if (hits.length === 0) return null;
        return alongX ? hits[0].point.x : hits[0].point.z;
      };

      for (const cfg of configs) {
        const sign = cfg.sign;
        const cHit = sampleAxis(0, cfg.y, sign);
        if (cHit === null) continue;

        const lHit = sampleAxis(-0.14, cfg.y, sign);
        const rHit = sampleAxis(0.14, cfg.y, sign);
        const tHit = sampleAxis(0, cfg.y + 0.045, sign);
        const bHit = sampleAxis(0, cfg.y - 0.045, sign);

        // 取最外侧贴合点 + 10mm 牌照框厚，确保弧面保险杠边缘不穿模、不悬空
        const candidates = [cHit, lHit, rHit].filter(
          (v): v is number => v !== null,
        );
        const outerCoord =
          sign === 1 ? Math.max(...candidates) : Math.min(...candidates);

        let pitch = 0;
        if (tHit !== null && bHit !== null) {
          const dAxis = sign === 1 ? tHit - bHit : bHit - tHit;
          pitch = Math.max(-0.26, Math.min(0.26, Math.atan2(dAxis, 0.09)));
        }

        const plateUnit = new THREE.Group();
        const frameMesh = new THREE.Mesh(plateFrameGeo, plateFrameMat);
        frameMesh.castShadow = true;
        frameMesh.receiveShadow = true;
        plateUnit.add(frameMesh);

        const faceMesh = new THREE.Mesh(plateFaceGeo, plateFaceMat);
        faceMesh.position.z = 0.0066;
        plateUnit.add(faceMesh);

        if (alongX) {
          plateUnit.position.set(outerCoord + sign * 0.01, cfg.y, 0);
          plateUnit.rotation.order = 'YXZ';
          plateUnit.rotation.y = sign === 1 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          plateUnit.position.set(0, cfg.y, outerCoord + sign * 0.01);
          plateUnit.rotation.order = 'YXZ';
          plateUnit.rotation.y = sign === 1 ? 0 : Math.PI;
        }
        plateUnit.rotation.x = pitch;

        platesGroup.add(plateUnit);
      }

      return platesGroup;
    };

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
      stateRef.current.onModelStatusChange?.('loading', 8);

      if (loadingVehicles.has(id)) return;
      loadingVehicles.add(id);

      const fetchAndParseHmy = async () => {
        try {
          const resp = await window.fetch(spec.modelUrl, { credentials: 'same-origin' });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

          const total = Number(resp.headers.get('content-length') || 0);
          let rawBuf: ArrayBuffer;

          if (resp.body && total > 0) {
            const reader = resp.body.getReader();
            const chunks: Uint8Array[] = [];
            let received = 0;
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (disposed) {
                reader.cancel().catch(() => {});
                return;
              }
              if (value) {
                chunks.push(value);
                received += value.byteLength;
                if (stateRef.current.vehicleId === id) {
                  const pct = Math.min(96, Math.round((received / total) * 100));
                  stateRef.current.onModelStatusChange?.('loading', pct);
                }
              }
            }
            const merged = new Uint8Array(received);
            let offset = 0;
            for (const c of chunks) {
              merged.set(c, offset);
              offset += c.byteLength;
            }
            rawBuf = merged.buffer;
          } else {
            rawBuf = await resp.arrayBuffer();
          }

          if (disposed) return;
          const glbBuffer = unpackHmyModelBuffer(rawBuf);

          loader.parse(
            glbBuffer,
            '/models/',
            (gltf) => {
              loadingVehicles.delete(id);
              const release = vehicleResourceDisposer(gltf.scene);
              if (disposed) {
                release();
                return;
              }
              releaseVehicles.push(release);

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

              const vehicleAssembly = new THREE.Group();
              vehicleAssembly.add(wrapper);
              vehicleAssembly.add(buildVehicleLicensePlates(wrapper, id));

              loadedVehicles.set(id, vehicleAssembly);
              carAnchor.add(vehicleAssembly);

              const isCurrent = stateRef.current.vehicleId === id;
              vehicleAssembly.visible = isCurrent;
              if (isCurrent) {
                showLoadedVehicle(stateRef.current.vehicleId);
                stateRef.current.onModelStatusChange?.('ready', 100);
              }
            },
            () => {
              loadingVehicles.delete(id);
              if (disposed || stateRef.current.vehicleId !== id) return;
              stateRef.current.onModelStatusChange?.('error', 0);
            },
          );
        } catch {
          loadingVehicles.delete(id);
          if (disposed || stateRef.current.vehicleId !== id) return;
          stateRef.current.onModelStatusChange?.('error', 0);
        }
      };

      void fetchAndParseHmy();
    };

    runtimeRef.current.switchVehicle = loadOrSwitchVehicle;
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

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    const onContextRestored = () => {
      runtimeRef.current.shadowDirtyFrames = 4;
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const animate = (now: number) => {
      if (disposed) return;
      rafId = window.requestAnimationFrame(animate);

      // 弹窗开启或切到后台时暂停 WebGL 渲染，保证移动端滚屏满帧零功耗
      if (document.hidden || stateRef.current.paused) {
        lastTime = now;
        lastPerfStamp = now;
        return;
      }

      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const elapsed = (now - clockStart) / 1000;
      const curMode = stateRef.current.viewMode;

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
      shaderball.ambientRingMat.color.lerp(
        runtimeRef.current.targetGlowColor,
        Math.min(1, dt * 4.5),
      );

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
      if (curMode === 'macro') {
        fillLight.position.x = Math.sin(elapsed * 0.7) * 3.2;
        fillLight.position.y = 3.8 + Math.cos(elapsed * 0.6) * 0.8;
      } else if (fillLight.position.x !== -4.4) {
        fillLight.position.set(-4.4, 4.6, 4.8);
      }

      // 整车静止时仅在切换车型或视图后更新阴影。
      if (curMode === 'sphere') {
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
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      controls.removeEventListener('start', handleControlStart);
      controls.dispose();

      filmController.dispose();
      runtimeRef.current.envMap?.renderTarget?.dispose();
      runtimeRef.current.envMap = null;
      keyLight.shadow.dispose();
      flakeNormalMap.dispose();

      shaderball.dispose();
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
      plateFrameGeo.dispose();
      plateFaceGeo.dispose();
      plateTexture.dispose();
      releaseVehicles.forEach((release) => release());
      loadedVehicles.clear();
      runtimeRef.current.switchVehicle = null;
      scene.clear();
      renderer.forceContextLoss();
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
      prevEnv.renderTarget?.dispose();
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
  }, [lightingPreset]);

  // 3. 同步色号与材质
  useEffect(() => {
    const rt = runtimeRef.current;
    rt.targetMoodColor = computeStudioMoodColor(activeSwatch.hex, lightingPreset);
    rt.targetGlowColor = computeSpotlightGlowColor(activeSwatch.shiftHex || activeSwatch.hex);
    rt.filmController?.update(activeSwatch, viewMode);
  }, [activeSwatch, viewMode, lightingPreset]);

  // 4. 同步视图模式切换
  useEffect(() => {
    const rt = runtimeRef.current;
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
      rt.controls.autoRotate = viewMode === 'sphere' || viewMode === 'car';
      rt.controls.autoRotateSpeed = viewMode === 'sphere' ? 1.4 : 0.55;
      rt.controls.minDistance = viewMode === 'macro' ? 1.45 : viewMode === 'closeup' ? 1.65 : 2.3;
      rt.controls.maxDistance = viewMode === 'macro' ? 3.5 : 14.5;
    }
  }, [viewMode]);

  // 5. 同步切换展车车型（Model 3 焕新版 / Model Y 焕新版）及失败重试
  const showVehicle = viewMode === 'car' || viewMode === 'closeup';
  useEffect(() => {
    if (!showVehicle) return;
    const start = window.setTimeout(() => runtimeRef.current.switchVehicle?.(vehicleId), 0);
    return () => window.clearTimeout(start);
  }, [showVehicle, vehicleId, retryToken]);

  // 6. 键盘左右键切色
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      e.preventDefault();
      onStepSwatch(e.key === 'ArrowRight' ? 1 : -1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStepSwatch]);

  return <div ref={containerRef} className="w-full h-full select-none" />;
}
