// ============================================================
// 和膜 HAMOREY — 多层高定物理车漆材质控制器 V2
// 顶层绝对镜面清漆 + 底层微米金属颗粒 / 平滑菲涅尔双色珠光折光
// ============================================================

import * as THREE from 'three';
import type { ColorFilmItem, StudioViewMode } from '../../config/colorStudio';

interface PearlUniforms {
  uPearlShiftColor: { value: THREE.Color };
  uPearlShiftStrength: { value: number };
}

export interface FilmMaterialController {
  material: THREE.MeshPhysicalMaterial;
  update: (swatch: ColorFilmItem, viewMode: StudioViewMode) => void;
  dispose: () => void;
}

/**
 * 创建统一复用的多层 TPU 改色物理材质控制器。
 * 保持单一着色器程序不变，切色号时零重编译卡顿。
 */
export function createFilmMaterialController(
  initialSwatch: ColorFilmItem,
  flakeNormalMap: THREE.Texture,
  initialMode: StudioViewMode,
): FilmMaterialController {
  const pearlUniforms: PearlUniforms = {
    uPearlShiftColor: { value: new THREE.Color(initialSwatch.shiftHex || initialSwatch.hex) },
    uPearlShiftStrength: { value: 0 },
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(initialSwatch.hex),
    metalness: initialSwatch.material.metalness,
    roughness: initialSwatch.material.roughness,
    clearcoat: initialSwatch.material.clearcoat,
    clearcoatRoughness: initialSwatch.material.clearcoatRoughness,
    reflectivity: 1.0,
    ior: 1.56,
    envMapIntensity: 1.75,
    normalMap: flakeNormalMap,
    normalScale: new THREE.Vector2(0, 0),
    iridescence: initialSwatch.material.iridescence,
    iridescenceIOR: initialSwatch.material.iridescenceIOR,
    iridescenceThicknessRange: [190, 580],
    sheen: initialSwatch.material.sheenIntensity,
    sheenRoughness: 0.2,
    sheenColor: new THREE.Color(initialSwatch.shiftHex || initialSwatch.hex),
    side: THREE.DoubleSide,
  });

  material.customProgramCacheKey = () => 'hamorey-film-physical-v2';

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPearlShiftColor = pearlUniforms.uPearlShiftColor;
    shader.uniforms.uPearlShiftStrength = pearlUniforms.uPearlShiftStrength;

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform vec3 uPearlShiftColor;
uniform float uPearlShiftStrength;`,
      )
      .replace(
        '#include <lights_physical_fragment>',
        `if (uPearlShiftStrength > 0.001) {
  vec3 pearlViewDir = normalize(vViewPosition);
  float ndotv = clamp(dot(normal, pearlViewDir), 0.0, 1.0);
  float pearlBand = smoothstep(0.12, 0.86, 1.0 - ndotv);
  diffuseColor.rgb = mix(diffuseColor.rgb, uPearlShiftColor, clamp(pearlBand * uPearlShiftStrength, 0.0, 0.9));
}
#include <lights_physical_fragment>`,
      );
  };

  const update = (swatch: ColorFilmItem, viewMode: StudioViewMode) => {
    const { material: p } = swatch;
    material.color.set(swatch.hex);
    material.metalness = p.metalness;
    material.roughness = p.roughness;
    material.clearcoat = p.clearcoat;
    material.clearcoatRoughness = p.clearcoatRoughness;
    material.iridescence = p.iridescence;
    material.iridescenceIOR = p.iridescenceIOR;
    material.sheen = p.sheenIntensity;
    material.sheenColor.set(swatch.shiftHex || swatch.hex);
    material.envMapIntensity = swatch.finish === 'crystal' ? 1.85 : 1.7;

    // 针对 512x512 微晶法线纹理设置各视角下的理想平铺比例
    if (viewMode === 'macro') {
      flakeNormalMap.repeat.set(3.5, 3.5);
    } else if (viewMode === 'swatch' || viewMode === 'sphere') {
      flakeNormalMap.repeat.set(8.5, 8.5);
    } else {
      flakeNormalMap.repeat.set(22, 22);
    }

    if (swatch.finish === 'crystal') {
      material.normalScale.set(0, 0);
      pearlUniforms.uPearlShiftStrength.value = 0;
    } else if (swatch.finish === 'metallic') {
      const scale = viewMode === 'macro' ? 0.13 : 0.075;
      material.normalScale.set(scale, scale);
      pearlUniforms.uPearlShiftColor.value.set(swatch.shiftHex || swatch.hex);
      pearlUniforms.uPearlShiftStrength.value = 0.26;
    } else {
      // pearlescent：珠光双色流转
      const scale = viewMode === 'macro' ? 0.08 : 0.038;
      material.normalScale.set(scale, scale);
      pearlUniforms.uPearlShiftColor.value.set(swatch.shiftHex || swatch.hex);
      pearlUniforms.uPearlShiftStrength.value = 0.88;
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
