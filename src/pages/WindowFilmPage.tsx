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
import { WINDOW_FILM_MODELS, WINDOW_FILM_POSITION_LABELS, formatWindowFilmPrice } from '../config/windowFilm';
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
            <h2 className="text-2xl font-bold text-white">
              隔热 · 清晰 · 安全
            </h2>
            <p className="mt-2 text-sm text-white/70 max-w-xl">
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
                      <span className="text-content-primary">
                        {Math.max(...WINDOW_FILM_MODELS.filter((item) => item.seriesCode === series.code).map((item) => item.warrantyYears))}年
                      </span>
                    </div>
                    <div>
                      <span className="text-content-muted">型号：</span>
                      <span className="text-content-primary">
                        {WINDOW_FILM_MODELS.filter((item) => item.seriesCode === series.code).map((item) => item.modelName).join(' / ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="md:w-48 flex-shrink-0">
                  <div className="p-4 rounded bg-graphite border border-border-subtle text-center">
                    <p className="text-xs text-content-muted">玻璃部位</p>
                    <p className="text-sm text-content-primary mt-1">前挡 / 侧挡</p>
                  </div>
                </div>
              </div>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Price Sheet" title="前挡与侧挡型号参数" />
        <div className="mt-8 overflow-x-auto rounded-lg border border-border-subtle bg-elevated">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-graphite text-left text-xs text-content-muted">
                <th className="px-4 py-3 font-medium">系列</th>
                <th className="px-4 py-3 font-medium">部位</th>
                <th className="px-4 py-3 font-medium">型号</th>
                <th className="px-4 py-3 font-medium">透光率</th>
                <th className="px-4 py-3 font-medium">紫外阻隔</th>
                <th className="px-4 py-3 font-medium">总阻隔</th>
                <th className="px-4 py-3 font-medium">厚度</th>
                <th className="px-4 py-3 font-medium">质保</th>
                <th className="px-4 py-3 font-medium">门店建议价</th>
                <th className="px-4 py-3 font-medium">零售建议价</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {WINDOW_FILM_MODELS.map((item) => (
                <tr key={item.modelCode}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-content-primary">{item.seriesName}</p>
                    <p className="mt-0.5 text-xs text-content-muted">{item.seriesPositioning}</p>
                  </td>
                  <td className="px-4 py-3 text-content-secondary">{WINDOW_FILM_POSITION_LABELS[item.glassPosition]}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-content-primary">{item.modelName}</p>
                    <p className="mt-0.5 font-mono text-xs text-content-muted">{item.modelCode}</p>
                  </td>
                  <td className="px-4 py-3 text-content-secondary">{item.visibleLightTransmittance}</td>
                  <td className="px-4 py-3 text-content-secondary">{item.uvRejection}</td>
                  <td className="px-4 py-3 text-content-secondary">{item.solarRejection}</td>
                  <td className="px-4 py-3 text-content-secondary">{item.thickness}</td>
                  <td className="px-4 py-3 text-content-secondary">{item.warrantyYears}年</td>
                  <td className="px-4 py-3 text-content-primary">{formatWindowFilmPrice(item.storeSuggestedPrice)}</td>
                  <td className="px-4 py-3 text-content-secondary">{formatWindowFilmPrice(item.retailSuggestedPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollReveal>

      {/* 前挡和侧挡选择建议 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Guide" title="前挡与侧挡选择建议" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-content-primary mb-3">前挡玻璃</h3>
            <ul className="flex flex-col gap-2 text-sm text-content-secondary">
              <li>· 优先选择高透光率系列，确保驾驶视野清晰</li>
              <li>· 注意符合国标透光率要求（≥70%）</li>
              <li>· 推荐和光70、和盾70、和护70、和真75、和原75</li>
            </ul>
          </Card>
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-content-primary mb-3">侧挡玻璃</h3>
            <ul className="flex flex-col gap-2 text-sm text-content-secondary">
              <li>· 可选择较低透光率，提升隐私与隔热</li>
              <li>· 注意信号通透性（ETC、GPS）</li>
              <li>· 推荐和光25、和盾10/35、和护15/25、和真15/35、和原10/35</li>
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
