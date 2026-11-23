// ============================================================
// 和膜 HAMOREY — 真实物理车漆材质控制器 V5
// 精确区分超哑丝绒 / 丝缎绸光 / 水晶镜面 / 金属随角异色 / 珠光双色 / 七彩镭射
// + 世界空间三平面程序化碳纤（幽冥黑波纹锻碳 / 黑锻碳碎切锻造碳 / 2x2 编织碳纤维）
// 单一着色器零重编译，切色零卡顿
// ============================================================

import * as THREE from 'three';
import type { ColorFilmItem, StudioViewMode } from '../../config/colorStudio';

interface PaintUniforms {
  uPearlShiftColor: { value: THREE.Color };
  uPearlShiftStrength: { value: number };
  uFlopStrength: { value: number };
  uLaserStrength: { value: number };
  uCarbonMode: { value: number };
  uCarbonScale: { value: number };
}

export interface FilmMaterialController {
  material: THREE.MeshPhysicalMaterial;
  update: (swatch: ColorFilmItem, viewMode: StudioViewMode) => void;
  dispose: () => void;
}

const CARBON_GLSL_HELPERS = `
float cHash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 cHash22(vec2 p) {
  return vec2(cHash21(p), cHash21(p + vec2(37.17, 17.83)));
}

float cNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = cHash21(i);
  float b = cHash21(i + vec2(1.0, 0.0));
  float c = cHash21(i + vec2(0.0, 1.0));
  float d = cHash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float cFbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * cNoise(p);
    p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.02;
    a *= 0.5;
  }
  return v;
}

// Mode 1: Damascus flowing marble forged carbon
float cDamascus(vec2 uv, vec3 viewDir) {
  vec2 q = vec2(cFbm(uv), cFbm(uv + vec2(5.2, 1.3)));
  float w = cFbm(uv + 2.4 * q);
  float bands = 0.5 + 0.5 * sin(uv.x * 4.5 + w * 11.0);
  float ridges = pow(bands, 1.45);
  float aniso = 0.72 + 0.28 * abs(sin(w * 6.2831 + viewDir.x * 2.2));
  return clamp(ridges * aniso, 0.0, 1.0);
}

// Mode 2: Chopped forged carbon composite shards
float cForgedLayer(vec2 uv, vec3 viewDir) {
  vec2 n = floor(uv);
  vec2 f = fract(uv);
  float md = 8.0;
  float cellId = 0.0;
  vec2 bestOffset = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = cHash22(n + g);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < md) {
        md = d;
        cellId = cHash21(n + g + vec2(11.3, 29.7));
        bestOffset = r;
      }
    }
  }
  float ang = cellId * 6.28318;
  vec2 dir = vec2(cos(ang), sin(ang));
  float fibers = 0.5 + 0.5 * sin(dot(bestOffset, dir) * 42.0 + cellId * 12.0);
  vec2 v2 = normalize(viewDir.xz + vec2(0.001, 0.001));
  float glint = pow(abs(dot(dir, v2)), 1.6);
  return clamp(mix(0.12, 0.92, glint) * (0.78 + 0.22 * fibers), 0.0, 1.0);
}

float cForged(vec2 uv, vec3 viewDir) {
  float a = cForgedLayer(uv, viewDir);
  float b = cForgedLayer(uv * 1.65 + vec2(7.4, 3.1), viewDir);
  return clamp(mix(a, b, 0.42), 0.0, 1.0);
}

// Mode 3: 2x2 diagonal twill woven carbon fiber
float cTwill(vec2 uv, vec3 viewDir) {
  vec2 cell = floor(uv);
  vec2 f = fract(uv);
  float diag = mod(cell.x + cell.y, 4.0);
  bool isWarp = diag < 2.0;
  float across = isWarp ? f.y : f.x;
  float along = isWarp ? f.x : f.y;
  float pillow = sin(clamp(across, 0.0, 1.0) * 3.14159);
  float strands = 0.88 + 0.12 * sin(across * 31.4159);
  float gap = smoothstep(0.0, 0.12, across) * smoothstep(1.0, 0.88, across) *
              smoothstep(0.0, 0.08, along) * smoothstep(1.0, 0.92, along);
  float orient = isWarp ? (0.62 + 0.38 * abs(viewDir.x)) : (0.30 + 0.34 * abs(viewDir.z));
  return clamp(pillow * strands * gap * orient, 0.0, 1.0);
}

float evalCarbon2D(vec2 uv, float mode, vec3 viewDir) {
  if (mode < 1.5) return cDamascus(uv, viewDir);
  if (mode < 2.5) return cForged(uv, viewDir);
  return cTwill(uv, viewDir);
}
`;

/**
 * 创建统一复用的 TPU 改色物理材质控制器。
 * 所有色号共用同一着色器程序（不切换任何 define），切色零卡顿。
 */
