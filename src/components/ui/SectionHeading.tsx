// ============================================================
// 和膜 HAMOREY — SectionHeading 区块标题
// ============================================================

import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface SectionHeadingProps {
  /** 中文标题 */
  title: string;
  /** 英文副标题 */
  subtitle?: string;
  /** 描述文本 */
  description?: ReactNode;
  /** 对齐方式 */
  align?: 'left' | 'center';
  /** 标题大小 */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'text-xl md:text-2xl',
  md: 'text-2xl md:text-3xl',
  lg: 'text-3xl md:text-4xl',
};

export function SectionHeading({
  title,
  subtitle,
  description,
  align = 'center',
  size = 'md',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {subtitle && (
        <span className="text-sm font-medium text-content-brand tracking-wider uppercase">
          {subtitle}
        </span>
      )}
      <h2 className={cn('font-semibold text-content-primary text-balance', sizeStyles[size])}>
        {title}
      </h2>
      {description && (
        <p className="text-base text-content-secondary max-w-2xl leading-relaxed text-balance">
          {description}
        </p>
      )}
    </div>
  );
}
