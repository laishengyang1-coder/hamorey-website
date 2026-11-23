import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent, WheelEvent } from 'react';
import {
  COLOR_STUDIO_SWATCHES,
  type ColorFilmItem,
  type StudioLightingPreset,
} from '../../config/colorStudio';
import { SwatchFanMaterial } from './SwatchFanMaterial';
import './SwatchFan.css';

interface SwatchFanProps {
  swatches: ColorFilmItem[];
  activeSwatch: ColorFilmItem;
  lightingPreset: StudioLightingPreset;
  lang: 'zh' | 'en';
  pickedUp: boolean;
  paused: boolean;
  onSelect: (swatch: ColorFilmItem) => void;
  onPickedUpChange: (picked: boolean) => void;
}

type Variables = CSSProperties & Record<`--_${string}`, string | number>;

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  startPos: number;
  moved: boolean;
  code?: string;
  tiltX: number;
  tiltY: number;
}

interface PendingTap {
  x: number;
  y: number;
  when: number;
  code: string;
}

const wrap = (n: number, length: number) => ((n % length) + length) % length;
const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));

const numbers = new Map(
  COLOR_STUDIO_SWATCHES.map((s, i) => [s.code, String(i + 1).padStart(2, '0')]),
);

const BASE_ANGLE = 13.5;
const AUTO_TURN_MS = 3400;
const VISIBLE_REACH = 5;

