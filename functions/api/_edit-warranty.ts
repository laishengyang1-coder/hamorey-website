import { type AuthContext, generateId } from './_lib';
import { certificateJob, inWarrantyTransaction, tryIssueCertificate, validInstallDate, warrantyExpiry, type CertificateEnv } from './_certificate-workflow';
import { error, ok } from './_middleware';

const columns: Record<string, string> = {
  customer_name: 'customer_name_snapshot', customer_phone: 'customer_phone_snapshot',
  plate_no: 'plate_no_snapshot', vin: 'vin_snapshot', vehicle_brand: 'vehicle_brand_snapshot',
  vehicle_model: 'vehicle_model_snapshot', installation_date: 'installation_date',
};

export async function editWarranty(env: CertificateEnv, user: AuthContext, id: string, body: unknown, ip: string) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return error('请填写要修改的字段', 400);
  const fields = Object.entries(body).filter(([name]) => Object.prototype.hasOwnProperty.call(columns, name));
  if (!fields.length || fields.some(([,value]) => typeof value !== 'string')) return error('修改字段无效', 400);
  for (const entry of fields) {
    if (entry[0] !== 'installation_date') continue;
    // Date inputs and earlier clients can submit either date-only or serialized UTC midnight.
    entry[1] = entry[1].replace(/T00:00:00(?:\.000)?Z$/, '');
    if (!validInstallDate(entry[1])) return error('施工日期无效', 400);
  }
  const province = user.role === 'PROVINCE';
  const result = await inWarrantyTransaction(env.DB, async tx => {
    const row = await tx.prepare(`SELECT wr.*, DATE_FORMAT(installation_date,'%Y-%m-%d') installed
      FROM warranty_records wr WHERE id = ? ${province ? 'AND province_org_id = ?' : ''} FOR UPDATE`)
      .bind(...(province ? [id, user.orgId] : [id])).first<Record<string, any>>();
    if (!row) return 'missing';
    const changed = fields.filter(([key,val]) => val !== (key === 'installation_date' ? row.installed : row[columns[key]] ?? ''));
    if (!changed.length) return 'unchanged';
    const assignments = changed.map(([key]) => columns[key] + ' = ?');
    const values = changed.map(([,v]) => v);
    const date = changed.find(([key]) => key === 'installation_date')?.[1];
    const issued = ['active','expired'].includes(row.status);
    if (issued && date) {
      const expires = warrantyExpiry(date, row.warranty_years_snapshot);
      assignments.push('warranty_expiry_date = ?', "status = CASE WHEN ? < CURDATE() THEN 'expired' ELSE 'active' END");
      values.push(expires, expires);
    }
    await tx.prepare(`UPDATE warranty_records SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = ?`)
      .bind(...values, id).run();
    await tx.prepare(`INSERT INTO operation_logs (id,user_id,action,target_type,target_id,detail_json,ip_address,created_at)
      VALUES (?,?,'edit_warranty_record','warranty_records',?,?,?,NOW())`)
      .bind(generateId(), user.userId, id, JSON.stringify(Object.fromEntries(changed)), ip).run();
    if (!issued || !row.certificate_no || !changed.some(([name]) => name !== 'customer_phone')) return 'saved';
    const job = certificateJob(id, user.userId);
    await tx.prepare(job.sql).bind(...job.params).run();
    return 'queued';
  });
  if (result === 'missing') return error('记录不存在或无权访问', 404);
  if (result === 'queued' && !await tryIssueCertificate(env, id)) {
    return ok({ certificatePending: true }, '修改已保存，证书更新中');
  }
  return ok(null, '修改成功');
}
