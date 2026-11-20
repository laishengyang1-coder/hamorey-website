# Antigravity 工作记录

> 协作约定见仓库根目录 `AGENTS.md` 与本目录 `README.md`。本文件只记录 Antigravity 的工作，不推定 Codex / WorkBuddy 的工作已完成。

## 2026-11-18：小程序第一批优化（功能与内容纠错）

- 用户要求：对小程序整体 UI 与内容做审查，并先完成「第一批：功能与内容纠错」。用户确认：和雅 HYM 质保为 **10 年**；天窗冰甲 T1/T2 参考价 **¥5000 不调整**。
- 基线：`a6f783c`（= `origin/main`，开始时工作区干净）。注意：`a6f783c` 是 2026-11-18 13:45 新提交的省代兑换地址簿修复，`WORKBUDDY.md` 中尚无对应交接条目；本轮**未改动** `pages/province/reward-checkout/*`。
- 范围：仅 `miniprogram/`；无后端、数据库、网站改动。

### 改动内容

| 问题 | 处理 | 文件 |
|---|---|---|
| WXML 直接调用 Page 方法（`{{statusLabel()}}`、`formatDate()`、`.split()`）渲染为空 | 新增 WXS 格式化模块，9 个页面改用 `fmt.*` | `utils/format.wxs`；store `records/edit/codes/orders/points`；province `codes/store-codes/points`；owner `stores` |
| `style: v2` 下原生 `<button class="btn-primary">` 被缩成 184px 窄条、带默认边框 | 全局提高优先级恢复通栏 | `app.wxss` |
| 首页 4 个内容模块被全局 `.section` 套上白框和分割线 | 首页内重置 `.section/.section-header` | `owner/query/index.wxss` |
| 首页「产品系列 › 全部」误跳品牌页 | 新增 `goProducts` 跳产品页 | `owner/query/index.{wxml,js}` |
| 英文副标题残留 `SUPERFILM` | 改为 `HAMOREY CASE` / `HAMOREY CASE GALLERY` | `owner/query`、`owner/cases` |
| 和雅 HYM 质保年限冲突（产品页 10 年 / 条款 8 年） | 条款改 10 年；补冷光紫 LGZ / 苍穹青 CQY（10 年）；覆盖内容补天窗膜；「PDF 证书」改为「电子证书图片」 | `owner/warranty-terms/index.wxml` |
| 质保状态写死「保障中」、装贴部位写死「整车」 | 按到期日显示保障中 / 已过保；按产品名推断 整车 / 车窗 / 天窗 | `utils/warranty.js`；`owner/result`、`owner/detail` |
| 授权门店名从地址截断（如「广西壮族自治店」）、省份标题重复、筛选后总数不变 | 重写区县提取（已用线上 132 家门店数据核对），同名加序号；同省门店归并；显示筛选后数量 | `owner/stores/index.{js,wxml}` |
| 车主「我的」中授权门店 / 关于和膜提示「即将上线」 | 改为跳转已存在页面；新增质保条款入口；移除无实现的「联系客服」 | `owner/profile/index.js` |
| 省代积分页「兑换记录」误跳积分商城 | 兑换记录页支持 `?scope=province`（读 `/province/redemptions`，该接口已存在） | `store/orders/index.js`、`province/points/index.js` |
| 从「我的质保码」带码登记会跳过车主/车辆且不识别型号，卡在第 3 步 | 从第 1 步开始，自动识别带入的码 | `store/register/index.js` |
| 门店 TabBar 遮挡「+ 登记质保」与列表末项 | 悬浮按钮上移到 TabBar 之上；TabBar 页底部留白含安全区 | `store/records`、`store/codes`、`store/index`、`store/points` 的 wxss |
| 质保详情照片一行只能放 2 张 | 200rpx + 16rpx 间距，一行 3 张 | `store/edit/index.wxss` |
| 兑换记录筛选栏吸顶压到手机状态栏 | 取消 sticky | `store/orders/index.wxss` |
| 「累计获得」= 可用 + 冻结，兑换后反而变小 | 文案改为「账户总积分」 | store / province `points/index.wxml` |
| 文案 | 漏字「此质保」→「质保码」；「录入」统一为「登记质保」；「前档」→「前挡」；无码提示改为联系省代或总部配发；未上牌显示「暂未上牌」；质保记录 active 显示「生效中」；兑换 pending 统一「待审核」 | 多处 |
| 公开接口携带残留 token 可能误弹「登录已过期」 | `/public/*` 调用显式 `auth: false` | owner `query/warranty/result/detail` |

### 检查结果

- `node --check`：全部改动 JS 通过；WXML 标签配对脚本检查 17 个改动文件通过；`format.wxs` 函数用 Node 垫片逐项验证输出。
- `npm run test:contracts`：通过（65 个小程序 API 调用）。
- **未执行**：微信开发者工具真机/模拟器逐页点验（开发者工具已打开该目录，会自动重新编译，需人工确认）；`npm run build`（本轮无网站改动）。

### 发布状态

| 项 | 状态 |
|---|---|
| 本地修改 | ✅ 已完成 |
| Git 提交 | ✅ 本地提交（见 `git log`，提交信息以 `fix(miniprogram): 第一批` 开头） |
| 推送 | ❌ 未执行（等待用户确认） |
| 网站 / API 部署 | 不涉及 |
| 小程序体验版 / 审核 / 正式发布 | ❌ 未执行 |

### 已知问题 / 未完成（第二、三批）

