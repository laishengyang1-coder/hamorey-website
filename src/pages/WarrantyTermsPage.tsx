// ============================================================
// 和膜 HAMOREY — 有限质保条款页 /warranty/terms/
// 与小程序官方《和膜有限质保条款》10 大章节及产品质保期限表保持一致
// ============================================================

import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { Card } from '../components/ui/Card';
import { siteConfig } from '../config/site';
import bannerImg from '../assets/hamorey/product-ppf.jpg';

const warrantyTables = [
  {
    category: '漆面保护膜 / PPF',
    rows: [
      ['和鼎 HD', '15 年'],
      ['和尊 HZ', '15 年'],
      ['和御 HY8', '10 年'],
      ['和旺 HW9', '10 年'],
      ['和雅 HYM 哑光', '10 年'],
      ['和旺 HW8', '8 年'],
      ['和兴 HX9', '7 年'],
      ['和兴 HX8', '6 年'],
    ],
  },
  {
    category: '汽车窗膜 / Window Film',
    rows: [
      ['和盾 10 / 35 / 70', '10 年'],
      ['和光 25 / 70', '10 年'],
      ['冷光紫 LGZ / 苍穹青 CQY（千层炫彩）', '10 年'],
      ['和护 15 / 35 / 70', '8 年'],
      ['和真 15 / 35 / 75', '8 年'],
      ['和原 10 / 35 / 75', '5 年'],
    ],
  },
  {
    category: 'TPU 改色车衣 & 天窗冰甲',
    rows: [
      ['和膜和彩 QCCY 全彩车衣', '6 年'],
      ['天窗冰甲 T1 / T2', '5 年'],
    ],
  },
];

const sections = [
  {
    num: '01',
    title: '适用范围',
    paragraphs: [
      '本有限质保条款适用于和膜正品漆面保护膜、汽车窗膜、TPU 改色车衣、天窗膜及经和膜确认适用的相关汽车膜产品。产品必须由和膜授权经销商或授权施工门店按照标准流程施工，并完成和膜电子质保登记及总部审核。',
      '本条款仅适用于已在和膜电子质保系统中显示为有效状态的产品。未完成电子质保登记、质保状态无效、质保信息不完整或产品来源无法核验的情况，不适用本有限质保条款。',
    ],
  },
  {
    num: '03',
    title: '质保生效条件',
    intro: '和膜产品质保需同时满足以下条件方可生效：',
    bullets: [
      '产品来源于和膜正规授权渠道；',
      '产品由和膜授权经销商或授权施工门店完成施工；',
      '经销商已在和膜电子质保系统中完成质保登记；',
      '质保记录已通过和膜总部或授权管理方审核，并显示为有效状态；',
      '车主可提供 VIN、质保记录、安装信息、产品信息或其他必要凭证；',
      '产品使用、清洁和维护方式符合和膜产品养护说明。',
    ],
  },
  {
    num: '04',
    title: '质保覆盖内容',
    intro:
      '在正常车辆使用和合理养护条件下，若产品出现经和膜或和膜授权管理方确认的材料或制造相关质量问题，可按本条款申请质保服务：',
    bullets: [
      '漆面保护膜：非人为造成的明显黄变、开裂、起泡、脱胶、分层或其他经确认的材料失效问题；',
      '汽车窗膜：非人为造成的明显褪色、脱胶、分层或影响正常使用的材料缺陷；',
      'TPU 改色车衣：非人为造成的异常开裂、脱胶、分层、明显褪色或材料稳定性问题；',
      '天窗膜：非人为造成的明显起泡、脱胶、分层、褪色或影响正常使用的材料缺陷。',
    ],
    outro:
      '具体是否属于质保范围，应以产品类别、实际安装情况、使用环境、养护情况、电子质保证书记录及和膜审核结果为准。',
  },
  {
    num: '05',
    title: '不属于质保范围',
    intro: '以下情况不属于和膜有限质保范围：',
    bullets: [
      '未经和膜授权经销商或授权施工门店施工、拆膜、补膜、重贴或改装所产生的问题；',
      '因施工不当、储存不当、运输损坏、错误使用或未按养护说明维护造成的问题；',
      '因车辆原厂漆面缺陷、二次喷漆、钣喷修复、漆面附着力异常、漆面老化等车辆本身问题导致的异常；',
      '因事故、碰撞、石击、划伤、火烧、水淹、自然灾害、人为破坏、外力撕扯等造成的损坏；',
      '使用强酸、强碱、研磨剂、腐蚀性清洁剂或不当清洁工具造成的问题；',
      '高压水枪近距离冲洗膜边、边角或接缝位置导致的翘边、进水或脱胶；',
      '正常使用过程中产生的轻微磨损、细小划痕、边缘积尘、轻微色差、轻微橘皮或不影响产品正常使用的外观变化；',
      '因未及时处理翘边、破损、污染物、水渍、鸟粪、树胶、沥青、虫胶等造成的进一步损伤；',
      '未在和膜电子质保系统中完成登记，或质保状态显示为无效、过期、驳回、作废的产品；',
      '超出电子质保证书载明的质保期限、产品范围、安装部位或适用区域的情况。',
    ],
  },
  {
    num: '06',
    title: '质保申请流程',
    intro:
      '如车主认为产品存在可能属于质保范围的问题，应优先联系原授权施工门店或和膜授权经销商，并提供必要信息用于核验：',
    bullets: [
      '车辆车架号（VIN）与电子质保证书编号；',
      '产品名称、产品系列、安装日期与安装门店信息；',
      '问题部位的清晰照片或视频；',
      '必要时提供车辆使用、养护、维修或事故记录。',
    ],
    outro:
      '和膜或授权管理方有权根据实际情况要求补充资料，并对问题原因进行判断。未经确认前，任何维修、更换、拆膜或重贴行为不应视为已获得和膜质保承诺。',
  },
  {
    num: '07',
    title: '车主日常养护注意事项',
    bullets: [
      '施工完成后的初期养护期（一般 7 天内），避免洗车、高压冲洗、暴晒后立即冲水或频繁触碰膜边；',
      '日常清洁时请使用中性清洁用品和柔软纤维毛巾；',
      '避免使用强酸、强碱、研磨剂、腐蚀性清洁剂或硬质刮擦工具；',
      '发现翘边、破损、鸟粪树胶附着或其他异常情况时，应及时联系授权施工门店处理；',
      '请妥善保留电子质保证书、安装信息及必要的售后沟通记录。',
    ],
  },
  {
    num: '08',
    title: '服务方式与责任限制',
    paragraphs: [
      '经和膜或授权管理方确认属于质保范围的情况，和膜可根据具体问题、产品类别、安装范围和当地服务条件，提供产品更换、补发对应材料、维修或重贴支持等合理的质保解决方案。',
      '除非当地法律另有强制规定，和膜有限质保不涵盖因产品问题间接产生的停用损失、交通费用、保险费用、替代车辆费用、商业损失、时间损失或其他间接、附带、特殊损失。',
    ],
  },
  {
    num: '09',
    title: '电子证书与数据说明',
    paragraphs: [
      '和膜电子质保证书是车主查询和售后沟通的重要凭证。网页公开展示可能会对敏感信息进行必要保护；用于售后、保险定损或打印存档的电子证书图片可显示完整核验信息。',
      '如纸质质保卡、口头承诺、聊天记录或其他渠道信息与和膜电子质保系统记录不一致，以和膜电子质保系统中的有效记录为准。',
    ],
  },
  {
    num: '10',
    title: '地区适用与条款解释',
    paragraphs: [
      '如本条款与当地强制性消费者保护法律法规不一致，以当地强制性法律规定为准；其余部分继续有效。和膜保留在合理范围内更新本有限质保条款的权利，更新后的条款将通过和膜官网及小程序公示。',
    ],
  },
];

