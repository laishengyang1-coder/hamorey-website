// ============================================================
// LoginHub — 登录枢纽页（公开，无需登录即可访问）
// 聚合三大后台入口：总部后台 / 省代登录 / 门店登录
// 使用纯 <a href> 触发整页跳转，因为 /admin、/province、/store
// 由 App.tsx 在 brandRouter 之外分发，客户端路由无法到达。
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
  /** 图标底色（完整字面量，供 Tailwind 扫描） */
  iconBg: string;
  /** 图标悬停色（完整字面量，供 Tailwind 扫描） */
  iconHover: string;
}

const LOGIN_ENTRIES: LoginEntry[] = [
  {
    href: '/admin',
    title: '总部后台',
    desc: '总部运营管理 · 数据总览',
    icon: '和',
    iconBg: 'bg-[#5C1A1A]',
    iconHover: 'group-hover:bg-[#7A2828]',
  },
  {
    href: '/province/login',
    title: '省代登录',
    desc: '省级代理管理中心',
    icon: '省',
    iconBg: 'bg-[#5C1A1A]',
    iconHover: 'group-hover:bg-[#7A2828]',
  },
  {
    href: '/store/login',
    title: '门店登录',
    desc: '门店施工与质保管理',
    icon: '店',
    iconBg: 'bg-[#5C1A1A]',
    iconHover: 'group-hover:bg-[#7A2828]',
  },
];

/**
 * 登录枢纽页：列出三个后台入口，供不同角色选择。
 */
export default function LoginHub() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#5C1A1A] mb-4">
            <span className="text-white text-2xl font-bold">和</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">和膜 HAMOREY 后台登录</h1>
          <p className="mt-2 text-sm text-gray-500">请选择对应的登录入口</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {LOGIN_ENTRIES.map((entry) => (
            <a
              key={entry.href}
              href={entry.href}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${entry.iconBg} mb-4 transition-colors ${entry.iconHover}`}
              >
                <span className="text-white text-xl font-bold">{entry.icon}</span>
              </div>
              <h2 className="text-base font-medium text-gray-900">{entry.title}</h2>
              <p className="mt-1 text-xs text-gray-500">{entry.desc}</p>
            </a>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          如遇登录问题，请联系总部运营：400-888-0000
        </p>
      </div>
    </div>
  );
}
