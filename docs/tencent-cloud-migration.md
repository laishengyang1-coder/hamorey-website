# 腾讯云迁移说明

本文档记录和膜系统从 Cloudflare Pages/D1/R2 迁移到腾讯云服务器、TencentDB MySQL 和 COS 的阶段安排。

## 当前状态

截至 2026-07-23，腾讯云生产环境已经独立运行：

- 内部预览地址：`http://134.175.187.12`
- 前端：腾讯云轻量服务器 Nginx
- API：腾讯云轻量服务器 Node.js + PM2（`hamorey-api`）
- 数据库：TencentDB MySQL（`hamorey`）
- 文件：腾讯云 COS（`hamorey-prod-1435246474`，`ap-guangzhou`）
- `/api/health` 已确认 API、MySQL、COS 均为 `ok`
- Nginx 与 `pm2-ubuntu` 均已配置开机自启
- 腾讯云、GitHub `main` 与本地代码版本已完成一致性核对

已经导入并核对的核心数据包括：

- 组织 80 家、用户 72 个
- 产品型号 28 个
- 质保码 3073 个、质保记录 539 条
- 质保码划拨记录 2506 条
- 积分流水 539 条、积分商品 16 个
- 门店公开资料 67 条

Cloudflare Pages/D1/R2 目前只保留为临时回退副本，不再作为腾讯云系统的数据源。未完成正式域名和 HTTPS 切换前，不要删除 Cloudflare 数据。

GitHub Actions 中的 `Deploy to Cloudflare Pages` 工作流已于 2026-07-23 人工停用，后续提交到 `main` 不会再自动发布到 Cloudflare。

## 阶段 1：腾讯云静态预览（已完成）

用途：备案期间提前验证腾讯云服务器能拉取 GitHub 最新前端代码、构建并通过 IP 打开页面。

服务器执行：

```bash
bash scripts/tencent-static-preview-deploy.sh
```

预期结果：

```text
HAMOREY_STATIC_PREVIEW_DEPLOYED
```

这是迁移过程中的历史验证阶段。当前腾讯云已经使用自己的 MySQL 和 COS，不再从 Cloudflare 读取业务数据。

## 阶段 2：正式腾讯云目标架构

一步到位目标：

```text
GitHub main
  -> 腾讯云轻量服务器
    -> Nginx: 前端静态页面 + /api 反向代理
    -> PM2: Node.js API 服务
    -> TencentDB MySQL: 业务数据
    -> COS: 施工照片、证书 PDF、导出文件、积分商品图片
```

需要提前准备：

- TencentDB for MySQL 实例
- MySQL 数据库：`hamorey`
- MySQL 用户：`hamorey`
- COS 存储桶，建议广州地域
- 服务器环境变量文件：`/etc/hamorey/api.env`

`/etc/hamorey/api.env` 示例：

```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://system.hemoppf.cn,https://www.hemoppf.cn

MYSQL_HOST=你的TencentDB内网地址
MYSQL_PORT=3306
MYSQL_USER=hamorey
MYSQL_PASSWORD=你的数据库密码
MYSQL_DATABASE=hamorey
MYSQL_CONNECTION_LIMIT=10

COS_SECRET_ID=你的SecretId
COS_SECRET_KEY=你的SecretKey
COS_BUCKET=你的bucket名称
COS_REGION=ap-guangzhou
```

## 阶段 3：D1 数据迁移准备与导入

导出 Cloudflare D1：

```bash
bash scripts/cloudflare-d1-backup.sh
```

如果已经确认当前是低峰期，也可以跳过确认提示：

```bash
bash scripts/cloudflare-d1-backup.sh --yes
```

生成迁移核对清单：

```bash
bash scripts/cloudflare-d1-inventory.sh
```

导出的 D1 SQL 不能直接塞进 TencentDB MySQL。仓库现在提供了迁移脚本，会先把 D1 SQL 加载到临时 SQLite，再按 MySQL 兼容结构建表、导入数据、重建索引。

服务器先安装 SQLite 客户端：

```bash
sudo apt-get install -y sqlite3
```

把最新 D1 备份 SQL 上传到服务器，例如：

```text
/opt/hamorey/backups/hamorey-db-YYYYMMDD-HHMMSS.sql
```

在服务器仓库目录执行导入：

```bash
cd /opt/hamorey/source/hamorey-website/server
HAMOREY_ENV_FILE=/etc/hamorey/api.env node scripts/import-d1-to-mysql.mjs /opt/hamorey/backups/hamorey-db-YYYYMMDD-HHMMSS.sql --reset
```

预期结果：

```text
HAMOREY_D1_MYSQL_IMPORT_DONE
organizations: 80
users: 72
product_models: 28
warranty_codes: 3073
warranty_records: 539
points_ledger: 539
...
```

