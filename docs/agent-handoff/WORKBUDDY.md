# WorkBuddy 工作与接收记录

> 本文件最初由 Codex 于 2026-11-16 建立为空白模板（保留其说明：模板存在不代表 WorkBuddy 已确认或已发布）。
> 以下为 WorkBuddy 本人填写的第一份正式交接，历史条目只增不改。

---

## 2026-11-16 本轮交接（WorkBuddy 撰写）

### 0. 已读确认

- 已**实际读取**（非据聊天转述）：
  1. `AGENTS.md`（协作入口与每轮规则）
  2. `docs/agent-handoff/README.md`（共享交接流程与已核对事实）
  3. `docs/agent-handoff/CODEX.md`（Codex 本轮只读核对记录）
  4. `docs/agent-handoff/WORKBUDDY.md`（本文件，Codex 建立的模板）
  5. `docs/workbuddy-handoff.md`（2026-08-10 原有生产/部署交接，含腾讯云约束与「不要恢复 Cloudflare」）
- 上述 4 个协作文件由 Codex 创建、**当前仍未提交**（`git status` 可见 `?? AGENTS.md`、`?? docs/agent-handoff/`），
  WorkBuddy 本轮**未提交、未移动、未改写**它们（仅填写本文件，见下）。

### 1. 任务与状态

- 用户本轮交给 WorkBuddy 的任务：门店/省代**登记质保**相关改造 ——
  ① 登记页标题与说明挤在一起（UI）② 质保码输入缺近似查找 ③ 省代代上质保需支持一次多产品。
- **状态：业务修改已结束，可以交接。** 代码已提交、已推送、网站/API 已部署并验证。
- **唯一的未完成项属于「发布动作」，不属于代码**：小程序新版本尚未上传体验版（需要人工在微信开发者工具操作），详见 §7。

### 2. 位置、分支、起止提交

| 项 | 值 |
|---|---|
| 项目路径 | `/Users/haiyan/WorkBuddy/2026-07-13-15-25-25/hamorey-website-v1` |
| 分支 | `main`（跟踪 `origin/main`，无本地领先/落后） |
| 本轮起点（业务改造前）| `369e2f9` |
| **本轮终点（当前 HEAD）** | **`bda83c7`**（= `origin/main` = 线上部署版本）|
| 工作区 | 除 Codex 的 4 个未提交协作文件外，**干净** |

### 3. 本轮改动（起 `369e2f9` → 止 `bda83c7`）

#### 3.1 `cd4650f` — 一次登记多个产品的质保

| 文件 | 用途 |
|---|---|
| `migrations/phase17_warranty_batch.sql` | 给 `warranty_records` 加 `batch_id` / `batch_seq` + 索引（**已在生产库执行**；文件本身在 `369e2f9` 提前入库）|
| `functions/api/store/warranty-records-batch.ts` | **新增** `POST /api/store/warranty-records-batch`：车主/车辆一次 + `products[]`（1~8 个码），N 条记录同一事务写入 |
| `miniprogram/pages/store/register/index.{js,wxml,wxss}` | 门店登记页步序改为 车主→车辆→产品与质保码→拍照→确认；产品可「＋」增加 |
| `src/store/pages/WarrantyRegistrationPage.tsx` | 网页门店端：选码改为「选中即加入列表」，提交走批量接口 |
| `server/src/generated/function-routes.ts` | 生成文件（由 `server/scripts/generate-node-function-routes.mjs` 重建，**不要手改**）|

#### 3.2 `bda83c7` — 模糊查找 + 省代多产品 + UI 修复

| 文件 | 用途 |
|---|---|
| `miniprogram/pages/store/register/index.{js,wxml,wxss}` | ① 修 UI 挤压：带说明的 `section-header` 加 `stacked` 改纵向（6 处）② 每个产品行输入 ≥2 字即防抖搜索（250ms）候选并点选填入 ③ 样式补充 |
| `miniprogram/pages/province/register/index.{js,wxml,wxss}` | 省代代上：搜索框改「搜索→点结果即加入产品列表」，可连续加（上限 8）、可移除；确认页列全部产品码；提交改批量接口 |
| `functions/api/province/warranty-records-batch.ts` | **新增** `POST /api/province/warranty-records-batch`：选下属门店、码可来自省代或门店库存、**库存随货转移并入同一事务** |
| `server/src/generated/function-routes.ts` | 生成文件，重建至 **108** 条路由 |

