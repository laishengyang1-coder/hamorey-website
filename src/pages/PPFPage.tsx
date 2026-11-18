// ============================================================
// 和膜 HAMOREY — 隐形车衣分类页 /products/ppf/
// 四大核心系列 + 全系8款型号对比矩阵 + 5层膜结构解剖 + 原厂漆对比 + 13部位理赔
// ============================================================

import { Link } from 'react-router-dom';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CTASection } from '../components/blocks/CTASection';
import { getCategoryConfig, ppfClaimParts, ppfModelMatrix } from '../config/products';
import ppfImg from '../assets/hamorey/product-ppf.jpg';

const filmLayers = [
  {
    no: '01',
    name: 'PET 表面保护层',
    spec: '施工前揭除',
    desc: '运输与裁膜期间隔绝灰尘静电，保护纳米涂层洁净无损。',
  },
  {
    no: '02',
    name: '纳米致密热修复顶涂层',
    spec: '疏水 · 抗污 · 自修复',
    desc: '细微洗车太阳纹受阳光或热水激发自动回弹闭合，荷叶疏水抗鸟粪酸雨腐蚀。',
  },
  {
    no: '03',
    name: '光学级脂肪族 TPU / 聚碳基材',
    spec: '7.5 – 8.5 mil 核心防护层',
    desc: '高韧性抗穿刺缓冲层，吸收高速碎石冲击与树枝剐蹭，长期日晒耐黄变。',
  },
  {
    no: '04',
    name: '低初粘压敏安装胶层',
    spec: '稳固服帖 · 撕膜不留胶',
    desc: '施工易走水定位，包边不起翘；到期更换或事故撕除不伤原厂清漆。',
  },
  {
    no: '05',
    name: '磨砂离型底膜',
    spec: '底材保护',
    desc: '保持安装胶层平整纯净，配合专车专用裁切顺畅贴合复杂曲面。',
  },
];

const paintComparison = [
  { dim: '烘烤工艺与硬度', factory: '190°C 高温电泳无尘烘烤，漆层致密坚韧', repaint: '60°C 低温烤房补漆，硬度与附着力显著下降' },
  { dim: '色差与老化速度', factory: '机器人恒量喷涂，长期保持均匀光泽', repaint: '人工调漆易产生肉眼色差，1–2 年后易失光发乌' },
  { dim: '二手车残值影响', factory: '原版原漆是二手车评估溢价的核心指标', repaint: '漆膜仪一测即知，单面喷漆常带来数千元折价' },
];

