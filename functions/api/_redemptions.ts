// Shared redemption handlers for store and province clients.

import { type PagesFunction } from '@cloudflare/workers-types';
import {
  batch,
  generateId,
  getAuthUser,
  getOrgPoints,
  queryAll,
  queryFirst,
  resolveOrganizationAddress,
} from './_lib';
import { error, getClientIP, ok } from './_middleware';

interface Env {
  DB: D1Database;
}

interface RedemptionRequest {
  address_id?: string;
  items?: Array<{ reward_id: string; quantity: number }>;
}

interface RewardRow {
  id: string;
  name: string;
  points_required: number;
  stock_quantity: number | null;
  stock_status: string;
}

function databaseMessage(err: unknown): string | null {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('INSUFFICIENT_POINTS')) return '积分余额已发生变化，请刷新后重试';
  if (message.includes('INSUFFICIENT_REWARD_STOCK')) return '商品库存已发生变化，请刷新后重试';
  if (message.includes('REWARD_NOT_AVAILABLE')) return '商品已下架或暂不可兑换';
  return null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const status = new URL(context.request.url).searchParams.get('status') || '';
    const conditions = ['r.organization_id = ?'];
    const params: unknown[] = [user.orgId];
    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }

    const items = await queryAll(
      context.env.DB,
      `SELECT r.*,
        (SELECT json_group_array(json_object(
          'reward_id', ri.reward_id,
          'quantity', ri.quantity,
          'points_per_item', ri.points_per_item,
          'reward_name', ri.reward_name_snapshot
        )) FROM redemption_items ri WHERE ri.redemption_id = r.id) AS items_json
       FROM redemptions r
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.created_at DESC LIMIT 50`,
      ...params,
    );

    return ok({ items });
  } catch (err) {
    console.error('[redemptions GET]', err);
    return error('获取兑换记录失败', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = getAuthUser(context.data);
    if (!user) return error('未登录', 401);

    const body = await context.request.json() as RedemptionRequest;
    if (!body.address_id) return error('请选择收货地址', 400);
    if (!body.items?.length) return error('请选择兑换商品', 400);
    if (body.items.length > 20) return error('单次最多兑换 20 种商品', 400);
    if (body.items.some((item) => !item.reward_id || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
      return error('兑换数量必须为 1 到 99 的整数', 400);
    }

    const rewardIds = body.items.map((item) => item.reward_id);
    if (new Set(rewardIds).size !== rewardIds.length) return error('同一商品不能重复提交', 400);

    const address = await resolveOrganizationAddress(context.env.DB, user.orgId, body.address_id);
    if (!address) return error('收货地址不存在，请先维护收货地址', 400);

    const rewards = await queryAll<RewardRow>(
      context.env.DB,
      `SELECT id, name, points_required, stock_quantity, stock_status
       FROM rewards WHERE id IN (${rewardIds.map(() => '?').join(',')}) AND status = 'active'`,
      ...rewardIds,
    );
    const rewardMap = new Map(rewards.map((reward) => [reward.id, reward]));

    let totalPoints = 0;
    for (const item of body.items) {
      const reward = rewardMap.get(item.reward_id);
      if (!reward) return error(`商品 ${item.reward_id} 不存在或已下架`, 400);
      if (reward.stock_status !== 'available') return error(`“${reward.name}”暂不可兑换`, 400);
      if (reward.stock_quantity !== null && reward.stock_quantity < item.quantity) {
        return error(`“${reward.name}”库存不足`, 400);
      }
      totalPoints += reward.points_required * item.quantity;
    }

    if (!Number.isSafeInteger(totalPoints) || totalPoints <= 0) return error('兑换积分计算异常', 400);

    const points = await getOrgPoints(context.env.DB, user.orgId);
    if (points.available < totalPoints) {
      return error(`积分不足，可用 ${points.available}，需要 ${totalPoints}`, 400);
    }

    const redemptionId = generateId();
    const statements: Array<{ sql: string; params: unknown[] }> = [
      {
        sql: `INSERT INTO redemptions (id, organization_id, address_id, total_points, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
        params: [redemptionId, user.orgId, address.id, totalPoints],
      },
    ];

    for (const item of body.items) {
      const reward = rewardMap.get(item.reward_id)!;
      statements.push({
        sql: `INSERT INTO redemption_items
              (id, redemption_id, reward_id, quantity, points_per_item, reward_name_snapshot, created_at)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        params: [generateId(), redemptionId, item.reward_id, item.quantity, reward.points_required, reward.name],
      });
    }

    statements.push(
      {
        sql: `INSERT INTO points_ledger
              (id, organization_id, change_type, points_change, frozen_change, related_type, related_id, reason, operator_user_id, created_at)
              VALUES (?, ?, 'freeze', ?, ?, 'redemption', ?, '兑换申请冻结积分', ?, datetime('now'))`,
        params: [generateId(), user.orgId, totalPoints, totalPoints, redemptionId, user.userId],
      },
      {
        sql: `INSERT INTO operation_logs
              (id, user_id, action, target_type, target_id, detail_json, ip_address, created_at)
              VALUES (?, ?, 'submit_redemption', 'redemption', ?, ?, ?, datetime('now'))`,
        params: [generateId(), user.userId, redemptionId, JSON.stringify({ totalPoints }), getClientIP(context.request)],
      },
    );

    await batch(context.env.DB, statements);

    const item = await queryFirst(context.env.DB, `SELECT * FROM redemptions WHERE id = ?`, redemptionId);
    return ok(item, '兑换申请已提交');
  } catch (err) {
    console.error('[redemptions POST]', err);
    const friendlyMessage = databaseMessage(err);
    return error(friendlyMessage || '提交兑换失败', friendlyMessage ? 409 : 500);
  }
};
