// ============================================================
// 和膜 HAMOREY — 电子质保证书样张预览卡片
// 用于质保查询页（初始态）与全车资产管家页，直观展示证书结构（全部脱敏示例）
// ============================================================

export function WarrantySamplePreview() {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-border-subtle">
      {/* 证书头部 */}
      <div className="bg-gradient-to-r from-[#4A0E0E] via-[#5C1A1A] to-[#3D0A0A] px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-wide">和膜 HAMOREY</span>
              <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium text-[#E6C88A]">
                样张示意
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-white/75">汽车膜品质保障 · 官方电子质保证书</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.18em] text-[#D9B97A]">WARRANTY CERTIFICATE</div>
            <span className="mt-1.5 inline-flex items-center rounded-full bg-[#D9B97A]/20 border border-[#D9B97A]/40 px-2.5 py-0.5 text-[11px] font-semibold text-[#E6C88A]">
              保障中
            </span>
          </div>
        </div>
      </div>

      {/* 产品摘要条 */}
      <div className="mx-4 mt-4 rounded-lg bg-graphite px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-brand">和膜隐形车衣 · 和御 HY8</div>
          <div className="text-xs text-content-secondary mt-0.5">旗舰级脂肪族 TPU · 10 年官方质保</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-content-muted">证书编号</div>
          <div className="text-xs font-mono font-bold text-brand mt-0.5">HM-2026-88****</div>
        </div>
      </div>

      {/* 核心档案字段 */}
      <div className="px-4 py-4 space-y-2 text-xs">
        {[
          ['车膜卷号', 'HI5672***-**（一卷一码防伪溯源）'],
          ['保护车辆', '保时捷 Taycan · 沪A·8***8'],
          ['质保周期', '2026-10-18 至 2036-10-18（10 年）'],
          ['施工单位', '和膜 HAMOREY 授权服务中心'],
          ['理赔定损', '含前机盖 / 保险杠 / 车门等 13 项单部位参考价'],
        ].map(([label, val]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 py-1.5 border-b border-border-subtle last:border-b-0"
          >
            <span className="text-content-muted shrink-0">{label}</span>
            <span className="font-medium text-content-primary text-right">{val}</span>
          </div>
        ))}
      </div>

      {/* 底部提示条 */}
      <div className="bg-graphite/70 px-5 py-2.5 flex items-center justify-between text-[11px] text-content-secondary border-t border-border-subtle">
        <span>支持高清电子证书长图下载与保险理赔核验</span>
        <span className="font-semibold text-brand">一车一档</span>
      </div>
    </div>
  );
}
