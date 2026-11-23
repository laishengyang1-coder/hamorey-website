// ============================================================
// 和膜 HAMOREY — 真实物理车漆材质控制器 V3
// 物理正确 F0≈0.04 基底 + 顶层清漆 + 金属随角异色（flop）+ 保亮度珠光折光
// 不启用 iridescence / sheen：避免掠射角泛白发粉，并保持单一着色器零重编译
// ============================================================

import * as THREE from 'three';
import type { ColorFilmItem, StudioViewMode } from '../../config/colorStudio';

interface PaintUniforms {
  uPearlShiftColor: { value: THREE.Color };
  uPearlShiftStrength: { value: number };
  uFlopStrength: { value: number };
}

export interface FilmMaterialController {
  material: THREE.MeshPhysicalMaterial;
  update: (swatch: ColorFilmItem, viewMode: StudioViewMode) => void;
  dispose: () => void;
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
  const uniforms: PaintUniforms = {
    uPearlShiftColor: { value: new THREE.Color(initialSwatch.shiftHex || initialSwatch.hex) },
    uPearlShiftStrength: { value: 0 },
    uFlopStrength: { value: 0 },
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(initialSwatch.hex),
    metalness: 0,
    roughness: 0.2,
    // 物理正确的介质反射率：IOR 1.5 → F0 ≈ 0.04（真实车漆 / TPU 涂层）
    ior: 1.5,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1,
    normalMap: flakeNormalMap,
    normalScale: new THREE.Vector2(0, 0),
    side: THREE.DoubleSide,
  });

  material.customProgramCacheKey = () => 'hamorey-film-physical-v3';

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPearlShiftColor = uniforms.uPearlShiftColor;
    shader.uniforms.uPearlShiftStrength = uniforms.uPearlShiftStrength;
    shader.uniforms.uFlopStrength = uniforms.uFlopStrength;

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform vec3 uPearlShiftColor;
uniform float uPearlShiftStrength;
uniform float uFlopStrength;`,
      )
      .replace(
        '#include <lights_physical_fragment>',
        `{
  vec3 paintViewDir = normalize(vViewPosition);
  float paintNdotV = clamp(abs(dot(normal, paintViewDir)), 0.0, 1.0);
  float grazing = 1.0 - paintNdotV;

  // 珠光 / 变色龙：掠射角向折光色相偏移，但保持原色亮度，避免发白发粉
  if (uPearlShiftStrength > 0.001) {
    float baseLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    float shiftLuma = max(dot(uPearlShiftColor, vec3(0.2126, 0.7152, 0.0722)), 1e-4);
    vec3 shiftTone = clamp(uPearlShiftColor * (baseLuma / shiftLuma), 0.0, 1.0);
    float band = smoothstep(0.25, 0.92, grazing);
    diffuseColor.rgb = mix(diffuseColor.rgb, shiftTone, band * uPearlShiftStrength);
  }

  // 金属漆随角异色（flop）：侧视与边缘自然压暗，呈现真实金属漆的立体层次
  if (uFlopStrength > 0.001) {
    float flop = smoothstep(0.15, 0.95, grazing);
    diffuseColor.rgb *= mix(1.0, 0.42, flop * uFlopStrength);
  }
}
#include <lights_physical_fragment>`,
      );
  };

  const update = (swatch: ColorFilmItem, viewMode: StudioViewMode) => {
    const { material: p, finish } = swatch;
    material.color.set(swatch.hex);

    // 金属度上限：过高金属度会把整块环境亮面直接染成高光白
    const metalCap = finish === 'crystal' ? 0.08 : finish === 'metallic' ? 0.62 : 0.45;
    material.metalness = Math.min(p.metalness, metalCap);
    // 底漆粗糙度保持一定漫反射，使颜色由「色」而非「反光」主导
    material.roughness = Math.max(p.roughness, finish === 'crystal' ? 0.32 : 0.24);
    material.clearcoat = p.clearcoat;
    // 整车/近景：车模面数有限，镜面级清漆会把灯箱边缘沿三角面拆成锯齿，适度柔化清漆反射
    const isVehicleView = viewMode === 'car' || viewMode === 'closeup';
    material.clearcoatRoughness = isVehicleView
      ? Math.max(p.clearcoatRoughness, 0.11)
      : p.clearcoatRoughness;
    material.envMapIntensity = finish === 'crystal' ? 0.9 : 1.0;

    if (viewMode === 'macro') {
      flakeNormalMap.repeat.set(3.5, 3.5);
    } else if (viewMode === 'swatch' || viewMode === 'sphere') {
      flakeNormalMap.repeat.set(8.5, 8.5);
    } else {
      flakeNormalMap.repeat.set(22, 22);
    }

    uniforms.uPearlShiftColor.value.set(swatch.shiftHex || swatch.hex);

    if (finish === 'crystal') {
      material.normalScale.set(0, 0);
      uniforms.uPearlShiftStrength.value = 0;
      uniforms.uFlopStrength.value = 0.18;
    } else if (finish === 'metallic') {
      const scale = viewMode === 'macro' ? 0.12 : 0.06;
      material.normalScale.set(scale, scale);
      uniforms.uPearlShiftStrength.value = 0.12;
      uniforms.uFlopStrength.value = 0.85;
    } else if (finish === 'pearlescent') {
      const scale = viewMode === 'macro' ? 0.07 : 0.035;
      material.normalScale.set(scale, scale);
      uniforms.uPearlShiftStrength.value = 0.42;
      uniforms.uFlopStrength.value = 0.5;
    } else {
      // chameleon / special：变色龙、镭射、炫彩
      const scale = viewMode === 'macro' ? 0.09 : 0.045;
      material.normalScale.set(scale, scale);
      uniforms.uPearlShiftStrength.value = 0.68;
      uniforms.uFlopStrength.value = 0.55;
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
