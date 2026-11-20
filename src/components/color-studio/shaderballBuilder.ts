// ============================================================
// 和膜 HAMOREY — 高定车漆光影雕塑测试球（Luxury Automotive Shaderball）
// 多曲率车漆壳体（圆穹 + 腰线折角凹槽 + 下摆曲面）+ 曜石黑×香槟金博物馆展台
// ============================================================

import * as THREE from 'three';

export interface LuxuryShaderballResources {
  rootGroup: THREE.Group;
  ambientRingMat: THREE.MeshBasicMaterial;
  dispose: () => void;
}

/**
 * 构建带精确腰线折角的高定车漆雕塑球壳（LatheGeometry 剖面）
 * - 上半部大曲率圆穹：检验清漆镜面通透度与柔光过渡
 * - 赤道内收倒角槽：检验金属漆随角异色（flop）与珠光折角色彩流转
 * - 下半部收腰曲面：检验暗部饱和度与环境反光层次
 */
function buildSculptedPaintShellGeometry(): THREE.LatheGeometry {
  const radius = 1.04;
  const pts: THREE.Vector2[] = [];

  // 从底部承托口（theta ≈ -72°）一路平滑扫到顶部极点（theta = +90°）
  const pushArc = (degStart: number, degEnd: number, steps: number, rOffset = 0) => {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const rad = THREE.MathUtils.degToRad(degStart + (degEnd - degStart) * t);
      const r = Math.max(0.001, (radius + rOffset) * Math.cos(rad));
      const y = (radius + rOffset) * Math.sin(rad);
      pts.push(new THREE.Vector2(r, y));
    }
  };

  // 1) 下半部收腰主漆面 (-70° -> -11°)
  pushArc(-70, -11, 28, 0);

  // 2) 下倒角平滑切入赤道内凹腰线槽 (-11° -> -6.5°, 内收 -0.068)
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const smooth = t * t * (3 - 2 * t);
    const rad = THREE.MathUtils.degToRad(-11 + 4.5 * t);
    const r = (radius - 0.068 * smooth) * Math.cos(rad);
    const y = (radius - 0.02 * smooth) * Math.sin(rad);
    pts.push(new THREE.Vector2(r, y));
  }

  // 3) 凹槽内壁（留给黑钛金精密环镶嵌）(-6.5° -> +6.5°)
  pushArc(-6.2, 6.2, 8, -0.068);

  // 4) 上倒角平滑切出回主球面 (+6.5° -> +11°)
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const smooth = t * t * (3 - 2 * t);
    const rad = THREE.MathUtils.degToRad(6.5 + 4.5 * t);
    const r = (radius - 0.068 * (1 - smooth)) * Math.cos(rad);
    const y = (radius - 0.02 * (1 - smooth)) * Math.sin(rad);
    pts.push(new THREE.Vector2(r, y));
  }

  // 5) 上半部主圆穹直达极点 (+11° -> +90°)
  pushArc(11, 90, 42, 0);
  // 闭合顶部极点防止微小针孔
  pts[pts.length - 1].set(0, radius);

  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 构建博物馆级三阶曜石黑倒角底座剖面
 */
function buildPedestalGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, -0.22),
    new THREE.Vector2(1.26, -0.22),
    new THREE.Vector2(1.26, -0.17),
    new THREE.Vector2(1.22, -0.14),
    new THREE.Vector2(1.1, -0.14),
    new THREE.Vector2(1.06, -0.06),
    new THREE.Vector2(0.86, -0.02),
    // 顶部凹弧托碗，贴合球体底部
    new THREE.Vector2(0.74, -0.02),
    new THREE.Vector2(0.58, -0.075),
    new THREE.Vector2(0.36, -0.11),
    new THREE.Vector2(0.0, -0.12),
  ];
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 生成底座斜台上的精细径向拉丝与暗金铭文环贴图
 */
function createPlinthEngravingTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;
    ctx.clearRect(0, 0, size, size);

    // 极细腻同心发丝纹
    for (let r = 310; r <= 470; r += 3) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = r % 6 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 外圈香槟金细刻线
    ctx.beginPath();
    ctx.arc(cx, cy, 456, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(201, 168, 106, 0.36)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 内圈暗金细刻线
    ctx.beginPath();
    ctx.arc(cx, cy, 376, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(201, 168, 106, 0.24)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 环形精密刻度（60 格高定表盘既视感）
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const isMajor = i % 5 === 0;
      const r0 = isMajor ? 434 : 444;
      const r1 = 452;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.strokeStyle = isMajor
        ? 'rgba(201, 168, 106, 0.48)'
        : 'rgba(201, 168, 106, 0.18)';
      ctx.lineWidth = isMajor ? 2.2 : 1.1;
      ctx.stroke();
    }

    // 环形品牌铭文
    const text = 'HAMOREY  ·  ATELIER COLOR PPF  ·  8.0 MIL TPU  ·  ';
    const fullText = text + text;
    ctx.font = '600 22px "SF Mono", ui-monospace, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(224, 198, 142, 0.58)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textRadius = 408;
    const step = (Math.PI * 2) / fullText.length;
    for (let i = 0; i < fullText.length; i++) {
      const angle = i * step - Math.PI / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(angle) * textRadius, cy + Math.sin(angle) * textRadius);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(fullText[i], 0, 0);
      ctx.restore();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 生成底座柔和接地阴影与微弱反光晕纹理
 */
function createSoftDiscTexture(innerAlpha: number, midAlpha: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(256, 256, 18, 256, 256, 250);
    g.addColorStop(0, `rgba(255,255,255,${innerAlpha})`);
    g.addColorStop(0.45, `rgba(255,255,255,${midAlpha})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLuxuryShaderball(
  paintMaterial: THREE.Material,
  initialGlowColor: THREE.Color,
): LuxuryShaderballResources {
  const rootGroup = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const sphereCenterY = 0.08;

  // 1. 高定多曲率雕塑车漆球壳
  const shellGeo = buildSculptedPaintShellGeometry();
  geometries.push(shellGeo);
  const shellMesh = new THREE.Mesh(shellGeo, paintMaterial);
  shellMesh.position.y = sphereCenterY;
  shellMesh.castShadow = true;
  shellMesh.receiveShadow = true;
  rootGroup.add(shellMesh);

  // 2. 赤道凹槽内的曜石黑钛精密环 + 上下双道香槟金极细精工线
  const titaniumMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#13161d'),
    metalness: 0.86,
    roughness: 0.28,
    clearcoat: 0.4,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.05,
  });
  const champagneGoldMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#C9A86A'),
    metalness: 0.94,
    roughness: 0.22,
    clearcoat: 0.35,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.15,
  });
  materials.push(titaniumMat, champagneGoldMat);

  const beltGeo = new THREE.CylinderGeometry(0.985, 0.985, 0.145, 96, 1, true);
  geometries.push(beltGeo);
  const beltMesh = new THREE.Mesh(beltGeo, titaniumMat);
  beltMesh.position.y = sphereCenterY;
  rootGroup.add(beltMesh);

  const goldTrimGeo = new THREE.TorusGeometry(0.992, 0.0085, 16, 96);
  goldTrimGeo.rotateX(Math.PI / 2);
  geometries.push(goldTrimGeo);

  const upperGoldTrim = new THREE.Mesh(goldTrimGeo, champagneGoldMat);
  upperGoldTrim.position.y = sphereCenterY + 0.072;
  rootGroup.add(upperGoldTrim);

  const lowerGoldTrim = new THREE.Mesh(goldTrimGeo, champagneGoldMat);
  lowerGoldTrim.position.y = sphereCenterY - 0.072;
  rootGroup.add(lowerGoldTrim);

  // 3. 博物馆级三阶曜石黑石材/阳极氧化铝展台
  const plinthY = -0.94;
  const plinthMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#101218'),
    metalness: 0.32,
    roughness: 0.42,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.75,
  });
  materials.push(plinthMat);

  const plinthGeo = buildPedestalGeometry();
  geometries.push(plinthGeo);
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
  plinthMesh.position.y = plinthY;
  plinthMesh.receiveShadow = true;
  rootGroup.add(plinthMesh);

  // 展台托碗口香槟金精工嵌环
  const collarGoldGeo = new THREE.TorusGeometry(0.81, 0.014, 18, 96);
  collarGoldGeo.rotateX(Math.PI / 2);
  geometries.push(collarGoldGeo);
  const collarGoldMesh = new THREE.Mesh(collarGoldGeo, champagneGoldMat);
  collarGoldMesh.position.y = plinthY - 0.015;
  rootGroup.add(collarGoldMesh);

  // 展台外沿香槟金基座细线
  const baseGoldGeo = new THREE.TorusGeometry(1.24, 0.009, 14, 96);
  baseGoldGeo.rotateX(Math.PI / 2);
  geometries.push(baseGoldGeo);
  const baseGoldMesh = new THREE.Mesh(baseGoldGeo, champagneGoldMat);
  baseGoldMesh.position.y = plinthY - 0.165;
  rootGroup.add(baseGoldMesh);

  // 展台顶环精密刻度与品牌暗金铭文层
  const engravingTex = createPlinthEngravingTexture();
  textures.push(engravingTex);
  const engravingMat = new THREE.MeshBasicMaterial({
    map: engravingTex,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  materials.push(engravingMat);

  const engravingGeo = new THREE.RingGeometry(0.83, 1.13, 96);
  engravingGeo.rotateX(-Math.PI / 2);
  geometries.push(engravingGeo);
  const engravingMesh = new THREE.Mesh(engravingGeo, engravingMat);
  engravingMesh.position.y = plinthY - 0.052;
  rootGroup.add(engravingMesh);

  // 4. 球底与展台底柔和接地阴影 + 极克制的同色系氛围漫反射光晕
  const shadowTex = createSoftDiscTexture(0.92, 0.45);
  const glowTex = createSoftDiscTexture(0.75, 0.25);
  textures.push(shadowTex, glowTex);

  const floorShadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    color: new THREE.Color('#000000'),
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  const ambientRingMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    color: initialGlowColor.clone(),
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  materials.push(floorShadowMat, ambientRingMat);

  const shadowDiscGeo = new THREE.PlaneGeometry(4.2, 4.2);
  shadowDiscGeo.rotateX(-Math.PI / 2);
  geometries.push(shadowDiscGeo);
  const shadowDisc = new THREE.Mesh(shadowDiscGeo, floorShadowMat);
  shadowDisc.position.y = plinthY - 0.222;
  rootGroup.add(shadowDisc);

  const glowDiscGeo = new THREE.PlaneGeometry(5.6, 5.6);
  glowDiscGeo.rotateX(-Math.PI / 2);
  geometries.push(glowDiscGeo);
  const glowDisc = new THREE.Mesh(glowDiscGeo, ambientRingMat);
  glowDisc.position.y = plinthY - 0.225;
  rootGroup.add(glowDisc);

  return {
    rootGroup,
    ambientRingMat,
    dispose: () => {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const t of textures) t.dispose();
    },
  };
}
