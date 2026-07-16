// ============================================================
// CodeInventoryTree — 交互式库存层级思维导图
// 水平树布局：HQ → 省代 → 门店，可点击 +/– 折叠展开
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';

// ─── Types ───
interface TreeNode {
  name: string;
  total: number;
  available: number;
  province?: string | null;
}
interface ProvinceNode extends TreeNode {
  id: string; province: string | null;
  stores: StoreNode[]; storeCount: number;
}
interface StoreNode extends TreeNode {
  id: string; parent_id: string; city: string | null;
}
interface TreeData {
  hq: TreeNode;
  provinces: ProvinceNode[];
}

// ─── Layout constants ───
const NODE_W = 170;
const NODE_H = 72;
const STORE_W = 148;
const STORE_H = 52;
const ROOT_X = 60;
const PROV_X = ROOT_X + NODE_W + 160;
const STORE_X = PROV_X + NODE_W + 140;
const V_GAP = 20;
const PROV_GAP = 36;
const LINE_COLOR = '#D4C5B5';
const HQ_COLOR = '#5C1A1A';
const PROV_COLOR = '#7A2E2E';
const STORE_COLOR = '#C8A96E';

// ─── Curved path ───
function pathD(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

// ─── Node rect sub-component ───
function NodeBlock({ cx, cy, w, h, fill, label, sub, collapsed, hasChildren, onToggle, color }: {
  cx: number; cy: number; w: number; h: number; fill: string;
  label: string; sub: string; collapsed?: boolean; hasChildren?: boolean;
  onToggle?: () => void; color?: string;
}) {
  const isStore = w < NODE_W;
  const fs = isStore ? 12 : 14;
  const subFs = isStore ? 10 : 12;
  const textColor = color || (isStore ? '#3A2A1A' : '#FFFFFF');
  const btnSize = 22;
  const btnX = cx + w / 2 - btnSize / 2 + 4;
  const btnY = cy + h - btnSize - 4;
  const maxChars = isStore ? 7 : 10;

  return (
    <g style={{ cursor: hasChildren ? 'pointer' : 'default' }} onClick={onToggle}>
      <rect x={cx - w / 2} y={cy} width={w} height={h} rx={8} fill={fill} filter="url(#shadow)" />
      <text x={cx} y={cy + h / 2 - subFs / 2} textAnchor="middle" fill={textColor}
        fontSize={fs} fontWeight={600} fontFamily="system-ui, sans-serif" className="select-none">
        {label.length > maxChars ? label.slice(0, maxChars) + '…' : label}
      </text>
      <text x={cx} y={cy + h / 2 + subFs / 2 + 2} textAnchor="middle" fill={textColor}
        fontSize={subFs} opacity={0.85} fontFamily="system-ui, sans-serif" className="select-none">
        {sub}
      </text>
      {hasChildren && (
        <g>
          <circle cx={btnX} cy={btnY} r={9} fill="#FFFFFF" stroke={fill} strokeWidth={1.5} />
          <text x={btnX} y={btnY + 1} textAnchor="middle" dominantBaseline="central"
            fill={fill} fontSize={14} fontWeight={700} fontFamily="system-ui, sans-serif"
            style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {collapsed ? '+' : '−'}
          </text>
        </g>
      )}
    </g>
  );
}

// ─── Layout engine ───
interface LayoutNode {
  id: string; name: string; total: number; available: number;
  cx: number; cy: number; w: number; h: number; fill: string;
  hasChildren: boolean; collapsed: boolean;
  children: LayoutNode[];
  isStore: boolean;
}
interface LayoutResult { nodes: LayoutNode[]; svgW: number; svgH: number; }

function useLayout(data: TreeData | null, collapsedIds: Set<string>): LayoutResult {
  return useMemo(() => {
    if (!data) return { nodes: [], svgW: 800, svgH: 600 };

    const nodes: LayoutNode[] = [];
    const visibleProvinces: LayoutNode[] = [];

    // Root (HQ) — fixed left-center
    const rootCY = 200; // will adjust later
    const root: LayoutNode = {
      id: 'hq', name: data.hq.name, total: data.hq.total, available: data.hq.available,
      cx: ROOT_X + NODE_W / 2, cy: rootCY, w: NODE_W, h: NODE_H, fill: HQ_COLOR,
      hasChildren: true, collapsed: false, children: [], isStore: false,
    };
    nodes.push(root);

    // Province level
    let provY = 100;
    for (const p of data.provinces) {
      const collapsed = collapsedIds.has(p.id);
      const provNode: LayoutNode = {
        id: p.id, name: p.province || p.name, total: p.total, available: p.available,
        cx: PROV_X + NODE_W / 2, cy: provY + NODE_H / 2, w: NODE_W, h: NODE_H, fill: PROV_COLOR,
        hasChildren: p.stores.length > 0, collapsed, children: [], isStore: false,
      };

      // Store level — only render if expanded
      if (!collapsed && p.stores.length > 0) {
        let storeY = provY;
        const storeStartY = storeY;
        for (const s of p.stores.slice(0, collapsed ? 0 : p.stores.length)) {
          const sn: LayoutNode = {
            id: s.id, name: s.name, total: s.total, available: s.available,
            cx: STORE_X + STORE_W / 2, cy: storeY + STORE_H / 2, w: STORE_W, h: STORE_H,
            fill: STORE_COLOR, hasChildren: false, collapsed: false,
            children: [], isStore: true,
          };
          provNode.children.push(sn);
          nodes.push(sn);
          storeY += STORE_H + V_GAP;
        }
        // Ensure province is centered among its stores
        provNode.cy = (storeStartY + storeY - V_GAP) / 2;
      }

      const nodeHeight = provNode.children.length > 0
        ? provNode.children.length * (STORE_H + V_GAP) - V_GAP
        : NODE_H;
      provY += nodeHeight + PROV_GAP;

      root.children.push(provNode);
      nodes.push(provNode);
      visibleProvinces.push(provNode);
    }

    // Center root vertically among provinces
    if (visibleProvinces.length > 0) {
      root.cy = (visibleProvinces[0].cy + visibleProvinces[visibleProvinces.length - 1].cy) / 2;
    }

    const svgW = STORE_X + STORE_W + 60;
    const svgH = Math.max(500, provY + 60);

    return { nodes, svgW, svgH };
  }, [data, collapsedIds]);
}

// ─── Main Component ───
export function CodeInventoryTree({ data }: { data: TreeData | null }) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    // Default: all provinces collapsed
    if (!data) return new Set();
    return new Set(data.provinces.map(p => p.id));
  });

  const toggle = useCallback((id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const layout = useLayout(data, collapsedIds);
  const { nodes, svgW, svgH } = layout;

  if (!data) return null;

  // Build a lookup for nodes
  const nodeMap = new Map<string, LayoutNode>();
  const roots: LayoutNode[] = [];
  for (const n of nodes) {
    nodeMap.set(n.id, n);
    if (n.id === 'hq') roots.push(n);
  }

  return (
    <div className="overflow-auto rounded-xl border border-[var(--paper-border)] bg-[var(--paper-raised)] p-4">
      <div className="flex items-center gap-2 mb-4 px-2">
        <span className="h-4 w-[3px] rounded-full bg-[var(--accent-gold)]" aria-hidden />
        <h3 className="font-display text-base font-semibold text-[var(--paper-text)]">库存层级总览</h3>
        <span className="text-xs text-[var(--paper-muted)]">总 / 可用  ·  点击 + / − 展开收起</span>
      </div>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: svgW, minWidth: '100%', height: svgH }}
        className="font-sans" shapeRendering="geometricPrecision">
        <defs>
          <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000020" />
          </filter>
        </defs>

        {/* Render HQ node + recursively render children */}
        {roots.map(root => (
          <TreeNodeGroup key={root.id} node={root} nodeMap={nodeMap} onToggle={toggle} />
        ))}
      </svg>
    </div>
  );
}

