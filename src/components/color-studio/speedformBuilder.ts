// ============================================================
// 和膜 HAMOREY — 3D 悬浮流光曲率样板廊（Sculpted Speedform Atelier）
// 汽车高定工坊专属雕塑形态：超跑中脊折线 + 双曲腰线弧面 + 倒角折边 + 曜石金铭牌底座
// ============================================================

import * as THREE from 'three';
import type { ColorFilmItem } from '../../config/colorStudio';

export interface SpeedformGalleryResources {
  rootGroup: THREE.Group;
  activeGroup: THREE.Group;
  activePlaqueMesh: THREE.Mesh;
  activePlaqueGeo: THREE.BufferGeometry;
  sidePlaques: Array<{
    pivot: THREE.Group;
    mesh: THREE.Mesh;
    filmMat: THREE.MeshPhysicalMaterial;
    offsetIndex: number;
  }>;
  updateGalleryColors: (
    swatches: ColorFilmItem[],
    activeIndex: number,
    lang: 'zh' | 'en',
  ) => void;
  setFlex: (flexAmount: number) => void;
  dispose: () => void;
}

const PLAQUE_WIDTH = 1.24;
const PLAQUE_HEIGHT = 2.12;
const CORNER_RADIUS = 0.19;

/**
 * 构建兼具超跑机盖中脊折线、S 型腰线曲面与厚实倒角折边的 3D 雕塑样板几何体
 */
