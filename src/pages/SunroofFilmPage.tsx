// ============================================================
// 和膜 HAMOREY — 天窗冰甲分类页 /products/sunroof-film/
// T系列产品信息 + 全景天窗场景展示
// ============================================================

import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CTASection } from '../components/blocks/CTASection';
import { getCategoryConfig } from '../config/products';
import sunroofFilmImg from '../assets/sunroof-film.jpeg';

export default function SunroofFilmPage() {
  useSEO('products/sunroof-film');

  const config = getCategoryConfig('sunroof_film')!;

  return (
    <PageLayout
      hero
      subtitle="Sunroof Film"
      title="天窗冰甲"
      description="面向全景天窗与新能源车型的顶部防护。隔热降温、防爆安全，T系列为您的天窗提供专业保护。"
    >
      {/* 主视觉 */}
      <ScrollReveal>
        <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
          <img
            src={sunroofFilmImg}
            alt="和膜天窗冰甲"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-carbon/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-content-primary">
              隔热 · 防爆 · 降温
            </h2>
            <p className="mt-2 text-sm text-content-secondary max-w-xl">
              专为全景天窗与新能源车型设计的顶部防护方案。
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* 新能源和大尺寸天窗使用场景 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Use Cases" title="适用场景" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-content-primary mb-3">
              新能源车型
            </h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              新能源车型普遍配备大面积全景天窗，夏季车内温度急剧升高。
              天窗冰甲有效阻隔热量，降低空调能耗，延长续航里程。
            </p>
          </Card>
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-content-primary mb-3">
              大尺寸天窗
            </h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              全景天窗、超大天幕玻璃面积大，紫外线直射影响驾乘舒适度。
              天窗冰甲提供UV阻隔与隔热降温，提升乘坐体验。
            </p>
          </Card>
        </div>
      </ScrollReveal>

      {/* T系列产品信息 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="T Series" title="T系列产品" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {config.series.map((series, index) => (
            <ScrollReveal key={series.code} delay={index * 100}>
              <Card padding="lg" hover className="h-full">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-content-primary">
                      {series.nameCn}
                    </h3>
                    <span className="text-sm text-content-brand">{series.nameEn}</span>
                  </div>
                  <Badge variant="brand">{series.warrantyYears}年质保</Badge>
                </div>
                <p className="text-sm text-content-secondary mb-3">{series.tagline}</p>
                <div className="flex flex-wrap gap-2">
                  {series.highlights.map((h) => (
                    <Badge key={h} variant="default">{h}</Badge>
                  ))}
                </div>
                <p className="text-xs text-status-warning mt-3">参数待补充</p>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* 产品结构和核心价值 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Structure" title="产品结构与核心价值" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: '隔热层', desc: '高效隔热涂层，阻隔红外线热量传递' },
            { title: '防爆层', desc: '强化基材，防止玻璃碎裂飞溅' },
            { title: 'UV阻隔层', desc: '阻隔99%以上紫外线，保护皮肤与内饰' },
          ].map((item) => (
            <Card key={item.title} padding="lg">
              <h3 className="text-base font-semibold text-content-brand mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-content-secondary">{item.desc}</p>
            </Card>
          ))}
        </div>
      </ScrollReveal>

      {/* 整体天窗报价规则 */}
      <ScrollReveal className="mt-16">
        <div className="p-6 rounded-lg bg-elevated border border-border-subtle">
          <h3 className="text-base font-semibold text-content-primary mb-3">
            整体天窗报价规则
          </h3>
          <p className="text-sm text-content-secondary leading-relaxed">
            天窗冰甲理赔报价按整体计算，不拆分材料费与施工费。
            具体价格以总部配置的报价表为准，可通过质保查询页面查看参考报价。
          </p>
        </div>
      </ScrollReveal>

      <div className="mt-16 -mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
