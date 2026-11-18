// ============================================================
// 和膜 HAMOREY — 隐私政策页 /privacy/
// ============================================================

import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { Card } from '../components/ui/Card';
import { siteConfig } from '../config/site';

const sections = [
  {
    title: '一、信息收集范围',
    content: [
      '当您访问和膜 HAMOREY 官方网站或使用电子质保查询服务时，我们仅在提供相应服务所必需的范围内处理信息：',
      '1. 合作申请与业务咨询：您在表单中主动填写的姓名、联系电话、所在省市、门店/企业名称及留言内容；',
      '2. 电子质保查询：您输入的手机号码、车牌号、车架号（VIN）或质保卷号，仅用于实时检索并展示对应车辆质保档案；',
      '3. 基础运行日志：为保障系统稳定与防范恶意请求而记录的必要访问时间与网络请求日志。',
    ],
  },
  {
    title: '二、信息使用目的',
    content: [
      '1. 响应您的产品咨询或区域合作申请，安排专人与您沟通对接；',
      '2. 向车主、授权施工门店或保险理赔核验方展示经审核生效的车辆电子质保证书及部位参考报价；',
      '3. 维护电子质保系统的防伪溯源准确性与服务安全性；',
      '和膜不会将您的个人信息出售或非法提供给无关第三方用于商业营销。',
    ],
  },
  {
    title: '三、公开质保查询说明',
    content: [
      '1. 车主查询电子质保无需注册网站账号；',
      '2. 系统仅返回已完成授权施工并通过审核的有效质保档案；',
      '3. 我们已通过页面规则限制公共搜索引擎收录具体车辆质保结果页面，降低车辆信息被公开索引的风险。',
    ],
  },
  {
    title: '四、数据安全与存储',
    content: [
      '1. 全站采用 HTTPS 加密传输，管理后台与业务账号密码均采用不可逆加密摘要存储；',
      '2. 质保档案在产品质保周期及合理售后追溯期内妥善保存，以便车主在车辆养护、理赔或过户时持续可查；',
      '3. 严格限制内部人员访问权限，关键管理操作留存审计日志。',
    ],
  },
  {
    title: '五、您的个人信息权利',
    content: [
      '您有权就登记在和膜电子质保系统或合作咨询记录中的个人信息申请核实、更正，或在符合法律法规的前提下申请删除处理。如需办理，请通过下方联系方式与和膜品牌运营中心联系。',
    ],
  },
  {
    title: '六、政策更新',
    content: [
      '本隐私政策可能随法律法规要求及服务功能完善适时更新，更新版本将在本页面公示生效。',
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
      description="和膜 HAMOREY 个人信息保护与电子质保数据使用说明。"
    >
      <div className="flex flex-col gap-6">
        {sections.map((section, index) => (
          <ScrollReveal key={section.title} delay={index * 40}>
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-content-primary mb-3">{section.title}</h2>
              <div className="flex flex-col gap-2">
                {section.content.map((line, lineIndex) => (
                  <p key={lineIndex} className="text-sm text-content-secondary leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal className="mt-10">
        <div className="p-6 rounded-lg bg-graphite border border-border-subtle text-sm text-content-secondary">
          <h3 className="text-base font-semibold text-content-primary mb-2">联系我们</h3>
          <p className="mb-3 text-xs text-content-secondary">
            如您对个人信息保护有任何疑问或权利请求，请联系和膜品牌运营中心：
          </p>
          <div className="flex flex-wrap gap-6 text-xs">
            {siteConfig.contact.phone && <span>电话：{siteConfig.contact.phone}</span>}
            <span>邮箱：{siteConfig.contact.email}</span>
            <span>地址：{siteConfig.contact.address}</span>
          </div>
        </div>
      </ScrollReveal>
    </PageLayout>
  );
}
