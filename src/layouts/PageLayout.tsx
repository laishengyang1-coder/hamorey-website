// ============================================================
// 和膜 HAMOREY — PageLayout 通用页面布局
// 标题区 + 内容区
// ============================================================

import { type ReactNode } from 'react';
import { Container } from '../components/ui/Container';
import { cn } from '../lib/cn';

export interface PageLayoutProps {
  /** 页面标题 */
  title?: string;
  /** 英文副标题 */
  subtitle?: string;
  /** 描述 */
  description?: string;
  /** 页面内容 */
  children: ReactNode;
  /** 容器大小 */
  size?: 'default' | 'narrow' | 'wide';
  /** 是否显示标题区背景 */
  hero?: boolean;
  className?: string;
}

export function PageLayout({
  title,
  subtitle,
  description,
  children,
  size = 'default',
  hero = false,
  className,
}: PageLayoutProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {(title || subtitle) && (
        <div
          className={cn(
            'py-12 md:py-16',
            hero && 'bg-graphite border-b border-border-subtle',
          )}
        >
          <Container size={size}>
            {subtitle && (
              <p className="text-sm font-medium text-content-brand tracking-wider uppercase mb-2">
                {subtitle}
              </p>
            )}
            {title && (
              <h1 className="text-3xl md:text-4xl font-bold text-content-primary text-balance">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-4 text-base text-content-secondary max-w-2xl leading-relaxed text-balance">
                {description}
              </p>
            )}
          </Container>
        </div>
      )}
      <Container size={size} className="py-8 md:py-12">
        {children}
      </Container>
    </div>
  );
}
