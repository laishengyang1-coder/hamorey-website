// ============================================================
// 和膜 HAMOREY — PageLayout 通用页面布局
// 标题区（可选全幅图片横幅）+ 内容区
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
  /** 标题区背景图（传入后使用深色全幅图片横幅） */
  image?: string;
  /** 背景图焦点位置，如 'center'、'70% center' */
  imagePosition?: string;
  className?: string;
}

export function PageLayout({
  title,
  subtitle,
  description,
  children,
  size = 'default',
  hero = false,
  image,
  imagePosition = 'center',
  className,
}: PageLayoutProps) {
  const hasHeader = Boolean(title || subtitle);

  return (
    <div className={cn('flex flex-col', className)}>
      {hasHeader && image && (
        <div className="relative isolate overflow-hidden bg-[#0B0606] text-white">
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80"
            style={{ objectPosition: imagePosition }}
            loading="eager"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B0606] via-[#0B0606]/75 to-[#0B0606]/20" />
          <Container size={size} className="flex min-h-[320px] md:min-h-[420px] flex-col justify-end py-14 md:py-20">
            {subtitle && (
              <p className="mb-3 flex items-center gap-3 text-xs md:text-sm font-medium tracking-[0.3em] text-[#D9B97A] uppercase">
                <span className="h-px w-8 bg-[#D9B97A]" />
                {subtitle}
              </p>
            )}
            {title && (
              <h1 className="text-3xl md:text-5xl font-bold text-balance">{title}</h1>
            )}
            {description && (
              <p className="mt-4 max-w-2xl text-base md:text-lg leading-relaxed text-white/70 text-balance">
                {description}
              </p>
            )}
          </Container>
        </div>
      )}

      {hasHeader && !image && (
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

      <Container size={size} className="py-10 md:py-16">
        {children}
      </Container>
    </div>
  );
}