export function buildSpeedformPlaqueGeometry(
  segX = 56,
  segY = 88,
): THREE.BufferGeometry {
  const halfW = PLAQUE_WIDTH * 0.5;
  const halfH = PLAQUE_HEIGHT * 0.5;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const vNorms: number[] = [];

  for (let iy = 0; iy <= segY; iy++) {
    const v = iy / segY;
    const y = (v * 2 - 1) * halfH;
    const dy = Math.max(0, Math.abs(y) - (halfH - CORNER_RADIUS));
    const cornerInset =
      dy > 0
        ? CORNER_RADIUS -
          Math.sqrt(Math.max(0, CORNER_RADIUS * CORNER_RADIUS - dy * dy))
        : 0;
    const rowHalfW = Math.max(0.03, halfW - cornerInset);

    for (let ix = 0; ix <= segX; ix++) {
      const u = ix / segX;
      const x = (u * 2 - 1) * rowHalfW;
      const uCentered = x / halfW; // -1 .. +1
      const vCentered = y / halfH; // -1 .. +1

      // 1. 纵向饱满弧面隆起
      const archY = Math.sin(v * Math.PI) * 0.165;
      // 2. 超跑机盖中央脊线折痕（明暗交界与清漆灯带 split 关键）
      const ridge =
        0.088 * Math.exp(-Math.pow(Math.abs(uCentered) * 3.6, 1.45)) * (0.4 + 0.6 * Math.sin(v * Math.PI));
      // 3. 双侧腰线 S 型曲率凹槽与肩线
      const shoulder =
        -0.135 * uCentered * uCentered +
        0.038 * Math.cos(uCentered * Math.PI * 2.3) * Math.sin(v * Math.PI);
      // 4. 四周平滑倒角折边，塑造厚实冲压金属板质感
      const radialEdge = Math.max(
        Math.abs(uCentered),
        Math.abs(vCentered),
      );
      const edgeDrop =
        radialEdge > 0.84
          ? -0.095 * Math.pow((radialEdge - 0.84) / 0.16, 1.8)
          : 0;

      const z = archY + ridge + shoulder + edgeDrop;

      positions.push(x, y, z);
      uvs.push(0.5 + x / PLAQUE_WIDTH, v);
      vNorms.push(v);
    }
  }

  const vertsPerRow = segX + 1;
  for (let iy = 0; iy < segY; iy++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = iy * vertsPerRow + ix;
      const b = a + 1;
      const c = a + vertsPerRow;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.userData.basePositions = new Float32Array(positions);
  geometry.userData.vNorms = new Float32Array(vNorms);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * 动态微调主样板纵向弧度曲率，交互时呈现流光扫面效果
 */
export function deformSpeedformGeometry(
  geometry: THREE.BufferGeometry,
  flexAmount: number,
): void {
  const base = geometry.userData.basePositions as Float32Array | undefined;
  const vNorms = geometry.userData.vNorms as Float32Array | undefined;
  if (!base || !vNorms) return;

  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  const arr = posAttr.array as Float32Array;
  const clamped = Math.max(-0.65, Math.min(0.65, flexAmount));

  if (Math.abs(clamped) < 0.0005) {
    arr.set(base);
  } else {
    for (let i = 0, vi = 0; i < base.length; i += 3, vi++) {
      const v = vNorms[vi];
      const bendCurve = Math.sin(v * Math.PI);
      arr[i] = base[i];
      arr[i + 1] = base[i + 1] - Math.abs(clamped) * 0.04 * (v - 0.5);
      arr[i + 2] = base[i + 2] + clamped * 0.24 * bendCurve;
    }
  }

  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
}

function drawPlinthNameplate(
  canvas: HTMLCanvasElement,
  swatch: ColorFilmItem,
  lang: 'zh' | 'en',
): void {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#14151a');
  grad.addColorStop(1, '#09090c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 顶部香槟金装饰细线
  ctx.fillStyle = '#C9A86A';
  ctx.fillRect(0, 0, w, 4);

  // 色号编码 + 系列标签
  ctx.fillStyle = '#C9A86A';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '600 20px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(
    `${swatch.code}  ·  ${lang === 'zh' ? swatch.finishLabel : swatch.finishLabelEn.toUpperCase()}`,
    28,
    18,
  );

  // 色名
  ctx.fillStyle = '#F7F3EB';
  ctx.font = 'bold 34px "HarmonyOS Sans SC", "PingFang SC", sans-serif';
  ctx.fillText(lang === 'zh' ? swatch.name : swatch.nameEn, 28, 52, w - 160);

  // 右下角品牌水印
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.textAlign = 'right';
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillText('HAMOREY', w - 28, 62);
}

/**
 * 构建 3D 悬浮流光曲率样板廊（主雕塑样板 + 左右景深侧翼样板）
 */
export function createSpeedformGallery(
  activeFilmMaterial: THREE.MeshPhysicalMaterial,
  swatches: ColorFilmItem[],
  initialIndex: number,
  lang: 'zh' | 'en',
): SpeedformGalleryResources {
  const rootGroup = new THREE.Group();
  rootGroup.position.set(0, 0.28, 0);

  const activeGroup = new THREE.Group();

  // 主雕塑流光样板
  const activePlaqueGeo = buildSpeedformPlaqueGeometry(56, 88);
  const activePlaqueMesh = new THREE.Mesh(activePlaqueGeo, activeFilmMaterial);
  activePlaqueMesh.castShadow = true;
  activePlaqueMesh.receiveShadow = true;
  activeGroup.add(activePlaqueMesh);

  // 主样板底部曜石黑 × 香槟金铭牌底座（替代廉价铆钉）
  const plinthCanvas = document.createElement('canvas');
  plinthCanvas.width = 512;
  plinthCanvas.height = 112;
  drawPlinthNameplate(plinthCanvas, swatches[initialIndex] || swatches[0], lang);

  const plinthTex = new THREE.CanvasTexture(plinthCanvas);
  plinthTex.colorSpace = THREE.SRGBColorSpace;
  plinthTex.anisotropy = 4;

  const plinthSideMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#121318'),
    metalness: 0.72,
    roughness: 0.28,
  });
  const plinthFaceMat = new THREE.MeshStandardMaterial({
    map: plinthTex,
    metalness: 0.35,
    roughness: 0.36,
  });
  const plinthGeo = new THREE.BoxGeometry(1.12, 0.23, 0.14);
  const plinthMesh = new THREE.Mesh(plinthGeo, [
    plinthSideMat,
    plinthSideMat,
    plinthSideMat,
    plinthSideMat,
    plinthFaceMat,
    plinthSideMat,
  ]);
  plinthMesh.position.set(0, -1.19, 0.01);
  activeGroup.add(plinthMesh);

  // 香槟金装饰细腰线
  const goldTrimGeo = new THREE.BoxGeometry(1.13, 0.016, 0.148);
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#C9A86A'),
    metalness: 0.92,
    roughness: 0.18,
  });
  const goldTrimMesh = new THREE.Mesh(goldTrimGeo, goldTrimMat);
  goldTrimMesh.position.set(0, -1.072, 0.01);
  activeGroup.add(goldTrimMesh);

  rootGroup.add(activeGroup);

  // 左右景深样板长廊（共 6 块侧翼，形成对称弧形悬浮廊道）
  const sideGeo = buildSpeedformPlaqueGeometry(30, 48);
  const sidePlinthGeo = new THREE.BoxGeometry(0.96, 0.1, 0.1);
  const offsets = [-3, -2, -1, 1, 2, 3];

  const sidePlaques = offsets.map((offsetIndex) => {
    const pivot = new THREE.Group();
    const absOff = Math.abs(offsetIndex);
    pivot.position.set(
      offsetIndex * 1.42,
      -absOff * 0.05,
      -Math.pow(absOff, 1.32) * 0.62,
    );
    pivot.rotation.y = -offsetIndex * 0.25;
    const scale = 1 - absOff * 0.1;
    pivot.scale.setScalar(scale);

    const filmMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#444444'),
      metalness: 0.35,
      roughness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 1.0,
      envMapIntensity: 1.55,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(sideGeo, filmMat);
    mesh.userData = { swatchOffset: offsetIndex };
    pivot.add(mesh);

    const sidePlinth = new THREE.Mesh(sidePlinthGeo, plinthSideMat);
    sidePlinth.position.set(0, -1.12, 0);
    pivot.add(sidePlinth);

    rootGroup.add(pivot);
    return { pivot, mesh, filmMat, offsetIndex };
  });

  const updateGalleryColors = (
    list: ColorFilmItem[],
    activeIndex: number,
    currentLang: 'zh' | 'en',
  ) => {
    if (list.length === 0) return;
    const current = list[activeIndex] || list[0];
    drawPlinthNameplate(plinthCanvas, current, currentLang);
    plinthTex.needsUpdate = true;

    for (const item of sidePlaques) {
      const targetIdx =
        (((activeIndex + item.offsetIndex) % list.length) + list.length) % list.length;
      const sw = list[targetIdx];
      item.filmMat.color.set(sw.hex);
      item.filmMat.metalness = sw.material.metalness;
      item.filmMat.roughness = sw.material.roughness;
      item.filmMat.iridescence = sw.material.iridescence;
      item.filmMat.sheen = sw.material.sheenIntensity;
      item.filmMat.sheenColor.set(sw.shiftHex || sw.hex);
      item.mesh.userData.swatchIndex = targetIdx;
    }
  };

  updateGalleryColors(swatches, initialIndex, lang);

  return {
    rootGroup,
    activeGroup,
    activePlaqueMesh,
    activePlaqueGeo,
    sidePlaques,
    updateGalleryColors,
    setFlex: (flexAmount: number) => deformSpeedformGeometry(activePlaqueGeo, flexAmount),
    dispose: () => {
      activePlaqueGeo.dispose();
      plinthGeo.dispose();
      plinthTex.dispose();
      plinthSideMat.dispose();
      plinthFaceMat.dispose();
      goldTrimGeo.dispose();
      goldTrimMat.dispose();
      sideGeo.dispose();
      sidePlinthGeo.dispose();
      for (const s of sidePlaques) {
        s.filmMat.dispose();
      }
    },
  };
}