- 后端证书长图 `functions/api/_certificate.ts` 与网站 `src/pages/WarrantyPage.tsx` 的「装贴部位」仍写死「整车」，与小程序详情页的推断结果可能不一致；需后端改动并部署后统一。
- 车主端 `custom-tab-bar` 未挂载（`app.json` tabBar 只含 B 端页面）、省代 Tab 切换后底栏消失、彩色 Emoji 图标、子页色板不统一、首页图片超重（金刚区图标单张约 700KB、产品图约 1.5MB）——列入第二批。
- 扫码录码、报价页吸底汇总、案例大图预览、质保卡专属分享、驳回重传照片、登记页照片上传失败错位——列入第三批。

### 对其他执行方的影响

- 新增公共文件 `miniprogram/utils/format.wxs`、`miniprogram/utils/warranty.js`，后续页面请复用，勿在 WXML 中直接调用 Page 方法。
- `pages/store/orders` 现为门店 / 省代共用页（`?scope=province`）。
- 未触碰邀请函（`pages/invitation`、`public/lijiang2027`）与省代兑换结算页。

## 2026-11-18：第二批已按用户要求撤回

- 曾在本地提交第二批视觉与导航统一（`40b68bf`：底栏、图标、配色、首页图片压缩、首页布局）。用户查看后表示不满意，要求改回。
- 已 `git reset --hard 52c21f4` 撤回：第二批的代码、新增图片（`images/icons/`、`images/home/`）均已移除。该提交从未推送，`origin/main` 不受影响。
- 当前保留：第一批（`52c21f4`，未推送）。

## 2026-11-18：第一批已推送

- 用户确认推送第一批。`git push origin main`：`a6f783c..bd087cf`（含 `52c21f4` 第一批 + `bd087cf` 撤回记录），提交均带 `[skip ci]`，不触发自动部署。
- 状态：推送 ✅；网站 / API 部署不涉及；小程序体验版 / 审核 / 发布 ❌ 未执行。本轮到此结束，可交接。

## 2026-11-18：官网 3D 在线选色展厅（Color Studio V1）本地开发与验收

- **用户需求**：先在品牌官网上线 3D 改色选色器（复刻实体扇形色卡弯曲折光与 3D 整车换色质感，预留 `?embed=miniprogram` 参数供后续小程序 `<web-view>` 嵌入，本轮暂不改小程序），首批上线 **20 色**（水晶单色 8、金属 6、珠光 6），从零搭建合规 3D 车模与渲染方案。
- **基线与分支**：`main` 分支 `09d303b`（= `origin/main`，开始时工作区干净）。
- **范围约束**：仅新增/修改官网前端、静态模型资产与依赖，**未触碰** `miniprogram/`、`functions/`、`server/`、`migrations/`、`vite.config.ts` 与 `scripts/warranty-years.lock.json`。

### 新增与改动文件清单

| 类型 | 文件路径 | 用途说明 |
|---|---|---|
| 依赖 | `package.json`、`package-lock.json` | 安装 `three` (`^0.187.0` 实装 `0.187.0`) 与 `@types/three` |
| 3D 模型 | `public/models/hamorey-gt.glb`、`public/models/ATTRIBUTION.txt` | 基于 CC-BY 4.0 `CarConcept.glb` 用 `@gltf-transform/cli` 做 `meshopt` + `webp` 压缩（约 2.36 MB）；运行期剥离原 Khronos 徽标与轮胎贴字，牌照替换为「和膜 · HAMOREY」 |
| 色库配置 | `src/config/colorStudio.ts`、`src/config/products.ts` | 首批 20 色（`HC-01~08` 水晶单色、`HM-01~06` 金属、`HP-01~06` 珠光）物理材质参数与 `HECAI_SPEC`；同步 `products.ts` 中 `colorPpfSwatches` 字面量（保持 `productCategories` 原样不变） |
| 3D 组件 | `src/components/color-studio/studioEnvironment.ts` | 程序化汽车影棚 HDR 环境贴图、256x256 金属颗粒法线贴图与定制展车牌照贴图（零外部 CDN/HDR 依赖） |
| 3D 组件 | `src/components/color-studio/filmMaterial.ts` | 统一复用物理车漆材质控制器（Clearcoat、金属颗粒、自定义珠光菲涅尔双色折光着色器） |
| 3D 组件 | `src/components/color-studio/swatchFanBuilder.ts` | 11 片扇形 3D 色卡、镀铬金属铆钉、动态握柄印刷贴图与无拉伸圆弧弯曲变形 |
| 3D 组件 | `src/components/color-studio/ColorStudioCanvas.tsx` | 五模式 3D 舞台（色卡/整车/近景/微距/球体）、精确顶点包围盒落地、背景空间同色调联动、MeshoptDecoder 异步预加载 |
| UI 组件 | `src/components/color-studio/ColorCatalogDrawer.tsx` | 选色抽屉（关键词搜索、系列卡片、HSL 彩虹光谱条筛选、表面工艺过滤、3 列视觉卡） |
| UI 组件 | `src/components/color-studio/ColorCardModal.tsx` | 膜料参数详情、纯前端 Canvas 生成高清 PNG 选色单下载与授权门店入口 |
| 页面路由 | `src/pages/ColorStudioPage.tsx`、`src/App.tsx` | 全屏 `/color-studio` 选色展厅路由（`React.lazy` 独立拆包，不增加首页主包体积） |
| 官网联动 | `src/pages/ColorPPFPage.tsx`、`src/config/navigation.ts`、`src/config/seo.ts` | 改色车衣页新增 3D 选色展厅横幅与 20 色拟真预览；导航及页尾新增「3D在线选色」入口 |

