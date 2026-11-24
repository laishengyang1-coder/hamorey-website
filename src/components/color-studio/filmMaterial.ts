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
  uKanasStrength: { value: number };
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
    uKanasStrength: { value: 0 },
    uFlopStrength: { value: 0 },
    uLaserStrength: { value: 0 },
    uCarbonStrength: { value: 0 },
    uCarbonScale: { value: 6 },
    uCarbonMap: { value: fallbackTex },
  };

  const whiteColor = new THREE.Color('#ffffff');
  const tempSpecColor = new THREE.Color();
  const tempSheenColor = new THREE.Color();

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(initialSwatch.hex),
    metalness: 0,
    roughness: 0.2,
    ior: 1.49,
    specularIntensity: 0.44,
    sheen: 0.12,
    sheenRoughness: 0.55,
    clearcoat: 0.92,
    clearcoatRoughness: 0.058,
    envMapIntensity: 1.0,
    normalMap: flakeNormalMap,
    normalScale: new THREE.Vector2(0, 0),
    side: THREE.DoubleSide,
  });

  material.customProgramCacheKey = () => 'hamorey-film-physical-v10';

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPearlShiftColor = uniforms.uPearlShiftColor;
    shader.uniforms.uPearlShiftStrength = uniforms.uPearlShiftStrength;
    shader.uniforms.uFacePearlStrength = uniforms.uFacePearlStrength;
    shader.uniforms.uKanasStrength = uniforms.uKanasStrength;
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
uniform float uKanasStrength;
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

  // Silky wide-feathered half-vector interference pearl (smooth organic flow across body curves, zero stiff bands)
  if (uFacePearlStrength > 0.001) {
    vec3 wN = normalize(vCarbonNorm);
    vec3 wV = normalize(cameraPosition - vCarbonPos);
    vec3 keyL1 = normalize(vec3(0.38, 0.86, 0.34));
    vec3 keyL2 = normalize(vec3(-0.44, 0.76, -0.48));
    vec3 h1 = normalize(keyL1 + wV);
    vec3 h2 = normalize(keyL2 + wV);
    float lobe1 = pow(max(dot(wN, h1), 0.0), 2.15);
    float lobe2 = pow(max(dot(wN, h2), 0.0), 2.45) * 0.76;
    float pinkBand = smoothstep(0.06, 0.86, max(lobe1, lobe2));
    vec3 roseTint = mix(uPearlShiftColor, uPearlShiftColor * 1.08, smoothstep(0.45, 0.95, pinkBand));
    diffuseColor.rgb = mix(diffuseColor.rgb, clamp(roseTint, 0.0, 1.0), pinkBand * uFacePearlStrength);
  }

  // Kanas Blue multi-stop chameleon (supple cyan-blue -> cobalt -> royal amethyst violet transition)
  if (uKanasStrength > 0.001) {
    vec3 cCyan = vec3(0.016, 0.36, 0.80);
    vec3 cCobalt = vec3(0.026, 0.15, 0.70);
    vec3 cViolet = vec3(0.23, 0.04, 0.76);
    vec3 cOrchid = vec3(0.44, 0.08, 0.80);
    float t1 = smoothstep(0.04, 0.42, grazing);
    float t2 = smoothstep(0.28, 0.72, grazing);
    float t3 = smoothstep(0.62, 0.96, grazing);
    vec3 kanas = mix(cCyan, cCobalt, t1);
    kanas = mix(kanas, cViolet, t2);
    kanas = mix(kanas, cOrchid, t3 * 0.62);
    diffuseColor.rgb = mix(diffuseColor.rgb, kanas, uKanasStrength);
  }

  // Smooth grazing-angle pearl / bicolor / chameleon / metallic shift
  if (uPearlShiftStrength > 0.001) {
    float band = smoothstep(0.10, 0.90, grazing);
    diffuseColor.rgb = mix(diffuseColor.rgb, uPearlShiftColor, band * uPearlShiftStrength);
  }

  // Prismatic laser diffraction sheen
  if (uLaserStrength > 0.001) {
    float phase = grazing * 7.0 + dot(normal, vec3(0.45, 0.65, 0.35)) * 2.0;
    vec3 rainbow = 0.55 + 0.45 * cos(phase + vec3(0.0, 2.094, 4.188));
    float band = smoothstep(0.14, 0.88, grazing);
    diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb, rainbow, 0.58), band * uLaserStrength);
  }

  // Subtle upward sky-scatter lift + Beer-Lambert rich-chroma optical lacquer depth (prevents flat/stiff colors & grey mud)
  if (uCarbonStrength < 0.5) {
    vec3 wUpN = normalize(vCarbonNorm);
    float skyLift = smoothstep(-0.15, 0.92, wUpN.y);
    diffuseColor.rgb *= (0.965 + 0.055 * skyLift);
  }
  if (uFlopStrength > 0.001) {
    float flop = smoothstep(0.14, 0.96, grazing) * uFlopStrength;
    vec3 richDepth = pow(clamp(diffuseColor.rgb, vec3(1e-4), vec3(1.0)), vec3(1.0 + flop * 0.36));
    diffuseColor.rgb = mix(diffuseColor.rgb, richDepth * (1.0 - flop * 0.28), 0.88);
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
    tempSheenColor.set(swatch.shiftHex || swatch.hex);
    tempSpecColor.copy(whiteColor).lerp(tempSheenColor, finish === 'crystal' ? 0.52 : 0.64);
    material.specularColor.copy(tempSpecColor);
    material.sheenColor.copy(tempSheenColor);

    if (isCarbon) {
      uniforms.uCarbonStrength.value = 1;
      uniforms.uCarbonMap.value = getOrLoadCarbonTexture(code);
      // 细密真实尺度（实拍样板同款高密纹理 + 温润 8.0 mil TPU 清漆）
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
      material.metalness = 0.24;
      material.roughness = 0.28;
      material.ior = 1.49;
      material.sheen = 0.08;
      material.sheenRoughness = 0.5;
      material.clearcoat = 0.88;
      material.clearcoatRoughness = 0.062;
      material.specularColor.copy(whiteColor);
      material.specularIntensity = 0.48;
      material.envMapIntensity = 1.04;
      material.normalScale.set(0, 0);
      uniforms.uPearlShiftStrength.value = 0;
      uniforms.uFacePearlStrength.value = 0;
      uniforms.uKanasStrength.value = 0;
      uniforms.uFlopStrength.value = 0.2;
      uniforms.uLaserStrength.value = 0;
      return;
    }

    uniforms.uCarbonStrength.value = 0;
    const isVolcanic = code === 'TPU-001B';
    const isRedInWhite = code === 'TPU-002B';
    const isBlackRed = code === 'TPU-001C';
    const isGreenChromis = code === 'TPU-002C';
    const isBluishGreen = code === 'TPU-003C';
    const isDawnMatte = code === 'TPU-021P';
    const isGoldenArmor = code === 'TPU-001G';
    const isKanas = code === 'TPU-005C' || code === 'TPU-006C';
    uniforms.uFacePearlStrength.value = isVolcanic
      ? 0.84
      : isRedInWhite
        ? 0.78
        : isBlackRed
          ? 0.86
          : isGreenChromis
            ? 0.80
            : isBluishGreen
              ? 0.76
              : isDawnMatte
                ? 0.46
                : isGoldenArmor
                  ? 0.66
                  : 0;
    uniforms.uKanasStrength.value = isKanas ? (code === 'TPU-006C' ? 0.90 : 0.98) : 0;

    if (isMatte) {
      // 高定丝绒哑光 TPU：色料同色微散射 sheen + 极低底漆白斑，呈现细腻高级丝绒雾面而非干涩 PVC 塑料
      const isLightMatte = code === 'TPU-021P' || code === 'TPU-011P';
      material.metalness = Math.min(p.metalness, finish === 'metallic' ? 0.28 : 0.08);
      material.roughness = isDawnMatte ? 0.48 : 0.56;
      material.ior = 1.46;
      material.sheen = isLightMatte ? 0.28 : 0.46;
      material.sheenRoughness = 0.52;
      material.clearcoat = isDawnMatte ? 0.12 : 0.06;
      material.clearcoatRoughness = isDawnMatte ? 0.44 : 0.56;
      material.specularIntensity = isLightMatte ? 0.30 : 0.22;
      material.envMapIntensity = isLightMatte ? 0.98 : 0.92;
    } else if (isSatin) {
      // 凝脂丝缎 TPU：温润半光丝绸漫射过渡
      material.metalness = Math.min(p.metalness, finish === 'metallic' ? 0.46 : 0.24);
      material.roughness = 0.34;
      material.ior = 1.48;
      material.sheen = 0.34;
      material.sheenRoughness = 0.42;
      material.clearcoat = 0.32;
      material.clearcoatRoughness = 0.28;
      material.specularIntensity = 0.36;
      material.envMapIntensity = 0.96;
    } else {
      // 温润原厂级 8.0 mil 清漆：色料着色底散射（彻底去除塑料灰白雾斑）+ 清澈凝脂光学清漆层
      const metalCap = finish === 'crystal' ? 0.03 : finish === 'metallic' ? 0.58 : 0.42;
      material.metalness = Math.min(p.metalness, metalCap);
      material.roughness = finish === 'crystal' ? 0.22 : 0.26;
      material.ior = 1.49;
      material.sheen = finish === 'crystal' ? 0.08 : 0.18;
      material.sheenRoughness = 0.48;
      material.clearcoat = finish === 'crystal' ? 0.94 : 0.92;
      material.clearcoatRoughness = finish === 'crystal' ? 0.030 : 0.036;
      material.specularIntensity = finish === 'crystal' ? 0.36 : 0.44;
      material.envMapIntensity = finish === 'crystal' ? 1.04 : 1.08;
    }

    if (viewMode === 'macro') {
      flakeNormalMap.repeat.set(isGoldenArmor ? 4.8 : 3.5, isGoldenArmor ? 4.8 : 3.5);
    } else if (viewMode === 'swatch' || viewMode === 'sphere') {
      flakeNormalMap.repeat.set(isGoldenArmor ? 11.0 : 8.5, isGoldenArmor ? 11.0 : 8.5);
    } else {
      flakeNormalMap.repeat.set(isGoldenArmor ? 26 : 22, isGoldenArmor ? 26 : 22);
    }

    uniforms.uPearlShiftColor.value.set(swatch.shiftHex || swatch.hex);
    uniforms.uLaserStrength.value = isLaser ? 0.52 : 0;

    if (finish === 'crystal') {
      material.normalScale.set(0, 0);
      uniforms.uPearlShiftStrength.value = isMatte ? 0.12 : 0.08;
      uniforms.uFlopStrength.value = isMatte ? 0.22 : code === 'TPU-001S' ? 0.10 : 0.32;
    } else if (finish === 'metallic') {
      const scale = isMatte ? 0.022 : viewMode === 'macro' ? 0.12 : 0.058;
      material.normalScale.set(scale, scale);
      uniforms.uPearlShiftStrength.value = isDualToneMetallic ? 0.45 : isMatte ? 0.12 : 0.22;
      uniforms.uFlopStrength.value = isMatte
        ? 0.28
        : isSatin
          ? 0.42
          : code === 'TPU-026M'
            ? 0.38
            : 0.56;
    } else if (finish === 'pearlescent') {
      const scale = isMatte ? 0.022 : viewMode === 'macro' ? 0.075 : 0.034;
      material.normalScale.set(scale, scale);
      uniforms.uPearlShiftStrength.value = isDawnMatte ? 0 : isMatte ? 0.28 : 0.48;
      uniforms.uFlopStrength.value = isDawnMatte ? 0.08 : isMatte ? 0.26 : 0.42;
    } else {
      const scale = isGoldenArmor
        ? viewMode === 'macro'
          ? 0.16
          : viewMode === 'sphere'
            ? 0.085
            : 0.072
        : isVolcanic
          ? viewMode === 'macro'
            ? 0.12
            : viewMode === 'sphere'
              ? 0.058
              : 0.046
          : viewMode === 'macro'
            ? 0.08
            : 0.038;
      material.normalScale.set(scale, scale);
      uniforms.uPearlShiftStrength.value =
        isVolcanic || isGoldenArmor || isKanas
          ? 0
          : isRedInWhite
            ? 0.22
            : isBlackRed
              ? 0.42
              : isGreenChromis
                ? 0.58
                : isBluishGreen
                  ? 0.56
                  : isLaser
                    ? 0.18
                    : 0.66;
      uniforms.uFlopStrength.value = isKanas
        ? isSatin
          ? 0.20
          : 0.28
        : isGreenChromis || isBluishGreen
          ? 0.24
          : isBlackRed
            ? 0.18
            : isRedInWhite
              ? 0.10
              : isGoldenArmor
                ? 0.14
                : isVolcanic
                  ? 0.22
                  : isSatin
                    ? 0.34
                    : 0.38;
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
