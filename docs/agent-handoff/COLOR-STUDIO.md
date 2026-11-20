# 和膜 HAMOREY — 3D 高定选色工坊（Color Studio）跨 AI 同步与调用文档

> 2026-11-19（V4 已更新，见第七节）。本文最初对应业务提交 `95028f491a67af1c445816ed22acb621fdaf796e`，覆盖官网选色、活动 H5 深链和小程序承载页接入。网站发布回执与本机观察分开记录。

## 一、官网入口与选色方式

和彩 QCCY 为 8.0 mil TPU 改色车衣。官网产品页和全屏选色工坊共用《2026 电子色卡》的 103 个产品色号。

| 入口 | 用途 |
|---|---|
| [高定选色工坊](https://hemoppf.cn/color-studio) | 默认进入「流光样板」，首张为纳多灰 `TPU-003S`。可切换整车、近景、微距和球体四种展示。 |
| [TPU 改色车衣产品页](https://hemoppf.cn/products/color-ppf) | 浏览全系色板，携带当前色号进入工坊。 |

### 流光样板

- **轮转（V4 改为弹簧物理）。** 默认浏览全部 103 色，在选定工艺后只循环该组色卡。自动播放约每 3.4 秒前进一色。卡片共用转轴、停稳间隔 13.5°。全部动作由一个 rAF 弹簧阻尼循环驱动（刚度 165、阻尼 21）：拖动 1:1 跟手，松手按速度惯性滑过 1~5 张并吸附中心；高速时扇面最多再张开约 3.2°、停稳收拢；支持触控板/滚轮横扫与左右键。卡片静止后循环自动休眠，不空转。位姿只由 rAF 写 `transform`，不放入 React `style`，以免重渲染覆盖当前帧造成跳位。
- **拿起看漆面。** 双击中央或侧边的卡片可拿起指定颜色，也可点「拿起色卡」。拿起时暂停轮转，拖动可改变卡片角度与高光位置，双击、点「放回色卡」或按 Esc 可以放回。键盘焦点在样板上时，左右键切色，回车或空格拿起或放回。
- **暂停与恢复。** 打开全系色谱、定制选色单、拿起卡片或切到后台都会暂时停止自动前进。放回或直接关闭弹层后延续先前的播放状态。从色谱或底部色轨主动选色、切换工艺后保持暂停，点播放键可继续。系统开启「减少动态效果」时初始为暂停。
- **材质（V4 改为纯净漆面）。** 卡面只用色号主色生成亮/基/中/暗四级亮度色阶（不混入其它颜色），叠加纯 CSS 斜向柔光高光带；亮光、丝缎、哑光按粗糙度区分高光宽度与强度，金属/珠光加细密 CSS 微粒，珠光与变色龙加偏色光带。仅锻碳/碳纤维使用 `public/color-studio/paint/tpu-*.webp` 纹理。原册四色带取样（`fanFinishes.ts`）因会把相邻色带的杂色混入卡面，已停用并删除。柔光、展厅、落日三档照明共用同一选色状态。

### 首屏与 3D 加载

默认样板用 HTML/CSS 图层呈现。小程序和触屏浏览器在蜂窝网络或无法识别网络类型时，点进三维视图才加载相应资源。在明确的 Wi-Fi、以太网以及普通桌面浏览器上，可在样板页空闲时预取三维舞台和当前车型；省流量及慢速网络会跳过。切到 `car`、`closeup`、`macro` 或 `sphere` 加载 Three.js 舞台；其中仅整车、腰线近景需要加载所选车型的 GLB。已载车型可在当前 3D 舞台内复用。直接打开带 `mode` 的链接会进入指定视图。

## 二、 URL Query 调用协议（深链与外呼规范）

其他页面、二维码、分享链接或小程序可指定以下参数。页面切换色号、视图或车型后会用 `history.replaceState` 同步地址。

| 参数 | 可选值 | 默认值与行为 |
|---|---|---|
| `code` | 任一官方色号，如 `TPU-010S`、`TPU-028P`、`TPU-CF` | 不区分大小写。缺省或未命中时选纳多灰 `TPU-003S`。 |
| `mode` | `swatch` 流光样板、`car` 实车整车、`closeup` 腰线近景、`macro` 微距肌理、`sphere` 光影球体 | 默认 `swatch`。切换视图会保留当前所选颜色。 |
| `car` | `model3`、`modely` | 默认 `model3`。在样板页预选车型，进入整车或近景时加载对应模型。 |
| `embed` | `miniprogram` | 默认使用官网界面。内嵌时隐藏「返回官网」，选色单的门店动作改用内嵌页面提示。 |

- [云山蓝的扇形样板](https://hemoppf.cn/color-studio?code=TPU-010S&mode=swatch)
- [Model Y 龙血红整车](https://hemoppf.cn/color-studio?code=TPU-028P&mode=car&car=modely)
- [Model 3 液态银整车](https://hemoppf.cn/color-studio?code=TPU-016M&mode=car&car=model3)
- [小程序内嵌参数示例](https://hemoppf.cn/color-studio?embed=miniprogram&code=TPU-044S&car=modely)

## 三、和膜小程序选色入口与微信好友卡片

本节对应 2026-11-20 开发预览分支 `codex/mini-color-studio-20261120` 的业务提交 `9edeb33`。交付阶段见 [Codex 工作记录](CODEX.md)。

- 车主首页四个常用功能下方、和膜案例上方有固定的「在线选色」入口。位置见 `miniprogram/pages/owner/query/index.wxml` 和同目录样式。入口独立于后台轮播配置。
- 首页与微信聊天卡片都直达 `/pages/owner/color-studio/index`。专页使用 `web-view` 打开 [和膜官网选色工坊](https://hemoppf.cn/color-studio?embed=miniprogram)，从中文扇形样板开始，免登录。线上官网负责色库与交互更新。
- 页面右上角支持「转发给朋友」。卡片使用「和膜在线选色」及随小程序打包的 `/images/color-studio-share-20261120.jpg`（800 × 640）。接收方打开整个选色工坊的默认页。卡片和丽江邀请函、质保页分别设置。
- 发布前，用有预览权限的微信在真机核对内嵌网页和聊天卡片，尤其是封面、对方点开后的落地页及页面返回。正式业务域名为 `https://hemoppf.cn`。网站上线与微信小程序版本发布分别进行。

---

## 四、核心源码与资产

| 文件或目录 | 当前职责 |
|---|---|
| `src/config/colorStudio.ts`、`src/config/colorStudioVault.ts` | `colorStudioVault.ts` 以流式字节混淆存储 103 色加密载荷（构建包内零明文色表）；`colorStudio.ts` 导出解码后的 `COLOR_STUDIO_SWATCHES`、产品规格、灯光、色系与车型配置。 |
| `src/components/color-studio/studioGuard.ts` | FNV-1a 域名授权校验（仅放行 `hemoppf.cn`、`hhppf.com` 及其子域与本地调试地址）、色库解码、`HMRY` 加密车模容器解包、微信小程序环境综合检测与生产环境防右键/防快捷键护盾。 |
| `src/pages/ColorStudioPage.tsx`、`src/pages/ColorStudioFanLayout.css` | 维护共享色号、灯光、语言、工艺、选色单和深链；手机/小程序端采用不遮挡 3D 视口的顶部通栏胶囊条与安全区留白，弹窗或后台时自动暂停 WebGL 渲染。 |
| `src/components/color-studio/SwatchFan.tsx`、`SwatchFan.css` | 弹簧阻尼物理扇形色卡（精简混淆类名 `_hfs*` / `--_*`），支持同向拖动、脱手惯性、双击拾取、滚轮与方向键。 |
| `SwatchFanMaterial.tsx`、`SwatchFanMaterial.css`（同一组件目录） | 由主色生成纯亮度色阶与 CSS 反射层（混淆类名 `_hfm*`）；锻碳/碳纤维读取 `public/color-studio/paint/tpu-001fp.webp`、`tpu-002fp.webp`、`tpu-cf.webp`。 |
| `src/components/color-studio/ColorStudioCanvas.tsx`、`shaderballBuilder.ts`、`studioEnvironment.ts`、`filmMaterial.ts` | WebGL 舞台：支持 `.hmy` 加密车模流式拉取与内存解包、`shaderballBuilder.ts` 多曲率雕塑测试球 + 三阶刻度铭文展台、程序化棚拍 HDR 与物理车漆。 |
| `src/components/color-studio/ColorCatalogDrawer.tsx`、`ColorCardModal.tsx` | 色谱抽屉（移动端 16px 防 iOS 放大输入框 + 连续彩虹色谱条）；选色单支持桌面直接下载 PNG、手机/微信 `<web-view>` 弹出可长按保存大图预览及 `wx.miniProgram.postMessage` 回传色号。 |
| `src/App.tsx`、`src/pages/ColorPPFPage.tsx` | 工坊与产品页**均为独立异步路由**（`React.lazy`）。 |
| `src/config/products.ts` | 保留原产品结构及早期 `HC/HM/HP` 20 色兼容数组。现行选色页和产品页统一读取 `colorStudio.ts`。 |
| `src/config/navigation.ts`、`src/config/seo.ts`、`src/index.css` | 维护官网导航、页尾入口、页面元信息及色轨公共样式。 |
| `public/models/m3-atelier.hmy`、`my-atelier.hmy`、`ATTRIBUTION.txt`、`scripts/pack-color-studio-assets.mjs` | 两个 Tesla 车模的 `HMRY` 加密二进制容器（已移除公开 `.glb` 原文件，外部软件与爬虫下载无法直接打开；Model 3 1,384,056 B，Model Y 1,580,400 B）及打包脚本。 |

V4 已删除不再引用的 `speedformBuilder.ts`、`fanFinishes.ts`、`public/color-studio/finishes/`（103 张）与 `paint/` 下 clearcoat/metal-grain/pearl-grain/satin 四张图（合计约 680 KB）。

### 2026 官方电子色卡 103 色分类速查表

| 工艺分组（`finish`） | 官方系列（`seriesName`） | 数量 | 色号范围示例 | 材质特性 |
|---|---|---|---|---|
| `crystal` | 水晶 Sole | 37 | `TPU-001S` ~ `TPU-049S` | 高清亮光单色（含 `TPU-035S 总裁黑`、`TPU-049S 超哑碳黑`） |
| `metallic` | 金属 Metal | 23 | `TPU-001M` ~ `TPU-029M` | 微米金属颗粒 + 随角异色 flop（含亮光 / 丝缎 / 超哑） |
| `pearlescent` | 珠光 Pearly | 27 | `TPU-001P` ~ `TPU-048P` | 保亮度掠射角折光（注：原 PPT 第 65 页朱雀红编为 `TPU-001P` 避免与 `TPU-002P 珍珠白` 重号） |
| `chameleon` | 双色 Bicolor / 变色龙 Chameleon | 7 | `TPU-001B` ~ `TPU-006C` | 强双色 / 变色龙随角流转 |
| `special` | 镭射 / 合金 / 炫彩 / 锻碳 / 碳纤维 | 9 | `TPU-001L` ~ `TPU-CF` | 镭射、炫彩、合金、锻碳与碳纤维特质 |

---

## 五、 后续扩展指引（加色号 / 换车模）

### 1. 扩充或校准色号（V5 加密色仓流程）

1. 在运行期或本地导出当前 `COLOR_STUDIO_SWATCHES` 为临时 JSON（如 `/tmp/swatches.json`），修改或追加 `ColorFilmItem`（工艺可取 `crystal`、`metallic`、`pearlescent`、`chameleon` 或 `special`）。
2. 执行加密打包脚本重新生成 `src/config/colorStudioVault.ts`（切勿直接提交明文大 JSON，防止被外部爬虫一键扒走色表）：
   ```bash
   node scripts/pack-color-studio-assets.mjs pack-swatches /tmp/swatches.json
   ```
3. 删除临时 JSON，运行 `npm run build` 核对产品页、底部色轨、全系色谱与整车深链。

### 2. 更换或新增 3D 车模（V5 `.hmy` 加密容器流程）

现用 Model 3 Highland（车漆材质名 `Geohoodsub00021Mtl`）和 Model Y Juniper（车漆材质名 `paint`）。制作与加密替换步骤如下：

```bash
# 1) meshopt + webp 压缩（必须保留材质槽与平滑法线）
npx @gltf-transform/cli optimize raw-car.glb /tmp/candidate.glb \
  --compress meshopt --texture-compress webp --texture-size 1024 \
  --simplify false --join false --palette false

# 2) 封装为 HMRY 加密容器（前 64KB 混淆，保持后段可被 Nginx gzip 压缩 ~26%）
node scripts/pack-color-studio-assets.mjs pack-model /tmp/candidate.glb public/models/m3-atelier.hmy
```

**缓存、防盗链与版本号（V5）**：服务器对 `/models/` 启用 `valid_referers` 防盗链（放行 `hemoppf.cn`、`hhppf.com`、`servicewechat.com` 与空 Referer）、`gzip` 压缩及 7 天缓存。**替换同名 `.hmy` 文件时必须同步更新 `STUDIO_VEHICLES[].modelUrl` 的 `?v=YYYYMMDD`**。

大陆访问沿用站内模型、解码器与程序化灯光资源。接手时保留现有加载方式。

## 六、 构建门禁与避坑红线（所有 AI 必读）

1. **`scripts/check-warranty-years.mjs` 沙箱限制**：
   - 构建时会用 `esbuild` + 空 `require: () => ({})` 沙箱执行 `src/config/products.ts`；
   - **严禁在 `src/config/products.ts` 顶层调用导入模块的方法（如 `.map()`）**，也**严禁修改 `productCategories` 中 `color_ppf` 系列的 `series: []`**，否则会导致质保年限校验失败！
2. **`scripts/check-api-contracts.mjs` 安全扫描**：
   - 全仓禁止在 `src/` 与 `miniprogram/` 的源码字符串中出现 `?token=` 字面量；
   - `miniprogram/app.json` 中注册的每个页面必须同时拥有 `.js/.json/.wxml/.wxss` 四个文件。
3. **TypeScript 与 Cloudflare/Node 全局类型冲突**：
   - `tsconfig.json` 包含 `@cloudflare/workers-types`，在 `src/` 中使用定时器和动画帧务必显式写 `window.setTimeout` / `window.clearTimeout` / `window.requestAnimationFrame` / `window.cancelAnimationFrame`。
   - 不要轻易修改 `vite.config.ts`，因为 `tsconfig.node.json` 的 `noEmit: false` 会同步重写 `vite.config.js`；当前 `/color-studio` 已通过 `React.lazy` 自动分包为独立 chunk。
4. **推送前标准自检命令**：
   ```bash
   npm run test:contracts && npm run build && npm --prefix server run build
   ```
5. **生产部署与文档同步**：
   - 推送至 GitHub `main` 分支（提交信息**不带 `[skip ci]`**）即自动触发 `.github/workflows/tencent-production.yml` 构建并发布至腾讯云 `https://hemoppf.cn`；仅改交接文档时请附带 `[skip ci]`。

---

## 七、验证记录

### 2026-11-19 V4 体验与性能优化（Antigravity）

基线 `a3ba701`（含 Codex `95028f4` 扇形样板、`32d1738` 入口修复）。用户反馈：动画僵硬、色卡有不存在的杂色、不够流畅、色谱条丢失、水晶与金属部分颜色失真。

- 动画：扇形改为弹簧物理 + 惯性 + 静止休眠，修复 React 提交覆盖 rAF 位姿的跳帧（见第一节「轮转」）。
- 质感：停用原册色带混色与拉伸颗粒/遮罩图，改纯亮度色阶 + CSS 柔光（见第一节「材质」）。
- 色彩：水晶 37 色与金属 23 色按原厂车漆资料交叉校准（如 Nardo Grey、Miami Blue、Rosso Corsa、GT Silver、Frozen Berry、Lava Orange、Chalk Grey、Brooklyn Grey、Kemora Grey、Sao Paulo Yellow、Selenite Grey、Tiffany Blue、Hermès Orange），`nameEn` 同步更新。珠光/变色龙/特殊工艺未改。
- 体积与加载：删除约 680 KB 未用资源；`/products/color-ppf` 改懒加载，官网首页主包 370.8 KB → 287.5 KB（gzip 97 → 80 KB）；`/models/` gzip + 7 天缓存，`/color-studio/paint/` 7 天缓存；样板页空闲预取 3D 分包与车模。
- 功能：恢复「全系色谱典藏」连续彩虹色谱条。
- 本机核验：`npm run build`、`npm --prefix server run build` 通过；浏览器拖动/甩动/停稳无跳帧，双击拿起放回正常，`/products/color-ppf` 懒加载正常，首页正常，控制台 0 错误。
- 线上发布：业务提交 `f1ff80d`，Run `44495579649` Success；车模 gzip 生效（Model 3 968,912 B / Model Y 1,095,871 B）并缓存 7 天，首页主包 `index-DYKLqi8b.js` 287,523 B，各入口 200。详见 [`ANTIGRAVITY.md`](ANTIGRAVITY.md)。

### 2026-11-19 扇形色卡正式发布与验收

1. 业务提交 [95028f4](https://github.com/laishengyang1-coder/hamorey-website/commit/95028f491a67af1c445816ed22acb621fdaf796e) 通过[腾讯云部署](https://github.com/laishengyang1-coder/hamorey-website/actions/runs/44489370935)，北京时间 16:59 完成。第一次实站验收发现，`/color-studio` 会跳转到同名素材目录并返回 403。17:01 将页面路径精确映射到单页应用入口，保留子目录静态文件，校验配置并平滑加载。
2. 持久化修复为 [32d1738](https://github.com/laishengyang1-coder/hamorey-website/commit/32d1738b73db43ba13f840056700eb1763e1d3bd)。`scripts/tencent-production-deploy.sh` 负责生成路由配置，`.github/workflows/tencent-production.yml` 会同时检查带色号与带末尾斜杠的地址确实返回应用 HTML。17:10 腾讯云完成重新发布，新增的两项页面入口检查均通过。[路由修复部署记录](https://github.com/laishengyang1-coder/hamorey-website/actions/runs/44492616977)。
3. 正式域名上，样板深链、带斜杠入口及 TPU 产品页全部返回 200。核对 103 张色带切片、7 张漆面纹理和 2 个车模的 SHA-256，共 112 份与业务提交一致。生产 API、MySQL、COS 健康检查均为 `ok`。
4. 17:02–17:03 使用全新 Chrome 会话，在桌面 1440×900 和手机触屏仿真 390×844 验证云山蓝、星云紫深链、103 色、自动轮转、双击侧卡拾取、拖动反光与放回。桌面打开 Model Y 整车正常。两种屏幕均无横向溢出或资源请求错误。线上页面与 3D 分包分别为 `ColorStudioPage-DVzJxkRc.js`、`ColorStudioCanvas-2CFjQycS.js`。

### 2026-11-19 扇形交互与本机性能

对应功能提交 `95028f4`。本机桌面 Chrome 和手机触屏仿真核验了自动轮转、筛选、弹层、拾取侧卡、拖动漆面反光、放回与视图切换。减少动态效果开启时，样板默认保持静止。微信真机表现仍待验证。

在同一台 M4 Mac、Chrome 158、60 Hz、未限制 CPU 的条件下，对两个 3.02 秒自动轮转区间采样。桌面帧间隔第 95 百分位从 66.6 毫秒降到 16.7 毫秒，超过 50 毫秒的间隔从 12 次降到 0 次；模拟手机尺寸为 33.3 毫秒降至 16.7 毫秒。两个方向实测相邻卡片夹角都从 15.00° 张开至 17.06°，再回到 15.00°。这些数值仅对应上述设备与采样区间。

### 2026-11-19 双车型及 103 色库历史发布（V3）

业务提交 `b078bf1`，腾讯云部署任务 [44481110537](https://github.com/laishengyang1-coder/hamorey-website/actions/runs/44481110537) 成功。当天核验了官网入口、双车型资产字节数和 API 健康状态。详见 [Antigravity 发布记录](ANTIGRAVITY.md)。

### 2026-11-18 曲面样板廊历史发布（V2）

- **业务提交 SHA**：`3dc537ee8c89981d3d39b6ac817a6e405403de93`（短号 `3dc537e`）
- **GitHub Actions 部署流水线**：Run `44269834351`（`Deploy to Tencent Cloud`）状态 `Success`
- **线上实测验真**：
  - `https://hemoppf.cn/color-studio` & `https://hemoppf.cn/products/color-ppf`：均返回 `HTTP/2 200`，HTML 入口脚本 `/assets/index-De8zAlv-.js`（271,622 B）与分包 `/assets/ColorStudioPage-DqC3vJNM.js`（726,445 B）均 `HTTP/2 200`。
  - `https://hemoppf.cn/models/hamorey-gt.glb`：`HTTP/2 200`（`application/octet-stream`，2,356,744 B），SHA-256 `6f019704b7f91fc46f6a529c2a00a13220444a0fc358108a4f7160c69dc05bb5` 与本地逐字节一致。
  - `https://api.hemoppf.cn/api/health`：`HTTP/2 200`（`api`/`mysql`/`cos` 均为 `ok`）。
  - 小程序端：**本轮未改动 `miniprogram/`**，后续接入请严格按本文第三节执行。