### 检查与浏览器实机验证结果

- `npm run build`（全部 5 项门禁均在最终修改后通过）：
  - `npm run test:contracts`：通过（65 个小程序 API 调用与跨端守卫验证通过）。
  - `tsc -p tsconfig.functions.json --noEmit` & `tsc -b`：零报错通过。
  - `node scripts/check-warranty-years.mjs`：通过（40 项与 lock 一致）。
  - `vite build`：成功产出 `dist/`，`ColorStudioPage` 独立分包（719.73 kB / gzip 183.48 kB）。
  - `node scripts/check-spa-build.mjs`：通过。
- 本地浏览器实机验证（`http://127.0.0.1:5173`，桌面端 `1280x800` 与移动端 `390x844`）：
  - 控制台报错 `0`，`/models/hamorey-gt.glb` 返回 HTTP `200`，零 `>=400` 请求。
  - `/products/color-ppf` 4 组工艺筛选计数（全部 20 / 水晶单色 8 / 金属 6 / 珠光 6）与跳转 `/color-studio?code=...` 正常。
  - `/color-studio` 五大模式（色卡翻页/弯曲/双击拿起、整车落地阴影与悬浮黑顶/全车同色切换、近景细节、微距颗粒、球体反光）、选色抽屉光谱筛选与选色单弹窗均验证通过；轮胎与车身无 Khronos 标识残留，牌照为「和膜 · HAMOREY」。

### 发布状态

| 项 | 状态 |
|---|---|
| 本地开发与构建 | ✅ 已完成并验证（工作区保留未提交改动，本地 `127.0.0.1:5173` Vite 预览运行中） |
| Git 提交 | ❌ 未执行（等待用户预览确认） |
| 推送 | ❌ 未执行 |
| 网站 / API 部署 | ❌ 未执行 |
| 小程序 | ❌ 本轮未改动 `miniprogram/` |

### 对其他执行方的影响

- 若需接入其他功能，请保留当前工作区新增的 `/color-studio`、`src/config/colorStudio.ts`、`src/components/color-studio/` 与 `public/models/` 未提交文件，勿清理工作区或覆盖 `src/pages/ColorPPFPage.tsx`、`src/App.tsx`。

## 2026-11-18：官网 3D 选色展厅 V2 升级（原创流光样板廊 + 高定工坊 UI + 半浮点 HDR 车漆质感）

- **用户反馈与改进方向**：去除与竞品同质化的「铆钉扇形色卡」与白底卡通小车画廊，原创品牌专属 3D 样板形态，全面拔高 UI 高奢质感，并提升漆面与清漆高光对比度。
- **基线与分支**：同上（`main` 分支 `09d303b`，工作区接续 V1 未提交改动，仍未执行提交/推送/部署，**未触碰** `miniprogram/`、`functions/`、`server/`、`migrations/`、`vite.config.ts`、`scripts/warranty-years.lock.json`）。

### V2 核心升级清单

| 模块 | 文件路径 | 升级内容 |
|---|---|---|
| 3D 原创样板廊 | 新增 `src/components/color-studio/speedformBuilder.ts`（替换并删除 `swatchFanBuilder.ts`） | 原创「3D 悬浮流光曲率样板廊（Sculpted Speedform Atelier）」：超跑机盖中脊折线 + S 型双肩弧面 + 倒角折边 + 曜石黑香槟金铭牌底座；主样板居中配合左右 6 块景深侧翼样板呈弧形陈列，支持滑切/点选邻位、纵向曲率折光交互与双击特写 |
| 真 HDR 与微晶纹理 | `src/components/color-studio/studioEnvironment.ts` | 改用 `THREE.DataTexture` + `THREE.HalfFloatType` 生成 16-bit 真高动态范围全景环境贴图（峰值亮度 `11.2~12.2`），并支持 **暗夜光廊 (`studio`) / 极昼展厅 (`gallery`) / 落日金辉 (`sunset`)** 三档实时切换；金属颗粒法线升级至 `512×512` 微米圆片纹理 + `LinearMipmapLinearFilter` (`anisotropy=8`) 消除噪点锯齿 |
| 多层车漆物理材质 | `src/components/color-studio/filmMaterial.ts`、`src/components/color-studio/ColorStudioCanvas.tsx` | 压低分析光漫射消除泛白粉雾感、顶层清漆 `clearcoatRoughness` 降至 `0.012~0.015`；珠光平滑菲涅尔曲线 `smoothstep` 流光更通透；展台补充同色系地灯氛围光晕并放宽移动端 `OrbitControls.maxDistance` 至 `14.5` |
| 色库与高定 UI | `src/config/colorStudio.ts`、`src/config/products.ts`、`src/pages/ColorStudioPage.tsx`、`src/components/color-studio/ColorCatalogDrawer.tsx`、`src/components/color-studio/ColorCardModal.tsx`、`src/pages/ColorPPFPage.tsx`、`src/index.css` | 精调 20 色高对比色值并新增 `optics` 光学指标与 7 大色系家族；重构为曜石黑 × 香槟金高定工坊界面（顶部五模式分段控制器 + 三档灯光胶囊、左侧光学铭牌卡、底部无滚动条「流光色珠胶片轨」、暗金立体漆面圆穹画廊弹窗） |
| 跨 AI 同步文档 | 新增 `docs/agent-handoff/COLOR-STUDIO.md`、更新 `docs/agent-handoff/README.md` | 完整记录线上入口、URL Query 协议（`code`/`mode`/`embed=miniprogram`）、小程序 `<web-view>` 6 步接入指南、源码地图、扩展色号/换车模命令与构建红线 |

