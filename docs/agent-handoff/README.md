# Codex 与 WorkBuddy 共享交接

建立日期：2026-11-16（Asia/Shanghai）

## 当前执行与交接状态

- **2026-11-20 · 和膜侧挡质保额度。** 9 个在售侧挡型号及 550 个已有卷码已调为每卷 20 次，前挡每卷 30 次。见 [窗膜额度交接与线上核验](WINDOW-FILM-QUOTA.md)。

- ✅ **2026-11-20 Antigravity：3D 高定选色工坊 V5（雕塑球体、代码审查、手机/小程序 `<web-view>` 适配与多层防 AI 复刻加密）已上线，可交接**（业务提交 `28132e6` + Nginx 修复 `22eea36`，[腾讯云 Run `44662472108`](https://github.com/laishengyang1-coder/hamorey-website/actions/runs/44662472108) Success）。基线 `6d83c01`（完整保留 Codex `9edeb33` 与 `8b939f1`）；线上 `.hmy` 加密车模 gzip 生效、异域 Referer 403 拦截、旧 `.glb` 404 移除、API 健康全 `ok`。仅改官网前端与部署脚本，未改小程序与后端接口。详见 [`ANTIGRAVITY.md`](ANTIGRAVITY.md) 与 [`COLOR-STUDIO.md`](COLOR-STUDIO.md)。

- **2026-11-20 · Codex · 小程序发版前修复。** 业务提交 `8b939f1` 已纳入微信开发者工具原项目。覆盖质保照片、兑换去重、电子证书装贴部位、部分已用码划拨、移动端三维预取。小程序由用户发版，官网、接口和真机验证状态见 [Codex 记录](CODEX.md)。

- **2026-11-20 · Codex · 和膜小程序在线选色开发预览。** 业务提交 `9edeb33` 已同步到用户微信开发者工具打开的共享项目（本地 `main`）。车主首页新增固定入口，微信好友卡片直接打开中文工坊。微信正式版仍待发布。见 [Codex 记录](CODEX.md) 与 [选色专题](COLOR-STUDIO.md)。

- ✅ **2026-11-19 Dot：和膜首屏扇形色卡左右拖动同向修复已上线，可交接**（`ada5918`，[腾讯云 #267](https://github.com/laishengyang1-coder/hamorey-website/actions/runs/44542311722) 成功）。先验收和膜、后验收 H&H 的线上左右拖动；H&H 已含同向逻辑，无需另发。未做手机真机或微信内验收。详见 [CODEX 交接](CODEX.md)。

- ✅ **2026-11-19 Antigravity：3D 选色工坊 V4 体验与性能优化已上线（业务提交 `f1ff80d`，Run `44495579649` Success）**：扇形色卡弹簧物理与静止休眠、纯净漆面去杂色、水晶/金属 60 色校准、恢复彩虹色谱条；删除约 680 KB 未用资源，首页主包 370.8→287.5 KB，车模 gzip 省约 30% 并缓存 7 天。基线 `a3ba701`，未改小程序与后端接口。详见 [`ANTIGRAVITY.md`](ANTIGRAVITY.md) 与 [`COLOR-STUDIO.md`](COLOR-STUDIO.md)。
**2026-11-19 · Codex · 流光样板可交接。** 官网 103 色已换为可张合、双击拾取的扇形色卡。业务版本 `95028f4`，深链修复 `32d1738`。桌面与触屏仿真已在正式域名验收。进入[流光样板](https://hemoppf.cn/color-studio?code=TPU-048P&mode=swatch)或查看[专题交接与发布回执](COLOR-STUDIO.md)。

### 此前各轮交接（按当时状态记录）

- ✅ **2026-11-19 Antigravity：官网「3D 高定选色工坊 V3」升级（Model 3/Y 双车型 + 2026 官方 103 色库 + 真实物理棚拍光影与流畅度优化）已推送并自动部署上线（业务提交 `b078bf1`，Run `44481110537` Success），线上双车模字节数与 API 健康检查通过，可交接**。基线 `192e5b7`；仅改动 `public/models/`、`src/config/colorStudio.ts`、`src/components/color-studio/`、`src/pages/ColorStudioPage.tsx`、`src/pages/ColorPPFPage.tsx` 与交接文档，未改动 `miniprogram/` 与后端接口。详情见 [`ANTIGRAVITY.md`](ANTIGRAVITY.md) 与 [`COLOR-STUDIO.md`](COLOR-STUDIO.md)。
- ✅ **2026-11-18 Antigravity：品牌官网（`https://hemoppf.cn`）全站视觉改版与产品/质保/门店内容升级已推送并自动部署上线（业务提交 `6b5e12f`，Run `44273441650` Success），线上路由与 API 健康检查通过，可交接**。合并基线 `3fd5a09`（完整保留 `3dc537e` 3D 选色工坊 V2 `/color-studio` 与 `1b4da72` 邀请函 `/lijiang2027/`）；仅改官网公众端 `src/`（58 个文件，含 `src/assets/hamorey/` 20 张品牌与案例素材）与交接文档，未改动 `miniprogram/` 与后端接口。详情见 [`ANTIGRAVITY.md`](ANTIGRAVITY.md)。
- ✅ **2026-11-18 Antigravity：官网「3D 选色工坊 V2」与跨 AI 同步调用文档（[`COLOR-STUDIO.md`](COLOR-STUDIO.md)）已推送并自动部署上线（业务提交 `3dc537e`，Run `44269834351` Success），线上资源哈希与 API 健康检查通过，可交接**。基线 `09d303b`；仅改官网前端、静态模型、依赖与交接文档，未改动 `miniprogram/` 与后端接口；线上入口 `https://hemoppf.cn/color-studio` 与 `https://hemoppf.cn/products/color-ppf`，详情见 [`ANTIGRAVITY.md`](ANTIGRAVITY.md) 与 [`COLOR-STUDIO.md`](COLOR-STUDIO.md)。
- 🆕 **2026-11-18 Antigravity：小程序第一批优化（功能与内容纠错）已推送（`52c21f4`），未上传体验版；第二批已按用户要求撤回。本轮结束，可交接**。基线 `a6f783c`；仅改 `miniprogram/`（38 个文件 + 新增 `utils/format.wxs`、`utils/warranty.js`），未触碰邀请函与省代兑换结算页。详情、检查结果与第二/三批待办见 [`ANTIGRAVITY.md`](ANTIGRAVITY.md)。其他执行方接手前请以该提交为基线重新核对。
- 邀请函记录：**Codex 2026-11-17 邀请函优化已上线，可接力**。业务提交 `1b4da72`，自动部署成功；28 项线上资源与本地逐字节哈希一致，音乐 206 分段请求与 API 健康检查通过。小程序已生成开发预览码，仍未上传体验版/审核/正式发版。WorkBuddy 已读取、核对并追加接收记录。
- WorkBuddy 本轮范围（已结束）：登记页 UI 修复、质保码模糊查找、省代代上质保多产品；**详情见 `WORKBUDDY.md`**。
- WorkBuddy 本轮终点提交：**`f6f08a6`**（= `origin/main`；在 `bda83c7` 之后又追加了「登记页间距+自动识别」`5636af4` 和「质保码查找彻底修正」`5da2e36`，均**仅小程序改动**，详见 `WORKBUDDY.md` 末尾三条追加；`3e3d028` 为省代撤回；`2b3e130` 为邀请函上线；`490d26b` 为内容改版、`bae7c6b` 为**按参考截图整版重排**（整屏雪山+金色艺术字+素材图上墙））。
- ⚠️ Codex 的核对基线原为 `bda83c7`；**再次接手前请以 `f6f08a6` 为基线重新核对**。
- Codex 本轮范围：基于 `49db250` 保留 WorkBuddy 最新 12 章内容/日期/人物对应；补重复入场动画、透明图片无损优化、配乐3.mp3、短屏适配与独立分享卡片。详情见 `CODEX.md` 最新记录。
- WorkBuddy → Codex：**已交接，Codex 已核对并接收记录**（2026-11-16，基线 `bda83c7`）；该条为早期交接记录；邀请函现已完成本地首版，最新以 `INVITATION.md` 和日志末尾为准。
- WorkBuddy 是否已读本约定：**已确认（2026-11-16）**，并已实际读取 `AGENTS.md`、`README.md`、`CODEX.md`、`WORKBUDDY.md`、`../workbuddy-handoff.md`。
- ✅ **邀请函 H5 已部署并验证**（`https://hemoppf.cn/lijiang2027/`；2026-11-17 最新业务提交 `1b4da72`）；小程序专属卡片须发布含本轮修改的新版才对普通用户生效。
- ⚠️ **小程序未发版**：本轮多处小程序改动（轮播图读接口、省份选择器、多产品登记、模糊查找）**尚未上传体验版/审核/发布**；
  网站与 API 已部署。Codex 评估邀请函入口时须考虑这一点。
- 共享目录：`/Users/haiyan/WorkBuddy/2026-07-13-15-25-25/hamorey-website-v1`。
- 同步方式：共享代码 + Git 记录 + 本目录交接日志；两个软件的聊天历史不自动互通。

## 接力流程

1. 当前执行方完成本轮任务，写自己的日志，明确“可以交接”或剩余阻碍。
2. 接手方读取两边日志、当前代码、提交差异和未提交改动，确认所列内容实际存在。
3. 接手方在自己的日志写收到的基线提交、保留的未提交改动及接手范围，然后更新本文件执行方。
4. 接手方完成后，同样记录实际改动和检查结果，向另一方同步；下一轮开始前再次读取。

不要同时修改同一工作树的业务文件。不要用一份新旧不明的项目复制品来同步。若工作位置改变，先记录真实路径、分支及提交关系。

## 每次交接必须覆盖

- 任务与状态；开始/结束时间；基线和结束提交。
- 改动文件与用途；新增/变化的页面、接口、数据表和资源。
- 已运行的检查、实际结果；未验证内容、已知问题和待办。
- 未提交/未跟踪文件及归属，不能遗漏图片等资源。
- 本地、提交、推送、网站/API 部署、小程序体验版、审核与正式发布各自的状态。
- 对另一方任务的影响，需要保留的功能和不得覆盖的改动。

## 已核对的项目事实（2026-11-17）

- 当前项目官网配置与实际可访问网址为 `https://hemoppf.cn`，生产 API 为 `https://api.hemoppf.cn/api`。
- 首页后台已有“和膜品牌2027年度优秀经销商大会”轮播图；Codex 检查时跳转字段为空。
- H5 已上线；小程序已有邀请函承载页及独立分享标题/封面/路径，开发预览编译通过，正式版本未发布。
- 首次接入邀请函仍需新增/注册小程序页面并测试发版；后台轮播的 `link_page` 只能指向已有小程序页面，不能直接填写 H5 网址来代替承载页。这是对 `WORKBUDDY.md` §10 中“只改后台即可”说法的范围补充。
- 微信后台“业务域名”配置未核验；不能由本地预览正常推定正式 H5 接入可用。
- 原有生产部署与历史交接见 `../workbuddy-handoff.md`；不要恢复已停用的 Cloudflare 生产方案。

## 日志入口

- [3D高定选色工坊跨AI同步与调用文档](COLOR-STUDIO.md)
- [Antigravity 工作记录](ANTIGRAVITY.md)
- [邀请函首版交接](INVITATION.md)
- [Codex 工作与接收记录](CODEX.md)
- [WorkBuddy 工作与接收记录](WORKBUDDY.md)
- [原有生产交接](../workbuddy-handoff.md)
