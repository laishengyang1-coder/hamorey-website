// ============================================================
// 繁星计划（总部运营活动）— 积分管理接口
// ------------------------------------------------------------
// 活动机制：省代动员门店（省代自身也参加）在抖音/小红书/视频号
// 发布带 #和膜 Tag 的视频，即算一次任务，每次任务 +30 积分；
// 月底按繁星积分排名前三名分别奖励 1000/800/500。
// 本接口供总部后台：配置活动期、查看繁星排行榜、手动加分、查看流水。
// 繁星积分 = 普通积分（change_type='award'、related_type='star_plan'），
// 自然并入全国积分总榜、可兑换。
//
// GET  /api/admin/star-plan?action=config       — 活动期配置
// GET  /api/admin/star-plan?action=leaderboard  — 繁星积分排行榜
// GET  /api/admin/star-plan?action=points       — 繁星加分流水
// POST /api/admin/star-plan                     — 手动加分
// PUT  /api/admin/star-plan                     — 更新活动期配置
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { queryAll, queryFirst, execute, generateId, parsePagination, writePointsLedger, writeOperationLog, getAuthUser } from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

interface Env { DB: D1Database; }

const CFG_START = 'star_plan_start';
const CFG_END = 'star_plan_end';
const DEFAULT_START = '2026-08-10';
const DEFAULT_END = '2026-09-15';

async function readConfig(db: D1Database): Promise<{ startDate: string; endDate: string }> {
  const rows = await queryAll<{ key: string; value: string | null }>(
    db,
    `SELECT key, value FROM system_settings WHERE key IN (?, ?)`,
    CFG_START, CFG_END,
  );
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value || '';
  return {
    startDate: map[CFG_START] || DEFAULT_START,
    endDate: map[CFG_END] || DEFAULT_END,
  };
}

async function upsertSetting(db: D1Database, key: string, value: string, description: string, updatedBy: string | null) {
  const existing = await queryFirst<{ id: string }>(db, `SELECT id FROM system_settings WHERE key = ?`, key);
  if (existing) {
    await execute(db, `UPDATE system_settings SET value = ?, updated_by = ?, updated_at = datetime('now') WHERE key = ?`, value, updatedBy, key);
  } else {
    await execute(db, `INSERT INTO system_settings (id, key, value, value_type, description, updated_by, updated_at) VALUES (?, ?, ?, 'string', ?, ?, datetime('now'))`, generateId(), key, value, description, updatedBy);
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const action = url.searchParams.get('action') || '';

    if (action === 'config') {
      return ok(await readConfig(context.env.DB));
    }

    if (action === 'leaderboard') {
      const { startDate, endDate } = await readConfig(context.env.DB);
      const rows = await queryAll(context.env.DB,
        `SELECT o.id, o.name, o.code, o.type, o.province, o.city,
                COALESCE(SUM(pl.points_change), 0) AS star_points,
                COUNT(pl.id) AS task_count
         FROM points_ledger pl
         JOIN organizations o ON o.id = pl.organization_id
         WHERE pl.related_type = 'star_plan' AND pl.change_type = 'award'
           AND pl.created_at >= ? AND pl.created_at < ?
         GROUP BY o.id, o.name, o.code, o.type, o.province, o.city
         ORDER BY star_points DESC, task_count DESC`,
        `${startDate} 00:00:00`, `${endDate} 23:59:59`,
      );
      // 附排名
      const ranked = rows.map((r: any, i: number) => ({ ...r, rank: i + 1 }));
      return ok({ items: ranked, startDate, endDate, total: ranked.length });
    }

    if (action === 'points') {
      const { page, pageSize, offset } = parsePagination(url);
      const where = `WHERE pl.related_type = 'star_plan'`;
      const [items, totalRow] = await Promise.all([
        queryAll(context.env.DB,
          `SELECT pl.*, o.name AS organization_name, o.code AS organization_code, o.type AS organization_type,
                  u.username AS operator_name
           FROM points_ledger pl
           JOIN organizations o ON pl.organization_id = o.id
           LEFT JOIN users u ON pl.operator_user_id = u.id
           ${where} ORDER BY pl.created_at DESC LIMIT ? OFFSET ?`,
          pageSize, offset),
        queryFirst<{ cnt: number }>(context.env.DB, `SELECT COUNT(*) AS cnt FROM points_ledger pl ${where}`),
      ]);
      return ok({ items, total: totalRow?.cnt ?? 0, page, pageSize });
    }

    return error('未知操作', 400);
  } catch (err) {
    console.error('[star-plan GET]', err);
    return error('获取繁星计划数据失败', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as { organization_id?: string; points?: number; remark?: string };
    if (!body.organization_id) return error('请选择组织', 400);
    if (!body.points || !Number.isFinite(Number(body.points)) || Number(body.points) <= 0) return error('请输入正确的积分数值', 400);

    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const points = Math.round(Number(body.points));
    const reason = body.remark?.trim() ? `繁星计划：${body.remark.trim()}` : '繁星计划';

    const ledgerId = await writePointsLedger(
      context.env.DB, body.organization_id, 'award', points, 0, 'star_plan', null, reason, user?.userId || null,
    );
    await writeOperationLog(context.env.DB, user?.userId || null, 'star_plan_award', 'points_ledger', ledgerId, body, getClientIP(context.request));

    return ok({ ledgerId }, '繁星积分已发放');
  } catch (err) {
    console.error('[star-plan POST]', err);
    return error('发放繁星积分失败', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as { start_date?: string; end_date?: string };
    if (!body.start_date || !body.end_date) return error('请填写活动起止日期', 400);
    if (body.end_date < body.start_date) return error('结束日期不能早于开始日期', 400);

    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    await upsertSetting(context.env.DB, CFG_START, body.start_date, '繁星计划活动开始日期', user?.userId || null);
    await upsertSetting(context.env.DB, CFG_END, body.end_date, '繁星计划活动结束日期', user?.userId || null);

    return ok({ startDate: body.start_date, endDate: body.end_date }, '活动期已更新');
  } catch (err) {
    console.error('[star-plan PUT]', err);
    return error('更新活动期失败', 500);
  }
};