### V2 构建与浏览器实机校验结果

- `npm run build`（全部 5 项门禁在最终代码编辑后再次通过）：
  - `npm run test:contracts`：通过（65 个小程序 API 调用与跨端守卫验证通过）。
  - `tsc -p tsconfig.functions.json --noEmit` & `tsc -b`：零报错通过。
  - `node scripts/check-warranty-years.mjs`：通过（40 项与 lock 一致）。
  - `vite build`：成功产出 `dist/`，`ColorStudioPage` 独立分包（726.44 kB / gzip 185.63 kB）。
  - `node scripts/check-spa-build.mjs`：通过。
- `npm --prefix server run build`：通过（`dist/index.js` 398.4kb）。
- 浏览器实机验收（`1280×800` 桌面端 & `390×844` 移动端）：
  - 控制台报错 `0`，`/models/hamorey-gt.glb` HTTP `200`，无 `>=400` 请求。
  - 验证全新雕塑样板与铭牌底座、三档灯光实时切换（暗夜/展厅/落日）、全车/黑顶切换、微距微晶颗粒、光影球体、暗金 7 色系典藏画廊与定制选色单均正常工作；移动端 `390×844` 样板视图、顶部 `(i)` 边距与无滚动条胶片轨均正常，整车在 `390px` 窄屏下与上下浮层无遮挡（前唇边缘贴近左边界，支持双指缩放/旋转查看）。

### 当前发布状态

| 项 | 状态 |
|---|---|
| 本地开发与构建 | ✅ V2 已完成并验证 |
| Git 提交 / 推送 | ✅ 已提交推送至 `origin/main`（业务提交 `3dc537e`） |
| 网站 / API 部署 | ✅ GitHub Actions Run `44269834351`（`Success`），线上 `https://hemoppf.cn/color-studio`、`https://hemoppf.cn/products/color-ppf`、`/assets/ColorStudioPage-DqC3vJNM.js`、`/models/hamorey-gt.glb`（SHA-256 `6f019704...` 与本地一致）及 `https://api.hemoppf.cn/api/health` 均核验通过 |
| 小程序 | ❌ 本轮未改动 `miniprogram/`（接入指南见 `COLOR-STUDIO.md`） |

### 线上验证回执（2026-11-18）

- 正式业务提交 `3dc537ee8c89981d3d39b6ac817a6e405403de93` 已由 GitHub Actions `44269834351` 自动构建发布至腾讯云 `https://hemoppf.cn`。
- 线上实测 `/models/hamorey-gt.glb` 返回 `200`（2,356,744 B，SHA-256 `6f019704b7f91fc46f6a529c2a00a13220444a0fc358108a4f7160c69dc05bb5` 与本地完全一致），入口 `/assets/index-De8zAlv-.js` 与 3D 分包 `/assets/ColorStudioPage-DqC3vJNM.js` 均返回 `200`，API `/api/health` 返回 `mysql`/`cos` 全 `ok`。
- 跨 AI 同步调用文档 [`COLOR-STUDIO.md`](COLOR-STUDIO.md) 已随同提交上线，本轮到此结束，可交接。

## 2026-11-18：品牌官网全站视觉改版与产品/质保/门店内容完善（上线部署）

- **用户需求**：对标国际主流车膜官网（XPEL、STEK、龙膜、威固、圣科），全面重做和膜官网（`https://hemoppf.cn`）的视觉设计、移动端体验与缺失业务内容，随后直接部署上线、推送到 GitHub 并编写交接文档。
- **时间与分支基线**：2026-11-18（Asia/Shanghai）。在独立工作树基于 `09d303b` 完成开发与全站视觉巡检后，拉取远端最新提交 `3fd5a09`（含 `3dc537e` 3D 高定选色工坊 V2），无损合并至共享主仓 `main` 分支生成业务提交 `6b5e12f`（`6b5e12fc6ceffc8cc2b230944e591ee701a727c3`）；临时工作树 `hamorey-website-redesign` 与本地预览服务已在推送后清理移除。
- **范围约束**：仅修改/新增官网公众端 `src/` 与交接文档；**未改动** `miniprogram/`、`functions/`、`server/`、`migrations/`、`public/lijiang2027/`、`public/models/`、`src/components/color-studio/`、`src/pages/ColorStudioPage.tsx` 与 `scripts/warranty-years.lock.json`。

### 新增与改动文件清单（共 58 个业务文件）

