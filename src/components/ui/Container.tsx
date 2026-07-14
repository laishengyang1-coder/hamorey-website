// ============================================================
// 和膜 HAMOREY — Container 原子组件
// 统一内容最大宽度
// ============================================================

import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'narrow' | 'wide';
}

const sizeStyles = {
  narrow: 'max-w-3xl',
  default: 'max-w-content',
  wide: 'max-w-7xl',
};

export function Container({ className, size = 'default', children, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto px-6 md:px-8',
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
