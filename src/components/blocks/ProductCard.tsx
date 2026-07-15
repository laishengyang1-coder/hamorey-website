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
      className="group overflow-hidden h-full"
    >
      <Link to={category.path} className="block h-full">
        {/* 图片 + 覆盖信息 */}
        <div className={`relative overflow-hidden ${size === 'large' ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
          <img
            src={category.image}
            alt={category.nameCn}
            className="w-full h-full object-cover transition-slow group-hover:scale-105"
            loading="lazy"
          />
          {/* 干净渐变：底部加深保证文字可读，上部保持透明 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          {/* 全部信息覆盖在图上 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
            <p className="text-xs font-medium text-white/70 tracking-wider uppercase mb-1">
              {category.nameEn}
            </p>
            <h3 className={`font-bold text-white ${size === 'large' ? 'text-xl md:text-2xl' : 'text-lg'}`}>
              {category.nameCn}
            </h3>
            <p className="mt-1.5 text-sm text-white/65 leading-relaxed">
              {category.oneLiner}
            </p>
            <div className="mt-3 flex items-center justify-between">
              {!category.warrantyEnabled && (
                <Badge variant="warning">暂不提供电子质保</Badge>
              )}
              {category.warrantyEnabled && category.series.length > 0 && (
                <Badge variant="brand">
                  {category.series.length} 个系列
                </Badge>
              )}
              <span className="text-sm text-white/80 font-medium group-hover:translate-x-1 transition-fast ml-auto">
                查看详情 →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
