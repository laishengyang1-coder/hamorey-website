// ============================================================
// 和膜 HAMOREY — ScrollReveal 滚动显现动效
// 元素进入视口时轻微上移并显现，遵守 prefers-reduced-motion
// ============================================================

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/** 入场方式 */
type RevealDirection = 'up' | 'left' | 'right' | 'scale';

export interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** 延迟动画（毫秒） */
  delay?: number;
  /** 入场方向 */
  direction?: RevealDirection;
  /** 标签 */
  as?: 'div' | 'section' | 'article' | 'li';
}

const revealClass: Record<RevealDirection, string> = {
  up: 'reveal',
  left: 'reveal-left',
  right: 'reveal-right',
  scale: 'reveal-scale',
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
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
        // 提前进入视口前就开始显现，避免快速滚动时出现大片空白
        rootMargin: '0px 0px 12% 0px',
        threshold: 0,
      },
    );

    observer.observe(el);
    // 兜底：无论观察器是否触发，1.2 秒后都显示（截图、打印、低端机型）
    const fallback = window.setTimeout(() => setVisible(true), 1200);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn(
        revealClass[direction],
        visible && 'reveal-visible',
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
