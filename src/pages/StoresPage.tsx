// ============================================================
// 和膜 HAMOREY — 授权门店页 /stores/
// 全量加载公开门店并支持省/市/授权等级/关键词组合即时筛选
// ============================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { fetchStores } from '../lib/api';
import { AUTH_LEVEL_LABELS } from '../config/stores';
import type { StoreQueryResult } from '../types/api';
import bannerImg from '../assets/hamorey/lifestyle-3.jpg';

export default function StoresPage() {
  useSEO('stores');

  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState('');
  const [allStores, setAllStores] = useState<StoreQueryResult['stores']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStores({ page: 1, pageSize: 500 });
      setAllStores(data.stores);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // 仅保留已公开且至少填写了地址或电话的有效门店
  const validStores = useMemo(
    () =>
      allStores.filter(
        (s) => s.is_public === 1 && Boolean((s.address && s.address.trim()) || (s.phone && s.phone.trim())),
      ),
    [allStores],
  );

  const provinces = useMemo(
    () => [...new Set(validStores.map((s) => s.province).filter(Boolean))].sort() as string[],
    [validStores],
  );

  const cities = useMemo(
    () =>
      [
        ...new Set(
          validStores
            .filter((s) => !province || s.province === province)
            .map((s) => s.city)
            .filter(Boolean),
        ),
      ].sort() as string[],
    [validStores, province],
  );

  const filteredStores = useMemo(() => {
    let result = validStores;
    if (province) result = result.filter((s) => s.province === province);
    if (city) result = result.filter((s) => s.city === city);
    if (level) result = result.filter((s) => s.auth_level === level);
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.public_name.toLowerCase().includes(kw) ||
          (s.address ?? '').toLowerCase().includes(kw) ||
          (s.city ?? '').toLowerCase().includes(kw),
      );
    }
    return result;
  }, [validStores, province, city, level, keyword]);

  const handleProvinceChange = useCallback((value: string) => {
    setProvince(value);
    setCity('');
  }, []);

  const hasActiveFilter = Boolean(province || city || level || keyword.trim());

  const resetFilters = useCallback(() => {
    setProvince('');
    setCity('');
    setLevel('');
    setKeyword('');
  }, []);

  return (
    <PageLayout
      hero
      image={bannerImg}
      imagePosition="center 80%"
      subtitle="Authorized Stores"
      title="授权门店"
      description="查找身边的和膜官方授权门店，享受标准化无尘施工与正品电子质保录入服务。"
    >
      {/* 筛选器 */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6">
        <Select
          placeholder="全部省份"
          value={province}
          onChange={(e) => handleProvinceChange(e.target.value)}
          options={provinces.map((p) => ({ value: p, label: p }))}
          wrapperClassName="md:w-44"
        />
        <Select
          placeholder="全部城市"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          options={cities.map((c) => ({ value: c, label: c }))}
          wrapperClassName="md:w-44"
        />
        <Select
          placeholder="全部授权等级"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          options={[
            { value: 'HEBC', label: '品牌灯塔店' },
            { value: 'HSS', label: '标准服务中心' },
            { value: 'Service_Point', label: '区域服务点' },
          ]}
          wrapperClassName="md:w-44"
        />
        <input
          type="text"
          placeholder="搜索门店名称、城市或地址"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 h-11 px-4 rounded bg-elevated text-sm text-content-primary placeholder:text-content-muted border border-border-default transition-fast focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      {/* 结果统计 */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <p className="text-sm text-content-muted">
          {province ? `${province}${city ? ` · ${city}` : ''} · ` : ''}共找到{' '}
          <span className="text-content-primary font-semibold">{filteredStores.length}</span> 家授权门店
        </p>
        <div className="flex items-center gap-3">
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-content-brand hover:underline"
            >
              清空筛选条件
            </button>
          )}
          {loading && <Badge variant="info">加载中...</Badge>}
        </div>
      </div>

      {/* 门店列表 */}
      {error ? (
        <EmptyState
          title="加载失败"
          description={error}
          action={
            <Button onClick={loadStores} variant="outline">
              重新加载
            </Button>
          }
        />
      ) : filteredStores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredStores.map((store, index) => {
            const products = (store.service_products ?? '').split(';').filter(Boolean);
            const region =
              store.province && store.city && store.province !== store.city
                ? `${store.province} · ${store.city}`
                : store.city || store.province || '';

            return (
              <ScrollReveal key={store.id} delay={(index % 6) * 40}>
                <Card hover padding="md" className="h-full flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-base font-semibold text-content-primary leading-snug">
                      {store.public_name}
                    </h3>
                    <Badge variant="brand">
                      {AUTH_LEVEL_LABELS[store.auth_level as keyof typeof AUTH_LEVEL_LABELS] || store.auth_level}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-content-secondary flex-1">
                    {region && (
                      <p className="flex items-center gap-2">
                        <span className="text-content-muted shrink-0">区域：</span>
                        <span>{region}</span>
                      </p>
                    )}
                    {store.address && (
                      <p className="flex items-start gap-2">
                        <span className="text-content-muted shrink-0">地址：</span>
                        <span className="leading-relaxed">{store.address}</span>
                      </p>
                    )}
                    {store.phone && (
                      <p className="flex items-center gap-2">
                        <span className="text-content-muted shrink-0">电话：</span>
                        <a href={`tel:${store.phone}`} className="hover:text-content-brand">
                          {store.phone}
                        </a>
                      </p>
                    )}
                    {store.business_hours && (
                      <p className="flex items-center gap-2">
                        <span className="text-content-muted shrink-0">营业：</span>
                        <span>{store.business_hours}</span>
                      </p>
                    )}
                    {products.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {products.map((product) => (
                          <Badge key={product} variant="default">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      ) : !loading ? (
        <EmptyState
          title="暂无匹配的门店"
          description="请尝试更换省份、城市或授权等级筛选条件。"
          action={
            hasActiveFilter ? (
              <Button onClick={resetFilters} variant="outline">
                查看全部门店
              </Button>
            ) : undefined
          }
        />
      ) : null}
    </PageLayout>
  );
}
