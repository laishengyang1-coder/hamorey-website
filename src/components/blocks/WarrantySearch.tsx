// ============================================================
// 和膜 HAMOREY — WarrantySearch 首页质保查询入口
// 横向一体式高对比搜索框 + 自动识别类型徽章
// ============================================================

import { useState, useCallback, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { detectInput, getInputPlaceholder } from '../../lib/detect';
import { searchWarrantyByQuery } from '../../lib/api';
import { WARRANTY_INPUT_TYPE_LABELS } from '../../types/enums';

export function WarrantySearch() {
  const [query, setQuery] = useState('');
  const [detectedType, setDetectedType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim().length >= 2) {
      const result = detectInput(value);
      setDetectedType(result.label);
    } else {
      setDetectedType('');
    }
    setError('');
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!query.trim()) {
        setError('请输入手机号、车牌号、车架号或质保码');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const result = detectInput(query);
        const data = await searchWarrantyByQuery(query);
        navigate('/warranty', {
          state: {
            query: result.value,
            type: result.type,
            result: data,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : '查询失败，请稍后重试';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [query, navigate],
  );

  return (
    <section className="py-20 md:py-28 bg-graphite">
      <Container size="narrow">
        <SectionHeading
          subtitle="E-Warranty Verification"
          title="一条信息，查询整车电子质保"
          description="自动识别手机号、车牌号、VIN 车架号或和膜质保卷号，实时核验正品保障与理赔参考价。"
        />

        <div className="mt-8 md:mt-10 rounded-xl bg-elevated border border-border-subtle p-5 md:p-7 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  placeholder={getInputPlaceholder()}
                  aria-label="电子质保查询"
                  autoComplete="off"
                  autoCapitalize="characters"
                  className="h-12 w-full rounded bg-carbon px-4 pr-24 text-base text-content-primary placeholder:text-content-muted border border-border-default transition-fast focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
                {detectedType && !error && (
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <Badge variant="brand">{detectedType}</Badge>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="h-12 px-8 shrink-0"
              >
                {loading ? '查询中...' : '立即查询'}
              </Button>
            </div>
            {error && <p className="mt-2 text-xs text-status-error">{error}</p>}
          </form>

          <div className="mt-4 pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs text-content-muted">
            <div className="flex flex-wrap items-center gap-1.5">
              <span>支持凭证：</span>
              {Object.values(WARRANTY_INPUT_TYPE_LABELS).map((label) => (
                <Badge key={label} variant="default">
                  {label}
                </Badge>
              ))}
            </div>
            <Link to="/warranty/terms" className="font-medium text-content-brand hover:underline">
              有限质保条款 →
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
