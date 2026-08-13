// ============================================================
// 和膜 HAMOREY — 公开质保查询页 /warranty/
// 单输入框智能识别 + 查询结果展示 + noindex
// 结果区参考 shark 质保卡设计：品牌头 + 产品卡 + 商品/车主/施工
// 信息分组 + 部位价值参考表 + 质保须知 + 除外情形 + 下载证书
// ============================================================

import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { detectInput, getInputPlaceholder } from '../lib/detect';
import { searchWarrantyByQuery } from '../lib/api';
import { WARRANTY_INPUT_TYPE_LABELS } from '../types/enums';
import { formatDate, warrantyStatusText } from '../lib/format';
import { siteConfig } from '../config/site';
import type { WarrantyCardData, WarrantyQueryResult } from '../types/api';

type QueryState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

function formatWarrantyPrice(cents?: number | null): string {
  return cents == null ? '-' : `¥${Math.round(cents / 100).toLocaleString('zh-CN')}`;
}

function fmtDate(s?: string | null): string {
  if (!s) return '-';
  return formatDate(s);
}

/** 信息分组卡片 */
function InfoSection({ title, rows }: { title: string; rows: Array<[string, ReactNode]> }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-brand">{title}</h4>
      <div className="mt-2 overflow-hidden rounded-lg border border-border-subtle bg-white">
        {rows.map(([k, v], i) => (
          <div
            key={k}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i > 0 ? 'border-t border-border-subtle' : ''}`}
          >
            <span className="w-24 shrink-0 text-content-muted">{k}</span>
            <span className="flex-1 truncate text-content-primary">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 常见部位价值参考表（两列） */
function PartPricesTable({ items }: { items: Array<{ name: string; priceCents: number }> }) {
  const colCount = 2;
  const rowCount = Math.max(1, Math.ceil(items.length / colCount));
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-white">
      <div className="grid grid-cols-2 divide-x divide-border-subtle">
        {Array.from({ length: colCount }).map((_, c) => (
          <div key={c} className="px-4 pb-1 pt-2.5">
            <div className="grid grid-cols-2 text-xs font-bold text-brand">
              <span>部位</span>
              <span className="text-right">价值</span>
            </div>
            <div className="mt-1 divide-y divide-border-subtle">
              {Array.from({ length: rowCount }).map((_, r) => {
                const item = items[r * colCount + c];
                if (!item) return <div key={r} className="py-1.5" />;
                return (
                  <div key={item.name} className="grid grid-cols-2 py-1.5 text-xs text-content-primary">
                    <span className="pr-2">{item.name}</span>
                    <span className="text-right text-content-secondary">
                      {formatWarrantyPrice(item.priceCents)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 单张质保证书卡（长图版式） */
function WarrantyCertificateCard({ record }: { record: WarrantyCardData }) {
  const status = warrantyStatusText(record.status, record.warranty_expiry_date);
  const partPrices = record.part_prices && record.part_prices.length > 0 ? record.part_prices : null;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border-subtle animate-fade-in-up">
      {/* 品牌头 */}
      <div className="bg-brand px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-bold tracking-wide text-white">和膜 HAMOREY</div>
            <div className="mt-1 text-xs text-[#E8D5C5]">汽车膜品质保障 · 电子质保证书</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.2em] text-[#C8A96E]">WARRANTY CERTIFICATE</div>
            <div className="mt-2">
              <Badge variant={record.status === 'active' ? 'success' : record.status === 'expired' ? 'error' : 'default'}>
                {status.text}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 产品卡 */}
      <div className="mx-4 mt-4 rounded-lg bg-graphite px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-lg font-bold text-brand">{record.product_name}</div>
            <div className="mt-0.5 text-sm text-content-secondary">{record.product_model}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] text-content-muted">质保编码</div>
            <div className="mt-0.5 text-sm font-bold text-brand">{record.certificate_no || '-'}</div>
          </div>
        </div>
      </div>

      {/* 信息分组 */}
      <div className="flex flex-col gap-5 px-4 pt-5">
        <InfoSection
          title="商品信息"
          rows={[
            ['车膜卷号', record.warranty_code || '-'],
            ['型号规格', `${record.product_name} ${record.product_model}`.trim()],
            ['装贴部位', '整车'],
            ['官方指导价', formatWarrantyPrice(record.warranty_price_cents)],
            [
              '质保期限',
              `${record.warranty_years} 年（${fmtDate(record.installation_date)} 至 ${fmtDate(record.warranty_expiry_date)}）`,
            ],
          ]}
        />
        <InfoSection
          title="车主信息"
          rows={[
            ['车主姓名', record.customer_name_snapshot || '-'],
            ['品牌车型', `${record.vehicle_brand_snapshot || '-'} ${record.vehicle_model_snapshot || ''}`.trim()],
            ['车牌号码', record.plate_no_snapshot || '临时车牌'],
            ['车架号码', record.vin_snapshot || '-'],
          ]}
        />
        <InfoSection
          title="施工信息"
          rows={[
            ['施工日期', fmtDate(record.installation_date)],
            ['质保录入单位', record.store_name || '-'],
          ]}
        />

        {/* 部位价值参考表 */}
        {partPrices && (
          <div>
            <div className="flex items-end justify-between gap-2">
              <h4 className="text-sm font-bold text-brand">常见部位价值参考</h4>
              <span className="text-[10px] text-content-muted">部位占比及价值仅供参考，以实际安装部位为准</span>
            </div>
            <div className="mt-2">
              <PartPricesTable items={partPrices} />
            </div>
          </div>
        )}

        {/* 质保须知 */}
        <div>
          <h4 className="text-sm font-bold text-brand">质保须知</h4>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-content-secondary">
            <li>1. 本质保仅对和膜品牌正品汽车膜产品有效，质保期内出现非人为质量问题可享免费维修或更换。</li>
            <li>2. 质保服务须通过和膜官方渠道或授权施工门店申请，请妥善保存本质保凭证。</li>
          </ul>
        </div>

        {/* 除外情形 */}
        <div>
          <h4 className="text-sm font-bold text-brand">质保范围除外情形</h4>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-content-secondary">
            <li>• 因交通事故、碰撞、划伤等外力导致的损坏；</li>
            <li>• 因非授权门店施工或施工技术不当导致的问题；</li>
            <li>• 因特殊漆面（哑光、电镀漆等）或使用环境异常导致的异常；</li>
            <li>• 因未按产品使用说明维护保养导致的损坏。</li>
          </ul>
        </div>
      </div>

      {/* 底部品牌条 */}
      <div className="mt-5 bg-brand px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#E8D5C5]">和膜品牌运营中心</div>
          {record.certificate_no && (
            <a
              href={`/api/public/certificates/${record.certificate_no}/download`}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white/95 px-4 py-2 text-sm font-medium text-brand transition-normal hover:bg-white"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              下载证书（长图）
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WarrantyPage() {
  useSEO('warranty');

  const location = useLocation();
  const [query, setQuery] = useState('');
  const [detectedType, setDetectedType] = useState('');
  const [state, setState] = useState<QueryState>('idle');
  const [result, setResult] = useState<WarrantyQueryResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 从首页跳转来的查询结果
  const navState = location.state as
    | { query?: string; type?: string; result?: WarrantyQueryResult }
    | null;

  // 如果有从首页传来的结果，直接展示
  useEffect(() => {
    if (navState?.result) {
      setResult(navState.result);
      setQuery(navState.query || '');
      setDetectedType(
        navState.type ? WARRANTY_INPUT_TYPE_LABELS[navState.type as keyof typeof WARRANTY_INPUT_TYPE_LABELS] : '',
      );
      setState('success');
    }
  }, [navState]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim().length >= 2) {
      const result = detectInput(value);
      setDetectedType(result.label);
    } else {
      setDetectedType('');
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;

      setState('loading');
      setErrorMsg('');

      try {
        const data = await searchWarrantyByQuery(query);
        if (data.vehicles.length === 0 && data.records.length === 0) {
          setState('empty');
        } else {
          setResult(data);
          setState('success');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '查询失败，请稍后重试';
        setErrorMsg(message);
        setState('error');
      }
    },
    [query],
  );

  return (
    <PageLayout
      hero
      subtitle="Warranty Search"
      title="电子质保查询"
      description="输入手机号、车牌号、VIN 或质保码，查询和膜电子质保证书。系统自动识别输入类型，按车辆展示已生效质保。"
    >
      {/* 查询表单 */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder={getInputPlaceholder()}
              label="质保查询"
              hint={detectedType ? `识别为：${detectedType}` : '支持手机号、车牌号、VIN（车架号）或质保码'}
              className="text-base"
              autoComplete="off"
              autoCapitalize="characters"
            />
            {detectedType && (
              <div className="absolute right-3 top-9">
                <Badge variant="brand">{detectedType}</Badge>
              </div>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            loading={state === 'loading'}
            disabled={!query.trim()}
            className="w-full sm:w-auto sm:self-start"
          >
            {state === 'loading' ? '查询中...' : '立即查询'}
          </Button>
        </div>
      </form>

      {/* 支持类型 */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-content-muted">
        <span>支持输入类型：</span>
        {Object.entries(WARRANTY_INPUT_TYPE_LABELS).map(([key, label]) => (
          <Badge key={key} variant="default">
            {label}
          </Badge>
        ))}
      </div>

      {/* 查询结果 */}
      <div className="mt-12">
        {state === 'idle' && (
          <div className="py-12 text-center">
            <p className="text-sm text-content-muted">请输入查询内容后点击"立即查询"</p>
          </div>
        )}

        {state === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Spinner size="lg" />
            <p className="text-sm text-content-secondary">正在查询质保信息...</p>
          </div>
        )}

        {state === 'error' && (
          <EmptyState
            title="查询失败"
            description={errorMsg}
            action={
              <Button onClick={() => setState('idle')} variant="outline">
                重新查询
              </Button>
            }
          />
        )}

        {state === 'empty' && (
          <EmptyState
            title="未找到质保记录"
            description={
              <>
                请核对输入内容是否正确。如需帮助，请联系施工门店或和膜总部：
                <br />
                电话：{siteConfig.contact.phone} | 邮箱：{siteConfig.contact.email}
              </>
            }
            action={
              <Button onClick={() => setState('idle')} variant="outline">
                重新查询
              </Button>
            }
          />
        )}

        {state === 'success' && result && (
          <div className="flex flex-col gap-10">
            {/* Mock 数据提示 */}
            {result.is_mock && (
              <div className="flex items-center gap-2 rounded border border-status-warning/30 bg-status-warning/10 p-3">
                <Badge variant="warning">提示</Badge>
                <p className="text-sm text-content-secondary">
                  当前为演示数据，真实质保数据将在质保后台上线后接入。
                </p>
              </div>
            )}

            {/* 查询摘要 */}
            <div className="flex items-center gap-2 text-sm text-content-secondary">
              <span className="font-medium text-content-primary">查询结果</span>
              <span className="text-content-muted">共 {result.records.length} 张质保证书</span>
            </div>

            {/* 按车辆分组渲染证书卡 */}
            {result.vehicles.length > 1
              ? result.vehicles.map((vehicle) => (
                  <div key={`${vehicle.plate_no}_${vehicle.vin || ''}`} className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-content-primary">
                        {vehicle.brand} {vehicle.model}
                      </span>
                      <span className="rounded bg-graphite px-2 py-0.5 text-xs font-medium text-content-secondary">
                        {vehicle.plate_no || '临时车牌'}
                      </span>
                    </div>
                    {result.records
                      .filter((r) => r.plate_no_snapshot === vehicle.plate_no)
                      .map((record) => (
                        <WarrantyCertificateCard key={record.id} record={record} />
                      ))}
                  </div>
                ))
              : result.records.map((record) => <WarrantyCertificateCard key={record.id} record={record} />)}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