export default function PPFPage() {
  useSEO('products/ppf');

  const config = getCategoryConfig('ppf')!;

  return (
    <PageLayout
      hero
      image={ppfImg}
      subtitle="Paint Protection Film"
      title="隐形车衣"
      description="守护原厂车漆与车辆残值。和膜隐形车衣覆盖 6 年至 15 年官方质保梯队，以光学级高光、热修复、抗穿刺与缎面哑光守护每一寸原厂漆面。"
    >
      {/* 核心价值导语 */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 border-l-2 border-brand pl-5 md:pl-6">
            <h2 className="text-2xl md:text-3xl font-bold text-content-primary">
              原厂车漆只有一次，物理铠甲长效守护
            </h2>
            <p className="mt-3 text-base leading-relaxed text-content-secondary">
              不同于仅维持数月的打蜡或镀晶，和膜隐形车衣以 7.5–8.5 mil 光学级 TPU 与聚碳酸酯复合涂层，
              在车漆表面形成高韧性透明物理屏障，从容抵御高速飞石、开门磕碰、恶意划车与酸雨鸟粪侵蚀。
            </p>
          </div>
          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            {[
              { v: '15年', l: '旗舰最长质保' },
              { v: '8.5mil', l: '加厚抗石击选型' },
              { v: '13项', l: '单部位理赔定损' },
            ].map((item) => (
              <div
                key={item.l}
                className="rounded-lg bg-elevated border border-border-subtle p-4 text-center"
              >
                <p className="text-2xl font-bold text-content-brand">{item.v}</p>
                <p className="mt-1 text-xs text-content-secondary">{item.l}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* 四大主力系列 */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="Core Series"
          title="四大主力产品系列"
          description="按驾驶环境、漆面质感偏好与预算自由选择。"
        />
      </ScrollReveal>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.series.map((series, index) => (
          <ScrollReveal key={series.code} delay={index * 60}>
            <Card padding="lg" hover className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-content-primary">{series.nameCn}</h3>
                    <span className="text-sm font-medium text-content-brand">{series.nameEn}</span>
                  </div>
                  <Badge variant="brand">{series.warrantyYears}年质保</Badge>
                </div>
                <p className="text-sm text-content-secondary mb-4">{series.tagline}</p>
                <div className="flex flex-wrap gap-2">
                  {series.highlights.map((h) => (
                    <Badge key={h} variant="default">
                      {h}
                    </Badge>
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

      {/* 全系 8 款型号对比矩阵（含 15 年殿堂旗舰和鼎 HD / 和尊 HZ） */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="Specification Matrix"
          title="隐形车衣全系型号与建议零售价"
          description="涵盖 6 年实用防护至 15 年聚碳酸酯旗舰系列，全部支持电子质保一车一档。"
        />
        <div className="mt-8 overflow-x-auto rounded-lg border border-border-subtle bg-elevated">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="bg-[#1A0D0D] text-white text-xs uppercase tracking-wider">
                <th className="py-4 px-5 font-semibold">产品型号</th>
                <th className="py-4 px-4 font-semibold">表面质感</th>
                <th className="py-4 px-4 font-semibold">核心基材与涂层</th>
                <th className="py-4 px-4 font-semibold">厚度</th>
                <th className="py-4 px-4 font-semibold">性能特点</th>
                <th className="py-4 px-4 font-semibold">官方质保</th>
                <th className="py-4 px-5 font-semibold text-right">整车参考价</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              {ppfModelMatrix.map((row) => (
                <tr key={row.modelCode} className="hover:bg-graphite/60 transition-colors">
                  <td className="py-4 px-5 font-semibold text-content-primary whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{row.name}</span>
                      {row.badge && <Badge variant="brand">{row.badge}</Badge>}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-content-secondary whitespace-nowrap">{row.finish}</td>
                  <td className="py-4 px-4 text-content-secondary">{row.substrate}</td>
                  <td className="py-4 px-4 font-medium text-content-primary whitespace-nowrap">
                    {row.thickness}
                  </td>
                  <td className="py-4 px-4 text-content-secondary">{row.feature}</td>
                  <td className="py-4 px-4 font-semibold text-content-brand whitespace-nowrap">
                    {row.warrantyYears} 年
                  </td>
                  <td className="py-4 px-5 font-bold text-content-primary text-right whitespace-nowrap">
                    {row.retailPrice}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-content-muted">
          注：整车参考价适用于标准五座轿车/SUV，大型 MPV、超跑或异形宽体车型以和膜授权门店现场报价为准。
        </p>
      </ScrollReveal>

      {/* 五层复合结构解析 */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="Film Architecture"
          title="五层精密复合结构"
          description="每一微米各司其职，兼顾光学通透度、抗冲击韧性与无损拆装。"
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          {filmLayers.map((layer) => (
            <div
              key={layer.no}
              className="flex flex-col justify-between p-5 rounded-lg bg-elevated border border-border-subtle"
            >
              <div>
                <span className="text-xs font-bold tracking-widest text-content-brand">
                  LAYER {layer.no}
                </span>
                <h3 className="mt-2 text-base font-bold text-content-primary">{layer.name}</h3>
                <p className="mt-1 text-xs font-medium text-content-brand">{layer.spec}</p>
                <p className="mt-3 text-xs leading-relaxed text-content-secondary">{layer.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* 为什么要守护原厂车漆 */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="Why Factory Paint Matters"
          title="原厂车漆 vs 后喷修补漆"
          description="保护原厂漆，本质上是在保护车辆的长期资产残值。"
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {paintComparison.map((item) => (
            <Card key={item.dim} padding="lg" className="h-full">
              <h3 className="text-base font-bold text-content-primary mb-4">{item.dim}</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded bg-brand/6 border border-brand/20">
                  <span className="text-xs font-semibold text-content-brand block mb-1">
                    原厂车漆 + 和膜车衣守护
                  </span>
                  <p className="text-content-primary text-xs leading-relaxed">{item.factory}</p>
                </div>
                <div className="p-3 rounded bg-graphite border border-border-subtle">
                  <span className="text-xs font-medium text-content-muted block mb-1">
                    剐蹭后进店钣金补漆
                  </span>
                  <p className="text-content-secondary text-xs leading-relaxed">{item.repaint}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollReveal>

      {/* 13个理赔部位 */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="Claim Valuation"
          title="13 个车身独立理赔报价部位"
          description="发生单面刮擦事故时无需整车重贴，可凭和膜电子质保证书按受损部位精准核定补膜价值。"
        />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {ppfClaimParts.map((part, index) => (
            <div
              key={part}
              className="flex items-center gap-2.5 px-4 py-3 rounded bg-elevated border border-border-subtle min-w-[152px]"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-sm bg-brand/15 flex items-center justify-center text-xs font-bold text-content-brand">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-sm font-medium text-content-primary">{part}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            to="/warranty"
            className="inline-flex items-center gap-2 text-sm font-semibold text-content-brand hover:gap-3 transition-all"
          >
            前往电子质保查询已投保车辆部位价值 →
          </Link>
        </div>
      </ScrollReveal>

      <div className="mt-16 -mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
