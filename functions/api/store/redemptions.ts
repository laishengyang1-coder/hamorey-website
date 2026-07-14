// ============================================================
// GET/POST /api/store/redemptions — 门店兑换
// ============================================================

import { type PagesFunction } from '@cloudflare/workers-types';
import { generateId, queryFirst, queryAll, execute, writeOperationLog, writePointsLedger, getOrgPoints, getAuthUser, resolveOrganizationAddress } from '../_lib';
import { ok, error, getClientIP } from '../_middleware';

interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);
    const status = new URL(context.request.url).searchParams.get('status') || '';
    const conditions: string[] = ['r.organization_id = ?'];
    const params: unknown[] = [user.orgId];
    if (status) { conditions.push('r.status = ?'); params.push(status); }

    const items = await queryAll(context.env.DB,
      `SELECT r.*,
        (SELECT json_group_array(json_object('reward_id', ri.reward_id, 'quantity', ri.quantity, 'points_per_item', ri.points_per_item, 'reward_name', ri.reward_name_snapshot)) FROM redemption_items ri WHERE ri.redemption_id = r.id) AS items_json
       FROM redemptions r WHERE ${conditions.join(' AND ')} ORDER BY r.created_at DESC LIMIT 50`,
      ...params);
    return ok({ items });
  } catch (err) {
    console.error('[store/redemptions GET]', err);
    return error('获取兑换记录失败', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const body = await context.request.json() as {
      address_id?: string; items?: Array<{ reward_id: string; quantity: number }>;
    };
    if (!body.address_id) return error('请选择收货地址', 400);
    if (!body.items || body.items.length === 0) return error('请选择兑换商品', 400);
    if (body.items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
      return error('兑换数量必须为 1 到 99 的整数', 400);
    }

    const address = await resolveOrganizationAddress(context.env.DB, user.orgId, body.address_id);
    if (!address) return error('收货地址不存在，请先在网页后台维护收货地址', 400);

    let totalPoints = 0;
    const rewardIds = body.items.map((i) => i.reward_id);
    const rewards = await queryAll<{ id: string; name: string; points_required: number; stock_quantity: number | null; stock_status: string }>(
      context.env.DB,
      `SELECT id, name, points_required, stock_quantity, stock_status FROM rewards WHERE id IN (${rewardIds.map(() => '?').join(',')}) AND status = 'active'`,
      ...rewardIds,
    );
    const rewardMap = new Map(rewards.map((r) => [r.id, r]));

    for (const item of body.items) {
      const reward = rewardMap.get(item.reward_id);
      if (!reward) return error(`商品 ${item.reward_id} 不存在或已下架`, 400);
      if (reward.stock_status === 'out_of_stock') return error(`"${reward.name}" 已售罄`, 400);
      if (reward.stock_quantity !== null && reward.stock_quantity < item.quantity) return error(`"${reward.name}" 库存不足`, 400);
      totalPoints += reward.points_required * item.quantity;
    }

    const points = await getOrgPoints(context.env.DB, user.orgId);
    if (points.available < totalPoints) return error(`积分不足，可用 ${points.available}，需要 ${totalPoints}`, 400);

    const redemptionId = generateId();
    await execute(context.env.DB,
      `INSERT INTO redemptions (id, organization_id, address_id, total_points, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
      redemptionId, user.orgId, address.id, totalPoints);

    for (const item of body.items) {
      const reward = rewardMap.get(item.reward_id)!;
      await execute(context.env.DB,
        `INSERT INTO redemption_items (id, redemption_id, reward_id, quantity, points_per_item, reward_name_snapshot, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        generateId(), redemptionId, item.reward_id, item.quantity, reward.points_required, reward.name);
    }

    await writePointsLedger(context.env.DB, user.orgId, 'freeze', 0, totalPoints, 'redemption', redemptionId, '兑换申请冻结积分', user.userId);
    await writeOperationLog(context.env.DB, user.userId, 'submit_redemption', 'redemption', redemptionId, { totalPoints }, getClientIP(context.request));

    const item = await queryFirst(context.env.DB, `SELECT * FROM redemptions WHERE id = ?`, redemptionId);
    return ok(item, '兑换申请已提交');
  } catch (err) {
    console.error('[store/redemptions POST]', err);
    return error('提交兑换失败', 500);
  }
};
