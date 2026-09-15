// ============================================================
// 和膜 HAMOREY — 腾讯云短信发送（TC3-HMAC-SHA256 手写签名，零第三方依赖）
// ------------------------------------------------------------
// 用途：质保审核通过后，给车主发送「质保激活通知」短信。
//
// 运行环境说明：生产为 Node server（pm2 进程 hamorey-api），functions 的
// tsconfig 面向 Workers 类型环境（types: @cloudflare/workers-types），因此
// node 内置模块用「动态拼接模块名」的方式导入以绕开静态类型检查——
// 与 _seal.ts 读取 node:fs 的做法保持一致。
//
// 设计约束（务必保留）：
//   1. 短信是「尽力而为」的附加能力，任何失败都不得影响审核主流程。
//      对外只暴露 notifyWarrantyActivated()，其内部吞掉全部异常。
//   2. 未配置短信密钥时静默跳过（只打日志），便于本地/预览环境运行。
//   3. 日志中手机号一律打码，不落明文。
// ============================================================

const SMS_HOST = 'sms.tencentcloudapi.com';
const SMS_SERVICE = 'sms';
const SMS_VERSION = '2021-01-11';
const DEFAULT_REGION = 'ap-guangzhou';
const DEFAULT_SIGN_NAME = 'HAMOREY和膜';
const DEFAULT_TEMPLATE_ID = '2710739';

interface SmsConfig {
  secretId: string;
  secretKey: string;
  sdkAppId: string;
  signName: string;
  templateId: string;
  region: string;
}

