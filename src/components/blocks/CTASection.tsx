// ============================================================
// 和膜 HAMOREY — CTASection 页尾行动区
// ============================================================

import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { siteConfig } from '../../config/site';

export function CTASection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-b from-graphite via-carbon to-graphite" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand/10 via-transparent to-brand/10" />

      <Container className="relative z-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="text-sm font-medium text-content-brand tracking-wider uppercase">
            {siteConfig.brandNameEn}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-content-primary text-balance">
            {siteConfig.cta.title}
          </h2>
          <p className="text-base md:text-lg text-content-secondary max-w-xl text-balance">
            {siteConfig.cta.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {siteConfig.cta.links.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button
                  variant={link.href === '/partner' ? 'primary' : 'outline'}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </Container>

      {/* 底部品牌线 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
    </section>
  );
}
