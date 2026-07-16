// ============================================================
// ChinaStoreMapPage - 全国门店地理分布
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, MapPinned, Store } from 'lucide-react';
import * as echarts from 'echarts/core';
import { MapChart } from 'echarts/charts';
import { TooltipComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';

echarts.use([MapChart, TooltipComponent, VisualMapComponent, CanvasRenderer]);

interface StoreOrganization {
  id: string;
  name: string;
  province: string | null;
  city: string | null;
  status: string;
}

interface OrganizationListResult {
  items: StoreOrganization[];
  total: number;
  page: number;
  pageSize: number;
}

interface ProvinceGroup {
  mapName: string;
  displayName: string;
  stores: StoreOrganization[];
  cities: string[];
}

interface ChinaGeoJson {
  type: 'FeatureCollection';
  features: Array<{
    properties: { name?: string; [key: string]: unknown };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

const MAP_NAME = 'hamorey-china-store-map';

function normalizeProvinceName(province: string | null): string {
  if (!province) return '';
  return province.trim().replace(/(维吾尔自治区|壮族自治区|回族自治区|特别行政区|自治区|省|市)$/u, '');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getProvinceFill(storeCount: number): string {
  if (storeCount >= 10) return '#681E1E';
  if (storeCount >= 4) return '#A96752';
  if (storeCount >= 1) return '#D5B776';
  return '#D8D3CF';
}

async function fetchAllStores(): Promise<StoreOrganization[]> {
  const first = await apiRequest<OrganizationListResult>('/admin/organizations?type=STORE&page=1&pageSize=100');
  const pageCount = Math.ceil(first.total / first.pageSize);
  if (pageCount <= 1) return first.items;

  const remaining = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => (
      apiRequest<OrganizationListResult>(`/admin/organizations?type=STORE&page=${index + 2}&pageSize=100`)
    )),
  );
  return [first, ...remaining].flatMap((page) => page.items);
}

function ChinaMap({ groups }: { groups: ProvinceGroup[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    let disposed = false;
    let chart: echarts.ECharts | null = null;
    let observer: ResizeObserver | null = null;

    async function renderMap() {
      try {
        const response = await fetch('/maps/china.json');
        if (!response.ok) throw new Error('地图边界文件加载失败');
        const geoJson = await response.json() as ChinaGeoJson;
        if (disposed || !chartRef.current) return;

        const usableGeoJson = {
          ...geoJson,
          features: geoJson.features.filter((feature) => feature.properties.name),
        } as unknown as Parameters<typeof echarts.registerMap>[1];

        echarts.registerMap(MAP_NAME, usableGeoJson);
        chart = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

        const groupByName = new Map(groups.map((group) => [group.mapName, group]));
        const mapData = geoJson.features
          .map((feature) => feature.properties.name || '')
          .filter(Boolean)
          .map((name) => {
          const value = groupByName.get(normalizeProvinceName(name))?.stores.length || 0;
          return {
            name,
            value,
            label: { color: value >= 4 ? '#FFFFFF' : '#4D4540' },
            itemStyle: { areaColor: getProvinceFill(value) },
          };
        });
        chart.setOption({
          animationDuration: 450,
          animationEasing: 'cubicOut',
          tooltip: {
            trigger: 'item',
            enterable: true,
            confine: true,
            backgroundColor: '#FFFFFF',
            borderColor: '#D9CEC5',
            borderWidth: 1,
            padding: 0,
            extraCssText: 'border-radius:8px;box-shadow:0 14px 34px rgba(60,35,28,.16);',
            formatter: (params: { name: string }) => {
              const group = groupByName.get(normalizeProvinceName(params.name));
              if (!group || group.stores.length === 0) {
                return `<div style="padding:12px 14px;min-width:150px"><div style="font-weight:600;color:#2E2926">${escapeHtml(normalizeProvinceName(params.name))}</div><div style="margin-top:5px;font-size:12px;color:#8B817A">暂无门店</div></div>`;
              }

              const storeRows = group.stores
                .map((store) => `<div style="display:flex;gap:10px;justify-content:space-between;padding:7px 0;border-top:1px solid #EEE8E3"><span style="max-width:250px;color:#3F3834;white-space:normal">${escapeHtml(store.name)}</span><span style="flex:none;color:#8B817A">${escapeHtml(store.city || '城市待补充')}</span></div>`)
                .join('');

              return `<div style="min-width:270px;max-width:390px">
                <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#F7F2EE;border-radius:8px 8px 0 0">
                  <strong style="color:#5C1A1A">${escapeHtml(group.displayName)}</strong>
                  <span style="font-size:12px;color:#8B817A">${group.stores.length} 家门店</span>
                </div>
                <div style="max-height:260px;overflow:auto;padding:4px 14px 8px;font-size:12px">${storeRows}</div>
              </div>`;
            },
          },
          visualMap: {
            type: 'piecewise',
            orient: 'horizontal',
            left: 18,
            bottom: 12,
            itemWidth: 18,
            itemHeight: 10,
            itemGap: 14,
            textStyle: { color: '#786F69', fontSize: 11 },
            pieces: [
              { value: 0, label: '暂无门店', color: '#D8D3CF' },
              { min: 1, max: 3, label: '1-3 家', color: '#D5B776' },
              { min: 4, max: 9, label: '4-9 家', color: '#A96752' },
              { min: 10, max: 999999, label: '10 家以上', color: '#681E1E' },
            ],
          },
          series: [{
            name: '门店数量',
            type: 'map',
            map: MAP_NAME,
            roam: true,
            scaleLimit: { min: 0.9, max: 4 },
            zoom: 1.08,
            top: 18,
            bottom: 46,
            label: {
              show: true,
              color: '#4D4540',
              fontSize: 10,
              formatter: (params: { name: string }) => normalizeProvinceName(params.name),
            },
            itemStyle: {
              areaColor: '#D8D3CF',
              borderColor: '#FFFFFF',
              borderWidth: 1.1,
            },
            emphasis: {
              label: { show: true, color: '#FFFFFF', fontWeight: 600 },
              itemStyle: { areaColor: '#B8924A', borderColor: '#FFFFFF', borderWidth: 1.4 },
            },
            select: {
              label: { color: '#FFFFFF' },
              itemStyle: { areaColor: '#7A2828' },
            },
            data: mapData,
          }],
        });

        observer = new ResizeObserver(() => chart?.resize());
        observer.observe(chartRef.current);
      } catch (err) {
        if (!disposed) setMapError(err instanceof Error ? err.message : '地图加载失败');
      }
    }

    renderMap();
    return () => {
      disposed = true;
      observer?.disconnect();
      chart?.dispose();
    };
  }, [groups]);

  if (mapError) {
    return <div className="flex h-[560px] items-center justify-center text-sm text-red-600">{mapError}</div>;
  }

  return (
    <div
      ref={chartRef}
      className="h-[560px] min-h-[420px] w-full"
      role="img"
      aria-label="中国门店分布地图，有门店的省份以酒红色或金色显示，无门店的省份以灰色显示"
    />
  );
}

export default function ChinaStoreMapPage() {
  const [stores, setStores] = useState<StoreOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStores(await fetchAllStores());
    } catch (err) {
      setError(err instanceof Error ? err.message : '门店数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStores(); }, [loadStores]);

  const groups = useMemo<ProvinceGroup[]>(() => {
    const grouped = new Map<string, StoreOrganization[]>();
    stores.forEach((store) => {
      const mapName = normalizeProvinceName(store.province);
      if (!mapName) return;
      const current = grouped.get(mapName) || [];
      current.push(store);
      grouped.set(mapName, current);
    });

    return Array.from(grouped.entries())
      .map(([mapName, provinceStores]) => ({
        mapName,
        displayName: provinceStores[0]?.province || mapName,
        stores: [...provinceStores].sort((a, b) => (a.city || '').localeCompare(b.city || '', 'zh-CN') || a.name.localeCompare(b.name, 'zh-CN')),
        cities: Array.from(new Set(provinceStores.map((store) => store.city).filter((city): city is string => Boolean(city)))).sort((a, b) => a.localeCompare(b, 'zh-CN')),
      }))
      .sort((a, b) => b.stores.length - a.stores.length || a.displayName.localeCompare(b.displayName, 'zh-CN'));
  }, [stores]);

  const missingProvinceCount = stores.filter((store) => !store.province).length;
  const cityCount = new Set(stores.map((store) => store.city).filter(Boolean)).size;

  if (loading) {
    return (
      <div>
        <PageHeader title="全国门店地图" description="正在汇总全国门店分布" />
        <div className="admin-card h-[620px] animate-pulse bg-[var(--paper-surface)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="全国门店地图" description="查看各省门店覆盖情况" />
        <div className="admin-card flex min-h-[360px] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={loadStores} className="rounded-lg bg-[#5C1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#7A2828]">重新加载</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="全国门店地图"
        description="查看各省门店覆盖情况，鼠标悬浮可查看门店明细"
        breadcrumb={[{ label: '数据看板', href: '/admin/dashboard' }, { label: '全国门店地图' }]}
        actions={(
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--paper-border-strong)] bg-white px-4 py-2 text-sm font-medium text-[var(--paper-text)] transition-colors hover:border-[#5C1A1A] hover:text-[#5C1A1A]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            返回看板
          </Link>
        )}
      />

      <div className="mb-4 grid grid-cols-1 overflow-hidden rounded-lg border border-[var(--paper-border)] bg-white sm:grid-cols-3 sm:divide-x sm:divide-[var(--paper-border)]">
        <SummaryMetric icon={<Store />} label="门店总数" value={stores.length} suffix="家" />
        <SummaryMetric icon={<MapPinned />} label="已覆盖省份" value={groups.length} suffix="个" />
        <SummaryMetric icon={<Building2 />} label="已覆盖城市" value={cityCount} suffix="个" />
      </div>

      {missingProvinceCount > 0 && (
        <div className="mb-4 rounded-lg border border-[#D8BF84] bg-[#FBF6EA] px-4 py-2.5 text-sm text-[#6F5825]">
          有 {missingProvinceCount} 家门店尚未填写省份，暂时无法显示在地图中。
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="admin-card min-w-0 overflow-hidden p-3">
          <ChinaMap groups={groups} />
        </section>

        <aside className="admin-card flex min-h-[586px] flex-col p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-4 w-[3px] rounded-full bg-[var(--accent-gold)]" aria-hidden />
            <div>
              <h2 className="font-display text-sm font-semibold text-[var(--paper-text)]">省份门店分布</h2>
              <p className="mt-0.5 text-[10px] text-[var(--paper-muted)]">按门店数量从高到低排列</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {groups.map((group, index) => (
              <div key={group.mapName} className="rounded-lg px-3 py-2 hover:bg-[var(--burgundy-tint)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F0E7DD] text-[10px] font-semibold text-[#5C1A1A]">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--paper-text)]">{group.displayName}</span>
                  <span className="metric-value text-xs font-semibold text-[#5C1A1A]">{group.stores.length} 家</span>
                </div>
                <p className="ml-7 mt-1 truncate text-[10px] text-[var(--paper-muted)]">
                  {group.cities.length > 0 ? group.cities.join('、') : '城市信息待补充'}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryMetric({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number; suffix: string }) {
  return (
    <div className="flex min-h-[82px] items-center gap-3 px-5 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3EBE5] text-[#5C1A1A] [&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:stroke-[1.7]">
        {icon}
      </span>
      <div>
        <p className="text-[11px] text-[var(--paper-muted)]">{label}</p>
        <p className="mt-0.5 text-xl font-semibold leading-none text-[var(--paper-text)]">
          {value.toLocaleString()} <span className="text-xs font-normal text-[var(--paper-muted)]">{suffix}</span>
        </p>
      </div>
    </div>
  );
}