### 4. 关联近期改动（同一会话、均已提交推送部署，Codex 需一并保留）

| 提交 | 内容 | 关键文件 |
|---|---|---|
| `36f58e6` | 组织积分「余额/累计消耗」口径修正：`freeze` 是正数被当成获得、`deduct` 实际为 0 导致消耗恒为 0；补 `freeze` 到可用/余额公式 | `functions/api/admin/points-ledger.ts`、`province/dashboard.ts`、`store/dashboard.ts` |
| `291414a` | 积分**排行榜**改「累计获得」口径（兑换不影响排名），5 处 SQL + 3 处文案 | `admin/dashboard.ts`、`province/dashboard.ts`、`store/dashboard.ts`、三个 `DashboardPage.tsx` |
| `369e2f9` | 开通质保账号必填 6 项（上级省代/省份/城市/地址/联系人/电话）+ 省份改下拉 + 存量省/市写法统一（河北→河北省、内蒙古→内蒙古自治区、城市补「市」）| `functions/api/_regions.ts`、`admin/organizations.ts`、`province/organizations.ts`、`src/shared/constants/regions.ts`、`miniprogram/config/regions.js`、两个 `StoreListPage.tsx`、`province/store-form/*` |
| `92bdfcd` | 小程序首页**轮播图改为后台可管理**：新表 `banners`、后台页 `/admin/banners`、小程序改读 `GET /api/public/banners`（保留本地 5 张作兜底）| `migrations/phase16_banners.sql`、`functions/api/admin/banners.ts`、`admin/banners/[id].ts`、`functions/api/public/banners.ts`、`admin/upload-url.ts`、`r2-upload/[[path]].ts`、`public/photos/[[path]].ts`、`src/admin/pages/BannersPage.tsx`、`src/apps/AdminApp.tsx`、`miniprogram/pages/owner/query/*` |
| `c023125` | 首页轮播追加「和膜品牌 2027 年度优秀经销商大会」海报（960×1280，含右下角白边处理）| `miniprogram/images/banner/banner-summit-2027.jpg`、`miniprogram/pages/owner/query/index.{js,wxml}` |

### 5. 数据结构变化（都已执行，勿重跑）

| 迁移 | 内容 | 生产库状态 |
|---|---|---|
| `migrations/phase16_banners.sql` | 新表 `banners`（轮播图）| **已执行**（表存在，5 条记录）|
| `migrations/phase17_warranty_batch.sql` | `warranty_records` + `batch_id` / `batch_seq` + `idx_wr_batch` | **已执行**（列与索引均存在）|
| 无迁移的纯数据订正 | 省份/城市写法统一；总部 `points_exempt` 曾被误设后**已回滚为 0** | 已完成并复核 |

新增接口（均为新增，未改动既有接口签名）：`/api/admin/banners`、`/api/admin/banners/:id`、`/api/public/banners`、
`/api/store/warranty-records-batch`、`/api/province/warranty-records-batch`；
`/api/admin/upload-url` 增加可选 `prefix`（默认 `reward-covers`，新增 `banners`）——**向后兼容**。

### 6. 未提交 / 未跟踪文件

- `AGENTS.md`、`docs/agent-handoff/README.md`、`docs/agent-handoff/CODEX.md`、`docs/agent-handoff/WORKBUDDY.md`
  → **均由 Codex 创建，属 Codex 归属**，WorkBuddy 未提交（本轮只按请求填写 WORKBUDDY.md 与 README 状态）。
- 业务代码：**无未提交改动**。
- 临时资源：本轮的验证脚本、报告生成器均在 `/tmp` 下（如 `/tmp/*.sh`、`/tmp/s1115/`），**不入库、可丢弃**。
- 图片等二进制：本轮新增的 `miniprogram/images/banner/banner-summit-2027.jpg` **已随 `c023125` 提交**，无未跟踪图片。

### 7. 发布状态（分开记录，互不推定）

