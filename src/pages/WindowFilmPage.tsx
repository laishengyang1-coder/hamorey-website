// ============================================================
// 和膜 HAMOREY — 窗膜分类页 /products/window-film/
// 5个系列：和光/和盾/和护/和真/和原
// ============================================================

import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CTASection } from '../components/blocks/CTASection';
import { getCategoryConfig } from '../config/products';
import windowFilmImg from '../assets/window-film.jpeg';

export default function WindowFilmPage() {
  useSEO('products/window-film');

  const config = getCategoryConfig('window_film')!;

  return (
    <PageLayout
      hero
      subtitle="Window Film"
      title="窗膜"
      description="隔热、清晰与舒适的长期平衡。和膜窗膜五大系列，满足不同车型与使用场景的隔热防护需求。"
    >
      {/* 核心价值 */}
      <ScrollReveal>
        <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
          <img
            src={windowFilmImg}
            alt="和膜窗膜"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3D0A0A]/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-content-primary">
              隔热 · 清晰 · 安全
            </h2>
            <p className="mt-2 text-sm text-content-secondary max-w-xl">
              高品质磁控溅射工艺，平衡隔热性能与信号通透。
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* 5个系列 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Series" title="窗膜五大系列" />
      </ScrollReveal>

      <div className="mt-8 flex flex-col gap-6">
        {config.series.map((series, index) => (
          <ScrollReveal key={series.code} delay={index * 80}>
            <Card padding="lg" hover>
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-content-primary">
                      {series.nameCn}
                    </h3>
                    <span className="text-sm text-content-brand">{series.nameEn}</span>
                  </div>
                  <p className="text-sm text-content-secondary mb-4">
                    {series.tagline}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {series.highlights.map((h) => (
                      <Badge key={h} variant="default">{h}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-content-muted">质保年限：</span>
                      <span className="text-content-primary">{series.warrantyYears}年</span>
                    </div>
                    <div>
                      <span className="text-content-muted">型号代码：</span>
                      <span className="text-content-primary">{series.modelCode}</span>
                    </div>
                  </div>
                </div>
                <div className="md:w-48 flex-shrink-0">
                  <div className="p-4 rounded bg-graphite border border-border-subtle text-center">
                    <p className="text-xs text-content-muted">详细参数</p>
                    <p className="text-sm text-status-warning mt-1">参数待补充</p>
                  </div>
                </div>
              </div>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      {/* 前挡和侧挡选择建议 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Guide" title="前挡与侧挡选择建议" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-content-primary mb-3">前挡玻璃</h3>
            <ul className="flex flex-col gap-2 text-sm text-content-secondary">
              <li>· 优先选择高透光率系列，确保驾驶视野清晰</li>
              <li>· 注意符合国标透光率要求（≥70%）</li>
              <li>· 推荐和光 AURIS 或和真 NEX5 系列</li>
            </ul>
          </Card>
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-content-primary mb-3">侧挡玻璃</h3>
            <ul className="flex flex-col gap-2 text-sm text-content-secondary">
              <li>· 可选择较低透光率，提升隐私与隔热</li>
              <li>· 注意信号通透性（ETC、GPS）</li>
              <li>· 推荐和盾 FORTEX 或和护 LUMIS 系列</li>
            </ul>
          </Card>
        </div>
      </ScrollReveal>

      {/* 质保与授权施工 */}
      <ScrollReveal className="mt-16">
        <div className="p-6 rounded-lg bg-elevated border border-border-subtle">
          <h3 className="text-base font-semibold text-content-primary mb-3">
            质保与授权施工
          </h3>
          <p className="text-sm text-content-secondary leading-relaxed">
            和膜窗膜质保码默认支持24次使用（整车玻璃），由授权门店施工后通过总部审核，
            生成可查询的电子质保证书。请在和膜授权门店完成施工，以获得完整质保服务。
          </p>
        </div>
      </ScrollReveal>

      <div className="mt-16 -mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
