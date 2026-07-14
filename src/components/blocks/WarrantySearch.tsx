// ============================================================
// 和膜 HAMOREY — WarrantySearch 质保查询入口
// 单输入框智能识别
// ============================================================

import { useState, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../ui/Container';
import { SectionHeading } from '../ui/SectionHeading';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
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
        setError('请输入查询内容');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const result = detectInput(query);
        const data = await searchWarrantyByQuery(query);
        // 跳转到质保查询页并传递结果
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
    <section className="py-16 md:py-24 bg-graphite">
      <Container size="narrow">
        <SectionHeading
          subtitle="Warranty Search"
          title="一条信息，查询整车质保"
          description="系统将自动识别输入类型，并按车辆展示已生效质保。"
        />

        <form onSubmit={handleSubmit} className="mt-8 md:mt-10">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder={getInputPlaceholder()}
                label="质保查询"
                hint="支持手机号、车牌号、VIN（车架号）或质保码"
                error={error}
                className="text-base"
                autoComplete="off"
                autoCapitalize="characters"
              />
              {detectedType && !error && (
                <div className="absolute right-3 top-9">
                  <Badge variant="brand">{detectedType}</Badge>
                </div>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={!query.trim()}
              className="w-full sm:w-auto sm:self-start"
            >
              {loading ? '查询中...' : '立即查询'}
            </Button>
          </div>
        </form>

        {/* 提示 */}
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-content-muted">
          <span>支持输入类型：</span>
          {Object.values(WARRANTY_INPUT_TYPE_LABELS).map((label) => (
            <Badge key={label} variant="default">
              {label}
            </Badge>
          ))}
        </div>
      </Container>
    </section>
  );
}
