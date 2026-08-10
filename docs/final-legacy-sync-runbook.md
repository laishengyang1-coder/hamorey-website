# 和膜正式切换前最终数据同步清单

更新时间：2026-08-10

## 原则

- 腾讯云 MySQL 是唯一正式数据库，GitHub `main` 是唯一代码源。
- 自动审核继续保留。本次修复不改变质保自动审核规则。
- 质保记录增量与质保码库存归属是两类数据，必须分别同步。
- 每次正式写入前先备份、再干跑、核对汇总，最后才加 `--apply`。
- 旧系统销售记录不能证明当前库存归属；库存同步必须使用旧系统导出的“当前库存/当前门店归属”数据。

## 1. 切换前备份

在腾讯服务器执行：

```bash
/opt/hamorey/scripts/backup-db.sh
tail -n 30 /var/log/hamorey-backup.log
```

看到 `HAMOREY_DB_BACKUP_DONE`，并在 COS 的 `backups/mysql/` 下确认当天文件后再继续。

## 2. 同步旧系统新增质保记录

将旧系统最新质保订单 JSON 放到服务器备份目录，然后先干跑：

```bash
cd /opt/hamorey/apps/api
HAMOREY_ENV_FILE=/etc/hamorey/api.env \
  node scripts/import-legacy-warranty-delta.mjs /opt/hamorey/backups/legacy-warranty-final.json
```

检查新增、跳过、无法匹配门店等数量。确认无误后正式写入：

```bash
HAMOREY_ENV_FILE=/etc/hamorey/api.env \
  node scripts/import-legacy-warranty-delta.mjs /opt/hamorey/backups/legacy-warranty-final.json --apply
```

批次编号和日期会根据本次文件内容自动生成，不会再复用旧的固定批次。

## 3. 同步当前库存归属

从旧系统导出每个门店当前持有的质保码，支持 `.xlsx`、`.xls`、`.csv` 或 `.json`。文件至少要有：

- 质保码/卷轴号
- 门店名称、门店编码、门店 ID 或联系电话中的一种
- 如有划拨单号、划拨时间也一起保留

先生成方案，不会修改数据库：

```bash
cd /opt/hamorey/apps/api
HAMOREY_ENV_FILE=/etc/hamorey/api.env \
  npm run inventory:plan -- /opt/hamorey/backups/legacy-current-inventory.xlsx \
  --output=/opt/hamorey/backups/final-inventory-plan.json
```

如果旧系统只能按单个门店导出，文件没有门店列，使用：

```bash
HAMOREY_ENV_FILE=/etc/hamorey/api.env \
  npm run inventory:plan -- /opt/hamorey/backups/one-store-inventory.xlsx \
  --target-org-name='完整门店名称' \
  --output=/opt/hamorey/backups/one-store-plan.json
```

出现 `HAMOREY_LEGACY_INVENTORY_PLAN_BLOCKED` 时禁止继续，先处理未匹配门店或同一码归属冲突。

方案生成后先干跑：

```bash
HAMOREY_ENV_FILE=/etc/hamorey/api.env \
  npm run inventory:apply -- /opt/hamorey/backups/final-inventory-plan.json
```

重点核对 `moved`、`alreadyAligned`、`missingCode`、`usedCode` 和 `lockedStatus`。确认无误后正式写入：

```bash
HAMOREY_ENV_FILE=/etc/hamorey/api.env \
  npm run inventory:apply -- /opt/hamorey/backups/final-inventory-plan.json --apply
```

默认不会移动已经使用过的质保码。只有旧系统当前库存明确证明“部分使用的窗膜余量已经转到新门店”时，才可在生成方案时加 `--allow-partial-used`；脚本会保留已用次数，不会归零。

## 4. 最终验收

1. 总部后台抽查质保总数、最新日期、门店归属、质保码剩余次数和积分流水。
2. 抽查至少 5 家近期有新增数据的门店，确认其库存下可以正常上质保。
3. 用真实手机测试小程序：查询、门店登录、质保录入、图片上传、积分商城图片。
4. 检查 `https://api.hemoppf.cn/api/health` 中 API、MySQL、COS 都为 `ok`。
5. 旧系统进入维护后不得再新增数据；如发生新增，必须重新导出并重复本清单。

## 5. 给 WorkBuddy 的边界

- 先同步 GitHub `main`，不要基于旧本地副本继续改。
- 不要把小程序 API 改回 IP 或 Cloudflare 地址。
- 不要恢复 Cloudflare 部署。
- 不要改自动审核规则。
- 不要直接执行带 `--apply` 的迁移命令；必须先向负责人展示干跑汇总并获得确认。