正式切换前必须校验核心表数量：

- `organizations`
- `users`
- `product_models`
- `warranty_codes`
- `warranty_records`
- `warranty_photos`
- `points_ledger`
- `rewards`
- `redemptions`

## 阶段 4：R2 到 COS

R2 内目前使用的关键目录：

- `warranty-photos/`：施工照片
- `certificates/`：质保证书 PDF
- `exports/`：后台导出文件
- `reward-covers/`：积分商城奖品图片

迁移策略：

1. 从 R2 下载对象清单和文件。
2. 按原 `file_key` 上传到腾讯云 COS。
3. 数据库里的 `file_key` 保持不变。
4. 后端读取文件时由 COS SDK 根据 `file_key` 取文件。

这样前端和小程序不需要改图片字段结构。

当前 Wrangler 版本不能直接列出 R2 对象，所以先从 D1 里提取业务记录引用过的 `file_key`：

```bash
bash scripts/cloudflare-d1-inventory.sh
```

输出文件：

- `exports/cloudflare-d1/inventory-summary-*.csv`
- `exports/cloudflare-d1/r2-referenced-file-keys-*.csv`

这两个文件属于业务数据核对材料，不提交 GitHub。

## 阶段 5：API 后端迁移

仓库现在有一个 Node 兼容层，会把 `functions/api` 中的 Cloudflare Pages Functions 自动映射成腾讯云 Node API 路由。

当前目标结构：

```text
server/
  src/
    index.ts
    db.ts
    cos.ts
    cloudflare-env.ts
    function-router.ts
    adapters/
      d1.ts
      r2.ts
    generated/
      function-routes.ts
    routes/
      health.ts
```

已经完成：

- `/api/health`：Node/MySQL/COS 健康检查
- `/api/auth/*`：登录、退出、当前用户
- `/api/admin/*`：总部后台
- `/api/province/*`：省代后台
- `/api/store/*`：门店/小程序业务接口
- `/api/public/*`：公开查询、图片、证书入口
- `/api/r2-upload/*`：文件上传兼容入口

兼容层说明：

- D1 查询由 `server/src/adapters/d1.ts` 转成 MySQL 查询。
- R2 对象存储由 `server/src/adapters/r2.ts` 转成 COS 调用。
- Cloudflare 权限中间件仍然复用 `functions/api/_middleware.ts`。
- 新增或删除 `functions/api` 文件后，`server/scripts/generate-node-function-routes.mjs` 会在构建前自动生成路由清单。

生产部署脚本：

```bash
bash scripts/tencent-production-deploy.sh
```

脚本会读取 `/etc/hamorey/api.env`，构建前端和 API，并用 PM2 启动 `hamorey-api`。

脚本现在会：

- GitHub 拉取失败时立即停止，禁止拿服务器旧代码继续发布
- 固定部署 `origin/main`
- 等待 API、MySQL、COS 健康检查恢复后再判定成功
- 把成功部署的提交号写入 `/opt/hamorey/apps/DEPLOYED_COMMIT`

日常发布与检查：

```bash
cd /opt/hamorey/source/hamorey-website
bash scripts/tencent-production-deploy.sh
cat /opt/hamorey/apps/DEPLOYED_COMMIT
curl --fail http://127.0.0.1/api/health
pm2 status
```

## 阶段 6：备案通过后的正式切换

备案通过后再做：

1. DNS 解析：
   - `system.hemoppf.cn` -> 腾讯云服务器 IP
   - `api.hemoppf.cn` -> 腾讯云服务器 IP
   - `www.hemoppf.cn` -> 腾讯云服务器 IP 或静态站点
2. 申请 HTTPS 证书。
3. Nginx 切换正式域名配置。
4. 微信公众平台配置合法域名：
   - request：`https://api.hemoppf.cn`
   - uploadFile：`https://api.hemoppf.cn`
   - downloadFile：`https://api.hemoppf.cn`
5. 小程序真机测试。
6. 把小程序 `apiBaseUrl` 改为 `https://api.hemoppf.cn/api` 并重新发布。
7. 确认 GitHub 中 Cloudflare Pages 工作流保持停用。
8. 先保留 Cloudflare 回退副本，腾讯云正式域名稳定运行 48 小时后再人工确认删除。

## 注意事项

- 备案通过前不要把 `hemoppf.cn` 作为正式公开访问入口。
- 当前 IP 预览只用于内部测试。
- GitHub 自动部署需要单独配置服务器 SSH 密钥和 GitHub Secrets。
- GitHub 的 Cloudflare Pages 工作流已经停用；不要重新启用。
- 数据迁移前必须先备份 D1 和 R2。
- 质保码、质保记录、积分流水属于核心业务数据，迁移后要做数量和抽样核对。
