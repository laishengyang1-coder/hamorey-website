// ============================================================
// 和膜 HAMOREY — 合作申请 API
// POST /api/partner-leads
// 接收合作申请表单，Zod 校验后写入 D1 partner_leads 表
// ============================================================

import { z } from 'zod';

// === Zod 校验 Schema ===
const partnerLeadSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符').max(20, '姓名最多20个字符'),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入正确的11位手机号'),
  province: z.string().optional(),
  city: z.string().optional(),
  company_name: z.string().max(50).optional().or(z.literal('')),
  business_type: z.string().optional(),
  store_count: z.number().int().min(0).max(9999).optional(),
  intended_type: z.string().optional(),
  message: z.string().max(500).optional().or(z.literal('')),
  privacy_agreed: z.boolean().refine((v) => v === true, '请阅读并同意隐私政策'),
  source: z.string().optional(),
});

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

function ok(data: unknown, message = ''): Response {
  return new Response(JSON.stringify({ code: 'OK', message, data }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function errorResponse(message: string, status: number, data: unknown = null): Response {
  return new Response(JSON.stringify({ code: 'ERROR', message, data }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.DB) {
    return errorResponse('数据库未配置', 500);
  }

  // 解析请求体
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('请求体格式错误', 400);
  }

  // Zod 校验
  const result = partnerLeadSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return errorResponse('输入校验失败', 400, { errors });
  }

  const data = result.data;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // 写入 D1
  try {
    await env.DB.prepare(
      `INSERT INTO partner_leads
        (id, name, phone, province, city, company_name, business_type,
         store_count, intended_type, message, privacy_agreed, follow_status, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`,
    )
      .bind(
        id,
        data.name,
        data.phone,
        data.province || null,
        data.city || null,
        data.company_name || null,
        data.business_type || null,
        data.store_count ?? null,
        data.intended_type || null,
        data.message || null,
        data.privacy_agreed ? 1 : 0,
        data.source || 'website',
        now,
        now,
      )
      .run();

    return ok(
      { lead_id: id, follow_status: 'new' },
      '合作申请提交成功，我们将尽快与您联系。',
    );
  } catch (err) {
    console.error('[partner-leads] DB error:', err);
    const message = err instanceof Error ? err.message : '数据库写入失败';
    return errorResponse(message, 500);
  }
};

// 支持 CORS 预检
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
