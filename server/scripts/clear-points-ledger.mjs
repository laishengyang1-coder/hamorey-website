#!/usr/bin/env node
// ============================================================
// 积分清零（对冲流水法）：给每个有余额的组织插入一条负数流水，
// 使 SUM(points_change) 归零。保留历史流水可审计、可回滚。
// 用法: HAMOREY_ENV_FILE=/etc/hamorey/api.env node scripts/clear-points-ledger.mjs [--apply]
// 默认 dry-run 只打印；加 --apply 才写库
// ============================================================
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';
import { randomUUID } from 'node:crypto';

const APPLY = process.argv.includes('--apply');
const envFile = process.env.HAMOREY_ENV_FILE || '/etc/hamorey/api.env';
const env = {};
for (const line of readFileSync(envFile, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const db = await mysql.createPool({
  host: env.MYSQL_HOST,
  port: Number(env.MYSQL_PORT),
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  decimalNumbers: true,
  timezone: 'Z',
});

try {
  // 找出有余额的组织（balance != 0）
  const [rows] = await db.query(
    `SELECT organization_id, SUM(points_change) AS balance
       FROM points_ledger
      GROUP BY organization_id
     HAVING balance <> 0`,
  );
  console.log(`待清零组织: ${rows.length} 个，总积分: ${rows.reduce((s, r) => s + Number(r.balance), 0)}`);
  if (rows.length === 0) {
    console.log('无需处理');
    process.exit(0);
  }

  let inserted = 0;
  for (const r of rows) {
    const balance = Number(r.balance);
    const id = `clear-${randomUUID().replace(/-/g, '')}`;
    console.log(
      `${APPLY ? '[APPLY]' : '[DRY]  '} ${r.organization_id.slice(0, 24)}... 余额 ${balance} -> 对冲 ${-balance}`,
    );
    if (APPLY) {
      await db.query(
        `INSERT INTO points_ledger (id, organization_id, change_type, points_change, frozen_change, related_type, related_id, reason, operator_user_id, created_at)
         VALUES (?, ?, 'adjust', ?, 0, 'point_reset', NULL, ?, NULL, NOW())`,
        [id, r.organization_id, -balance, `积分清零-${new Date().toISOString().slice(0, 10)}`],
      );
    }
    inserted++;
  }

  // 验证余额
  const [after] = await db.query(
    `SELECT COUNT(*) AS non_zero FROM (
       SELECT organization_id, SUM(points_change) AS b FROM points_ledger GROUP BY organization_id HAVING b <> 0
     ) t`,
  );
  console.log(`\n${APPLY ? '已插入' : 'DRY-RUN 预览'} ${inserted} 条对冲流水；剩余非零余额组织: ${after[0].non_zero}`);
  if (!APPLY) console.log('\n确认无误后加 --apply 正式写入');
  await db.end();
} catch (e) {
  console.error('执行失败:', e.message || e);
  await db.end();
  process.exit(1);
}
