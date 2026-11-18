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
