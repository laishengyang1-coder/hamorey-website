// ============================================================
// 和膜 HAMOREY — 质保条款页 /warranty/terms/
// V1 使用结构化占位文本
// ============================================================

import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { Badge } from '../components/ui/Badge';
import { siteConfig } from '../config/site';

const sections = [
  {
    title: '一、质保范围',
    content: [
      '和膜 HAMOREY 电子质保覆盖以下产品：',
      '1. 窗膜（和光、和盾、和护、和真、和原系列）；',
      '2. 隐形车衣（和御、和旺、和兴、和雅系列）；',
      '3. TPU改色车衣；',
      '4. 天窗冰甲（T系列）。',
      '建筑家居膜 V1 暂不提供电子质保服务。',
    ],
  },
  {
    title: '二、质保生效条件',
    content: [
      '1. 产品须由和膜授权门店施工；',
      '2. 施工后由门店通过质保码登记电子质保；',
      '3. 经总部审核通过后，质保记录状态变为"已生效"；',
      '4. 质保起始日为施工日期，到期日按产品质保年限计算。',
    ],
  },
  {
    title: '三、质保年限',
    content: [
      '1. 窗膜：默认5年质保（以产品型号设置为准）；',
      '2. 隐形车衣：和御/和旺/和兴系列10年，和雅哑光系列7年；',
      '3. TPU改色车衣：5年质保；',
      '4. 天窗冰甲：5年质保。',
      '具体质保年限以产品设置和质保码导入时保存的规则快照为准。',
    ],
  },
  {
    title: '四、质保内容',
    content: [
      '在质保期内，如产品出现以下非人为质量问题，和膜授权门店将提供相应售后服务：',
      '1. 窗膜：起泡、脱胶、严重褪色；',
      '2. 隐形车衣：开裂、脱胶、严重黄变（非人为因素）；',
      '3. TPU改色车衣：开裂、脱胶；',
      '4. 天窗冰甲：起泡、脱胶。',
    ],
  },
  {
    title: '五、不予质保的情形',
    content: [
      '1. 非和膜授权门店施工的产品；',
      '2. 因人为损坏、交通事故、自然灾害等外部因素造成的损伤；',
      '3. 因不当清洁或使用腐蚀性化学品造成的损伤；',
      '4. 未通过质保码登记或审核未通过的产品；',
      '5. 质保已到期或已作废的记录。',
    ],
  },
  {
    title: '六、质保码使用规则',
    content: [
      '1. 每个质保码全局唯一，三码合一；',
      '2. 窗膜质保码默认可使用24次（整车玻璃），其他产品默认1次；',
      '3. 质保码使用次数仅审核通过后扣减；',
      '4. 质保码状态包括：未划拨、库存、部分使用、已用尽、冻结、作废。',
    ],
  },
  {
    title: '七、质保查询',
    content: [
      '1. 车主和保险公司可通过官网 /warranty/ 页面查询质保信息；',
      '2. 查询支持手机号、车牌号、VIN 或质保码；',
      '3. 查询结果仅展示审核通过且状态有效的质保记录；',
      '4. 查询结果页禁止搜索引擎收录。',
    ],
  },
  {
    title: '八、理赔报价',
    content: [
      '1. 隐形车衣和 TPU改色车衣显示13个车身部位的理赔参考报价；',
      '2. 窗膜显示前挡、左前侧窗、右前侧窗、左后侧窗、右后侧窗、后挡共6个玻璃部位报价；',
      '3. 天窗冰甲显示整体报价；',
      '4. 报价仅作为当前官方参考，最终说明文字由总部确认。',
    ],
  },
];

export default function WarrantyTermsPage() {
  useSEO('warranty/terms');

  return (
    <PageLayout
      hero
      subtitle="Warranty Terms"
      title="质保条款"
      description="和膜电子质保范围与责任说明。"
    >
      {/* 占位提示 */}
      <ScrollReveal>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-status-warning/10 border border-status-warning/30 mb-8">
          <Badge variant="warning">注意</Badge>
          <p className="text-sm text-content-secondary">
            本质保条款为 V1 占位文本，正式版本待法务确认后替换。
          </p>
        </div>
      </ScrollReveal>

      {/* 条款内容 */}
      <div className="flex flex-col gap-8">
        {sections.map((section, index) => (
          <ScrollReveal key={section.title} delay={index * 50}>
            <div>
              <h2 className="text-lg font-semibold text-content-primary mb-3">
                {section.title}
              </h2>
              <div className="flex flex-col gap-2">
                {section.content.map((line, lineIndex) => (
                  <p
                    key={lineIndex}
                    className="text-sm text-content-secondary leading-relaxed"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* 联系方式 */}
      <ScrollReveal className="mt-12">
        <div className="p-6 rounded-lg bg-elevated border border-border-subtle">
          <h3 className="text-base font-semibold text-content-primary mb-3">
            联系我们
          </h3>
          <p className="text-sm text-content-secondary mb-2">
            如您对质保条款有任何疑问，请联系和膜总部：
          </p>
          <div className="flex flex-col gap-1 text-sm text-content-secondary">
            <span>电话：{siteConfig.contact.phone}</span>
            <span>邮箱：{siteConfig.contact.email}</span>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal className="mt-8">
        <p className="text-xs text-content-muted">
          最后更新日期：2026-07-13 | 版本：V1.0（占位）
        </p>
      </ScrollReveal>
    </PageLayout>
  );
}