| 模块 | 文件路径 | 改动与用途说明 |
|---|---|---|
| 纯净品牌视觉与实装图库 | 新增 `src/assets/hamorey/`（20 张：`logo-primary.png`、`logo-negative.png`、`hero.jpg`、`product-window.jpg`、`product-ppf.jpg`、`product-color.jpg`、`product-sunroof.jpg`、`product-architectural.jpg`、`lifestyle-0~3.jpg`、`cases/case-1~8.jpg`） | 替换原先带外部 `H&H` 贴字与裁切变形的橙色海报素材；提取官方勃艮第红主标与反白标，新增 8 张授权门店真实装贴案例图 |
| 全局导航 / 页尾 / 子页头 | `src/components/blocks/Navbar.tsx`、`src/components/blocks/Footer.tsx`、`src/layouts/PageLayout.tsx` | 接入官方品牌 Logo；修复移动端顶部导航在深色首屏上深色字隐形的 Bug（统一实底毛玻璃导航栏）；`PageLayout` 支持全宽深色沉浸式头图与 `imagePosition` 焦点控制；完整保留 `3D在线选色`（`/color-studio`）导航与页尾入口 |
| 首页核心区块重塑 | `src/pages/HomePage.tsx`、`src/components/blocks/Hero.tsx`、`ProductGrid.tsx`、`BrandStory.tsx`、`ProductSeriesHighlight.tsx`、`QualitySystem.tsx`、`CTASection.tsx`、新增 `CaseGallery.tsx` | 全屏深色质感首屏 + 底部 4 项核心数据信任条；暗黑杂志风五大产品矩阵（双层暗角渐变确保浅景头图文字高对比可读）；品牌故事补充母公司背景与交错实景双图；清理「参数待补充」「资质图标待品牌方提供后替换」等占位文案；新增真实装贴案例墙与三栏转化行动卡 |
| 产品中心与五大品类页 | `src/config/products.ts`、`src/config/seo.ts`、`src/pages/ProductsPage.tsx`、`WindowFilmPage.tsx`、`PPFPage.tsx`、`ColorPPFPage.tsx`、`SunroofFilmPage.tsx`、`ArchitecturalFilmPage.tsx` | `products.ts` 补齐车衣与天窗冰甲实测参数及全系 **8 款隐形车衣对比矩阵**（含 15 年质保旗舰「和鼎 HD / 和尊 HZ」，严格保持 `check-warranty-years.mjs` 锁定的 6 项 `series` 年限不变），并同步保留 20 款 3D 改色色板；`WindowFilmPage` 修正「六大系列」与「和护15/35」；`PPFPage` 新增 8 型号参数价格表、五层结构解析与原厂漆对比；`ColorPPFPage` 融合 **3D 选色展厅交互入口 + 首批 20 色拟真预览** 与 **真 TPU 对比传统 PVC 表格 + 实装案例墙 + 13 部位理赔** |
| 电子质保与条款体系 | `src/components/blocks/WarrantySearch.tsx`、新增 `WarrantySamplePreview.tsx`、`src/pages/WarrantyPage.tsx`、`WarrantyTermsPage.tsx`、`PrivacyPage.tsx` | 升级一体式质保查询框 + 三步核验指引 + 脱敏电子质保证书样张预览；将 `WarrantyTermsPage` 从 V1「待法务确认」占位草稿升级为正式 10 章电子质保条款（同步和雅 HYM 10 年、和鼎/和尊 15 年、冷光紫/苍穹青 10 年及天窗冰甲保障范围） |
| 授权门店 / 招商 / 服务 / 物料 | `src/components/blocks/StoreFinder.tsx`、`PartnerForm.tsx`、`src/pages/StoresPage.tsx`、`PartnerPage.tsx`、`ServicePage.tsx`、`MarketingMaterialsPage.tsx`、`FaqPage.tsx`、`ContactPage.tsx` | 门店查询拉取上限提升至 500 家覆盖全国省份，自动过滤无地址且无电话的空白测试门店，隐藏空营业时间行，支持省/市/等级一键重置全部；升级百店计划、全车资产管家、FAQ 与合作咨询页版式 |
| 基础 UI 组件与动效修复 | `src/components/ui/Select.tsx`、`Badge.tsx`、`ScrollReveal.tsx`、`src/index.css` | 将原生 `<select>` 重构为无障碍自定义按钮弹出下拉框，彻底修复 Chromium 双重下拉箭头重叠问题；`Badge` 增加 `w-fit shrink-0` 修复卡片内徽章被横向拉满；优化滚动入场速度并增加 1.2s 兜底显示防白屏，同时保留 `.no-scrollbar` 供 3D 选色工坊使用 |

### 检查与线上验证结果

- **构建与门禁全量通过**：
  - `npm run test:contracts`：通过（65 个小程序 API 调用与跨端守卫验证通过）。
  - `npm run build`：`tsc -p tsconfig.functions.json --noEmit`、`tsc -b`、`node scripts/check-warranty-years.mjs`（40 项一致）、`vite build`、`node scripts/check-spa-build.mjs` 全部零报错通过；确认 `dist/lijiang2027/index.html`、`dist/models/hamorey-gt.glb` 与 `dist/assets/ColorStudioPage-*.js` 均正常产出。
  - `npm --prefix server run build`：通过（生成 109 条 API 路由，`dist/index.js` 398.4kb）。
- **浏览器实机视觉验收**：
  - 桌面端（`1440×900`）与移动端（`390×844`）逐页巡检首页、五大产品页、电子质保、质保条款、授权门店、百店计划、品牌介绍、全车资产管家、物料中心，浏览器 Console `error = 0`、`warning = 0`。
