// ============================================================
// 和膜 HAMOREY — 真实物理车漆材质控制器 V6
// 精确区分超哑丝绒 / 丝缎绸光 / 水晶镜面 / 金属随角异色 / 珠光双色 / 七彩镭射
// + 实拍无缝高精三平面碳纤映射（幽冥黑波纹锻碳 / 黑锻碳碎切碳条 / 2x2 细密斜纹碳纤维）
// 单一着色器零重编译，切色零卡顿
// ============================================================

import * as THREE from 'three';
import type { ColorFilmItem, StudioViewMode } from '../../config/colorStudio';
import { getCarbonTextureUrl, isCarbonSwatch } from './swatchVisuals';

interface PaintUniforms {
  uPearlShiftColor: { value: THREE.Color };
  uPearlShiftStrength: { value: number };
  uFacePearlStrength: { value: number };
  uFlopStrength: { value: number };
  uLaserStrength: { value: number };
  uCarbonStrength: { value: number };
  uCarbonScale: { value: number };
  uCarbonMap: { value: THREE.Texture };
}

export interface FilmMaterialController {
  material: THREE.MeshPhysicalMaterial;
  update: (swatch: ColorFilmItem, viewMode: StudioViewMode) => void;
  dispose: () => void;
}

function createFallbackCarbonTexture(): THREE.DataTexture {
  const data = new Uint8Array([32, 34, 38, 255]);
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 创建统一复用的 TPU 改色物理材质控制器。
 * 所有色号共用同一着色器程序（不切换任何 define），切色零卡顿。
 */
export function createFilmMaterialController(
  initialSwatch: ColorFilmItem,
  flakeNormalMap: THREE.Texture,
  initialMode: StudioViewMode,
): FilmMaterialController {
  const fallbackTex = createFallbackCarbonTexture();
  const textureLoader = new THREE.TextureLoader();
  const carbonTextureCache = new Map<string, THREE.Texture>();
  let disposed = false;

  const getOrLoadCarbonTexture = (code: string): THREE.Texture => {
    const cached = carbonTextureCache.get(code);
    if (cached) return cached;
    const tex = textureLoader.load(getCarbonTextureUrl(code), (loaded) => {
      if (disposed) {
        loaded.dispose();
        return;
      }
      loaded.wrapS = THREE.RepeatWrapping;
      loaded.wrapT = THREE.RepeatWrapping;
      loaded.anisotropy = 8;
      loaded.generateMipmaps = true;
      loaded.minFilter = THREE.LinearMipmapLinearFilter;
      loaded.magFilter = THREE.LinearFilter;
      loaded.needsUpdate = true;
    });
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    carbonTextureCache.set(code, tex);
    return tex;
  };

  const uniforms: PaintUniforms = {
    uPearlShiftColor: { value: new THREE.Color(initialSwatch.shiftHex || initialSwatch.hex) },
    uPearlShiftStrength: { value: 0 },
    uFacePearlStrength: { value: 0 },
    uFlopStrength: { value: 0 },
    uLaserStrength: { value: 0 },
    uCarbonStrength: { value: 0 },
    uCarbonScale: { value: 6 },
    uCarbonMap: { value: fallbackTex },
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

  material.customProgramCacheKey = () => 'hamorey-film-physical-v7';

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPearlShiftColor = uniforms.uPearlShiftColor;
    shader.uniforms.uPearlShiftStrength = uniforms.uPearlShiftStrength;
    shader.uniforms.uFacePearlStrength = uniforms.uFacePearlStrength;
    shader.uniforms.uFlopStrength = uniforms.uFlopStrength;
    shader.uniforms.uLaserStrength = uniforms.uLaserStrength;
    shader.uniforms.uCarbonStrength = uniforms.uCarbonStrength;
    shader.uniforms.uCarbonScale = uniforms.uCarbonScale;
    shader.uniforms.uCarbonMap = uniforms.uCarbonMap;

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
uniform float uFacePearlStrength;
uniform float uFlopStrength;
uniform float uLaserStrength;
uniform float uCarbonStrength;
uniform float uCarbonScale;
uniform sampler2D uCarbonMap;
varying vec3 vCarbonPos;
varying vec3 vCarbonNorm;`,
      )
      .replace(
        '#include <lights_physical_fragment>',
        `{
  vec3 paintViewDir = normalize(vViewPosition);
  float paintNdotV = clamp(abs(dot(normal, paintViewDir)), 0.0, 1.0);
  float grazing = 1.0 - paintNdotV;

  // World-space triplanar sampling of real seamless high-res carbon textures
  if (uCarbonStrength > 0.5) {
    vec3 cNorm = normalize(vCarbonNorm);
    vec3 tw = pow(abs(cNorm), vec3(7.0));
    tw /= max(tw.x + tw.y + tw.z, 1e-4);
    vec3 sp = vCarbonPos * uCarbonScale;
    vec3 sYZ = texture2D(uCarbonMap, sp.yz).rgb;
    vec3 sXZ = texture2D(uCarbonMap, sp.xz).rgb;
    vec3 sXY = texture2D(uCarbonMap, sp.xy).rgb;
    vec3 srgbTex = sYZ * tw.x + sXZ * tw.y + sXY * tw.z;
    // Convert sampled sRGB texture to linear and enhance crisp carbon fiber depth
    vec3 linTex = pow(clamp(srgbTex, 0.0, 1.0), vec3(2.2));
    float luma = dot(linTex, vec3(0.2126, 0.7152, 0.0722));
    float anisoBoost = 0.86 + 0.34 * smoothstep(0.12, 0.85, grazing);
    diffuseColor.rgb = clamp(linTex * 1.15 * anisoBoost, 0.005, 0.32);
    roughnessFactor = mix(0.38, 0.14, smoothstep(0.02, 0.22, luma));
  }

  // True half-vector interference pearl (volcanic ash: ~60% clean light volcanic grey, pink erupts tightly around light-reflection crests)
  if (uFacePearlStrength > 0.001) {
    vec3 wN = normalize(vCarbonNorm);
    vec3 wV = normalize(cameraPosition - vCarbonPos);
    vec3 keyL1 = normalize(vec3(0.42, 0.82, 0.39));
    vec3 keyL2 = normalize(vec3(-0.48, 0.72, -0.50));
    vec3 h1 = normalize(keyL1 + wV);
    vec3 h2 = normalize(keyL2 + wV);
    float lobe1 = pow(max(dot(wN, h1), 0.0), 3.8);
    float lobe2 = pow(max(dot(wN, h2), 0.0), 4.2) * 0.72;
    float pinkBand = smoothstep(0.22, 0.80, max(lobe1, lobe2));
    // Keep volcanic grey clean & luminous off-axis; erupt into silky sakura-rose pink right on reflection crests
    vec3 roseTint = mix(uPearlShiftColor, uPearlShiftColor * 1.15, smoothstep(0.55, 0.95, pinkBand));
    diffuseColor.rgb = mix(diffuseColor.rgb, clamp(roseTint, 0.0, 1.0), pinkBand * uFacePearlStrength);
  }

  // Grazing-angle pearl / bicolor / chameleon / metallic shift (keep dark bases luminous)
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
    const isCarbon = isCarbonSwatch(code);
    const isMatte = !isCarbon && p.roughness >= 0.44;
    const isSatin = !isCarbon && !isMatte && p.roughness >= 0.24;
    const isLaser = code === 'TPU-001L' || code === 'TPU-002L';
    const isDualToneMetallic = code === 'TPU-001M' || code === 'TPU-002M';

    material.color.set(swatch.hex);

    if (isCarbon) {
      uniforms.uCarbonStrength.value = 1;
      uniforms.uCarbonMap.value = getOrLoadCarbonTexture(code);
      // 细密真实尺度（实拍样板同款高密纹理 + 湿润高亮 8.0 mil TPU 清漆）
      if (code === 'TPU-CF') {
        uniforms.uCarbonScale.value =
          viewMode === 'macro' ? 16.0 : viewMode === 'sphere' ? 7.5 : 13.5;
      } else if (code === 'TPU-002FP') {
        uniforms.uCarbonScale.value =
          viewMode === 'macro' ? 8.0 : viewMode === 'sphere' ? 3.6 : 6.2;
      } else {
        // TPU-001FP 幽冥黑
        uniforms.uCarbonScale.value =
          viewMode === 'macro' ? 7.4 : viewMode === 'sphere' ? 3.2 : 5.6;
      }
      material.metalness = 0.28;
      material.roughness = 0.26;
      material.clearcoat = 0.96;
      material.clearcoatRoughness = isVehicleView ? 0.11 : 0.06;
      material.specularIntensity = 1.0;
      material.envMapIntensity = 1.08;
      material.normalScale.set(0, 0);
      uniforms.uPearlShiftStrength.value = 0;
      uniforms.uFacePearlStrength.value = 0;
      uniforms.uFlopStrength.value = 0.22;
      uniforms.uLaserStrength.value = 0;
      return;
    }

    uniforms.uCarbonStrength.value = 0;
    const isVolcanic = code === 'TPU-001B';
    uniforms.uFacePearlStrength.value = isVolcanic ? 0.86 : 0;

    if (isMatte) {
      material.metalness = Math.min(p.metalness, finish === 'metallic' ? 0.32 : 0.08);
      material.roughness = 0.66;
      material.clearcoat = 0.04;
      material.clearcoatRoughness = 0.68;
      material.specularIntensity = 0.28;
      material.envMapIntensity = 0.52;
    } else if (isSatin) {
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
      const scale = isVolcanic
        ? viewMode === 'macro'
          ? 0.14
          : viewMode === 'sphere'
            ? 0.068
            : 0.055
        : viewMode === 'macro'
          ? 0.09
          : 0.045;
      material.normalScale.set(scale, scale);
      uniforms.uPearlShiftStrength.value = isVolcanic ? 0 : isLaser ? 0.18 : 0.76;
      uniforms.uFlopStrength.value = isVolcanic ? 0.22 : isSatin ? 0.42 : 0.58;
    }
  };

  update(initialSwatch, initialMode);

  return {
    material,
    update,
    dispose: () => {
      disposed = true;
      fallbackTex.dispose();
      carbonTextureCache.forEach((t) => t.dispose());
      carbonTextureCache.clear();
      material.dispose();
    },
  };
}
