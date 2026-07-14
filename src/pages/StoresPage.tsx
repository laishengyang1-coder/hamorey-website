// ============================================================
// 和膜 HAMOREY — 授权门店页 /stores/
// ============================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { fetchStores } from '../lib/api';
import { AUTH_LEVEL_LABELS, getStoreProducts } from '../config/stores';
import type { StoreQueryResult } from '../types/api';

export default function StoresPage() {
  useSEO('stores');

  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState('');
  const [stores, setStores] = useState<StoreQueryResult['stores']>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取门店数据
  const loadStores = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStores({
        province: province || undefined,
        city: city || undefined,
        keyword: keyword || undefined,
        level: (level as 'HEBC' | 'HSS' | 'Service_Point') || undefined,
        page: 1,
        pageSize: 50,
      });
      setStores(data.stores);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [province, city, keyword, level]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // 提取省份列表
  const provinces = useMemo(() => {
    return [...new Set(stores.map((s) => s.province).filter(Boolean))] as string[];
  }, [stores]);

  const cities = useMemo(() => {
    return [...new Set(
      stores
        .filter((s) => !province || s.province === province)
        .map((s) => s.city)
        .filter(Boolean),
    )] as string[];
  }, [stores, province]);

  const handleProvinceChange = useCallback((value: string) => {
    setProvince(value);
    setCity('');
  }, []);

  return (
    <PageLayout
      hero
      subtitle="Authorized Stores"
      title="授权门店"
      description="查找和膜授权门店，获取正规施工与质保服务。仅展示状态正常的授权门店。"
    >
      {/* 筛选器 */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8">
        <Select
          placeholder="选择省份"
          value={province}
          onChange={(e) => handleProvinceChange(e.target.value)}
          options={provinces.map((p) => ({ value: p, label: p }))}
          wrapperClassName="md:w-40"
        />
        <Select
          placeholder="选择城市"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          options={cities.map((c) => ({ value: c, label: c }))}
          wrapperClassName="md:w-40"
        />
        <Select
          placeholder="授权等级"
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
          placeholder="搜索门店名称或地址"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 h-11 px-4 rounded bg-elevated text-content-primary placeholder:text-content-muted border border-border-default transition-fast focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      {/* 结果统计 */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-content-muted">
          共找到 <span className="text-content-primary font-medium">{total}</span> 家授权门店
        </p>
        {loading && <Badge variant="info">加载中...</Badge>}
      </div>

      {/* 门店列表 */}
      {error ? (
        <EmptyState
          title="加载失败"
          description={error}
          action={<Button onClick={loadStores} variant="outline">重新加载</Button>}
        />
      ) : stores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {stores.map((store, index) => (
            <ScrollReveal key={store.id} delay={index * 50}>
              <Card hover padding="md" className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-content-primary pr-2">
                    {store.public_name}
                  </h3>
                  <Badge variant="brand">
                    {AUTH_LEVEL_LABELS[store.auth_level as keyof typeof AUTH_LEVEL_LABELS] || store.auth_level}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2 text-sm text-content-secondary flex-1">
                  <p>
                    <span className="text-content-muted">城市：</span>
                    {store.province} · {store.city}
                  </p>
                  <p>
                    <span className="text-content-muted">地址：</span>
                    {store.address}
                  </p>
                  <p>
                    <span className="text-content-muted">电话：</span>
                    {store.phone}
                  </p>
                  <p>
                    <span className="text-content-muted">营业：</span>
                    {store.business_hours}
                  </p>
                  {store.service_products && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {store.service_products.split(';').filter(Boolean).map((product) => (
                        <Badge key={product} variant="default">{product}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <EmptyState
          title="暂无匹配的门店"
          description="请尝试更换筛选条件，或联系和膜总部获取更多信息。"
        />
      )}
    </PageLayout>
  );
}