| 渠道 | 状态 | 依据 |
|---|---|---|
| 本地修改 | **已完成** | 工作区除 Codex 文档外干净 |
| Git 提交 | **已完成** | `bda83c7` 及 §3/§4 各提交 |
| Git 推送 | **已完成** | `origin/main` = `bda83c7`；GitHub Actions 部署成功 |
| 网站 / API 部署 | **已部署并验证** | 服务器 `DEPLOYED_COMMIT` = `bda83c7`；`/api/health` 返回 200；新接口无 token 返回 401（已注册且有鉴权）|
| 小程序**体验版上传** | ❌ **未执行** | 需人工在微信开发者工具上传；WorkBuddy 无法代做 |
| 小程序**审核** | ❌ **未提交** | 依赖上一步 |
| 小程序**正式发布** | ❌ **未发布** | 线上小程序仍是旧版本 |

> ⚠️ **一次发版要覆盖的积压改动**（都只改在小程序代码里，尚未随版本发布）：
> ① 轮播图改读接口 + 新增大会海报（`c023125`/`92bdfcd`）
> ② 开店省份选择器（`369e2f9`）
> ③ 门店/省代登记页多产品 + 模糊查找 + UI 修复（`cd4650f`/`bda83c7`）
> 接口侧已全部向后兼容：旧版小程序不会报错（省份简称由后端自动归一；轮播图有本地兜底）。

### 8. 检查与结果

**已验证（实际执行）**
- `npx tsc --noEmit` 无输出；`npm run build` 通过（含 `check-api-contracts` **61** 条、`tsc -b`、`vite build`、`check-spa-build`）
- 三个改动页面的 `wxml` 结构校验通过（与 `province/codes`、`store/register` 等线上页同跑对照，确认校验器自身可信）；`node --check` 通过
- 真实接口端到端（用真实数据跑完再清理）：
  - 门店批量：2 个产品 → 2 条记录同 `batch_id`、`batch_seq` 1/2、同客户同车辆、均 pending、2 条审核日志；同码重复被拒
  - 省代批量：2 个产品 → 记录归属门店、`province_org_id` 为省代、**两个码自动划给门店 + 2 条划拨流水**；清理后记录数/码归属全部还原
  - 组织积分：147 个组织恒等式 `余额 = 累计获得 − 累计消耗` **0 例外**；总数 55092 / 61892 / 6800
  - 开店必填：缺字段 POST 返回 400 且**未写入**（组织数不变）；公开门店 131 家省份全为官方全称
- 轮播图：COS 签名直链 200 / `image/jpeg` / 141149 字节；`/api/public/photos/banners/…` 免登录 200

**未验证（明确未做，不要当成已验证）**
- 小程序**真机 / 体验版**上的实际表现（多产品页、搜索下拉点选、省份选择器、轮播图）
- 网页门店端「多产品录入」的**人工点测**（接口已验，UI 未点）
- 微信后台**业务域名**配置（与邀请函 H5 有关，见 §9）
- 审核侧「按批次整批通过」**尚未实现**

### 9. 已知问题 / 遗留事项

1. **小程序待发版**（见 §7 积压清单）——这是本阶段最大遗留。
2. **审核仍是逐条**：一辆车多个产品 = 多条待审核，总部需逐条通过。「按 `batch_id` 整批通过」未做。
3. `累计发放`（只算 `award`）与 `累计获得`（`award+adjust`）相差 80 分（3 笔人工调减），**属定义差异、非 bug**。
4. **省份/城市规范化是单向的**：前端已改下拉、后端已归一并校验，但历史自由文本仍可能再出现；建议后续在后台加「批量纠错」入口。
5. `src/admin/pages/OrganizationForm.tsx` 是**无人引用的死代码**（真正表单在两个 `StoreListPage` 内联）—— 未改，勿误改。
6. 数据里存在 `阿荣旗` 被填在「城市」字段（它是县级旗，正确应为 `呼伦贝尔市`），**未擅自修改**，待业务确认。
7. 轮播图后台的跳转字段（`link_page`）目前为空 —— 若邀请函希望从小程序首页进入，这是现成的口子（见 §10）。

### 10. 对 Codex 邀请函任务的影响 / 不得覆盖的改动

- **保留**：`miniprogram/pages/owner/query/index.js` 里的 `HOME_CONFIG.banners`（本地兜底图）**不要删**；
  轮播图已改为「优先读 `/api/public/banners`，失败回落到本地」，删掉兜底会导致接口异常时首页空白。
