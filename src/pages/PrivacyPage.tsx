// ============================================================
// 和膜 HAMOREY — 隐私政策页 /privacy/
// V1 使用结构化占位文本，正式版本待法务确认
// ============================================================

import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { Badge } from '../components/ui/Badge';
import { siteConfig } from '../config/site';

const sections = [
  {
    title: '一、信息收集',
    content: [
      '和膜 HAMOREY 在您使用官网和质保查询服务时，可能收集以下个人信息：',
      '1. 您在合作申请表单中提交的姓名、手机号、省市、公司名称、业务类型等信息；',
      '2. 您在合作咨询表单中提交的姓名、手机号、邮箱、咨询内容等信息；',
      '3. 您在质保查询时输入的手机号、车牌号、VIN 或质保码（仅用于查询，不长期保存查询记录）；',
      '4. 您访问网站时的 IP 地址、浏览器类型和访问时间等技术信息。',
    ],
  },
  {
    title: '二、信息使用',
    content: [
      '和膜收集的个人信息仅用于以下目的：',
      '1. 处理您的合作申请和咨询请求，与您建立联系；',
      '2. 提供质保查询服务，展示您的车辆质保信息；',
      '3. 改进网站功能和服务质量；',
      '4. 遵守法律法规的要求。',
      '和膜不会将您的个人信息出售或提供给第三方用于商业营销目的。',
    ],
  },
  {
    title: '三、质保查询规则',
    content: [
      '1. 质保查询不需要用户登录或绑定微信；',
      '2. 查询输入的手机号、车牌号、VIN 或质保码仅用于匹配质保记录；',
      '3. 查询结果页禁止搜索引擎收录（noindex）；',
      '4. 公开查询仅展示审核通过且状态有效的质保记录；',
      '5. 展示范围由总部设置，可能包括产品信息、施工日期、到期日期和施工门店。',
    ],
  },
  {
    title: '四、信息保护',
    content: [
      '1. 和膜采取技术和管理措施保护您的个人信息安全；',
      '2. 密码等信息以安全摘要形式存储，不保存明文；',
      '3. 查询接口限制高频重复请求；',
      '4. 后续可增加验证码、手机号验证和信息脱敏，不改变现有数据结构。',
    ],
  },
  {
    title: '五、信息保留',
    content: [
      '1. 合作申请和咨询记录在处理完成后保留一定期限，用于后续服务和审计；',
      '2. 质保记录长期保留，不因车主变更或门店停用而删除；',
      '3. 删除业务数据优先使用停用、作废或归档，不直接物理删除。',
    ],
  },
  {
    title: '六、您的权利',
    content: [
      '1. 您有权了解和膜如何收集和使用您的个人信息；',
      '2. 您有权要求查询、更正或删除您的个人信息；',
      '3. 如您行使上述权利，请联系和膜总部。',
    ],
  },
  {
    title: '七、政策更新',
    content: [
      '本隐私政策可能根据法律法规和业务需要进行更新。更新后的政策将在本页面发布，不另行单独通知。',
    ],
  },
];

export default function PrivacyPage() {
  useSEO('privacy');

  return (
    <PageLayout
      hero
      subtitle="Privacy Policy"
      title="隐私政策"
      description="和膜 HAMOREY 隐私政策，说明个人信息使用和查询规则。"
    >
      {/* 占位提示 */}
      <ScrollReveal>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-status-warning/10 border border-status-warning/30 mb-8">
          <Badge variant="warning">注意</Badge>
          <p className="text-sm text-content-secondary">
            本隐私政策为 V1 占位文本，正式版本待法务确认后替换。
          </p>
        </div>
      </ScrollReveal>

      {/* 政策内容 */}
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
            如您对本隐私政策有任何疑问，请联系和膜总部：
          </p>
          <div className="flex flex-col gap-1 text-sm text-content-secondary">
            <span>电话：{siteConfig.contact.phone}</span>
            <span>邮箱：{siteConfig.contact.email}</span>
            <span>地址：{siteConfig.contact.address}</span>
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
