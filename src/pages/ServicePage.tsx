// ============================================================
// 和膜 HAMOREY — 全车资产管家页 /service/
// 8个区块
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

const serviceSections = [
  {
    title: '全车资产管家定义',
    content: '和膜不只是卖出一卷膜，而是以产品、施工、质保和理赔服务，建立车辆全生命周期的防护记录体系。让每一次施工都有记录，每一份保障都可查询。',
  },
  {
    title: '四膜产品组合',
    content: '窗膜 + 隐形车衣 + TPU改色车衣 + 天窗冰甲，四大产品体系覆盖全车玻璃与漆面防护需求，为不同车型与使用场景提供专业方案。',
  },
  {
    title: '授权门店和标准施工',
    content: '所有和膜产品均由授权门店完成标准施工，施工全程拍照留档，确保交付品质与可追溯性。',
  },
  {
    title: '三码合一与产品追溯',
    content: '每卷和膜产品配有唯一质保码，导入、划拨、登记、审核全流程追溯，确保产品来源可查、去向可追。',
  },
];

export default function ServicePage() {
  useSEO('service');

  return (
    <PageLayout
      hero
      subtitle="Service"
      title="全车资产管家"
      description="和膜与普通产品展示品牌的区别，在于以完整的服务闭环守护您的爱车资产。"
    >
      {/* 1-4. 定义/产品组合/施工/三码合一 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {serviceSections.map((section, index) => (
          <ScrollReveal key={section.title} delay={index * 80}>
            <Card padding="lg" className="h-full">
              <span className="text-3xl font-bold text-border-default/30">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-content-primary">
                {section.title}
              </h3>
              <p className="mt-2 text-sm text-content-secondary leading-relaxed">
                {section.content}
              </p>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      {/* 5. 电子质保证书 */}
      <ScrollReveal className="mt-16">
        <SectionHeading
          subtitle="E-Warranty"
          title="电子质保证书"
          description="总部审核通过后，系统自动生成可查询的电子质保证书。"
        />
        <div className="mt-8 p-6 rounded-lg bg-elevated border border-border-subtle">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-semibold text-content-primary mb-3">
                证书内容
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-content-secondary">
                <li>· HAMOREY 和膜品牌标识</li>
                <li>· 电子质保证书标题与证书编号</li>
                <li>· 质保码与产品信息</li>
                <li>· 车主、车辆与施工门店信息</li>
                <li>· 施工日期与质保到期日</li>
                <li>· 官网查询二维码</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-content-primary mb-3">
                证书特点
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-content-secondary">
                <li>· 整车质保可在一个 PDF 中分组展示</li>
                <li>· 适合车主保存和门店售后沟通</li>
                <li>· 随时通过官网查询验证</li>
                <li>· 快照字段确保历史记录不受资料修改影响</li>
              </ul>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 6. 保险理赔部位报价 */}
      <ScrollReveal className="mt-16">
        <SectionHeading
          subtitle="Insurance Claim"
          title="保险理赔部位报价"
          description="车主和保险公司可通过质保查询查看产品部位报价。"
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg">
            <Badge variant="brand">隐形车衣 / TPU改色</Badge>
            <p className="mt-3 text-sm text-content-secondary">
              13个车身部位：前/后保险杠、前机盖、翼子板、车门、车顶、后备箱盖等。
            </p>
          </Card>
          <Card padding="lg">
            <Badge variant="brand">窗膜</Badge>
            <p className="mt-3 text-sm text-content-secondary">
              6个玻璃部位：前挡、左前侧窗、右前侧窗、左后侧窗、右后侧窗、后挡。
            </p>
          </Card>
          <Card padding="lg">
            <Badge variant="brand">天窗冰甲</Badge>
            <p className="mt-3 text-sm text-content-secondary">
              整体报价，不拆分材料费与施工费。
            </p>
          </Card>
        </div>
      </ScrollReveal>

      {/* 7. 售后服务和长期记录 */}
      <ScrollReveal className="mt-16">
        <SectionHeading subtitle="After-Sales" title="售后服务与长期记录" />
        <div className="mt-8 p-6 rounded-lg bg-elevated border border-border-subtle">
          <p className="text-sm text-content-secondary leading-relaxed">
            和膜以数字质保系统建立车辆防护的长期记录。车主可通过官网随时查询质保状态、
            施工记录和到期提醒。保险公司可查询产品信息和部位报价，加速理赔流程。
            授权门店提供标准售后服务，确保每一份质保都有实际保障。
          </p>
        </div>
      </ScrollReveal>

      {/* 8. 车主查询入口 */}
      <div className="mt-16 -mx-6 md:-mx-8">
        <WarrantySearch />
      </div>

      <div className="mt-16 -mx-6 md:-mx-8">
        <CTASection />
      </div>
    </PageLayout>
  );
}
