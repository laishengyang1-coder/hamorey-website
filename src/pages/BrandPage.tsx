// ============================================================
// 和膜 HAMOREY — 品牌介绍页 /brand/
// 品牌起源（和和新材 870328）+ 双栏视觉叙事 + 核心价值 + 演进路径 + 制造实力 + 三级门店网络
// ============================================================

import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CTASection } from '../components/blocks/CTASection';
import { QualitySystem } from '../components/blocks/QualitySystem';
import { siteConfig } from '../config/site';
import bannerImg from '../assets/hamorey/lifestyle-1.jpg';
import storyImgA from '../assets/hamorey/product-ppf.jpg';
import storyImgB from '../assets/hamorey/product-architectural.jpg';

const brandValues = [
  {
    en: 'MATERIAL SCIENCE',
    title: '材料科学驱动',
    description: '依托母公司和和新材在高性能功能膜与精密涂布领域的深厚积累，从脂肪族 TPU 母粒、纳米陶瓷浆料到压敏胶配方自主把控。',
  },
  {
    en: 'CONSISTENT QUALITY',
    title: '严苛品控交付',
    description: '执行批次耐黄变、氙灯加速老化、抗穿刺与剥离强度全检标准，配合一卷一码溯源管理，确保每一台施工车辆品质如一。',
  },
  {
    en: 'LIFECYCLE GUARDIAN',
    title: '全周期资产守护',
    description: '打通全国三级授权门店、标准化施工留档、电子质保证书与 13 项车身部位理赔报价体系，守护原厂车漆与车辆残值。',
  },
];

const brandTimeline = [
  {
    phase: '高性能膜材智造基因',
    description: '背靠和和新材（股票代码：870328）产业研发与涂布产线优势，构建隐形车衣、汽车窗膜、改色车衣、天窗冰甲与建筑家居膜五大产品矩阵。',
  },
  {
    phase: '全国授权服务网络建设',
    description: '建立 HEBC 品牌灯塔店、HSS 标准服务中心与区域服务点三级门店网络，推行无尘车间施工规范与技师培训体系。',
  },
  {
    phase: '数字化全车资产管家',
    description: '上线和膜电子质保与理赔报价平台，实现从卷号出库、门店划拨、实车拍照建档到事故单部位定损核验的数字化闭环。',
  },
];

export default function BrandPage() {
  useSEO('brand');

  return (
    <PageLayout
      hero
      image={bannerImg}
      imagePosition="center 75%"
      subtitle="About HAMOREY"
      title="和膜，不止于膜"
      description="源自新材料智造基因的高端汽车膜品牌。以材料科技、标准施工与数字质保，守护每一台爱车的长期资产价值。"
    >
      {/* 1. 品牌起源与定位（左右双栏图文） */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="brand">高端汽车膜品牌</Badge>
              <Badge variant="default">和和新材旗下品牌 · 股票代码 870328</Badge>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-content-primary leading-tight">
              以新材料研发积淀，重塑中国车主的全车防护体验
            </h2>
            <p className="mt-5 text-base text-content-secondary leading-relaxed">
              和膜 HAMOREY 是和和新材（股票代码：870328）旗下的高端功能膜品牌，运营总部位于上海宝山。
              我们将高分子基材选型、纳米功能涂层研发与精密涂布制造能力，延伸至汽车漆面保护与空间玻璃隔热领域。
            </p>
            <p className="mt-4 text-base text-content-secondary leading-relaxed">
              在和膜看来，交付一卷好膜只是起点。我们围绕中国车主的真实用车环境与保险理赔痛点，
              打造覆盖「科学选膜、标准施工、电子质保、部位定损」的全车资产管家服务体系，让每一份守护清晰可见、有据可查。
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="aspect-[16/9] overflow-hidden rounded-lg">
              <img
                src={storyImgA}
                alt="和膜漆面保护视觉"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="aspect-[16/9] overflow-hidden rounded-lg">
              <img
                src={storyImgB}
                alt="和膜建筑与空间玻璃防护"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 2. 品牌价值 */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading subtitle="Core Values" title="三大核心价值支柱" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {brandValues.map((value, index) => (
            <ScrollReveal key={value.title} delay={index * 80}>
              <Card padding="lg" className="h-full">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-content-muted uppercase">
                  {value.en}
                </p>
                <h3 className="mt-2 text-xl font-bold text-content-brand mb-3">
                  {value.title}
                </h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  {value.description}
                </p>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* 3. 从产品销售到长期资产管理 */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="Brand Architecture"
          title="从一卷膜到全车资产管理"
          description="连接制造端、门店端与车主端，构建长期可信赖的品牌护城河。"
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {brandTimeline.map((item, index) => (
            <ScrollReveal key={item.phase} delay={index * 80}>
              <div className="flex flex-col gap-3 p-6 rounded-lg bg-elevated border border-border-subtle h-full">
                <span className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center text-sm font-bold text-content-brand">
                  0{index + 1}
                </span>
                <h3 className="text-base font-semibold text-content-primary">{item.phase}</h3>
                <p className="text-sm text-content-secondary leading-relaxed">{item.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* 4. 企业与工厂实力 */}
      <div className="mt-16 md:mt-20 -mx-6 md:-mx-8">
        <QualitySystem />
      </div>

      {/* 5. 授权服务体系与百店计划 */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="Service Network"
          title="三级授权门店服务体系"
          description="分级授权、统一标准，让车主在不同城市都能获得一致的专业交付。"
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              level: 'HEBC',
              name: '品牌灯塔店',
              desc: '城市级品牌形象标杆，配备独立无尘降雾贴膜工位、全系产品体验区与认证技师团队。',
            },
            {
              level: 'HSS',
              name: '标准服务中心',
              desc: '区域级核心服务网点，覆盖窗膜、车衣与改色主力产品线，执行标准施工与电子质保建档。',
            },
            {
              level: 'Service Point',
              name: '区域服务点',
              desc: '贴近车主日常用车的授权施工网点，提供正规正品装贴、质保核验与便捷售后响应。',
            },
          ].map((tier, index) => (
            <ScrollReveal key={tier.level} delay={index * 80}>
              <Card padding="lg" className="h-full">
                <Badge variant="brand">{tier.level}</Badge>
                <h3 className="mt-3 text-lg font-semibold text-content-primary">{tier.name}</h3>
                <p className="mt-2 text-sm text-content-secondary leading-relaxed">{tier.desc}</p>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {/* 6. 联系信息卡片 */}
      <ScrollReveal className="mt-16">
        <Card padding="lg" className="text-center">
          <h3 className="text-xl font-semibold text-content-primary">
            与和膜一起，共建全车资产管家服务网络
          </h3>
          <p className="mt-3 text-sm text-content-secondary max-w-xl mx-auto">
            无论您是寻求爱车防护方案的车主、保险定损机构还是区域渠道伙伴，欢迎随时与和膜运营中心联系。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-content-secondary">
            <span>总部地址：{siteConfig.contact.address}</span>
            {siteConfig.contact.phone && <span>联系电话：{siteConfig.contact.phone}</span>}
            <span>商务邮箱：{siteConfig.contact.email}</span>
          </div>
        </Card>
      </ScrollReveal>

      {/* 页尾行动区 */}
      <div className="mt-16 -mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
