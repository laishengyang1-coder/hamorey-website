# 和膜 HAMOREY — 3D 高定选色工坊（Color Studio）跨 AI 同步与调用文档

> 文档日期：2026-11-19（V3 升级：2026 官方 103 色 + Model 3/Y 双车型 + 真实物理棚拍光影）  
> 适用范围：供 Codex、WorkBuddy、Antigravity 等后续 AI 接手或对接小程序、活动 H5、后台色库、3D 车模替换时直接查阅与调用。  
> 部署状态：✅ 官网与双车型 3D 模型持续通过 GitHub Actions 自动部署至 `https://hemoppf.cn`（最新部署记录见 [`ANTIGRAVITY.md`](ANTIGRAVITY.md)）。

---

## 一、 功能定位与线上正式入口

本模块是和膜 **和彩 QCCY（8.0 mil 脂肪族光学级 TPU 改色车衣）** 的独立 3D 在线选色展厅（V3），已集成在品牌官网 React SPA 中：

| 入口名称 | 线上正式 URL | 说明 |
|---|---|---|
| **3D 高定选色工坊（全屏独立页面）** | `https://hemoppf.cn/color-studio` | 脱离官网白底页眉页脚，支持全屏 3D 展示、Model 3 / Model Y 双车型切换与小程序 `<web-view>` 内嵌 |
| **官网 TPU 改色车衣入口页** | `https://hemoppf.cn/products/color-ppf` | 含 3D 展厅横幅与 2026 官方全系 103 色拟真预览卡片，支持带色号直跳 `/color-studio` |
| **Model 3 焕新版 3D 资产** | `https://hemoppf.cn/models/tesla-model-3.glb` | 约 1.38 MB，`meshopt + webp` 压缩（保留完整平滑法线与原始材质槽，CC BY 4.0） |
| **Model Y 焕新版 3D 资产** | `https://hemoppf.cn/models/tesla-model-y.glb` | 约 1.50 MB，`meshopt + webp` 压缩（2026 Juniper 贯穿灯带，运行期剥离 `transmission` 零卡顿） |

---

## 二、 URL Query 调用协议（深链与外呼规范）

其他页面、营销海报二维码、微信公众号菜单或微信小程序 `<web-view>` 可通过以下 URL 参数直接控制选色工坊的初始状态：

| 参数名 | 可选值 / 示例 | 默认值 | 行为说明 |
|---|---|---|---|
| `code` | 2026 官方 103 色编码，如 `TPU-001S`、`TPU-028P`、`TPU-016M`、`TPU-CF`（不区分大小写） | `TPU-003S` | 设定初始选中的色号；未传或未命中时回退至 `TPU-003S`（纳多灰）。页面内切色后会通过 `window.history.replaceState` 实时同步 URL 参数。 |
| `mode` | `swatch` \| `car` \| `closeup` \| `macro` \| `sphere` | `swatch` | 设定初始 3D 视角：`swatch`（3D 悬浮流光曲率样板廊）、`car`（360° 实车整车）、`closeup`（腰线近景）、`macro`（8mil 微距肌理）、`sphere`（光影球体）。 |
| `car` | `model3` \| `modely` | `model3` | 设定初始展车车型：`model3`（Tesla Model 3 焕新版 Highland）、`modely`（Tesla Model Y 焕新版 Juniper）。按需懒加载并内存缓存，切换秒切。 |
| `embed` | `miniprogram` | 无 | **微信小程序 `<web-view>` 专用内嵌开关**：开启后自动隐藏左上角「返回官网」按钮，并将「定制选色单」弹窗底部的跳官网门店链接替换为小程序友好确认按钮。 |

### 常用调用示例
- 官网正常全屏访问：`https://hemoppf.cn/color-studio`
- 直接看 Model Y 龙血红整车：`https://hemoppf.cn/color-studio?code=TPU-028P&mode=car&car=modely`
- 直接看 Model 3 液态银整车：`https://hemoppf.cn/color-studio?code=TPU-016M&mode=car&car=model3`
- 微信小程序内嵌调用：`https://hemoppf.cn/color-studio?embed=miniprogram&code=TPU-044S&car=modely`

---

## 三、 微信小程序 `<web-view>` 后续接入指南

> 当前状态：本轮仅上线官网端，**`miniprogram/` 目录尚未改动**。后续负责小程序的 AI 请按以下步骤直接接入，写法可直接参照仓库内既有的 `miniprogram/pages/invitation/index/` 承载页。

1. **新建承载页四件套**（缺任一后缀都会导致 `npm run test:contracts` 失败）：
   - `miniprogram/pages/owner/color-studio/index.js`
   - `miniprogram/pages/owner/color-studio/index.json`（推荐 `"navigationBarTitleText": "3D高定选色"`）
   - `miniprogram/pages/owner/color-studio/index.wxml`
   - `miniprogram/pages/owner/color-studio/index.wxss`
