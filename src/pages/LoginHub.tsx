// ============================================================
// LoginHub — 登录枢纽页（公开，无需登录即可访问）
// 聚合三大后台入口：总部后台 / 省代登录 / 门店登录
// 分栏式品牌布局：左勃艮第品牌面板 + 右角色卡片
// ============================================================

import React from 'react';

interface LoginEntry {
  /** 跳转地址（整页导航） */
  href: string;
  /** 卡片标题 */
  title: string;
  /** 卡片说明 */
  desc: string;
  /** 图标字符 */
  icon: string;
}

const LOGIN_ENTRIES: LoginEntry[] = [
  { href: '/admin', title: '总部后台', desc: '总部运营管理 · 数据总览', icon: '和' },
  { href: '/province/login', title: '省代登录', desc: '省级代理管理中心', icon: '省' },
  { href: '/store/login', title: '门店登录', desc: '门店施工与质保管理', icon: '店' },
];

/**
 * 登录枢纽页：列出三个后台入口，供不同角色选择。
 */
export default function LoginHub() {
  return (
    <div className="min-h-screen admin-canvas flex">
      {/* 左：勃艮第品牌面板（≥ md 显示） */}
      <aside className="admin-sidebar hidden md:flex md:w-[42%] lg:w-[40%] flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center">
            <span className="text-white text-base font-bold">和膜</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-wide">HAMOREY</span>
        </div>

        <div className="space-y-6">
          <div className="hairline-gold max-w-[200px]" />
          <h1 className="font-display text-4xl lg:text-5xl font-semibold leading-tight">
            和膜质保<br />管理中心
          </h1>
          <p className="text-white/70 leading-relaxed max-w-sm">
            覆盖选膜、施工、质保与理赔的全车资产管家。请选择对应角色入口，进入您的专属工作台。
          </p>
        </div>

        <p className="text-white/45 text-sm tracking-wide">不止于膜 · 全车资产管家</p>
      </aside>

      {/* 右：角色入口 */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div className="md:hidden text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#5C1A1A] mb-3 ring-1 ring-[var(--accent-gold)]/40">
              <span className="text-white text-lg font-bold">和</span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-[var(--paper-text)]">和膜 HAMOREY</h1>
          </div>

          <div className="mb-7">
            <p className="text-sm font-medium text-[var(--paper-muted)] uppercase tracking-[0.18em]">选择登录入口</p>
            <h2 className="font-display text-2xl font-semibold text-[var(--paper-text)] mt-1">进入您的工作台</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {LOGIN_ENTRIES.map((entry) => (
              <a
                key={entry.href}
                href={entry.href}
                className="admin-card admin-card--hover group p-6 flex flex-col items-center text-center"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#5C1A1A] mb-4 ring-1 ring-[var(--accent-gold)]/30 transition-transform duration-300 group-hover:scale-105">
                  <span className="text-white text-lg font-bold">{entry.icon}</span>
                </div>
                <h3 className="text-base font-semibold text-[var(--paper-text)]">{entry.title}</h3>
                <p className="mt-1.5 text-xs text-[var(--paper-muted)] leading-relaxed">{entry.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#5C1A1A] opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  进入 <span aria-hidden>→</span>
                </span>
              </a>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-[var(--paper-muted)]">
            如遇登录问题，请联系总部运营：400-888-0000
          </p>
        </div>
      </main>
    </div>
  );
}