- **可复用的现成能力**：轮播图已可后台管理（`/admin/banners`，含上传、排序、启用停用、`link_page` 跳转）。
  若希望小程序首页出现「丽江年会邀请函」入口，**只需在后台新增一条轮播并填 `link_page`**，无需改代码、无需再发版；
  但它要求小程序已发到「读接口」的版本（见 §7 积压①）。
- **不要手改** `server/src/generated/function-routes.ts`（构建时自动重建）；新增 `functions/api/**` 文件后
  必须重新生成并**一并提交**，否则线上路由缺失。
- `migrations/phase16_banners.sql`、`phase17_warranty_batch.sql` **已在生产执行**，不要重复执行；
  如需回滚，两个文件头部都写了回滚语句。
- 部署链路未变：push `main` → GitHub Actions → 腾讯云（Nginx + PM2 `hamorey-api` + COS）。
  **不要恢复 Cloudflare 方案**（见 `docs/workbuddy-handoff.md`）。小程序不随 CI 发布，必须人工上传。
- 若邀请函是独立 H5：需确认微信后台**业务域名**、以及分享用的标题/封面/路径（小程序默认分享是电子质保，不能直接复用）。
- 本文件与 `README.md` 是协作记录，**不构成额外的部署或小程序发布授权**。

### 11. 后续协作规则确认

- ✅ 每轮**开始前先读** `docs/agent-handoff/CODEX.md`（及 README、AGENTS.md），并核对当前分支/提交/未提交改动。
- ✅ 每轮**结束前补写**本文件（`docs/agent-handoff/WORKBUDDY.md`），只增不改历史条目。
- ✅ 分开记录：本地修改 / Git 提交 / 推送 / 网站·API 部署 / 小程序体验版 / 审核 / 正式发布。
- ✅ 不覆盖对方改动、不清理对方未提交文件、不同时改同一工作树的业务文件。
- ✅ 两个软件的聊天记录不自动互通，**以本目录记录 + 实际代码 + Git 记录为准**。

### 12. 交接结论

- **WorkBuddy 本轮业务修改：结束，可交接。**
- 建议 Codex 接手前核对：`git log --oneline -7` 应为 `bda83c7 → cd4650f → 369e2f9 → 36f58e6 → 291414a → 92bdfcd → c023125`；
  工作区应只有 `AGENTS.md`、`docs/agent-handoff/` 四项未跟踪文件。
- 接手范围（Codex）：丽江年会邀请函；**本记录不覆盖邀请函的技术选型与素材**。

---

## 2026-11-16 追加（WorkBuddy · 新终点 `5636af4`）

> Codex 已在 `CODEX.md` 记录「收到交接、基线 `bda83c7`」。此条目为交接后用户新提的需求，
> **基线应更新为 `5636af4`**，核对时请以本条目为准。

### 触发
用户真机验收截图反馈两点：① 「＋ 再添加一个产品」与下方说明仍显拥挤 ② 填了质保码没有自动识别出产品型号。

### 改动（仅小程序，无接口/表/迁移变化）

| 文件 | 用途 |
|---|---|
| `miniprogram/pages/store/register/index.{js,wxml,wxss}` | ① 行间距 16→28rpx、按钮与说明间留 20rpx、说明压成一行 ② 每行增加「✓ 已识别：型号」/「✗ 不在本店库存或次数用完」 ③ 失焦精确识别 + 点选候选直接带型号 ④「下一步」校验：非空码必须识别成功 |
| `miniprogram/pages/province/register/index.{js,wxml,wxss}` | 已添加列表显示型号（点搜索结果时带上 `model_name`）|

**新增的小程序外部调用**：`/store/warranty-codes`（复用既有接口，无后端改动）；契约检查 61 → **62**。

### 验证
`node --check` 通过；`npx tsc --noEmit` 无输出；`npm run build` 通过（含契约 62 条、vite 构建）；
三个页面 WXML 结构校验通过（与线上对照页同跑）。

### 发布状态（更新 §7 的表）

| 渠道 | 状态 |
|---|---|
| 本地修改 / Git 提交 / 推送 | ✅ 完成（`5636af4` = `origin/main`）|
| 网站 / API 部署 | 本次**无后端与网页改动**；CI 会随推送重新发布同一内容，不影响功能 |
| 小程序体验版 / 审核 / 正式发布 | ❌ 仍未上传、未审核、未发布 |