export default function WarrantyTermsPage() {
  useSEO('warranty/terms');

  return (
    <PageLayout
      hero
      image={bannerImg}
      imagePosition="center 75%"
      subtitle="Limited Warranty"
      title="和膜有限质保条款"
      description="明确产品质保期限、生效条件、覆盖范围与售后服务流程，守护每一位和膜车主的长期权益。"
    >
      <div className="flex flex-col gap-10">
        {/* 第 1 条 */}
        <ScrollReveal>
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2 py-0.5 rounded bg-brand/12 text-xs font-bold text-content-brand">
                01
              </span>
              <h2 className="text-lg md:text-xl font-bold text-content-primary">适用范围</h2>
            </div>
            <div className="space-y-3 text-sm text-content-secondary leading-relaxed">
              {sections[0].paragraphs?.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Card>
        </ScrollReveal>

        {/* 第 2 条：质保期限表 */}
        <ScrollReveal>
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-0.5 rounded bg-brand/12 text-xs font-bold text-content-brand">
                02
              </span>
              <h2 className="text-lg md:text-xl font-bold text-content-primary">产品质保期限</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {warrantyTables.map((group) => (
                <div
                  key={group.category}
                  className="rounded-lg border border-border-subtle overflow-hidden"
                >
                  <div className="bg-[#1A0D0D] px-4 py-2.5 text-xs font-semibold text-[#E6C88A] tracking-wide">
                    {group.category}
                  </div>
                  <div className="divide-y divide-border-subtle text-sm bg-white">
                    {group.rows.map(([name, period]) => (
                      <div key={name} className="flex items-center justify-between px-4 py-2.5 gap-2">
                        <span className="text-content-primary">{name}</span>
                        <span className="font-semibold text-content-brand shrink-0">{period}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-content-muted leading-relaxed">
              注：不同批次、特定合作渠道或专供订单如另有约定，最终质保期限以和膜电子质保证书载明内容为准。质保期限自施工安装日期起计算。
            </p>
          </Card>
        </ScrollReveal>

        {/* 第 3–10 条 */}
        {sections.slice(1).map((sec) => (
          <ScrollReveal key={sec.num}>
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 rounded bg-brand/12 text-xs font-bold text-content-brand">
                  {sec.num}
                </span>
                <h2 className="text-lg md:text-xl font-bold text-content-primary">{sec.title}</h2>
              </div>
              {sec.intro && (
                <p className="text-sm text-content-secondary leading-relaxed mb-3">{sec.intro}</p>
              )}
              {sec.bullets && (
                <ul className="space-y-2 text-sm text-content-secondary leading-relaxed">
                  {sec.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0 mt-2" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {sec.paragraphs && (
                <div className="space-y-3 text-sm text-content-secondary leading-relaxed">
                  {sec.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              )}
              {sec.outro && (
                <p className="mt-3 text-xs text-content-muted leading-relaxed">{sec.outro}</p>
              )}
            </Card>
          </ScrollReveal>
        ))}

        {/* 联系方式 */}
        <ScrollReveal>
          <div className="p-6 rounded-lg bg-graphite border border-border-subtle text-sm text-content-secondary flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-semibold text-content-primary">售后与条款咨询</h3>
              <p className="mt-1 text-xs text-content-secondary">
                如需质保协助，请优先联系原授权施工门店，或通过邮件联系和膜品牌运营中心。
              </p>
            </div>
            <div className="text-xs space-y-1 shrink-0">
              {siteConfig.contact.phone && <div>电话：{siteConfig.contact.phone}</div>}
              <div>邮箱：{siteConfig.contact.email}</div>
              <div>地址：{siteConfig.contact.address}</div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </PageLayout>
  );
}
