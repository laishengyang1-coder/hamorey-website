// ============================================================
// 和膜 HAMOREY — 天窗冰甲分类页 /products/sunroof-film/
// T1 / T2 参数展示 + 全景天幕防护场景
// ============================================================

import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CTASection } from '../components/blocks/CTASection';
import { getCategoryConfig } from '../config/products';
import sunroofFilmImg from '../assets/hamorey/product-sunroof.jpg';

export default function SunroofFilmPage() {
  useSEO('products/sunroof-film');

  const config = getCategoryConfig('sunroof_film')!;

  return (
    <PageLayout
      hero
      image={sunroofFilmImg}
      imagePosition="center 75%"
      subtitle="Sunroof Film"
      title="天窗冰甲"
      description="面向全景天窗与新能源车型的顶部防护。高效反射红外热源、强韧防爆抗冲击，告别夏季头顶灼热感。"
    >
      {/* 主视觉导语 */}
      <ScrollReveal>
        <div className="border-l-2 border-brand pl-5 md:pl-6">
          <h2 className="text-2xl md:text-3xl font-bold text-content-primary">隔热 · 防爆 · 降温</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-content-secondary">
            集窗膜的高效隔热与隐形车衣的抗冲击韧性于一体，专为大面积玻璃天幕研发，5 年官方电子质保。
          </p>
        </div>
      </ScrollReveal>

      {/* 新能源和大尺寸天窗使用场景 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Use Cases" title="为什么全景天幕需要专用冰甲" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-content-primary mb-3">
              新能源超大天幕降温
            </h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              新能源车型普遍取消物理遮阳帘，夏季头顶玻璃暴晒直烤。天窗冰甲从外部源头阻隔太阳辐射热，降低空调负荷与电耗。
            </p>
          </Card>
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-content-primary mb-3">
              高空坠物与飞石防爆
            </h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              高速石子飞溅或停车遭遇树枝、冰雹冲击时，高韧性防爆基材可吸收冲击能量并牢牢粘附碎裂玻璃，守护乘员安全。
            </p>
          </Card>
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-content-primary mb-3">
              99% 紫外线阻隔护内饰
            </h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              全天候阻隔 99% 以上有害紫外线，保护驾乘人员头面部肌肤免受晒伤，同时延缓真皮座椅与中控台老化褪色。
            </p>
          </Card>
        </div>
      </ScrollReveal>

      {/* T系列产品信息 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="T Series" title="T 系列型号与参数" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {config.series.map((series, index) => (
            <ScrollReveal key={series.code} delay={index * 80}>
              <Card padding="lg" hover className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-content-primary">
                        {series.nameCn}
                      </h3>
                      <span className="text-sm font-medium text-content-brand">{series.nameEn}</span>
                    </div>
                    <Badge variant="brand">{series.warrantyYears}年质保</Badge>
                  </div>
                  <p className="text-sm text-content-secondary mb-4">{series.tagline}</p>
                  <div className="flex flex-wrap gap-2">
                    {series.highlights.map((h) => (
                      <Badge key={h} variant="default">{h}</Badge>
                    ))}
                  </div>
                </div>

                {series.specs.length > 0 && (
                  <dl className="mt-5 pt-4 border-t border-border-subtle grid grid-cols-3 gap-2 text-xs">
                    {series.specs.map((sp) => (
                      <div key={sp.label}>
                        <dt className="text-content-muted">{sp.label}</dt>
                        <dd className="mt-1 font-semibold text-content-primary">{sp.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* 产品结构和核心价值 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="Structure" title="复合防护层结构" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: '纳米耐候自洁表层', desc: '疏水抗污易清洁，抵御雨水树胶与户外日晒腐蚀。' },
            { title: '高隔热纳米陶瓷/光学层', desc: '高达 85%–92% 综合隔热表现，且不含金属层、不影响 5G 与 ETC/GPS 信号。' },
            { title: '强韧防爆缓冲基材', desc: '2.0–3.0 mil 强化抗冲击层，降低天幕玻璃意外碎裂飞溅风险。' },
          ].map((item) => (
            <Card key={item.title} padding="lg">
              <h3 className="text-base font-semibold text-content-brand mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">{item.desc}</p>
            </Card>
          ))}
        </div>
      </ScrollReveal>

      {/* 整体天窗报价规则 */}
      <ScrollReveal className="mt-16">
        <div className="p-6 rounded-lg bg-elevated border border-border-subtle">
          <h3 className="text-base font-semibold text-content-primary mb-2">
            电子质保与理赔说明
          </h3>
          <p className="text-sm text-content-secondary leading-relaxed">
            天窗冰甲在授权门店施工并通过审核后享 5 年电子质保；事故理赔报价按整块天窗综合价值核定，可通过官网或小程序「电子质保查询」实时调阅。
          </p>
        </div>
      </ScrollReveal>

      <div className="mt-16 -mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