// ─── Recursive tree renderer ───
function TreeNodeGroup({ node, nodeMap, onToggle }: {
  node: LayoutNode; nodeMap: Map<string, LayoutNode>; onToggle: (id: string) => void;
}) {
  const { cx, cy, w, h, fill, name, total, available, hasChildren, collapsed, children, isStore } = node;
  const handleClick = hasChildren ? () => onToggle(node.id) : undefined;
  const sub = `总${total}/可${available}`;

  // Lines to children
  const childLines = (!collapsed && children.length > 0)
    ? children.map((ch, i) => (
        <path key={`${node.id}-${ch.id}`}
          d={pathD(cx + w / 2, cy, ch.cx - ch.w / 2, ch.cy)}
          stroke={LINE_COLOR} strokeWidth={1.6} fill="none" opacity={0.5} />
      ))
    : null;

  return (
    <g>
      {childLines}
      <NodeBlock cx={cx} cy={cy - h / 2} w={w} h={h} fill={fill}
        label={name} sub={sub} collapsed={collapsed} hasChildren={hasChildren}
        onToggle={handleClick} color={isStore ? '#3A2A1A' : undefined} />
      {!collapsed && children.map(ch => (
        <TreeNodeGroup key={ch.id} node={ch} nodeMap={nodeMap} onToggle={onToggle} />
      ))}
    </g>
  );
}
