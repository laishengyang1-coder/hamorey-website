import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * iOS 26 Liquid Glass 分段控制器：
 * 自动测量选中按钮的 offsetLeft / offsetWidth，用弹性弹簧曲线平滑滑行液态玻璃透镜胶囊，
 * 并在滑动瞬间产生微弱的提亮折射质感（无嵌套 backdrop-filter，保证 60fps 丝滑流畅）。
 */
export function IosGlassSegmented({
  activeKey,
  className,
  pillClassName,
  role,
  'aria-label': ariaLabel,
  children,
}: {
  activeKey: string;
  className?: string;
  pillClassName?: string;
  role?: string;
  'aria-label'?: string;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glideTimerRef = useRef<number | null>(null);
  const [rect, setRect] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });
  const [gliding, setGliding] = useState(false);

  useEffect(() => {
    return () => {
      if (glideTimerRef.current !== null) {
        window.clearTimeout(glideTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const target = el.querySelector<HTMLElement>(`[data-ios-seg="${activeKey}"]`);
      if (!target) return;
      setRect((prev) => {
        const moved = prev.ready && Math.abs(prev.left - target.offsetLeft) > 2;
        if (moved) {
          setGliding(true);
          if (glideTimerRef.current !== null) {
            window.clearTimeout(glideTimerRef.current);
          }
          glideTimerRef.current = window.setTimeout(() => {
            glideTimerRef.current = null;
            setGliding(false);
          }, 300);
        }
        return { left: target.offsetLeft, width: target.offsetWidth, ready: true };
      });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [activeKey]);

  return (
    <div
      ref={containerRef}
      role={role}
      aria-label={ariaLabel}
      className={cn('relative inline-flex items-center', className)}
    >
      {rect.ready && (
        <span
          aria-hidden="true"
          className={cn(
            'ios26-sliding-lens pointer-events-none absolute top-1 bottom-1 left-0 rounded-full',
            gliding && 'is-gliding',
            pillClassName,
          )}
          style={{
            width: `${rect.width}px`,
            transform: `translate3d(${rect.left}px, 0, 0)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