- **腾讯云自动部署与线上巡检**：
  - GitHub Actions `Deploy to Tencent Cloud` Run `44273441650`（对应提交 `6b5e12f`，`/opt/hamorey/apps/DEPLOYED_COMMIT` = `6b5e12fc6ceffc8cc2b230944e591ee701a727c3`）执行 `Success`。
  - 线上实测 HTTP `200` 且新构建资源包已生效（`/assets/index--Wnpr_HV.js`、`/assets/index-Bv4y6bxG.css`、`/assets/ColorStudioPage-DaXFspA4.js`）：`https://hemoppf.cn/`、`https://hemoppf.cn/products/ppf`、`https://hemoppf.cn/products/color-ppf`、`https://hemoppf.cn/color-studio`、`https://hemoppf.cn/warranty`、`https://hemoppf.cn/warranty/terms`、`https://hemoppf.cn/stores`、`https://hemoppf.cn/lijiang2027/`、`https://hemoppf.cn/models/hamorey-gt.glb`、`https://system.hemoppf.cn/login/admin`、`https://api.hemoppf.cn/api/health`（`api`/`mysql`/`cos` 全 `ok`）。

### 发布状态

| 项 | 状态 |
|---|---|
| 本地修改与工作区状态 | ✅ 已完成，共享仓工作区干净，无未提交/未跟踪业务文件 |
| Git 提交 | ✅ 已提交（业务提交 `6b5e12f`） |
| GitHub 推送 | ✅ 已推送至 `origin/main` |
| 网站 / API 生产部署 | ✅ 已验证（GitHub Actions Run `44273441650` 自动部署腾讯云成功，线上各路由与 API 核验通过） |
| 小程序体验版上传 | ❌ 未执行（本轮仅改官网，小程序保持第一批 `52c21f4` 未发版状态） |
| 小程序审核 / 正式发布 | ❌ 未执行 |

### 未验证内容、已知问题与后续影响

- **已知待办**：后端证书渲染 `functions/api/_certificate.ts` 与前端质保结果卡片的「装贴部位」仍固定显示「整车」，后续若需与小程序按产品分类动态显示「整车 / 车窗 / 天窗」对齐，需单独修改后端并验证。
- **对其他执行方的影响与保护项**：
  - 请保留 `src/assets/hamorey/` 新增品牌视觉图库、`CaseGallery.tsx`、`WarrantySamplePreview.tsx` 及重构后的自定义 `Select.tsx`。
  - `src/pages/ColorPPFPage.tsx` 与 `src/config/products.ts` 已同时整合 3D 选色工坊 V2（`/color-studio`）与本次官网改版内容，后续修改改色车衣页时请勿回退任一侧功能，且勿改动 `products.ts` 中受 `warranty-years.lock.json` 校验的 `series` 年限字段。


## 2026-11-19：官网 3D 高定选色工坊 V3（Model 3/Y 双车型 + 2026 官方 103 色 + 真实棚拍光影与流畅度优化）

- **用户需求**：将概念超跑替换为 Tesla Model 3 焕新版与 Model Y 焕新版并支持双车型切换；按桌面《副本2026 电子色卡.pptx》全量替换为 2026 官方色库；解决 Model Y 拖拽卡顿及强光泛白失真问题，并推送部署上线。
- **基线与业务提交**：基于 `192e5b7`（= `origin/main`），业务提交 `b078bf1`（12 个文件改动），已推送并触发腾讯云自动部署。
- **范围约束**：仅修改 `public/models/`、`src/config/colorStudio.ts`、`src/components/color-studio/`、`src/pages/ColorStudioPage.tsx`、`src/pages/ColorPPFPage.tsx` 及 `docs/agent-handoff/`；未改动 `miniprogram/`、`functions/`、`server/`、`migrations/` 与 `scripts/warranty-years.lock.json`。

### 改动清单

| 模块 | 文件路径 | 说明 |
|---|---|---|
| 双车型 3D 资产 | 新增 `public/models/tesla-model-3.glb`（1,384,048B）、`public/models/tesla-model-y.glb`（1,580,392B）；删除 `hamorey-gt.glb`；更新 `ATTRIBUTION.txt` | Model 3 Highland（CC BY 4.0，保留原始材质槽与平滑法线做 `meshopt + webp` 压缩）与 Model Y Juniper 2026，支持 `?car=model3\|modely` 懒加载与内存缓存秒切 |
| 2026 官方 103 色库 | `src/config/colorStudio.ts`、`src/components/color-studio/ColorCatalogDrawer.tsx`、`src/pages/ColorPPFPage.tsx` | 从《2026 电子色卡》全量提取 103 色（水晶 37、金属 23、珠光 27、双色·变色龙 7、镭射·合金·炫彩·锻碳 9），区分亮光 / 丝缎 / 超哑 PBR 参数（注：原 PPT 第 65 页朱雀红编为 `TPU-001P` 避免与 `TPU-002P 珍珠白` 重号） |
| 真实物理棚拍光影与流畅度 | `src/components/color-studio/filmMaterial.ts`、`studioEnvironment.ts`、`ColorStudioCanvas.tsx`、`src/pages/ColorStudioPage.tsx` | 消除泛白（`ior: 1.5` 真实 F0、去 `iridescence`/`sheen`、保亮度珠光偏色、金属随角异色 flop、`NeutralToneMapping`、有边界棚拍柔光箱 + 深色地坪、单面玻璃）；消除卡顿（剥离 Model Y 大灯 `KHR_materials_transmission` 避免二次离屏渲染、移除 WebGL 上方 9 处 `backdrop-blur`、自适应 DPR 1.0–1.75、静态车模按需刷新阴影） |
| 跨 AI 文档 | `docs/agent-handoff/COLOR-STUDIO.md`、`ANTIGRAVITY.md`、`README.md` | 同步 V3 双车型参数、103 色分类与线上验证回执 |

