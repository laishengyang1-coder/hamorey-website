import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { COLOR_STUDIO_SWATCHES, type ColorFilmItem, type StudioLightingPreset } from '../../config/colorStudio';
import { fanFinishes } from './fanFinishes';
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

type Variables = CSSProperties & Record<`--${string}`, string | number>;
type Touch = {
  pointer: number; x: number; y: number; code?: string;
  moved: boolean; tiltX: number; tiltY: number;
};
type PendingTap = { x: number; y: number; when: number; code: string };
const wrap = (n: number, length: number) => ((n % length) + length) % length;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const numbers = new Map(COLOR_STUDIO_SWATCHES.map((s, i) => [s.code, String(i + 1).padStart(2, '0')]));
const angle = 15;
const turnInterval = 3200;
const turnDuration = 1730;
const neighboringDelay = 50;

function lettering(first: string, last: string, mix = 0) {
  const rgb = (hex: string) => [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const b = rgb(last);
  const [r, g, blue] = rgb(first).map((c, i) => {
    const channel = c + (b[i] - c) * mix;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * blue > .21 ? '#141518' : '#fffaf1';
}

export function SwatchFan({
  swatches, activeSwatch, lightingPreset, lang, pickedUp, paused, onSelect, onPickedUpChange,
}: SwatchFanProps) {
  const stage = useRef<HTMLDivElement>(null);
  const pointer = useRef<Touch | null>(null);
  const pending = useRef<PendingTap | null>(null);
  const tapTimer = useRef(0);
  const lastDouble = useRef(-Infinity);
  const holdUntil = useRef(0);
  const firstTurn = useRef(true);
  const settleTimer = useRef(0);
  const dragFrame = useRef(0);
  const tilt = useRef({ x: 0, y: 0 });
  const [interacting, setInteracting] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const active = Math.max(0, swatches.findIndex(color => color.code === activeSwatch.code));
  // Absolute card positions keep each physical card moving in the same direction at the loop seam.
  const anchor = useRef({ list: swatches, slot: active, direction: 1, adjacent: true });
  const n = swatches.length;
  const previous = anchor.current;
  let center = active;
  if (previous.list === swatches && n) {
    const delta = wrap(active - previous.slot + Math.floor(n / 2), n) - Math.floor(n / 2);
    center = previous.slot + delta;
  }
  const displacement = center - previous.slot;
  const direction = Math.sign(displacement) || previous.direction;
  const adjacent = swatches === previous.list &&
    (displacement === 0 ? previous.adjacent : Math.abs(displacement) === 1);
  useLayoutEffect(() => {
    anchor.current = { list: swatches, slot: center, direction, adjacent };
  }, [swatches, center, direction, adjacent]);
  const handlers = useRef({ onSelect, onPickedUpChange, pickedUp, swatches });
  useLayoutEffect(() => { handlers.current = { onSelect, onPickedUpChange, pickedUp, swatches }; });
  useLayoutEffect(() => {
    const el = stage.current;
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
      window.clearTimeout(tapTimer.current);
      window.clearTimeout(settleTimer.current);
      window.cancelAnimationFrame(dragFrame.current);
    };
  }, []);
  useEffect(() => {
    if (paused || pickedUp || interacting || !visible || n < 2) return;
    const timer = window.setTimeout(() => {
      if (document.hidden || pointer.current) return;
      firstTurn.current = false;
      handlers.current.onSelect(swatches[wrap(active + 1, n)]);
    }, Math.max(firstTurn.current ? 1200 : turnInterval, holdUntil.current - performance.now()));
    return () => window.clearTimeout(timer);
  }, [paused, pickedUp, interacting, visible, n, active, swatches]);

  function clearTap() {
    window.clearTimeout(tapTimer.current);
    pending.current = null;
  }
  useEffect(() => {
    clearTap();
    if (!stage.current) return;
    tilt.current = { x: 0, y: 0 };
    stage.current.style.removeProperty('--tilt-x');
    stage.current.style.removeProperty('--tilt-y');
    stage.current.style.removeProperty('--inspection-reflection');
    stage.current.style.removeProperty('--flex');
  }, [pickedUp, activeSwatch.code, swatches]);
  useEffect(() => {
    if (!pickedUp) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"],dialog[open]')) {
        handlers.current.onPickedUpChange(false);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [pickedUp]);

  const cardHeight = Math.min(box.h * .77, box.w * (box.w < box.h ? .83 : .54));
  const cardWidth = cardHeight * .46;
  const stepWidth = Math.max(50, Math.sin(angle * Math.PI / 180) * cardHeight * 1.94);
  const variables: Variables = {
    '--card-h': `${cardHeight}px`, '--card-w': `${cardWidth}px`,
    '--fan-top': `${Math.max(0, (box.h - cardHeight) * .37)}px`,
    '--pivot': `${cardHeight * 2.35}px`, '--ridge': `${cardHeight * 1.86}px`,
    '--turn-time': `${adjacent ? turnDuration : 480}ms`,
    '--turn-ease': adjacent ? 'cubic-bezier(.81,0,.22,.99)' : 'cubic-bezier(.2,.74,.24,1)',
  };

  function sample(code: string) {
    return handlers.current.swatches.find(s => s.code === code);
  }
  function lift(code: string) {
    const color = sample(code);
    if (!color) return;
    clearTap();
    holdUntil.current = performance.now() + 5000;
    if (!handlers.current.pickedUp) handlers.current.onSelect(color);
    handlers.current.onPickedUpChange(!handlers.current.pickedUp);
    lastDouble.current = performance.now();
  }
  function tap(code: string, x: number, y: number) {
    const last = pending.current, now = performance.now();
    if (last && now - last.when < 375 && Math.hypot(last.x - x, last.y - y) < 28) {
      lift(last.code);
      return;
    }
    clearTap();
    pending.current = { x, y, when: now, code };
    // Keep the side card under the finger until a possible second tap arrives.
    tapTimer.current = window.setTimeout(() => {
      const hit = sample(code);
      if (hit && !handlers.current.pickedUp) handlers.current.onSelect(hit);
      pending.current = null;
    }, 375);
  }
  function onDown(e: PointerEvent<HTMLDivElement>) {
    if (!e.isPrimary || e.button !== 0 || pointer.current) return;
    const button = (e.target as Element).closest<HTMLButtonElement>('button[data-fan-code]');
    pointer.current = {
      pointer: e.pointerId, x: e.clientX, y: e.clientY, code: button?.dataset.fanCode,
      moved: false, tiltX: tilt.current.x, tiltY: tilt.current.y,
    };
    holdUntil.current = performance.now() + 5200;
    setInteracting(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onMove(e: PointerEvent<HTMLDivElement>) {
    const touch = pointer.current;
    if (!touch || e.pointerId !== touch.pointer) return;
    const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    if (!touch.moved && Math.hypot(dx, dy) < 7) return;
    const el = e.currentTarget;
    if (!touch.moved) {
      clearTap();
      if (!pickedUp) {
        // If the user catches a moving fan, grab the current pose, not its destination.
        const slots = [...el.querySelectorAll<HTMLElement>('.swatch-fan__slot')];
        const angles = slots.map(slot => {
          const matrix = new DOMMatrixReadOnly(getComputedStyle(slot).transform);
          return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
        });
        slots.forEach((slot, i) => slot.style.setProperty('--grip-angle', angles[i] + 'deg'));
      }
      touch.moved = true;
      el.dataset.dragging = 'true';
    }
    // Coalesce pointer samples at display refresh rate. Each update moves cached layers.
    window.cancelAnimationFrame(dragFrame.current);
    dragFrame.current = window.requestAnimationFrame(() => {
      if (pointer.current !== touch) return;
      if (pickedUp) {
        const x = clamp(touch.tiltX - dy / Math.max(1,cardHeight) * 67, -26, 26);
        const y = clamp(touch.tiltY + dx / Math.max(1,cardWidth) * 64, -47, 47);
        tilt.current = { x, y };
        el.style.setProperty('--tilt-x', x + 'deg');
        el.style.setProperty('--tilt-y', y + 'deg');
        el.style.setProperty('--inspection-reflection', clamp(y * .65 - x * .35, -35, 35) + '%');
      } else {
        el.style.setProperty('--drag-angle', clamp(dx / stepWidth, -2, 2) * angle + 'deg');
        el.style.setProperty('--flex', clamp(-dy / Math.max(1,cardHeight) * 29, -10, 10) + 'deg');
      }
    });
  }
  function onUp(e: PointerEvent<HTMLDivElement>, cancelled = false) {
    const touch = pointer.current;
    if (!touch || e.pointerId !== touch.pointer) return;
    pointer.current = null;
    setInteracting(false);
    const el = e.currentTarget;
    window.cancelAnimationFrame(dragFrame.current);
    if (touch.moved && !pickedUp) {
      el.dataset.settling = 'true';
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => { delete el.dataset.settling; }, 400);
      el.querySelectorAll<HTMLElement>('.swatch-fan__slot').forEach(slot => slot.style.removeProperty('--grip-angle'));
    }
    delete el.dataset.dragging;
    el.style.removeProperty('--drag-angle');
    el.style.removeProperty('--flex');
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    if (cancelled) { clearTap(); return; }
    const distance = (e.clientX - touch.x) / stepWidth;
    if (touch.moved) {
      if (!pickedUp && n > 1 && Math.abs(distance) > .16) {
        const steps = Math.sign(distance) * clamp(Math.round(Math.abs(distance)), 1, 2);
        onSelect(swatches[wrap(active + steps, n)]);
      }
    } else if (touch.code) {
      tap(touch.code, e.clientX, e.clientY);
    } else {
      // A still-rotating card can move out from under the second tap.
      const last = pending.current;
      if (last && performance.now() - last.when < 375 && Math.hypot(last.x - e.clientX, last.y - e.clientY) < 28) lift(last.code);
    }
  }

  // Mirror the physical fan in both directions, including when browsing just one finish family.
  const reach = n > 1 ? Math.min(6, Math.max(3, Math.ceil(box.w / (stepWidth * 1.4)) + 1)) : 0;
  const cards = [];
  for (let offset = -reach; n && offset <= reach; offset++) {
    const slot = center + offset, swatch = swatches[wrap(slot, n)];
    const isCurrent = offset === 0, isLifted = pickedUp && isCurrent;
    const stops = fanFinishes[swatch.code]?.stops;
    const deepBlack = swatch.code === 'TPU-002S' || swatch.code === 'TPU-035S';
    const base = swatch.hex;
    const top = deepBlack ? base : stops?.[0] ?? base;
    const bottom = deepBlack ? base : stops?.[3] ?? base;
    const printedName = lang === 'zh' ? swatch.name : swatch.nameEn;
    // The leading card departs first. A 50 ms lag per neighbour opens the fan at
    // peak speed and closes it as the followers settle on the same 15° spacing.
    const delay = adjacent ? (3 + clamp(offset * direction, -3, 3)) * neighboringDelay : 0;
    const style: Variables = {
      '--turn-delay': `${delay}ms`,
      '--fan-reflection': `var(--inspection-reflection, ${clamp(-offset * 11, -32, 32)}%)`,
      '--slot-angle': `${-offset * angle}deg`,
      '--ink-top': lettering(base, top, .43), '--ink-bottom': lettering(base, bottom, .63),
      zIndex: isLifted ? 50 : 20 - offset,
    };
    cards.push(
      <div key={swatch.code + '/' + Math.floor(slot/n)} className="swatch-fan__slot" data-center={isCurrent} style={style}>
        <button type="button" className="swatch-fan__card" data-fan-code={swatch.code}
          aria-label={`${printedName} ${swatch.code}`} aria-pressed={isCurrent} tabIndex={isCurrent ? 0 : -1}
          onClick={e => { if (e.detail === 0) lift(swatch.code); }}>
          <span className="swatch-fan__surface" aria-hidden="true">
            <SwatchFanMaterial swatch={swatch} lightingPreset={lightingPreset} />
            <span className="swatch-fan__arc" />
            <span className="swatch-fan__brand">HAMOREY</span>
            <span className="swatch-fan__number">{numbers.get(swatch.code)}</span>
            <span className="swatch-fan__caption"><strong>{printedName}</strong><small>{swatch.code}</small></span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div ref={stage} style={variables} className="swatch-fan" data-swatch-fan=""
      data-lighting={lightingPreset} data-picked-up={pickedUp}
      role="region" tabIndex={-1} aria-label={lang === 'zh' ? '流光色卡，左右键选色，回车拿起或放回' : 'Film samples. Arrow keys browse, Enter lifts or returns a sample.'}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={e => onUp(e)}
      onPointerCancel={e => onUp(e,true)} onLostPointerCapture={e => { if (e.target === e.currentTarget) onUp(e, true); }}
      onDoubleClick={e => {
        if (performance.now() - lastDouble.current < 150) return;
        const hit = (e.target as Element).closest<HTMLButtonElement>('button[data-fan-code]');
        if (hit?.dataset.fanCode) lift(hit.dataset.fanCode);
      }}
      onKeyDown={e => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const hit = (e.target as Element).closest<HTMLButtonElement>('button[data-fan-code]');
          if (!e.repeat) lift(hit?.dataset.fanCode ?? activeSwatch.code);
          return;
        }
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        holdUntil.current = performance.now() + 5200;
        if (!pickedUp && n) {
          const next = swatches[wrap(active + (e.key === 'ArrowLeft' ? -1 : 1), n)];
          onSelect(next);
          window.requestAnimationFrame(() => stage.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus({ preventScroll:true }));
        }
      }}>
      <div className="swatch-fan__room" aria-hidden="true" />
      <div className="swatch-fan__cards">{cards}</div>
    </div>
  );
}