2. **编写 `index.wxml` 与 `index.js`**：
   ```xml
   <web-view wx:if="{{!failed}}" src="{{src}}" bindload="onWebLoad" binderror="onWebError" />
   <view wx:else class="error">
     <text>3D 选色工坊暂时未能打开，请检查网络后重试</text>
     <button bindtap="retry">重新加载</button>
   </view>
   ```
   ```js
   const BASE_URL = 'https://hemoppf.cn/color-studio';
   Page({
     data: { src: `${BASE_URL}?embed=miniprogram`, failed: false },
     onLoad(options) {
       const params = ['embed=miniprogram'];
       if (options && options.code) params.push(`code=${encodeURIComponent(options.code)}`);
       if (options && options.mode) params.push(`mode=${encodeURIComponent(options.mode)}`);
       this.setData({ src: `${BASE_URL}?${params.join('&')}` });
     },
     onShow() {
       wx.showShareMenu({ menus: ['shareAppMessage'] });
     },
     onWebLoad() { this.setData({ failed: false }); },
     onWebError() { this.setData({ failed: true }); },
     retry() {
       const sep = this.data.src.includes('?') ? '&' : '?';
       this.setData({ failed: false, src: `${this.data.src}${sep}_t=${Date.now()}` });
     },
     onShareAppMessage() {
       return { title: '和膜 3D 高定选色工坊 · 实车换色预览', path: '/pages/owner/color-studio/index' };
     }
   });
   ```
3. **注册路由**：在 `miniprogram/app.json` 的 `"pages"` 数组中加入 `"pages/owner/color-studio/index"`。
4. **添加入口**：在车主端 `miniprogram/pages/owner/product/index.*`（`color` 分类「和彩 QCCY」卡片）及首页金刚区/轮播中跳转 `/pages/owner/color-studio/index`。
5. **双向跳转与通信（如后续需要跳回小程序报价/门店页）**：
   - 在前端 `index.html` 或 `ColorCardModal.tsx` 引入微信官方 JSSDK（`https://res.wx.qq.com/open/js/jweixin-1.6.0.js`），在 `isEmbed === true` 分支点击「到店看实膜 / 立即报价」时调用：
     ```ts
     window.wx?.miniProgram?.navigateTo({
       url: `/pages/owner/quote/index?color=${encodeURIComponent(swatch.code)}`,
     });
     ```
6. **微信后台与发版核验（红线）**：
   - 上线前必须在微信小程序后台「开发 -> 开发设置 -> **业务域名**」配置 `https://hemoppf.cn`（并放置微信校验文件到 `public/`）；
   - 小程序变更必须上传体验版并在微信真机实测通过后再提交审核发版；**禁止将 GitHub 网站推送等同于小程序生效**。

---

## 四、 核心源码与资产地图

| 文件路径 | 职责说明 |
|---|---|
| `src/config/colorStudio.ts` | 唯一主配置库：定义 `COLOR_STUDIO_SWATCHES`（首批 20 色）、`HECAI_SPEC`（8.0 mil / 6 年质保）、三档灯光预设 `LIGHTING_PRESETS`、7 大色系分组 `HUE_GROUPS` 与各色号 `optics` / PBR 材质参数 |
| `src/config/products.ts` | 保持官网 `productCategories` 原有结构，同步维护纯字面量 `colorPpfSwatches`（供兼容旧引用与静态检查） |
| `src/components/color-studio/studioEnvironment.ts` | 纯前端程序化生成 16-bit `HalfFloatType` 真 HDR 全景环境光（`studio` 暗夜光廊 / `gallery` 极昼展厅 / `sunset` 落日金辉）、`512×512` 微晶圆片法线贴图与「和膜 · HAMOREY」展车牌照贴图 |
| `src/components/color-studio/filmMaterial.ts` | 统一复用 `MeshPhysicalMaterial` 控制器（`clearcoatRoughness: 0.012~0.015`）+ 自定义珠光菲涅尔双色折光 GLSL 注入 |
| `src/components/color-studio/speedformBuilder.ts` | 原创「3D 悬浮流光曲率样板廊」几何构建（超跑中脊折线 + 双曲肩线 + 倒角折边 + 曜石金铭牌底座）与实时弯曲变形器 |
| `src/components/color-studio/ColorStudioCanvas.tsx` | 五视角 WebGL 舞台、精准世界顶点包围盒落地计算、`MeshoptDecoder` 异步加载、轮胎去标识清洗与响应式镜头控制 |
| `src/components/color-studio/ColorCatalogDrawer.tsx` | 曜石黑金「和彩全系色谱典藏」抽屉弹窗（搜索、工艺过滤、7 色系家族胶囊、立体漆面圆穹卡） |
| `src/components/color-studio/ColorCardModal.tsx` | 膜料参数说明、纯前端 Canvas 一键导出 900×1200 高清 PNG 选色单图片、授权门店转化按钮 |
| `src/pages/ColorStudioPage.tsx` | 全屏 `/color-studio` 交互页面（顶部导航、三档灯光、左侧光学铭牌卡、底部无滚动条流光色珠胶片轨） |
| `src/App.tsx` | 使用 `React.lazy` 注册 `/color-studio` 独立异步路由分包（不增加官网首页主包体积） |
| `src/pages/ColorPPFPage.tsx` | 官网 `/products/color-ppf` 页面：接入 3D 展厅入口横幅与 20 色拟真预览联动 |
| `src/config/navigation.ts`、`src/config/seo.ts`、`src/index.css` | 顶部/页尾「3D在线选色」导航、SEO 元信息、`.no-scrollbar` 隐藏横向轨道滚动条样式 |
| `public/models/hamorey-gt.glb`、`public/models/ATTRIBUTION.txt` | 2.36 MB 轻量化开源超跑模型及 CC-BY 4.0 署名文件 |

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