### 未验证 / 对 Codex 的影响
- **改动未在真机复验**（仅结构与语法校验）；需重新上传体验版才能看到。
- 小程序积压发版清单再加一条：**登记页间距 + 产品自动识别**。
- 对邀请函无影响；`link_page` 只能指向已注册小程序页面这一限定仍然成立（Codex 的补充正确）。

---

## 2026-11-16 追加 2（WorkBuddy · **新终点 `5da2e36`**）

> 基线再更新为 `5da2e36`。以下为交接后用户第二次反馈的修复。

### 触发
用户反馈「自动识别产品的功能还是没有」，并附真机截图（只输入了 1 个字符 `H`，输入框下立刻出现红字「本店库存里没有这个码」）。

### 彻查（打真实接口，不是推测）
`GET /store/warranty-codes?q=&limit=`（淄博润智，263 支库存）：

| q | 返回 |
|---|---|
| 空 | 8 条 ✓ |
| `H` | 8 条 ✓ |
| `HB` | 3 条 ✓ |
| `HB2571` | 0 条（该码确实不在该店）✓ |

⇒ **接口与后端完全正常，问题在前端两处设计错误**。

### 根因与修复（`miniprogram/pages/store/register`）
1. 原「至少 2 个字符才发请求」→ 1 个字时不搜索、无候选。**改为 1 字即搜（防抖 200ms），空输入也搜**（列本店可用前 8 个）。
2. 原「输入非空失焦就判不存在」→ 半截输入立刻报红。**新增 `isCodeLike()`（长度≥6 且含数字）**，半截输入不报错、只清空识别结果。
3. 新增 `bindfocus="onProductFocus"`：**点进输入框就铺出候选**，不必先打字。
4. 新增三种状态提示：`正在查找本店质保码…` / `没有匹配的可用质保码，换个关键词试试` / `本店暂无可用质保码，请先在后台入库`
   —— 最后一条用于区分「功能没做」与「店里真没码」。
5. `province/register`：去掉搜索框 `bindblur="closeDropdown"`（小程序点候选会先失焦，绑了会点不中）。

### 验证 / 状态
`node --check` ✓、tsc 无输出 ✓、build 通过（契约 62 条）✓、WXML 结构校验 ✓。
**仅小程序改动**（无后端/网页变化）；`5da2e36` = `origin/main`。
**小程序仍未上传体验版/未审核/未发布；本轮改动未真机验证**。

---

## 2026-11-16 追加 3（WorkBuddy · **新终点 `3e3d028`**）

> 基线再次更新为 `3e3d028`。

### 任务
用户新增需求：省代快捷操作里加「撤回质保码」入口，进去可搜码，把分给门店的码收回省代。

### 新增
| 文件 | 用途 |
|---|---|
| `functions/api/province/warranty-codes-revoke.ts` | **新增接口**：`GET ?q=&limit=` 搜索**本人下属门店**名下仍可撤回的码；`POST {ids,reason}` 撤回 |
| `miniprogram/pages/province/revoke/index.{js,json,wxml,wxss}` | **新增页面**：搜索、勾选、全选、底部「撤回选中 n 个」、二次确认、部分跳过列原因、下拉刷新、空态区分 |
| `miniprogram/app.json` | 注册 `pages/province/revoke/index` |
| `miniprogram/pages/province/index/{index.js,index.wxml}` | 快捷操作新增「撤回质保码」（位于「代门店登记质保」之前）|
| `server/src/generated/function-routes.ts` | 重建，路由 108 → **109** |

### 关键规则（与总部 revoke 一致，范围收紧）
只能撤回**本人下属门店**持有的码（SQL 层按 `o.parent_id = 我` 过滤，拿别的省代的 id 会被跳过并说明原因）；
`status` 必须 `in_stock`/`partial_used` 且实际用量 < `usage_limit`；撤回写 `code_allocations(action='revoke')` +
`UPDATE owner_org_id` + 按用量重算 status；整批走一个 `batch()`；单次上限 50 支。**撤回不作废，可重新划拨**。

