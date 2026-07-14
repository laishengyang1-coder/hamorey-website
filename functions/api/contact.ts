// ============================================================
// 和膜 HAMOREY — 合作咨询 API
// POST /api/contact
// 接收合作咨询表单，Zod 校验后写入 D1 partner_leads 表
// ============================================================

import { z } from 'zod';

// === Zod 校验 Schema ===
const contactSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符').max(20, '姓名最多20个字符'),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入正确的11位手机号'),
  email: z
    .string()
    .email('请输入正确的邮箱地址')
    .optional()
    .or(z.literal('')),
  subject: z
    .string()
    .min(1, '请输入咨询主题')
    .max(50, '主题最多50个字符'),
  message: z
    .string()
    .min(1, '请输入咨询内容')
    .max(1000, '内容最多1000个字符'),
  privacy_agreed: z
    .boolean()
    .refine((v) => v === true, '请阅读并同意隐私政策'),
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('请求体格式错误', 400);
  }

  // Zod 校验
  const result = contactSchema.safeParse(body);
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

  // 写入 D1 partner_leads 表（复用合作线索表，email 存入 email 列）
  try {
    await env.DB.prepare(
      `INSERT INTO partner_leads
        (id, name, phone, email, business_type,
         intended_type, message, privacy_agreed, follow_status, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`,
    )
      .bind(
        id,
        data.name,
        data.phone,
        data.email || null,
        'contact_inquiry',
        data.subject,
        data.message,
        data.privacy_agreed ? 1 : 0,
        'website_contact',
        now,
        now,
      )
      .run();

    return ok(
      { id },
      '咨询提交成功，我们将尽快与您联系。',
    );
  } catch (err) {
    console.error('[contact] DB error:', err);
    const message = err instanceof Error ? err.message : '数据库写入失败';
    return errorResponse(message, 500);
  }
};

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