### 1. 扩充新色号
1. 打开 `src/config/colorStudio.ts`，按既有结构向 `COLOR_STUDIO_SWATCHES` 数组追加新色号对象（`finish` 选 `'crystal'` / `'metallic'` / `'pearlescent'`，填好 `hex`、`shiftHex`、`hueGroup`、`optics`、`material`）。
2. 同步在 `src/config/products.ts` 的 `colorPpfSwatches` 末尾追加纯字面量对象以保持两处对齐。
3. 无需修改 3D 组件，UI 计数、顶部编号总数、色珠轨道、典藏画廊与选色单导出全部自动更新。

### 2. 更换或新增 3D `.glb` 车模
1. **建模材质命名规范**（供 `ColorStudioCanvas.tsx` 自动识别与换色）：
   - 全车主要改色漆面材质名以 `Paint 1` 开头（如 `Paint 1 Body`）；
   - 车顶/侧裙等可切「悬浮黑顶」的拼接漆面材质名以 `Paint 2` 开头；
   - 车窗玻璃命名为 `Glass`、刹车卡钳命名为 `Brake`、车牌命名为 `License`。
2. **压缩规范（禁止依赖海外 CDN）**：
   - 中国大陆用户访问必须零海外 CDN 依赖，**严禁改用指向 `gstatic.com` 的 `DRACOLoader` 或外链 `.hdr`**；
   - 统一使用 `meshopt` 压缩（前端已内置 `three/examples/jsm/libs/meshopt_decoder.module.js` 本地解码），且压缩时务必关闭 `--simplify` 与 `--palette` 以免丢失材质名：
     ```bash
     npx @gltf-transform/cli optimize raw-car.glb public/models/hamorey-gt.glb \
       --compress meshopt --texture-compress webp --texture-size 1024 \
       --simplify false --palette false
     ```
   - `ColorStudioCanvas.tsx` 会通过真实世界坐标顶点自动计算精确包围盒，确保不同尺寸或带旋转节点的模型四轮均能严丝合缝贴合 `y = 0` 地面。

---

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

## 七、 本轮线上发布与验证记录（2026-11-18）

- **业务提交 SHA**：`3dc537ee8c89981d3d39b6ac817a6e405403de93`（短号 `3dc537e`）
- **GitHub Actions 部署流水线**：Run `44269834351`（`Deploy to Tencent Cloud`）状态 `Success`
- **线上实测验真**：
  - `https://hemoppf.cn/color-studio` & `https://hemoppf.cn/products/color-ppf`：均返回 `HTTP/2 200`，HTML 入口脚本 `/assets/index-De8zAlv-.js`（271,622 B）与分包 `/assets/ColorStudioPage-DqC3vJNM.js`（726,445 B）均 `HTTP/2 200`。
  - `https://hemoppf.cn/models/hamorey-gt.glb`：`HTTP/2 200`（`application/octet-stream`，2,356,744 B），SHA-256 `6f019704b7f91fc46f6a529c2a00a13220444a0fc358108a4f7160c69dc05bb5` 与本地逐字节一致。
  - `https://api.hemoppf.cn/api/health`：`HTTP/2 200`（`api`/`mysql`/`cos` 均为 `ok`）。
  - 小程序端：**本轮未改动 `miniprogram/`**，后续接入请严格按本文第三节执行。