### 构建与线上部署核验结果

- **本地门禁**：`npm run build`（`test:contracts` + `tsc` + `check-warranty-years.mjs` + `vite build` + `check-spa-build.mjs`）与 `npm --prefix server run build` 全量通过；本地浏览器实测白/红/蓝/金属银 4 色与拖拽流畅度 0 报错。
- **腾讯云自动部署**：GitHub Actions `Deploy to Tencent Cloud` Run `44481110537`（提交 `b078bf1`）执行 **`Success`**。
- **线上资产核验（2026-11-19 15:54 Asia/Shanghai）**：
  - `https://hemoppf.cn/models/tesla-model-3.glb`：`HTTP/2 200`，`1,384,048` 字节（与本地逐字节一致）
  - `https://hemoppf.cn/models/tesla-model-y.glb`：`HTTP/2 200`，`1,580,392` 字节（与本地逐字节一致）
  - `https://hemoppf.cn/color-studio`：`HTTP/2 200`，新构建入口 `/assets/index-BB9S3O8G.js` 已生效
  - `https://api.hemoppf.cn/api/health`：`{"ok":true,"checks":{"api":"ok","mysql":"ok","cos":"ok"}}`

### 发布状态

| 项 | 状态 |
|---|---|
| 本地修改与工作区状态 | ✅ 已完成，本地临时 `5173` 服务已关闭 |
| Git 提交与推送 | ✅ 已推送至 `origin/main`（业务提交 `b078bf1`） |
| 网站 / API 生产部署 | ✅ 已验证（Run `44481110537` Success，线上新模型与页面资源已生效） |
| 小程序体验版 / 审核 / 正式发布 | ❌ 本轮未改动 `miniprogram/` |

## 2026-11-19：3D 高定选色工坊 V4 体验与性能优化（已上线）

- **用户需求**：扇形样板动画僵硬、色卡有不存在的杂色、整体不够流畅、「全系色谱典藏」色谱条丢失、水晶与金属部分颜色失真；随后要求全面优化流畅度/质感/体积/加载速度并部署、写交接。
- **基线**：`a3ba701`（含 Codex `95028f4` 扇形样板、`32d1738` 入口修复、`a3ba701` 交接）。**业务提交**：`f1ff80d`。
- **范围**：仅官网前端、静态资源、Nginx 生成脚本与交接文档；未改 `miniprogram/`、`functions/`、`server/`、数据库。

### 改动

| 方向 | 内容 | 文件 |
|---|---|---|
| 动画 | rAF 弹簧阻尼物理（1:1 跟手、惯性吸附、滚轮/方向键、动态张合），静止自动休眠；位姿不走 React style，修复重渲染跳帧 | `SwatchFan.tsx`、`SwatchFan.css` |
| 质感 | 停用原册色带混色（杂色根因）与拉伸颗粒/遮罩图，改主色纯亮度色阶 + CSS 柔光高光；去掉昂贵 `mask` 与大半径多层阴影 | `SwatchFanMaterial.tsx`、`SwatchFanMaterial.css` |
| 色彩 | 水晶 37 + 金属 23 色按原厂车漆资料交叉校准，`nameEn` 同步 | `src/config/colorStudio.ts` |
| 功能 | 恢复「全系色谱典藏」连续彩虹色谱条（±26° 色相，与工艺/色系联动） | `ColorCatalogDrawer.tsx` |
| 体积 | 删除未用 `fanFinishes.ts`、`speedformBuilder.ts`、`public/color-studio/finishes/`（103 张）、`paint/` 4 张（约 680 KB） | — |
| 加载 | `/products/color-ppf` 改 `React.lazy`：首页主包 370.8 KB → 287.5 KB（gzip 97 → 80 KB）；样板页空闲预取 3D 分包与车模；车模 URL 加 `?v=20261119` | `src/App.tsx`、`ColorStudioPage.tsx`、`colorStudio.ts` |
| 服务器 | `/models/` 启用 gzip + `max-age=604800, stale-while-revalidate`；`/color-studio/paint/` 同样缓存 | `scripts/tencent-production-deploy.sh` |

### 检查与线上核验（17:41 Asia/Shanghai）

- 本机：`npm run build`、`npm --prefix server run build` 通过；浏览器拖动/甩动/停稳无跳帧、双击拿起放回、产品页懒加载、首页均正常，控制台 0 错误。
- GitHub Actions Run `44495579649`：**Success**（含 Codex 新增的 `/color-studio` 两种入口 HTML 检查）。
- 线上：`/models/tesla-model-y.glb?v=20261119` 返回 `content-type: model/gltf-binary`、`content-encoding: gzip`、`cache-control: public, max-age=604800, stale-while-revalidate=2592000`；实际传输 Model 3 968,912 B（原 1,384,048）、Model Y 1,095,871 B（原 1,580,392），约省 30%。
- 首页入口 `/assets/index-DYKLqi8b.js`（287,523 B）；`/color-studio?code=TPU-011S&mode=swatch`、`/color-studio/`、`/products/color-ppf`、`/` 均 200 且为应用 HTML；`/api/health` api/mysql/cos 全 `ok`。

### 发布状态

| 项 | 状态 |
|---|---|
| Git 提交 / 推送 | ✅ `f1ff80d` 已推送 `origin/main` |
| 网站部署 | ✅ Run `44495579649` Success，线上核验通过 |
| 小程序 | ❌ 未改动 |

### 对其他执行方的影响

