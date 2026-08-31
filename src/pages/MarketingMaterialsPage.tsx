// ============================================================
// 和膜 HAMOREY — 营销物料中心页 /marketing/
// 分类导航 + 搜索过滤 + 物料卡片网格（游客可看可下载）
// ============================================================

import { useState, useMemo, useCallback } from 'react';
import {
  Palette,
  Image,
  Film,
  Store,
  Video,
  Briefcase,
  GraduationCap,
  Award,
  Download,
  Search,
  FileText,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';
import {
  marketingCategories,
  marketingTotalCount,
  type MaterialItem,
  type MaterialCategory,
} from '../config/marketingMaterials';

/** 分类图标映射 */
const iconMap: Record<string, LucideIcon> = {
  Palette,
  Image,
  Film,
  Store,
  Video,
  Briefcase,
  GraduationCap,
  Award,
};

/** 文件格式对应的徽章样式 */
const formatBadgeVariant = (format: string) => {
  switch (format) {
    case 'png':
    case 'jpg':
    case 'svg':
    case 'webp':
      return 'info';
    case 'pdf':
      return 'error';
    case 'zip':
    case 'ai':
    case 'psd':
      return 'default';
    case 'mp4':
      return 'warning';
    default:
      return 'success';
  }
};

/** 格式化文件大小 */
function formatSize(size?: string): string {
  return size || '—';
}

function MaterialCard({ item, index }: { item: MaterialItem; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用时不处理
    }
  }, []);

  return (
    <ScrollReveal delay={index * 40}>
      <Card hover padding="md" className="h-full flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* 预览缩略图 */}
            {item.previewUrl ? (
              <div className="w-14 h-14 shrink-0 rounded-md overflow-hidden bg-graphite border border-border-subtle">
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 shrink-0 rounded-md bg-graphite border border-border-subtle flex items-center justify-center">
                <FileText className="h-6 w-6 text-content-muted" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-content-primary leading-snug truncate">
                {item.name}
              </h3>
              <p className="text-xs text-content-muted mt-0.5">
                {item.format.toUpperCase()} · {formatSize(item.size)}
              </p>
            </div>
          </div>
          <Badge variant={formatBadgeVariant(item.format) as 'default' | 'brand' | 'success' | 'warning' | 'error' | 'info'}>
            {item.format.toUpperCase()}
          </Badge>
        </div>

        {item.description && (
          <p className="text-sm text-content-secondary leading-relaxed mb-3 flex-1">
            {item.description}
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-content-muted bg-elevated rounded px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-border-subtle">
          <span className="text-xs text-content-muted">
            更新于 {item.updatedAt}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(item.name)}
              title="复制名称"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </Button>
            <Button size="sm" onClick={() => window.open(item.downloadUrl, '_blank')}>
              <Download className="h-4 w-4" />
              下载
            </Button>
          </div>
        </div>
      </Card>
    </ScrollReveal>
  );
}

export default function MarketingMaterialsPage() {
  useSEO('marketing');

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [keyword, setKeyword] = useState('');

  // 当前分类（'all' 表示全部）
  const currentCategories = useMemo(
    () => (activeCategory === 'all'
      ? marketingCategories
      : marketingCategories.filter((cat) => cat.id === activeCategory)),
    [activeCategory],
  );

  // 过滤后的物料
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const items = currentCategories.flatMap((cat) =>
      cat.materials.map((m) => ({ item: m, category: cat })),
    );
    if (!kw) return items;
    return items.filter(({ item }) =>
      item.name.toLowerCase().includes(kw) ||
      (item.description || '').toLowerCase().includes(kw) ||
      (item.tags || []).some((t) => t.toLowerCase().includes(kw)),
    );
  }, [currentCategories, keyword]);

  // 统计当前分类物料数
  const totalInView = filtered.length;

  return (
    <PageLayout
      hero
      subtitle="Marketing Center"
      title="营销物料中心"
      description="汇聚和膜品牌的营销物料：海报、产品资料、门店物料、视频、销售工具与培训资料，供渠道伙伴下载使用。"
    >
      {/* 分类统计 + 搜索 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 text-sm text-content-muted">
          <span className="text-xs font-medium uppercase tracking-wide text-content-brand">
            共 {marketingTotalCount} 项物料
          </span>
          {activeCategory !== 'all' && (
            <span>· 当前 {currentCategories[0]?.name}</span>
          )}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索物料名称、标签..."
            className="w-full h-11 pl-10 pr-4 rounded bg-elevated text-content-primary placeholder:text-content-muted border border-border-default transition-fast focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {/* 分类导航 */}
      <div className="flex flex-wrap gap-2 mb-10">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            'px-4 py-2 rounded text-sm font-medium transition-fast border',
            activeCategory === 'all'
              ? 'bg-brand text-white border-brand'
              : 'bg-elevated text-content-secondary border-border-default hover:border-brand hover:text-content-brand',
          )}
        >
          全部
          <span className={cn('ml-1.5 text-xs', activeCategory === 'all' ? 'text-white/70' : 'text-content-muted')}>
            {marketingTotalCount}
          </span>
        </button>
        {marketingCategories.map((cat) => {
          const Icon = iconMap[cat.icon] || FileText;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-fast border',
                isActive
                  ? 'bg-brand text-white border-brand'
                  : 'bg-elevated text-content-secondary border-border-default hover:border-brand hover:text-content-brand',
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-content-muted')} />
              {cat.name}
              <span className={cn('text-xs', isActive ? 'text-white/70' : 'text-content-muted')}>
                {cat.materials.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* 分类说明 */}
      {activeCategory !== 'all' && currentCategories[0] && (
        <div className="mb-10 rounded-lg bg-graphite/50 border border-border-subtle p-5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-content-brand">
              {currentCategories[0].nameEn}
            </span>
            <div className="h-4 w-px bg-border-default" />
            <p className="text-sm text-content-secondary">
              {currentCategories[0].description}
            </p>
          </div>
        </div>
      )}

      {/* 物料网格 */}
      {totalInView > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {filtered.map(({ item }, index) => (
            <MaterialCard key={item.id} item={item} index={index} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-10 w-10 text-content-muted mb-4" />
          <h3 className="text-lg font-medium text-content-primary mb-1">
            暂无匹配的物料
          </h3>
          <p className="text-sm text-content-secondary">
            请尝试更换关键词或分类，查看更多和膜营销物料。
          </p>
        </div>
      )}
    </PageLayout>
  );
}
