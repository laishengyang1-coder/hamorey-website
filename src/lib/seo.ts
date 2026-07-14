// ============================================================
// 和膜 HAMOREY — SEO Hook
// 管理页面 title / description / og:image / noindex
// ============================================================

import { useEffect } from 'react';
import { getSeoMeta, type SeoMeta } from '../config/seo';
import { siteConfig } from '../config/site';

/**
 * 设置页面 SEO 元数据
 * @param routeKey 路由 key（对应 seo.ts 配置）
 * @param overrides 可覆盖特定字段
 */
export function useSEO(routeKey: string, overrides?: Partial<SeoMeta>): void {
  const seo = { ...getSeoMeta(routeKey), ...overrides };

  useEffect(() => {
    // 设置 title
    const title = overrides?.title ?? seo.title;
    document.title = title;

    // 设置 description
    setMetaTag('name', 'description', overrides?.description ?? seo.description);

    // 设置 og:title
    setMetaTag('property', 'og:title', title);

    // 设置 og:description
    setMetaTag('property', 'og:description', overrides?.description ?? seo.description);

    // 设置 og:image
    const ogImage = overrides?.ogImage ?? seo.ogImage ?? '/og-default.jpg';
    setMetaTag('property', 'og:image', ogImage);

    // 设置 twitter:card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', overrides?.description ?? seo.description);
    setMetaTag('name', 'twitter:image', ogImage);

    // 设置 robots (noindex)
    const noindex = overrides?.noindex ?? seo.noindex ?? false;
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // 设置 og:url
    setMetaTag('property', 'og:url', `${siteConfig.siteUrl}${window.location.pathname}`);

    // 设置 og:site_name
    setMetaTag('property', 'og:site_name', `${siteConfig.brandName} ${siteConfig.brandNameEn}`);
  }, [routeKey, overrides?.title, overrides?.description, overrides?.ogImage, overrides?.noindex, seo.title, seo.description, seo.ogImage, seo.noindex]);
}

/**
 * 设置或更新 meta 标签
 */
function setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  let element = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}
