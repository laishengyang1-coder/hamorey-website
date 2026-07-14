// ============================================================
// PageHeader — 页面标题栏（衬线标题 + 勃艮第面包屑 + 香槟金分隔）
// ============================================================

import React from 'react';
import { cn } from '../../lib/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({ title, description, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-7', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-3 flex items-center gap-1.5 text-[13px] text-[var(--paper-muted)]">
          {breadcrumb.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-[var(--paper-border-strong)]">/</span>}
              {item.href ? (
                <a href={item.href} className="transition-colors hover:text-[#5C1A1A]">
                  {item.label}
                </a>
              ) : (
                <span className="font-medium text-[var(--paper-text-soft)]">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="hidden sm:block h-6 w-[3px] rounded-full bg-[var(--accent-gold)]" aria-hidden />
            <h1 className="font-display text-[26px] leading-tight font-semibold text-[var(--paper-text)]">
              {title}
            </h1>
          </div>
          {description && (
            <p className="mt-1.5 ml-[15px] text-sm text-[var(--paper-text-soft)]">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