export function createFilmMaterialController(
  initialSwatch: ColorFilmItem,
  flakeNormalMap: THREE.Texture,
  initialMode: StudioViewMode,
): FilmMaterialController {
  const uniforms: PaintUniforms = {
    uPearlShiftColor: { value: new THREE.Color(initialSwatch.shiftHex || initialSwatch.hex) },
    uPearlShiftStrength: { value: 0 },
    uFlopStrength: { value: 0 },
    uLaserStrength: { value: 0 },
    uCarbonMode: { value: 0 },
    uCarbonScale: { value: 12 },
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(initialSwatch.hex),
    metalness: 0,
    roughness: 0.2,
    ior: 1.5,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1,
    normalMap: flakeNormalMap,
    normalScale: new THREE.Vector2(0, 0),
    side: THREE.DoubleSide,
  });

  material.customProgramCacheKey = () => 'hamorey-film-physical-v5';

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPearlShiftColor = uniforms.uPearlShiftColor;
    shader.uniforms.uPearlShiftStrength = uniforms.uPearlShiftStrength;
    shader.uniforms.uFlopStrength = uniforms.uFlopStrength;
    shader.uniforms.uLaserStrength = uniforms.uLaserStrength;
    shader.uniforms.uCarbonMode = uniforms.uCarbonMode;
    shader.uniforms.uCarbonScale = uniforms.uCarbonScale;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vCarbonPos;
