// ============================================================
// 和膜 HAMOREY — ProductCard 产品卡片
// ============================================================

import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import type { ProductCategoryConfig } from '../../config/products';

export interface ProductCardProps {
  category: ProductCategoryConfig;
  /** 尺寸 */
  size?: 'default' | 'large';
}

export function ProductCard({ category, size = 'default' }: ProductCardProps) {
  return (
    <Card
      hover
      padding="none"
      className={`group overflow-hidden ${size === 'large' ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <Link to={category.path} className="block">
        {/* 图片区 */}
        <div className={`relative overflow-hidden ${size === 'large' ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
          <img
            src={category.image}
            alt={category.nameCn}
            className="w-full h-full object-cover transition-slow group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3D0A0A]/80 via-[#3D0A0A]/20 to-transparent" />
          {/* 文字覆盖 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
            <p className="text-xs font-medium text-content-brand tracking-wider uppercase mb-1">
              {category.nameEn}
            </p>
            <h3 className={`font-bold text-content-primary ${size === 'large' ? 'text-xl md:text-2xl' : 'text-lg'}`}>
              {category.nameCn}
            </h3>
          </div>
        </div>
        {/* 底部信息 */}
        <div className="p-4 md:p-5">
          <p className="text-sm text-content-secondary leading-relaxed mb-3">
            {category.oneLiner}
          </p>
          <div className="flex items-center justify-between">
            {!category.warrantyEnabled && (
              <Badge variant="warning">暂不提供电子质保</Badge>
            )}
            {category.warrantyEnabled && category.series.length > 0 && (
              <Badge variant="brand">
                {category.series.length} 个系列
              </Badge>
            )}
            <span className="text-sm text-content-brand font-medium group-hover:translate-x-1 transition-fast">
              查看详情 →
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