function letteringColor(hex: string): string {
  const clean = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const ch = Number.parseInt(clean.slice(i, i + 2), 16) / 255;
    return ch <= 0.04045 ? ch / 12.92 : ((ch + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.24 ? '#141518' : '#fffaf1';
}

export function SwatchFan({
  swatches,
  activeSwatch,
  lightingPreset,
  lang,
  pickedUp,
  paused,
  onSelect,
  onPickedUpChange,
}: SwatchFanProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dragRef = useRef<DragState | null>(null);
  const pendingTapRef = useRef<PendingTap | null>(null);
  const tapTimerRef = useRef(0);
  const lastDoubleRef = useRef(-Infinity);
  const holdUntilRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const wheelTimerRef = useRef(0);
  const tiltRef = useRef({ x: 0, y: 0 });

  const n = swatches.length;
  const activeIdx = Math.max(
    0,
    swatches.findIndex((c) => c.code === activeSwatch.code),
  );

  const physicsRef = useRef({
    list: swatches,
    pos: activeIdx,
    target: activeIdx,
    velocity: 0,
    dragging: false,
    renderCenter: activeIdx,
  });
  const wakeRef = useRef<() => void>(() => {});
  const poseSlotRef = useRef<(slotIndex: number, el: HTMLDivElement) => void>(() => {});

  const [renderCenter, setRenderCenter] = useState(activeIdx);
  const [interacting, setInteracting] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const handlersRef = useRef({ onSelect, onPickedUpChange, pickedUp, swatches });
  useLayoutEffect(() => {
    handlersRef.current = { onSelect, onPickedUpChange, pickedUp, swatches };
  });

  useLayoutEffect(() => {
    const p = physicsRef.current;
    if (p.list !== swatches) {
      p.list = swatches;
      p.pos = activeIdx;
      p.target = activeIdx;
      p.velocity = 0;
      p.renderCenter = activeIdx;
      setRenderCenter(activeIdx);
      return;
    }
    if (p.dragging || !n) return;
    const currentWrapped = wrap(Math.round(p.target), n);
    if (currentWrapped !== activeIdx) {
      const delta = wrap(activeIdx - currentWrapped + Math.floor(n / 2), n) - Math.floor(n / 2);
      p.target = Math.round(p.target) + delta;
    }
    wakeRef.current();
  }, [swatches, activeIdx, n]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const resize = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => {
      document.removeEventListener('visibilitychange', update);
      window.clearTimeout(tapTimerRef.current);
      window.clearTimeout(wheelTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (paused || pickedUp || interacting || !visible || n < 2) return;
    const delay = Math.max(AUTO_TURN_MS, holdUntilRef.current - performance.now());
    const timer = window.setTimeout(() => {
      if (document.hidden || dragRef.current) return;
      const p = physicsRef.current;
      p.target = Math.round(p.target) + 1;
      wakeRef.current();
      const nextIdx = wrap(Math.round(p.target), n);
      handlersRef.current.onSelect(swatches[nextIdx]);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [paused, pickedUp, interacting, visible, n, activeIdx, swatches]);

  function clearTap() {
    window.clearTimeout(tapTimerRef.current);
    pendingTapRef.current = null;
  }

  useEffect(() => {
    clearTap();
    const el = stageRef.current;
    if (!el) return;
    tiltRef.current = { x: 0, y: 0 };
    el.style.removeProperty('--_tx');
    el.style.removeProperty('--_ty');
    el.style.removeProperty('--_ir');
    el.style.removeProperty('--_fx');
  }, [pickedUp, activeSwatch.code, swatches]);

  useEffect(() => {
    if (!pickedUp) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"],dialog[open]')) {
        handlersRef.current.onPickedUpChange(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pickedUp]);

  useEffect(() => {
    let rafId = 0;
    let running = false;
    let lastTime = performance.now();

    const poseSlot = (slotIndex: number, slotEl: HTMLDivElement) => {
      const p = physicsRef.current;
      const isPicked = handlersRef.current.pickedUp;
      const speedSpread = clamp(Math.abs(p.velocity) * 0.42, 0, 3.2);
      const spacing = BASE_ANGLE + speedSpread;
      const rel = slotIndex - p.pos;
      const absRel = Math.abs(rel);
      const liftY = isPicked ? 0 : Math.min(28, absRel * absRel * 1.45);
      const scale = isPicked ? 1 : 1 - Math.min(0.08, absRel * 0.014);
      slotEl.style.transform = `translate3d(0, ${liftY.toFixed(2)}px, 0) rotate(${(-rel * spacing).toFixed(3)}deg) scale(${scale.toFixed(4)})`;
      const nearest = Math.round(p.pos);
      slotEl.style.zIndex = String(isPicked && slotIndex === nearest ? 50 : 30 - Math.round(absRel * 3));
      const refl = clamp(-rel * 13 + p.velocity * 1.8, -36, 36);
      slotEl.style.setProperty('--_rf', `var(--_ir, ${refl.toFixed(1)}%)`);
    };
    poseSlotRef.current = poseSlot;

    const tick = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      const p = physicsRef.current;
      if (!handlersRef.current.swatches.length) {
        running = false;
        return;
      }

      let settled = false;
      if (!p.dragging) {
        const disp = p.target - p.pos;
        const accel = disp * 165 - p.velocity * 21;
        p.velocity += accel * dt;
        p.pos += p.velocity * dt;
        if (Math.abs(disp) < 0.0008 && Math.abs(p.velocity) < 0.004) {
          p.pos = p.target;
          p.velocity = 0;
          settled = true;
        }
      }

      const nearestSlot = Math.round(p.pos);
      if (nearestSlot !== p.renderCenter) {
        p.renderCenter = nearestSlot;
        setRenderCenter(nearestSlot);
      }
      for (const [slotIndex, slotEl] of slotRefs.current.entries()) poseSlot(slotIndex, slotEl);

      if (settled) {
        running = false;
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const wake = () => {
      if (running) return;
      running = true;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };
    wakeRef.current = wake;
    wake();
    return () => {
      running = false;
      window.cancelAnimationFrame(rafId);
      wakeRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    wakeRef.current();
  }, [pickedUp, box.w, box.h]);

  // 适配手机与微信小程序内嵌短视口：卡片高度自适应可用舞台空间
  const cardHeight = Math.min(box.h * 0.78, box.w * (box.w < box.h ? 0.8 : 0.52));
  const cardWidth = cardHeight * 0.46;
  const stepWidth = Math.max(52, Math.sin((BASE_ANGLE * Math.PI) / 180) * cardHeight * 1.85);

  const variables: Variables = {
    '--_ch': `${cardHeight}px`,
    '--_cw': `${cardWidth}px`,
    '--_ft': `${Math.max(4, (box.h - cardHeight) * 0.35)}px`,
    '--_pv': `${cardHeight * 2.38}px`,
  };

  function sampleByCode(code: string) {
    return handlersRef.current.swatches.find((s) => s.code === code);
  }

  function lift(code: string) {
    const color = sampleByCode(code);
    if (!color) return;
    clearTap();
    holdUntilRef.current = performance.now() + 5000;
    if (!handlersRef.current.pickedUp) handlersRef.current.onSelect(color);
    handlersRef.current.onPickedUpChange(!handlersRef.current.pickedUp);
    lastDoubleRef.current = performance.now();
  }

  function handleTap(code: string, x: number, y: number) {
    const last = pendingTapRef.current;
    const now = performance.now();
    if (last && now - last.when < 320 && Math.hypot(last.x - x, last.y - y) < 28) {
      lift(last.code);
      return;
    }
    clearTap();
    pendingTapRef.current = { x, y, when: now, code };
    tapTimerRef.current = window.setTimeout(() => {
      const hit = sampleByCode(code);
      if (hit && !handlersRef.current.pickedUp) {
        handlersRef.current.onSelect(hit);
      }
      pendingTapRef.current = null;
    }, 240);
  }

  function onDown(e: PointerEvent<HTMLDivElement>) {
    if (!e.isPrimary || e.button !== 0 || dragRef.current) return;
    const button = (e.target as Element).closest<HTMLButtonElement>('button[data-sc]');
    const p = physicsRef.current;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastTime: performance.now(),
      startPos: p.pos,
      moved: false,
      code: button?.dataset.sc,
      tiltX: tiltRef.current.x,
      tiltY: tiltRef.current.y,
    };
    holdUntilRef.current = performance.now() + 5200;
    setInteracting(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;

    const el = e.currentTarget;
    if (!drag.moved) {
      clearTap();
      drag.moved = true;
      el.dataset.dg = '1';
      if (!pickedUp) {
        physicsRef.current.dragging = true;
      }
    }

    if (pickedUp) {
      const x = clamp(drag.tiltX - (dy / Math.max(1, cardHeight)) * 62, -24, 24);
      const y = clamp(drag.tiltY + (dx / Math.max(1, cardWidth)) * 58, -44, 44);
      tiltRef.current = { x, y };
      el.style.setProperty('--_tx', `${x.toFixed(2)}deg`);
      el.style.setProperty('--_ty', `${y.toFixed(2)}deg`);
      el.style.setProperty(
        '--_ir',
        `${clamp(y * 0.72 - x * 0.35, -36, 36).toFixed(1)}%`,
      );
      return;
    }

    const now = performance.now();
    const dt = Math.max(0.004, (now - drag.lastTime) / 1000);
    const stepDx = e.clientX - drag.lastX;
    drag.lastX = e.clientX;
    drag.lastTime = now;

    // 保留 ada5918 同向拖动与松手惯性方向
    const p = physicsRef.current;
    const nextPos = drag.startPos + dx / stepWidth;
    const instantVel = stepDx / stepWidth / dt;
    p.velocity = p.velocity * 0.45 + clamp(instantVel, -24, 24) * 0.55;
    p.pos = nextPos;
    p.target = nextPos;
    wakeRef.current();

    el.style.setProperty('--_fx', `${clamp((-dy / Math.max(1, cardHeight)) * 22, -9, 9).toFixed(2)}deg`);
  }

  function onUp(e: PointerEvent<HTMLDivElement>, cancelled = false) {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    setInteracting(false);

    const el = e.currentTarget;
    delete el.dataset.dg;
    el.style.removeProperty('--_fx');
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);

    const p = physicsRef.current;
    p.dragging = false;
    wakeRef.current();

    if (cancelled) {
      clearTap();
      p.target = Math.round(p.pos);
      return;
    }

    if (drag.moved) {
      if (!pickedUp && n > 1) {
        const projected = p.pos + clamp(p.velocity * 0.16, -5, 5);
        const snapped = Math.round(projected);
        p.target = snapped;
        const targetIdx = wrap(snapped, n);
        if (targetIdx !== activeIdx) {
          onSelect(swatches[targetIdx]);
        }
      }
      return;
    }

    if (drag.code) {
      handleTap(drag.code, e.clientX, e.clientY);
    } else {
      const last = pendingTapRef.current;
      if (
        last &&
        performance.now() - last.when < 320 &&
        Math.hypot(last.x - e.clientX, last.y - e.clientY) < 28
      ) {
        lift(last.code);
      }
    }
  }

  function onWheel(e: WheelEvent<HTMLDivElement>) {
    if (pickedUp || n < 2) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 2) return;
    holdUntilRef.current = performance.now() + 4500;
    wheelAccumRef.current += delta;
    if (Math.abs(wheelAccumRef.current) >= 42) {
      const steps = Math.sign(wheelAccumRef.current);
      wheelAccumRef.current = 0;
      const p = physicsRef.current;
      p.target = Math.round(p.target) + steps;
      wakeRef.current();
      onSelect(swatches[wrap(Math.round(p.target), n)]);
    }
    window.clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = window.setTimeout(() => {
      wheelAccumRef.current = 0;
    }, 160);
  }

  const reach = n > 1 ? Math.min(VISIBLE_REACH, Math.max(3, Math.ceil(box.w / (stepWidth * 1.5)))) : 0;
  const cards = [];

  for (let offset = -reach; n && offset <= reach; offset++) {
    const slot = renderCenter + offset;
    const swatch = swatches[wrap(slot, n)];
    const isCurrent = offset === 0;
    const printedName = lang === 'zh' ? swatch.name : swatch.nameEn;
    const ink = letteringColor(swatch.hex);

    const style: Variables = {
      '--_it': ink,
      '--_ib': ink,
    };

    cards.push(
      <div
        key={slot}
        ref={(node) => {
          if (node) {
            if (!slotRefs.current.has(slot)) {
              slotRefs.current.set(slot, node);
              poseSlotRef.current(slot, node);
            }
          } else {
            slotRefs.current.delete(slot);
          }
        }}
        className="_hfs_s"
        data-c={isCurrent ? '1' : undefined}
        style={style}
      >
        <button
          type="button"
          className="_hfs_b"
          data-sc={swatch.code}
          aria-label={`${printedName} ${swatch.code}`}
          aria-pressed={isCurrent}
          tabIndex={isCurrent ? 0 : -1}
          onClick={(e) => {
            if (e.detail === 0) lift(swatch.code);
          }}
        >
          <span
            className="_hfs_f"
            data-k={
              swatch.code.endsWith('FP') || swatch.code === 'TPU-CF'
                ? 'c'
                : swatch.material.roughness >= 0.44
                  ? 'm'
                  : swatch.material.roughness >= 0.24
                    ? 's'
                    : 'g'
            }
            aria-hidden="true"
          >
            <SwatchFanMaterial swatch={swatch} lightingPreset={lightingPreset} />
            <span className="_hfs_m">HAMOREY</span>
            <span className="_hfs_n">{numbers.get(swatch.code)}</span>
            <span className="_hfs_t">
              <strong>{printedName}</strong>
              <small>{swatch.code}</small>
            </span>
          </span>
        </button>
      </div>,
    );
  }

  return (
    <div
      ref={stageRef}
      style={variables}
      className="_hfs"
      data-l={lightingPreset}
      data-p={pickedUp ? '1' : undefined}
      role="region"
      tabIndex={-1}
      aria-label={
        lang === 'zh'
          ? '流光色卡，左右滑动或方向键选色，双击拿起或放回'
          : 'Film samples. Drag or arrow keys to browse, double-tap to lift.'
      }
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={(e) => onUp(e)}
      onPointerCancel={(e) => onUp(e, true)}
      onLostPointerCapture={(e) => {
        if (e.target === e.currentTarget) onUp(e, true);
      }}
      onWheel={onWheel}
      onDoubleClick={(e) => {
        if (performance.now() - lastDoubleRef.current < 150) return;
        const hit = (e.target as Element).closest<HTMLButtonElement>('button[data-sc]');
        if (hit?.dataset.sc) lift(hit.dataset.sc);
      }}
      onKeyDown={(e) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const hit = (e.target as Element).closest<HTMLButtonElement>('button[data-sc]');
          if (!e.repeat) lift(hit?.dataset.sc ?? activeSwatch.code);
          return;
        }
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        holdUntilRef.current = performance.now() + 5200;
        if (!pickedUp && n) {
          const step = e.key === 'ArrowLeft' ? -1 : 1;
          const p = physicsRef.current;
          p.target = Math.round(p.target) + step;
          wakeRef.current();
          const next = swatches[wrap(Math.round(p.target), n)];
          onSelect(next);
        }
      }}
    >
      <div className="_hfs_bg" aria-hidden="true" />
      <div className="_hfs_w">{cards}</div>
    </div>
  );
}