varying vec3 vCarbonNorm;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vCarbonPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vCarbonNorm = normalize(mat3(modelMatrix) * objectNormal);`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform vec3 uPearlShiftColor;
uniform float uPearlShiftStrength;
uniform float uFlopStrength;
uniform float uLaserStrength;
uniform float uCarbonMode;
uniform float uCarbonScale;
varying vec3 vCarbonPos;
varying vec3 vCarbonNorm;
${CARBON_GLSL_HELPERS}`,
      )
      .replace(
        '#include <lights_physical_fragment>',
        `{
  vec3 paintViewDir = normalize(vViewPosition);
  float paintNdotV = clamp(abs(dot(normal, paintViewDir)), 0.0, 1.0);
  float grazing = 1.0 - paintNdotV;

  // Triplanar 3D carbon composite & twill weave (zero UV stretch across car & sphere)
  if (uCarbonMode > 0.5) {
    vec3 cNorm = normalize(vCarbonNorm);
    vec3 tw = pow(abs(cNorm), vec3(6.0));
    tw /= max(tw.x + tw.y + tw.z, 1e-4);
    vec3 sp = vCarbonPos * uCarbonScale;
    float pYZ = evalCarbon2D(sp.yz, uCarbonMode, paintViewDir);
    float pXZ = evalCarbon2D(sp.xz, uCarbonMode, paintViewDir);
    float pXY = evalCarbon2D(sp.xy, uCarbonMode, paintViewDir);
    float pat = clamp(pYZ * tw.x + pXZ * tw.y + pXY * tw.z, 0.0, 1.0);
    vec3 cDark = vec3(0.008, 0.009, 0.011);
    vec3 cLight = vec3(0.115, 0.126, 0.148);
    diffuseColor.rgb = mix(cDark, cLight, pat);
    roughnessFactor = mix(0.42, 0.16, pat);
  }

  // Pearl / bicolor / chameleon / metallic shift (keep dark bases luminous)
  if (uPearlShiftStrength > 0.001) {
    float baseLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    float shiftLuma = max(dot(uPearlShiftColor, vec3(0.2126, 0.7152, 0.0722)), 1e-4);
    float lumaScale = clamp(baseLuma / shiftLuma, 0.48, 1.18);
    vec3 shiftTone = clamp(uPearlShiftColor * lumaScale, 0.0, 1.0);
    float band = smoothstep(0.18, 0.88, grazing);
    diffuseColor.rgb = mix(diffuseColor.rgb, shiftTone, band * uPearlShiftStrength);
  }

  // Prismatic laser diffraction sheen
  if (uLaserStrength > 0.001) {
    float phase = grazing * 7.5 + dot(normal, vec3(0.45, 0.65, 0.35)) * 2.2;
    vec3 rainbow = 0.55 + 0.45 * cos(phase + vec3(0.0, 2.094, 4.188));
    float band = smoothstep(0.16, 0.85, grazing);
    diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb, rainbow, 0.62), band * uLaserStrength);
  }

  // Metallic flop darkening at grazing angles
  if (uFlopStrength > 0.001) {
    float flop = smoothstep(0.15, 0.95, grazing);
    diffuseColor.rgb *= mix(1.0, 0.40, flop * uFlopStrength);
  }
}
#include <lights_physical_fragment>`,
      );
  };

  const update = (swatch: ColorFilmItem, viewMode: StudioViewMode) => {
    const { material: p, finish, code } = swatch;
    const isVehicleView = viewMode === 'car' || viewMode === 'closeup';
    const carbonMode =
      code === 'TPU-001FP' ? 1 : code === 'TPU-002FP' ? 2 : code === 'TPU-CF' ? 3 : 0;
    const isMatte = carbonMode === 0 && p.roughness >= 0.44;
    const isSatin = carbonMode === 0 && !isMatte && p.roughness >= 0.24;
    const isLaser = code === 'TPU-001L' || code === 'TPU-002L';
    const isDualToneMetallic = code === 'TPU-001M' || code === 'TPU-002M';

    material.color.set(swatch.hex);
    uniforms.uCarbonMode.value = carbonMode;

    if (carbonMode > 0) {
      material.metalness = 0.32;
      material.roughness = 0.28;
      material.clearcoat = 0.88;
      material.clearcoatRoughness = isVehicleView ? 0.14 : 0.09;
      material.specularIntensity = 0.92;
      material.envMapIntensity = 1.02;
      material.normalScale.set(0, 0);
      uniforms.uPearlShiftStrength.value = 0;
      uniforms.uFlopStrength.value = 0.24;
      uniforms.uLaserStrength.value = 0;

      if (carbonMode === 1) {
        uniforms.uCarbonScale.value =
          viewMode === 'macro' ? 5.2 : viewMode === 'sphere' ? 2.1 : 3.0;
      } else if (carbonMode === 2) {
        uniforms.uCarbonScale.value =
          viewMode === 'macro' ? 20.0 : viewMode === 'sphere' ? 8.5 : 13.5;
      } else {
        uniforms.uCarbonScale.value =
          viewMode === 'macro' ? 58.0 : viewMode === 'sphere' ? 24.0 : 40.0;
      }
      return;
    }

    if (isMatte) {
      // 超哑 / 哑光（Magno）：高粗糙漫反射 + 极低清漆，彻底告别塑料亮感
      material.metalness = Math.min(p.metalness, finish === 'metallic' ? 0.32 : 0.08);
      material.roughness = 0.66;
      material.clearcoat = 0.04;
      material.clearcoatRoughness = 0.68;
      material.specularIntensity = 0.28;
      material.envMapIntensity = 0.52;
    } else if (isSatin) {
      // 丝缎（Satin）：柔和绸缎半哑光，柔化高光勾勒腰线
      material.metalness = Math.min(p.metalness, finish === 'metallic' ? 0.52 : 0.28);
      material.roughness = 0.36;
      material.clearcoat = 0.24;
      material.clearcoatRoughness = 0.34;
      material.specularIntensity = 0.58;
      material.envMapIntensity = 0.78;
    } else {
      const metalCap = finish === 'crystal' ? 0.08 : finish === 'metallic' ? 0.68 : 0.48;
      material.metalness = Math.min(p.metalness, metalCap);
      material.roughness = Math.max(p.roughness, finish === 'crystal' ? 0.30 : 0.20);
      material.clearcoat = p.clearcoat;
      material.clearcoatRoughness = isVehicleView
        ? Math.max(p.clearcoatRoughness, 0.11)
        : p.clearcoatRoughness;
      material.specularIntensity = 1;
      material.envMapIntensity = finish === 'crystal' ? 0.92 : 1.05;
    }

    if (viewMode === 'macro') {
      flakeNormalMap.repeat.set(3.5, 3.5);
    } else if (viewMode === 'swatch' || viewMode === 'sphere') {
      flakeNormalMap.repeat.set(8.5, 8.5);
    } else {
      flakeNormalMap.repeat.set(22, 22);
    }

    uniforms.uPearlShiftColor.value.set(swatch.shiftHex || swatch.hex);
    uniforms.uLaserStrength.value = isLaser ? 0.52 : 0;

    if (finish === 'crystal') {
      material.normalScale.set(0, 0);
      uniforms.uPearlShiftStrength.value = 0;
      uniforms.uFlopStrength.value = isMatte ? 0.08 : 0.18;
    } else if (finish === 'metallic') {
      const scale = isMatte ? 0.025 : viewMode === 'macro' ? 0.13 : 0.065;
      material.normalScale.set(scale, scale);
      uniforms.uPearlShiftStrength.value = isDualToneMetallic ? 0.45 : isMatte ? 0.06 : 0.18;
      uniforms.uFlopStrength.value = isMatte ? 0.22 : isSatin ? 0.52 : 0.88;
    } else if (finish === 'pearlescent') {
      const scale = isMatte ? 0.02 : viewMode === 'macro' ? 0.08 : 0.038;
      material.normalScale.set(scale, scale);
      uniforms.uPearlShiftStrength.value = isMatte ? 0.12 : 0.52;
      uniforms.uFlopStrength.value = isMatte ? 0.14 : 0.48;
    } else {
      // chameleon / bicolor / laser / special
      const scale = viewMode === 'macro' ? 0.09 : 0.045;
      material.normalScale.set(scale, scale);
      uniforms.uPearlShiftStrength.value = isLaser ? 0.18 : 0.76;
      uniforms.uFlopStrength.value = isSatin ? 0.42 : 0.58;
    }
  };

  update(initialSwatch, initialMode);

  return {
    material,
    update,
    dispose: () => {
      material.dispose();
    },
  };
}
