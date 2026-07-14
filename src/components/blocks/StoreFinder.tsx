// ============================================================
// 和膜 HAMOREY — StoreFinder 门店查询区块
// 用于首页和门店页，从 /api/stores 实时读取公开门店资料
// ============================================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { EmptyState } from '../ui/EmptyState';
import { ScrollReveal } from '../ScrollReveal';
import { fetchStores } from '../../lib/api';
import { AUTH_LEVEL_LABELS } from '../../config/stores';
import type { StorePublicProfile } from '../../types/models';

export function StoreFinder() {
  const [stores, setStores] = useState<StorePublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStores({ page: 1, pageSize: 200 })
      .then((res) => {
        if (!cancelled) {
          setStores(res.stores);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const provinces = useMemo(
    () => [...new Set(stores.map((s) => s.province).filter(Boolean))].sort() as string[],
    [stores],
  );

  const cities = useMemo(
    () =>
      [
        ...new Set(
          stores
            .filter((s) => !province || s.province === province)
            .map((s) => s.city)
            .filter(Boolean),
        ),
      ].sort() as string[],
    [stores, province],
  );

  const filteredStores = useMemo(() => {
    let result = stores.filter((s) => s.is_public === 1);
    if (province) result = result.filter((s) => s.province === province);
    if (city) result = result.filter((s) => s.city === city);
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.public_name.toLowerCase().includes(kw) ||
          (s.address ?? '').toLowerCase().includes(kw),
      );
    }
    return result;
  }, [stores, province, city, keyword]);

  const handleProvinceChange = useCallback((value: string) => {
    setProvince(value);
    setCity('');
  }, []);

  return (
    <section className="py-16 md:py-24 bg-carbon">
      <Container>
        <ScrollReveal>
          <SectionHeading
            subtitle="Authorized Stores"
            title="授权门店"
            description="查找和膜授权门店，获取正规施工与质保服务。"
          />
        </ScrollReveal>

        {/* 筛选器 */}
        <div className="mt-8 md:mt-10 flex flex-col md:flex-row gap-3 md:gap-4">
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
          <input
            type="text"
            placeholder="搜索门店名称或地址"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 h-11 px-4 rounded bg-elevated text-content-primary placeholder:text-content-muted border border-border-default transition-fast focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        {/* 状态 */}
        {loading && (
          <div className="mt-8 flex items-center justify-center">
            <Badge variant="info">加载中...</Badge>
          </div>
        )}
        {error && !loading && (
          <EmptyState
            title="加载失败"
            description={error}
            action={
              <Button onClick={() => window.location.reload()} variant="outline">
                重试
              </Button>
            }
            className="mt-8"
          />
        )}

        {/* 门店列表 */}
        {!loading && !error && (
          <>
            {filteredStores.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredStores.map((store, index) => (
                  <ScrollReveal key={store.id} delay={index * 100}>
                    <Card hover padding="md" className="h-full flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-base font-semibold text-content-primary pr-2">
                          {store.public_name}
                        </h3>
                        <Badge variant="brand">
                          {AUTH_LEVEL_LABELS[store.auth_level] || store.auth_level}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-2 text-sm text-content-secondary flex-1">
                        <p className="flex items-center gap-2">
                          <span className="text-content-muted">城市：</span>
                          {store.province} · {store.city}
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="text-content-muted shrink-0">地址：</span>
                          {store.address || '-'}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-content-muted">电话：</span>
                          {store.phone || '-'}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-content-muted">营业：</span>
                          {store.business_hours || '-'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(store.service_products ?? '')
                            .split(';')
                            .filter(Boolean)
                            .map((product) => (
                              <Badge key={product} variant="default">
                                {product}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <EmptyState
                title="暂无匹配的门店"
                description="请尝试更换筛选条件，或联系和膜总部获取更多信息。"
                className="mt-8"
              />
            )}
          </>
        )}

        {/* 查看全部门店 */}
        <div className="mt-8 text-center">
          <Link to="/stores">
            <Button variant="outline">查看全部门店</Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
