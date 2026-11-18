// ============================================================
// 和膜 HAMOREY — 全车资产管家页 /service/
// 四大闭环 + 六步标准施工规范 + 电子质保证书样张预览 + 理赔部位体系 + 在线查质保
// ============================================================

import { Link } from 'react-router-dom';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CTASection } from '../components/blocks/CTASection';
import { WarrantySearch } from '../components/blocks/WarrantySearch';
import { WarrantySamplePreview } from '../components/blocks/WarrantySamplePreview';
import bannerImg from '../assets/hamorey/lifestyle-2.jpg';

const serviceSections = [
  {
    title: '全车资产管家定义',
    content:
      '和膜不只是交付一卷车膜，而是以产品分级、标准施工、电子质保和单部位理赔参考，建立车辆全生命周期的漆面与玻璃防护档案。',
  },
  {
    title: '全车四膜协同方案',
    content:
      '汽车窗膜 + 隐形车衣 + TPU 改色车衣 + 天窗冰甲，覆盖前挡侧后挡玻璃、全车原厂漆面与全景天幕，一站式配齐整车防护。',
  },
  {
    title: '授权门店标准施工',
    content:
      '所有受保产品均须由和膜官方授权门店在标准工位完成装贴，施工过程实车拍照上传总部审核，确保包边细节与交付品质。',
  },
  {
    title: '一卷一码全链路追溯',
    content:
      '每卷和膜产品拥有唯一防伪质保卷号，历经总部入库、省代划拨、门店核销与实车绑定，杜绝假膜串货，保障车主正品权益。',
  },
];

const installStandards = [
  { step: '01', name: '接车漆面环检', desc: '多光源检测原车漆面划痕与铁粉状况，与车主当面确认施工方案。' },
  { step: '02', name: '无尘精洗去污', desc: '中性洗车液配合去铁粉、火山泥深层清洁缝隙，确保胶层零杂质贴合。' },
  { step: '03', name: '专车版型精裁', desc: '匹配车型曲面预裁或微调，减少车漆表面动刀风险与大面积拆卸。' },
  { step: '04', name: '恒湿降尘装贴', desc: '喷淋降尘工位专用安装液定型走水，赶水均匀无气泡、无水纹。' },
  { step: '05', name: '隐形包边收口', desc: '门边、机盖与翼子板边缘精细热风收边，美观隐形且洗车不易起翘。' },
  { step: '06', name: '复检建档交车', desc: '28 项交车细节复检并拍照上传系统，激活和膜官方电子质保证书。' },
];

export default function ServicePage() {
  useSEO('service');

  return (
    <PageLayout
      hero
      image={bannerImg}
      imagePosition="center 80%"
      subtitle="Asset Guardian"
      title="全车资产管家"
      description="三分膜，七分贴，十分靠保障。和膜以标准施工、数字质保与透明的部位理赔体系，守护您的爱车长期价值。"
    >
      {/* 1-4. 四大服务闭环 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {serviceSections.map((section, index) => (
          <ScrollReveal key={section.title} delay={index * 60}>
            <Card padding="lg" className="h-full">
              <span className="text-2xl font-bold text-content-brand/35">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-content-primary">{section.title}</h3>
              <p className="mt-2 text-sm text-content-secondary leading-relaxed">
                {section.content}
              </p>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      {/* 新增：六步标准施工规范 */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="Installation Standard"
          title="和膜六步匠心施工规范"
          description="从接车清洁到包边复检，标准化流程兑现每一卷高性能膜材的应有表现。"
        />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {installStandards.map((item) => (
            <div
              key={item.step}
              className="p-5 rounded-lg bg-elevated border border-border-subtle flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-content-brand">
                  STEP {item.step}
                </span>
              </div>
              <h3 className="text-base font-bold text-content-primary">{item.name}</h3>
              <p className="text-xs leading-relaxed text-content-secondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* 5. 电子质保证书（左说明 + 右真实证书样张） */}
      <ScrollReveal className="mt-16 md:mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6">
            <p className="text-xs md:text-sm font-medium tracking-[0.25em] text-content-brand uppercase">
              E-Warranty Certificate
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-content-primary">
              一车一档，随时可查的官方电子质保
            </h2>
            <p className="mt-4 text-sm md:text-base text-content-secondary leading-relaxed">
              施工完成并通过总部审核后，系统自动为爱车生成包含唯一证书编号、车膜卷号、施工门店快照与部位理赔价值表的电子质保证书。
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-content-secondary">
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                支持手机号、车牌号、VIN 车架号、质保码四种方式秒级核验
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                支持一键下载高清电子质保证书长图，便于车主存档与保险报案
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                关键信息采用历史快照固化，不受后续基础资料变更影响
              </li>
            </ul>
            <div className="mt-6">
              <Link
                to="/warranty/terms"
                className="inline-flex items-center gap-2 text-sm font-semibold text-content-brand hover:gap-3 transition-all"
              >
                阅读《和膜有限质保条款》全文 →
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <WarrantySamplePreview />
          </div>
        </div>
      </ScrollReveal>

      {/* 6. 保险理赔部位报价 */}
      <ScrollReveal className="mt-16 md:mt-20">
        <SectionHeading
          subtitle="Insurance Claim"
          title="透明的分部位事故理赔参考体系"
          description="车辆发生局部刮擦碰撞时，可凭电子质保证书调阅官方分部位补膜参考报价，协助车主高效定损。"
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg">
            <Badge variant="brand">隐形车衣 / TPU改色</Badge>
            <h3 className="mt-3 text-lg font-semibold text-content-primary">
              13 个车身独立部位
            </h3>
            <p className="mt-2 text-sm text-content-secondary leading-relaxed">
              涵盖前后保险杠、前机盖、四门、左右翼子板、车顶与后备箱盖，受损哪块补哪块，报价含工时与膜材综合价值。
            </p>
          </Card>
          <Card padding="lg">
            <Badge variant="brand">汽车窗膜</Badge>
            <h3 className="mt-3 text-lg font-semibold text-content-primary">
              6 大车窗玻璃部位
            </h3>
            <p className="mt-2 text-sm text-content-secondary leading-relaxed">
              覆盖前挡、后挡及左前、右前、左后、右后车窗玻璃，玻璃意外破损重贴时可按单窗核定参考价值。
            </p>
          </Card>
          <Card padding="lg">
            <Badge variant="brand">天窗冰甲</Badge>
            <h3 className="mt-3 text-lg font-semibold text-content-primary">
              整块天幕综合核定
            </h3>
            <p className="mt-2 text-sm text-content-secondary leading-relaxed">
              针对全景天窗与新能源超大天幕玻璃，按所贴 T1 / T2 型号提供整块天窗综合理赔参考报价。
            </p>
          </Card>
        </div>
      </ScrollReveal>

      {/* 质保查询入口 */}
      <div className="mt-16 md:mt-20 -mx-6 md:-mx-8">
        <WarrantySearch />
      </div>

      {/* 页尾行动区 */}
      <div className="-mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
