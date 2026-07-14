// ============================================================
// 和膜 HAMOREY — ScrollReveal 滚动显现动效
// 元素进入视口时轻微上移并显现，遵守 prefers-reduced-motion
// ============================================================

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** 延迟动画（毫秒） */
  delay?: number;
  /** 标签 */
  as?: 'div' | 'section' | 'article' | 'li';
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 检查 prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1,
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn(
        'reveal',
        visible && 'reveal-visible',
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
