#!/usr/bin/env node
// ============================================================
// 为"省代同名门店"创建独立 STORE 账号（占位手机号 + 统一初始密码）
// 用法: HAMOREY_ENV_FILE=/etc/hamorey/api.env node scripts/create-same-name-store-accounts.mjs [--apply]
// 默认 dry-run；--apply 写库
// ============================================================
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../../functions/api/_lib.ts';

const APPLY = process.argv.includes('--apply');
const INIT_PASSWORD = process.env.INIT_PASSWORD || 'Hamorey@123456';
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

// 占位手机号（1900001 + 序号）
const PHONE_BASE = 19000010000;
const PASSWORD_HASH = await hashPassword(INIT_PASSWORD);

try {
  // 找省代同名门店（无账号的）
  const [rows] = await db.query(
    `SELECT s.id AS store_id, s.name AS store_name
       FROM organizations p
       JOIN organizations s ON s.type = 'STORE' AND s.parent_id = p.id AND s.name = p.name
       LEFT JOIN users su ON su.organization_id = s.id
      WHERE p.type = 'PROVINCE' AND p.status = 'active' AND su.id IS NULL
      ORDER BY p.name`,
  );
  console.log(`待建账号门店: ${rows.length} 个（初始密码 ${INIT_PASSWORD}）`);
  if (rows.length === 0) { console.log('无需处理'); process.exit(0); }

  // 取现有最大占位序号，避免冲突
  const [maxRow] = await db.query(`SELECT MAX(CAST(SUBSTRING(username, 8) AS UNSIGNED)) AS m FROM users WHERE username LIKE '1900001%'`);
  let seq = Number(maxRow[0].m || 0);

  let created = 0;
  for (const r of rows) {
    seq += 1;
    const phone = String(PHONE_BASE + seq);
    // 双重防冲突
    const [dup] = await db.query(`SELECT id FROM users WHERE username = ?`, [phone]);
    if (dup.length > 0) { console.log(`跳过冲突 ${phone}`); continue; }
    const id = `user-${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    console.log(`${APPLY ? '[APPLY]' : '[DRY]  '} ${r.store_name} -> ${phone}`);
    if (APPLY) {
      await db.query(
        `INSERT INTO users (id, organization_id, username, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'STORE', 'active', NOW(), NOW())`,
        [id, r.store_id, phone, PASSWORD_HASH],
      );
    }
    created++;
  }
  console.log(`\n${APPLY ? '已创建' : 'DRY-RUN 预览'} ${created} 个账号`);
  if (!APPLY) console.log('确认无误后加 --apply 正式写入');
  await db.end();
} catch (e) {
  console.error('执行失败:', e.message || e);
  await db.end();
  process.exit(1);
}
