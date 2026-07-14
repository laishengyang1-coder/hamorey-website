// ============================================================
// 和膜 HAMOREY — Footer 页尾
// ============================================================

import { Link } from 'react-router-dom';
import { footerNavGroups } from '../../config/navigation';
import { siteConfig } from '../../config/site';
import { Container } from '../ui/Container';

export function Footer() {
  return (
    <footer className="bg-graphite border-t border-border-subtle mt-auto">
      <Container className="py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12">
          {/* 品牌标识 */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-content-primary">
                {siteConfig.brandName}
              </span>
              <span className="text-sm font-medium text-content-brand tracking-wider">
                {siteConfig.brandNameEn}
              </span>
            </div>
            <p className="text-sm text-content-secondary leading-relaxed max-w-xs">
              {siteConfig.description}
            </p>
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-center gap-2 text-sm text-content-muted">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1C4.5 1 2.5 3 2.5 5.5C2.5 8.5 7 13 7 13S11.5 8.5 11.5 5.5C11.5 3 9.5 1 7 1Z" stroke="currentColor" strokeWidth="1" />
                  <circle cx="7" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span>{siteConfig.contact.address}</span>
              </div>
              {siteConfig.contact.phone && (
                <div className="flex items-center gap-2 text-sm text-content-muted">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 1H5L6 4L4.5 5.5C5.5 7.5 6.5 8.5 8.5 9.5L10 8L13 9V11C13 12 12 13 11 13C5.5 13 1 8.5 1 3C1 2 2 1 3 1Z" stroke="currentColor" strokeWidth="1" />
                  </svg>
                  <span>{siteConfig.contact.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-content-muted">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="2" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1" />
                  <path d="M1 4L7 8L13 4" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span>{siteConfig.contact.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-content-muted">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="1" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1" />
                  <path d="M6 4L6 7L9 7" stroke="currentColor" strokeWidth="1" />
                  <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span>微信公众号：{siteConfig.social.wechat}</span>
              </div>
            </div>
          </div>

          {/* 导航链接分组 */}
          {footerNavGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-content-primary">
                {group.title}
              </h4>
              <ul className="flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-content-secondary hover:text-content-brand transition-fast"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 底部信息 */}
        <div className="mt-12 pt-6 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-content-muted">
            © {new Date().getFullYear()} {siteConfig.brandName} {siteConfig.brandNameEn}. All rights reserved.
          </p>
          <p className="text-xs text-content-muted">
            {siteConfig.icpNumber}
          </p>
        </div>
      </Container>
    </footer>
  );
}