interface SmsSendResult {
  ok: boolean;
  code?: string;
  message?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cryptoModule: any;

/** 惰性加载 node:crypto（动态模块名绕开 Workers 类型检查，见文件头说明） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCrypto(): Promise<any> {
  if (!cryptoModule) {
    const moduleName = 'node:' + 'crypto';
    cryptoModule = await import(moduleName);
  }
  return cryptoModule;
}

/** 从 Node 进程环境读取变量（server 由 pm2 --update-env 注入 /etc/hamorey/api.env） */
function readEnv(name: string): string {
  const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
  return (g.process?.env?.[name] || '').trim();
}

/**
 * 组装短信配置。密钥优先级：SMS_* > TENCENTCLOUD_* > COS_*。
 * 注意：COS_SECRET_ID/KEY 属于仅授 COS 权限的子账号（hamorey-cos-api），
 * 用它调短信接口会被 CAM 拒绝（AuthFailure.UnauthorizedOperation），
 * 因此生产必须单独提供具备 sms:SendSms 权限的 SMS_SECRET_ID / SMS_SECRET_KEY。
 */
function readConfig(): SmsConfig | null {
  const secretId = readEnv('SMS_SECRET_ID') || readEnv('TENCENTCLOUD_SECRET_ID') || readEnv('COS_SECRET_ID');
  const secretKey = readEnv('SMS_SECRET_KEY') || readEnv('TENCENTCLOUD_SECRET_KEY') || readEnv('COS_SECRET_KEY');
  const sdkAppId = readEnv('SMS_SDK_APP_ID');
  if (!secretId || !secretKey || !sdkAppId) return null;
  return {
    secretId,
    secretKey,
    sdkAppId,
    signName: readEnv('SMS_SIGN_NAME') || DEFAULT_SIGN_NAME,
    templateId: readEnv('SMS_TEMPLATE_ID') || DEFAULT_TEMPLATE_ID,
    region: readEnv('SMS_REGION') || DEFAULT_REGION,
  };
}

/**
 * 归一化大陆手机号为 E.164（+86xxxxxxxxxxx）。
 * 兼容库内历史格式：11 位裸号、86/086 前缀、+/00 国际前缀、含空格或连字符。
 * 非法或非大陆手机号返回 null（调用方跳过发送）。
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim().replace(/[\s\-()]/g, '');
  if (!value) return null;

  // 显式带国际前缀时只接受中国（+86 / 0086）：否则 +1 4155552671 会被
  // 误当成「11 位大陆手机号」而发往错误的号码。
  let digits: string;
  if (value.startsWith('+')) {
    if (!value.startsWith('+86')) return null;
    digits = value.slice(3);
  } else if (value.startsWith('00')) {
    if (!value.startsWith('0086')) return null;
    digits = value.slice(4);
  } else if (value.startsWith('86') && value.length === 13) {
    digits = value.slice(2);
  } else {
    digits = value;
  }

  return /^1[3-9]\d{9}$/.test(digits) ? `+86${digits}` : null;
}

/** 手机号打码：仅保留后 4 位 */
function maskPhone(phone: string): string {
  return `***${phone.slice(-4)}`;
}

/**
 * 调用腾讯云 SendSms（TC3-HMAC-SHA256 签名）。
 * 成功判定：无 Response.Error 且 SendStatusSet[0].Code === 'Ok'。
 */
async function sendSms(cfg: SmsConfig, phone: string, templateParamSet: string[]): Promise<SmsSendResult> {
  const { createHash, createHmac } = await getCrypto();

  const action = 'SendSms';
  const payload = JSON.stringify({
    PhoneNumberSet: [phone],
    SmsSdkAppId: cfg.sdkAppId,
    SignName: cfg.signName,
    TemplateId: cfg.templateId,
    TemplateParamSet: templateParamSet,
  });

  const sha256Hex = (input: string) => createHash('sha256').update(input).digest('hex');
  const hmac = (key: string | Uint8Array, data: string) => createHmac('sha256', key).update(data).digest();

  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

  const canonicalRequest = [
    'POST',
    '/',
    '',
    'content-type:application/json; charset=utf-8',
    `host:${SMS_HOST}`,
    '',
    'content-type;host',
    sha256Hex(payload),
  ].join('\n');

  const credentialScope = `${date}/${SMS_SERVICE}/tc3_request`;
  const stringToSign = [
    'TC3-HMAC-SHA256',
    String(timestamp),
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const secretDate = hmac(`TC3${cfg.secretKey}`, date);
  const secretService = hmac(secretDate, SMS_SERVICE);
  const secretSigning = hmac(secretService, 'tc3_request');
  const signature = createHmac('sha256', secretSigning).update(stringToSign).digest('hex');

  const authorization = `TC3-HMAC-SHA256 Credential=${cfg.secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`;

  const res = await fetch(`https://${SMS_HOST}`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json; charset=utf-8',
      Host: SMS_HOST,
      'X-TC-Action': action,
      'X-TC-Timestamp': String(timestamp),
      'X-TC-Version': SMS_VERSION,
      'X-TC-Region': cfg.region,
    },
    body: payload,
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, code: `HTTP_${res.status}`, message: text.slice(0, 200) };
  }
  const body = data?.Response ?? data;
  if (body?.Error) {
    return { ok: false, code: body.Error.Code, message: body.Error.Message };
  }
  const first = body?.SendStatusSet?.[0];
  if (!first || first.Code !== 'Ok') {
    return { ok: false, code: first?.Code ?? 'EMPTY_SEND_STATUS', message: first?.Message ?? '未返回发送状态' };
  }
  return { ok: true, code: 'Ok', message: first.Message };
}

/**
 * 质保审核通过后通知车主。**永不抛异常**，失败仅记日志。
 * 供两条审核路径共用：后台人工审核（functions/api/admin/reviews-[id].ts）
 * 与超时自动通过（server/src/auto-approve.ts）。
 */
export async function notifyWarrantyActivated(input: {
  recordId: string;
  certNo?: string | null;
  phone?: string | null;
}): Promise<void> {
  const label = `[sms] warranty record=${input.recordId}${input.certNo ? ` cert=${input.certNo}` : ''}`;
  try {
    const phone = normalizePhone(input.phone);
    if (!phone) {
      console.warn(`${label} 跳过短信：手机号缺失或非大陆手机号`);
      return;
    }
    const cfg = readConfig();
    if (!cfg) {
      console.warn(`${label} 跳过短信：未配置 SMS_SDK_APP_ID / SMS_SECRET_ID / SMS_SECRET_KEY`);
      return;
    }
    const result = await sendSms(cfg, phone, []);
    if (result.ok) {
      console.log(`${label} 短信已发送 phone=${maskPhone(phone)} template=${cfg.templateId}`);
    } else {
      console.warn(`${label} 短信发送失败 code=${result.code} message=${result.message}`);
    }
  } catch (err) {
    console.error(`${label} 短信发送异常`, err);
  }
}
