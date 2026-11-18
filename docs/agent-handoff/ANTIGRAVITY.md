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
