# 腾讯云迁移说明

本文档记录和膜系统从 Cloudflare Pages/D1/R2 迁移到腾讯云服务器、TencentDB MySQL 和 COS 的阶段安排。

## 当前状态

- 线上正式站点仍在 Cloudflare Pages：`https://hemoppf.com`
- 数据库为 Cloudflare D1：`hamorey-db`
- 文件存储为 Cloudflare R2：`hamorey-assets`
- 腾讯云轻量服务器已经安装 Node.js、pnpm、PM2、Nginx。
- 腾讯云当前只部署静态前端预览，`/api` 暂时反向代理到 `https://hemoppf.com/api`。
- 最终形态不再依赖 Cloudflare：前端由 Nginx 托管，API 由 Node.js/PM2 托管，数据进 TencentDB MySQL，文件进 COS。

## 阶段 1：腾讯云静态预览

用途：备案期间提前验证腾讯云服务器能拉取 GitHub 最新前端代码、构建并通过 IP 打开页面。

服务器执行：

```bash
bash scripts/tencent-static-preview-deploy.sh
```

预期结果：

```text
HAMOREY_STATIC_PREVIEW_DEPLOYED
```

这个阶段不是最终迁移。后台数据仍然来自 Cloudflare。

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

## 阶段 3：D1 数据迁移准备

导出 Cloudflare D1：

```bash
npx wrangler d1 export hamorey-db --remote --output=exports/d1/hamorey-db-$(date +%Y%m%d-%H%M%S).sql
```

导出的 D1 SQL 不能直接当成最终生产库长期使用。正式迁移要转换为 MySQL 兼容格式，然后导入 TencentDB MySQL。

转换重点：

- `TEXT` 时间字段保留为 `DATETIME` 或 `VARCHAR(32)`
- SQLite `datetime('now')` 改为 MySQL `CURRENT_TIMESTAMP`
- `INTEGER CHECK (...)` 约束改为应用层校验或 MySQL `CHECK`
- `PRAGMA`、D1 特有导出语句移除
- 迁移后重建索引和唯一约束

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
- `rewards/`：积分商城奖品图片

迁移策略：

1. 从 R2 下载对象清单和文件。
2. 按原 `file_key` 上传到腾讯云 COS。
3. 数据库里的 `file_key` 保持不变。
4. 后端读取文件时由 COS SDK 根据 `file_key` 取文件。

这样前端和小程序不需要改图片字段结构。

## 阶段 5：API 后端迁移

Cloudflare Pages Functions 不能直接作为普通 Node 服务运行。需要把 `functions/api` 中的业务逻辑迁到 Node HTTP 服务。

建议目标结构：

```text
server/
  src/
    index.ts
    db.ts
    cos.ts
    routes/
      admin/
      province/
      store/
      public/
```

迁移优先级：

1. `/api/health`
2. `/api/auth/login`
3. `/api/auth/me`
4. 门店端小程序接口：`/api/store/*`
5. 总部后台接口：`/api/admin/*`
6. 省代接口：`/api/province/*`
7. 上传与文件读取：`/api/store/upload-url`、`/api/r2-upload/*`、`/api/public/photos/*`

当前已经建立 `server/` 骨架，并提供 `/api/health` 用于检查 Node API、MySQL、COS 配置状态。

生产部署脚本：

```bash
bash scripts/tencent-production-deploy.sh
```

脚本会读取 `/etc/hamorey/api.env`，构建前端和 API，并用 PM2 启动 `hamorey-api`。

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
6. 冻结 Cloudflare 写入，做最终增量数据迁移。
7. 切正式流量。

## 注意事项

- 备案通过前不要把 `hemoppf.cn` 作为正式公开访问入口。
- 当前 IP 预览只用于内部测试。
- GitHub 自动部署需要单独配置服务器 SSH 密钥和 GitHub Secrets。
- 数据迁移前必须先备份 D1 和 R2。
- 质保码、质保记录、积分流水属于核心业务数据，迁移后要做数量和抽样核对。
