// ============================================================
// 和膜 HAMOREY — 公开质保查询页 /warranty/
// 单输入框智能识别 + 查询结果展示 + noindex
// ============================================================

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { detectInput, getInputPlaceholder } from '../lib/detect';
import { searchWarrantyByQuery } from '../lib/api';
import { WARRANTY_INPUT_TYPE_LABELS } from '../types/enums';
import { formatDate, warrantyStatusText } from '../lib/format';
import { siteConfig } from '../config/site';
import type { WarrantyQueryResult } from '../types/api';

type QueryState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

function formatWarrantyPrice(cents?: number | null): string {
  return cents == null ? '-' : `¥${Math.round(cents / 100).toLocaleString('zh-CN')}`;
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
          <div className="text-center py-12">
            <p className="text-sm text-content-muted">
              请输入查询内容后点击"立即查询"
            </p>
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
          <div className="flex flex-col gap-8">
            {/* Mock 数据提示 */}
            {result.is_mock && (
              <div className="p-3 rounded bg-status-warning/10 border border-status-warning/30 flex items-center gap-2">
                <Badge variant="warning">提示</Badge>
                <p className="text-sm text-content-secondary">
                  当前为演示数据，真实质保数据将在质保后台上线后接入。
                </p>
              </div>
            )}

            {/* 按车辆聚合展示质保卡 */}
            {result.vehicles.map((vehicle) => (
              <div key={vehicle.vehicle_id} className="flex flex-col gap-4">
                {/* 车辆信息 */}
                <Card padding="lg">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-content-primary">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-4 text-sm text-content-secondary">
                        <span>车牌：{vehicle.plate_no}</span>
                        {vehicle.vin && <span>VIN：{vehicle.vin}</span>}
                        {vehicle.model_year && <span>年款：{vehicle.model_year}</span>}
                      </div>
                    </div>
                    <Badge variant="brand">
                      {vehicle.record_count} 张质保
                    </Badge>
                  </div>
                </Card>

                {/* 质保卡列表 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.records
                    .map((record) => {
                      const status = warrantyStatusText(
                        record.status,
                        record.warranty_expiry_date,
                      );
                      return (
                        <Card key={record.id} hover padding="md">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-base font-semibold text-content-primary">
                                {record.product_name}
                              </h4>
                              <p className="text-sm text-content-brand mt-0.5">
                                {record.product_model}
                              </p>
                            </div>
                            <Badge
                              variant={
                                record.status === 'active'
                                  ? 'success'
                                  : record.status === 'expired'
                                    ? 'error'
                                    : 'default'
                              }
                            >
                              {status.text}
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-1.5 text-sm text-content-secondary">
                            <div className="flex justify-between">
                              <span className="text-content-muted">质保码：</span>
                              <span className="font-mono">{record.warranty_code}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-content-muted">施工日期：</span>
                              <span>{formatDate(record.installation_date)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-content-muted">到期日期：</span>
                              <span>{formatDate(record.warranty_expiry_date)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-content-muted">质保年限：</span>
                              <span>{record.warranty_years} 年</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-content-muted">质保价格：</span>
                              <span>{formatWarrantyPrice(record.warranty_price_cents)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-content-muted">施工门店：</span>
                              <span>{record.store_name}</span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