- 替换 `public/models/` 同名模型时**必须**同步修改 `STUDIO_VEHICLES[].modelUrl` 的 `?v=`（服务器缓存 7 天）。
- 色卡质感不要再引入原册色带取样混色，否则会再次出现杂色；新增色号只需在 `colorStudio.ts` 填准 `hex`/`shiftHex`/`finish`/`material.roughness`。
- 微信真机表现仍待实测。

## 2026-11-20：3D 高定选色工坊 V5（雕塑球体、代码审查、手机/小程序适配与防 AI 复刻加密，已上线）

- **用户需求**：保留新版雕塑光影球体；全站与选色工坊深度代码审查及流畅度/质感/UI 优化；做好手机端及微信小程序 `<web-view>` 嵌入适配；增加针对外部 AI 复刻与扒站的代码/色库/车模加密防护；部署上线并同步 GitHub 交接文档。
- **基线**：`6d83c01`（含 Codex `9edeb33` 小程序入口与 `8b939f1` 移动端 Wi-Fi 预取策略，完整保留）。**业务提交**：`28132e6` + `22eea36`（Nginx `valid_referers` 重复参数修复）。
- **范围**：仅官网前端 `src/`、静态车模 `public/models/`、打包与部署脚本 `scripts/` 及交接文档；未改 `miniprogram/`、`functions/`、`server/`、数据库与 `warranty-years.lock.json`。

### 改动清单

| 模块 | 核心改动 | 涉及文件 |
|---|---|---|
| 高定雕塑球体 | 多曲率车漆壳体 + 黑钛双金腰带 + 三阶 60 刻度铭文曜石展台，校准桌面与竖屏构图 | `shaderballBuilder.ts`、`ColorStudioCanvas.tsx` |
| 代码审查与稳定性 | 弹窗/后台暂停 WebGL 渲染；去除遮罩 `backdrop-blur` 掉帧；补齐 `webglcontextlost`、WebGL 初始化容错、`Studio3DErrorBoundary` 与 3D 失败后「重试 / 返回流光样板」 | `ColorStudioCanvas.tsx`、`ColorStudioPage.tsx`、`ColorCatalogDrawer.tsx`、`ColorCardModal.tsx` |
| 手机与小程序适配 | 自动识别微信 `<web-view>` 与 `?embed=miniprogram`，同步顶栏标题「和膜在线选色」；顶部通栏紧凑胶囊条 + 刘海/底栏安全区 + `overscroll-none`；搜索框 16px 防 iOS 放大；选色单支持长按保存大图与 `wx.miniProgram.postMessage` | `studioGuard.ts`、`ColorStudioPage.tsx`、`ColorStudioFanLayout.css`、`ColorCatalogDrawer.tsx`、`ColorCardModal.tsx` |
| 防扒站与加密防护 | 103 色流式密文打包（产包零明文色表）；双车模转 `HMRY` 加密容器 `.hmy` 并删除 `.glb`；FNV-1a 域名哈希锁 + DOM/CSS 类名去语义化 + 生产防右键/快捷键护盾；Nginx `/models/` 防盗链 | `pack-color-studio-assets.mjs`、`colorStudioVault.ts`、`colorStudio.ts`、`studioGuard.ts`、`SwatchFan*`、`tencent-production-deploy.sh`、`public/models/*.hmy` |

### 检查与线上核验（2026-11-20 10:50 Asia/Shanghai）

- **本地验证**：`bash -n`、`npm run test:contracts`（65 项）、`npm run build`（含 40 项质保年限与 SPA 校验）、`npm --prefix server run build` 全通；`dist/assets/*.js` 零明文色名/色号；浏览器 `390×844` 小程序模式与 `1280×800` 桌面端实测 0 报错。
- **腾讯云部署**：Run `44662472108`（`22eea36`）**Success**（10:48:56）。
- **线上核验**：`m3-atelier.hmy`（gzip `1,027,939` B）与 `my-atelier.hmy`（gzip `1,154,829` B）均 200 且 7 天缓存；外部伪造 `Referer: https://evil-clone.ru/` 返回 **403**；微信 `servicewechat.com` 返回 **200**；旧 `tesla-model-3.glb` 返回 **404**；`/color-studio`、`/color-studio/`、`/products/color-ppf` 均 200（`index-CN6718SX.js`）；`/api/health` 全 `ok`。

### 发布状态

| 项 | 状态 |
|---|---|
| Git 提交 / 推送 | ✅ `28132e6`、`22eea36` 已推送 `origin/main` |
| 网站部署 | ✅ Run `44662472108` Success，线上核验通过 |
| 小程序 | ❌ 本轮未改 `miniprogram/`（`<web-view>` 直连线上域名自动生效） |

### 对其他执行方的影响

- 后续新增/调整 103 色请通过 `node scripts/pack-color-studio-assets.mjs pack-swatches <json>` 更新 `colorStudioVault.ts`，勿直接提交明文大色表；替换车模请用 `pack-model` 生成 `.hmy` 并同步更新 `?v=YYYYMMDD`。
- `studioGuard.ts` 已包含 FNV-1a 域名哈希白名单（`hemoppf.cn`、`hhppf.com`、`localhost`、`127.0.0.1` 及其子域）；若未来新增正式域名，需在 `studioGuard.ts` 添加对应哈希并在 `tencent-production-deploy.sh` 的 `valid_referers` 放行。
- 微信真机内长按保存选色图与好友转发仍待实机点验。
