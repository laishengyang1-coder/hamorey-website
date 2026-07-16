// ============================================================
// CodeInventoryTree — 质保码库存层级可视化（思维导图风格）
// ============================================================

import React, { useMemo } from 'react';

interface TreeNode {
  name: string;
  total: number;
  available: number;
  province?: string | null;
}

interface ProvinceNode extends TreeNode {
  id: string;
  province: string | null;
  stores: StoreNode[];
  storeCount: number;
}

interface StoreNode extends TreeNode {
  id: string;
  parent_id: string;
  city: string | null;
}

interface TreeData {
  hq: TreeNode;
  provinces: ProvinceNode[];
}

// ─── Layout constants ───
const PADDING = 100;
const NODE_W = 160;
const NODE_H = 68;
const HQ_Y = 20;
const PROV_Y = 200;
const STORE_Y = 420;
const LINE_COLOR = '#D4C5B5';
const HQ_COLOR = '#5C1A1A';
const PROV_COLOR = '#7A2E2E';
const STORE_COLOR = '#C8A96E';
const STORE_SMALL_W = 130;
const STORE_SMALL_H = 50;

function useLayout(data: TreeData | null) {
  return useMemo(() => {
    if (!data) return null;

    const { hq, provinces } = data;
    const w = Math.max(800, PADDING * 2 + provinces.length * 200);

    // HQ position
    const hqX = w / 2;
    const hqY = HQ_Y;

    // Province positions — evenly spaced
    const provSpacing = Math.min(200, (w - PADDING * 2) / Math.max(1, provinces.length));
    const provStartX = PADDING + (w - PADDING * 2 - provSpacing * (provinces.length - 1)) / 2;

    return { w, hqX, hqY, provSpacing, provStartX, provinces: provinces.map((p, i) => {
      const px = provStartX + i * provSpacing;
      // Stores under this province — cluster them
      const stores = p.stores.slice(0, 8); // max 8 shown directly
      const storeSpacing = Math.min(150, 700 / Math.max(1, stores.length));
      const storeStartX = px - (storeSpacing * (stores.length - 1)) / 2;
      const overflow = p.stores.length - stores.length;

      return { ...p, px, py: PROV_Y, stores: stores.map((s, si) => ({
        ...s, sx: storeStartX + si * storeSpacing, sy: STORE_Y,
      })), overflow, storeStartX, storeSpacing };
    }) };
  }, [data]);
}

// ─── Path helpers ───
function curvedLine(x1: number, y1: number, x2: number, y2: number): string {
  const cy = (y1 + y2) / 2;
  return `M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}`;
}

function NodeRect({
  x, y, w, h, fill, name, total, available,
}: {
  x: number; y: number; w: number; h: number; fill: string;
  name: string; total: number; available: number;
}) {
  const cx = x;
  const cy = y;
  const textColor = fill === STORE_COLOR ? '#3A2A1A' : '#FFFFFF';

  return (
    <g>
      <rect x={cx - w / 2} y={cy} width={w} height={h} rx={8} fill={fill} />
      <text x={cx} y={cy + 20} textAnchor="middle" fill={textColor} fontSize={13} fontWeight={600}
        fontFamily="system-ui, sans-serif" className="select-none">
        {name.length > 10 ? name.slice(0, 9) + '…' : name}
      </text>
      <text x={cx} y={cy + 42} textAnchor="middle" fill={textColor} fontSize={11} opacity={0.85}
        fontFamily="system-ui, sans-serif" className="select-none">
        总{total} / 可{available}
      </text>
    </g>
  );
}

function StoreNodeRect({
  x, y, name, total, available,
}: {
  x: number; y: number; name: string; total: number; available: number;
}) {
  const w = STORE_SMALL_W;
  const h = STORE_SMALL_H;
  const cx = x;
  const cy = y;

  return (
    <g>
      <rect x={cx - w / 2} y={cy} width={w} height={h} rx={6} fill={STORE_COLOR} />
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#3A2A1A" fontSize={11} fontWeight={500}
        fontFamily="system-ui, sans-serif" className="select-none">
        {name.length > 8 ? name.slice(0, 7) + '…' : name}
      </text>
      <text x={cx} y={cy + 34} textAnchor="middle" fill="#6B5A4A" fontSize={10}
        fontFamily="system-ui, sans-serif" className="select-none">
        总{total} / 可{available}
      </text>
    </g>
  );
}

export function CodeInventoryTree({ data }: { data: TreeData | null }) {
  const layout = useLayout(data);

  if (!layout || !data) return null;

  const { hq } = data;
  const { w, hqX, hqY, provinces } = layout;
  const h = STORE_Y + STORE_SMALL_H + 40;
  const svgW = Math.max(w, 800);

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--paper-border)] bg-[var(--paper-raised)] p-4 mt-4">
      <div className="flex items-center gap-2 mb-4 px-2">
        <span className="h-4 w-[3px] rounded-full bg-[var(--accent-gold)]" aria-hidden />
        <h3 className="font-display text-base font-semibold text-[var(--paper-text)]">库存层级总览</h3>
        <span className="text-xs text-[var(--paper-muted)] ml-1">总 / 可用</span>
      </div>
      <svg viewBox={`0 0 ${svgW} ${h}`} width={svgW} height={h}
        style={{ minWidth: '100%' }} className="font-sans">
        {/* HQ root */}
        <NodeRect x={hqX} y={hqY} w={NODE_W} h={NODE_H} fill={HQ_COLOR}
          name={hq.name} total={hq.total} available={hq.available} />

        {/* Lines HQ → Provinces */}
        {provinces.map((p, i) => (
          <path key={`hq-p-${i}`} d={curvedLine(hqX, hqY + NODE_H, p.px, p.py)}
            stroke={LINE_COLOR} strokeWidth={2} fill="none" />
        ))}

        {/* Province nodes + lines to stores */}
        {provinces.map((p, pi) => (
          <g key={`prov-${pi}`}>
            <NodeRect x={p.px} y={p.py} w={NODE_W} h={NODE_H} fill={PROV_COLOR}
              name={p.province || p.name} total={p.total} available={p.available} />

            {/* Lines Province → Stores */}
            {p.stores.map((s, si) => (
              <path key={`p-s-${pi}-${si}`}
                d={curvedLine(p.px, p.py + NODE_H, s.sx, s.sy)}
                stroke={LINE_COLOR} strokeWidth={1.2} fill="none" opacity={0.6} />
            ))}

            {/* Store nodes */}
            {p.stores.map((s, si) => (
              <StoreNodeRect key={`s-${pi}-${si}`}
                x={s.sx} y={s.sy} name={s.name} total={s.total} available={s.available} />
            ))}

            {/* Overflow marker */}
            {p.overflow > 0 && (
              <text x={p.px} y={STORE_Y + STORE_SMALL_H + 22}
                textAnchor="middle" fill="#9B8B7B" fontSize={11} fontFamily="system-ui, sans-serif">
                +{p.overflow} 家门店
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