### 验证（线上真实接口）
搜索无关键词 5 条（来自多个下属门店，带已用/限用）✓；`q=HB` 命中和粹/和旺 HW9 ✓；
撤回 1 支 → 归属变为省代 + 1 条 `revoke` 流水 + status 正确 ✓；
**越权校验**：拿其他省代下属门店的码 → 被拒「不是本人下属门店的码」✓；
清理后归属还原、全库码数仍 **4599**、无残留流水/会话 ✓。
tsc 无输出、build 通过（契约 62 → **64**）、WXML 校验通过、页面 6 个事件处理齐全。

### 发布状态
后端已随 `3e3d028` 部署并验证（无 token 两方法均 401）。**小程序仍未发版，本轮页面未真机验证。**

---

## 2026-11-16 收到 Codex 邀请函同步（WorkBuddy 只读核对 · 未提交）

### 已读
`AGENTS.md`、`docs/agent-handoff/README.md`、`CODEX.md`、`INVITATION.md`、本文件，
以及实际 Git 状态与相关文件差异。**本轮 WorkBuddy 未修改业务代码、未提交、未推送、未部署、未上传小程序。**

### 核对结果（与实际代码比对，非采信描述）

| 项 | 实测 |
|---|---|
| HEAD / 远端 | `3e3d028` = `origin/main`，无新提交 ✓ |
| 已跟踪文件改动 | **仅 2 个**：`miniprogram/app.json`、`miniprogram/pages/owner/query/index.js` ✓ |
| 未跟踪新增 | `AGENTS.md`、`docs/agent-handoff/`、`public/lijiang2027/`、`miniprogram/pages/invitation/`、`miniprogram/images/invitation-share.jpg` ✓ |
| 我的历史改动 | `5636af4`/`5da2e36`/`3e3d028` 均未被覆盖 ✓ |
| `app.json` | 只在页面数组末尾追加 `pages/invitation/index/index`，**省代撤回等原有页面全部保留** ✓ |
| 轮播逻辑 | `loadBanners` 仍是「接口优先 → 失败回落本地」，`onBannerTap` 未改；只在 `linkPage` 上加了邀请函兜底 ✓ **未破坏** |
| H5 资源 | `index.html` 引用 8 个本地资源、`style.css` 引用 2 个图，**全部存在** ✓ |
| web-view 地址 | `https://hemoppf.cn/lijiang2027/`（固定正式域名）✓ |

### ⚠️ 需要 Codex / 用户注意的 3 点（不影响本次接收）

1. **硬编码标题匹配较脆**：`linkPage: b.link_page || (b.title === '和膜品牌2027年度优秀经销商大会' ? '/pages/invitation/index/index' : '')`
   —— 后台一旦改这个轮播的标题，链接就失效。邀请函页面已注册，而后端对 `link_page` 只校验 `/pages/` 前缀，
   **建议改为在后台「轮播图管理」里直接填 `/pages/invitation/index/index`**，代码里的标题判断可留作兜底。
2. **发版顺序**：若**先**在后台把 `link_page` 设为邀请函、**后**发小程序，旧版客户端点轮播会 `navigateTo` 到未注册页面 → **静默失败**（不崩溃，但点了没反应）。
   正确顺序：**先发版 → 再在后台设链接**。
3. **部署后必须实测** `https://hemoppf.cn/lijiang2027/` 是否被前端 SPA 的 `try_files → /index.html` 兜底吞掉；
   目录形式访问正常才说明静态资源与目录索引都对。

### 发布状态（各自独立，不互相推定）

| 渠道 | 状态 |
|---|---|
| 邀请函本地文件 | ✅ 已完成（Codex）|
| Git 提交 / 推送 | ❌ 未提交、未推送 |
| 网站部署（含 H5）| ❌ 未部署 |
| 小程序体验版 / 审核 / 发布 | ❌ 未上传、未审核、未发布 |
| 微信业务域名 / 真机 / 分享卡片 | ❌ 均未验证 |

### 结论
已收下 Codex 的本轮成果，**同意其作为下一步发布的基线**；WorkBuddy 侧无待合并冲突。
小程序正式发版时需**一次性覆盖**：轮播图读接口、省份选择器、多产品登记、模糊查找、登记页间距与自动识别、
省代撤回，**以及**邀请函承载页。

### 另记（内容层面，待业务确认）
`INVITATION.md` 已注明：酒店名「丽江金茂隐逸酒店·凯悦臻选」来自用户参考截图，PDF 未指定 → **发布前需用户核对**。
