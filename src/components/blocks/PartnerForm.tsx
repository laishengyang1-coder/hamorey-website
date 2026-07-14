// ============================================================
// 和膜 HAMOREY — PartnerForm 合作申请表单
// 9字段含隐私授权勾选，提交到 /api/partner-leads
// ============================================================

import { useState, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import { FormField } from '../ui/FormField';
import { submitPartnerLead } from '../../lib/api';
import { partnerLeadSchema } from '../../lib/validation';

interface FormState {
  name: string;
  phone: string;
  province: string;
  city: string;
  company_name: string;
  business_type: string;
  store_count: string;
  intended_type: string;
  message: string;
  privacy_agreed: boolean;
}

const initialState: FormState = {
  name: '',
  phone: '',
  province: '',
  city: '',
  company_name: '',
  business_type: '',
  store_count: '',
  intended_type: '',
  message: '',
  privacy_agreed: false,
};

const businessTypeOptions = [
  { value: 'car_beauty', label: '汽车美容' },
  { value: 'car_repair', label: '汽车维修' },
  { value: 'car_film', label: '汽车贴膜' },
  { value: 'car_sales', label: '汽车销售' },
  { value: 'other', label: '其他' },
];

const intendedTypeOptions = [
  { value: 'HEBC', label: '品牌灯塔店 (HEBC)' },
  { value: 'HSS', label: '标准服务中心 (HSS)' },
  { value: 'Service_Point', label: '区域服务点 (Service Point)' },
  { value: 'province', label: '省级代理' },
];

export function PartnerForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = useCallback(
    (field: keyof FormState, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSubmitError('');

      // Zod 校验
      const parseData = {
        ...form,
        store_count: form.store_count ? Number(form.store_count) : undefined,
      };
      const result = partnerLeadSchema.safeParse(parseData);

      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          if (!newErrors[field]) {
            newErrors[field] = issue.message;
          }
        });
        setErrors(newErrors);
        return;
      }

      setLoading(true);
      try {
        await submitPartnerLead({
          name: result.data.name,
          phone: result.data.phone,
          province: result.data.province || undefined,
          city: result.data.city || undefined,
          company_name: result.data.company_name || undefined,
          business_type: result.data.business_type || undefined,
          store_count: result.data.store_count,
          intended_type: result.data.intended_type || undefined,
          message: result.data.message || undefined,
          privacy_agreed: result.data.privacy_agreed,
          source: 'website_partner',
        });
        setSuccess(true);
        setForm(initialState);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '提交失败，请稍后重试';
        setSubmitError(message);
      } finally {
        setLoading(false);
      }
    },
    [form],
  );

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-status-success/15 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M8 16l5 5L24 10"
              stroke="var(--status-success)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-content-primary">
          合作申请提交成功
        </h3>
        <p className="text-sm text-content-secondary max-w-md">
          感谢您的关注！和膜招商团队将在 1-3 个工作日内与您联系，请保持手机畅通。
        </p>
        <Button onClick={() => setSuccess(false)} variant="outline">
          再次提交
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField label="姓名" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="请输入您的姓名"
            error={errors.name}
          />
        </FormField>
        <FormField label="手机号" required error={errors.phone}>
          <Input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="请输入11位手机号"
            maxLength={11}
            error={errors.phone}
          />
        </FormField>
        <FormField label="所在省份" error={errors.province}>
          <Input
            value={form.province}
            onChange={(e) => handleChange('province', e.target.value)}
            placeholder="如：广东"
            error={errors.province}
          />
        </FormField>
        <FormField label="所在城市" error={errors.city}>
          <Input
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="如：广州"
            error={errors.city}
          />
        </FormField>
        <FormField label="公司/门店名称" error={errors.company_name}>
          <Input
            value={form.company_name}
            onChange={(e) => handleChange('company_name', e.target.value)}
            placeholder="请输入公司或门店名称"
            error={errors.company_name}
          />
        </FormField>
        <FormField label="当前业务类型" error={errors.business_type}>
          <Select
            placeholder="请选择业务类型"
            value={form.business_type}
            onChange={(e) => handleChange('business_type', e.target.value)}
            options={businessTypeOptions}
            error={errors.business_type}
          />
        </FormField>
        <FormField label="现有门店数量" error={errors.store_count}>
          <Input
            type="number"
            value={form.store_count}
            onChange={(e) => handleChange('store_count', e.target.value)}
            placeholder="如：3"
            min={0}
            error={errors.store_count}
          />
        </FormField>
        <FormField label="意向合作类型" error={errors.intended_type}>
          <Select
            placeholder="请选择合作类型"
            value={form.intended_type}
            onChange={(e) => handleChange('intended_type', e.target.value)}
            options={intendedTypeOptions}
            error={errors.intended_type}
          />
        </FormField>
      </div>

      <FormField label="留言" error={errors.message}>
        <textarea
          value={form.message}
          onChange={(e) => handleChange('message', e.target.value)}
          placeholder="请简要描述您的合作意向或问题（选填）"
          maxLength={500}
          rows={4}
          className="w-full px-4 py-3 rounded bg-elevated text-content-primary placeholder:text-content-muted border border-border-default transition-fast focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
        />
        {errors.message && (
          <p className="text-xs text-status-error">{errors.message}</p>
        )}
      </FormField>

      <Checkbox
        checked={form.privacy_agreed}
        onChange={(e) => handleChange('privacy_agreed', e.target.checked)}
        error={errors.privacy_agreed}
        label={
          <span>
            我已阅读并同意
            <Link
              to="/privacy"
              className="text-content-brand hover:text-brand-light ml-1 underline"
            >
              隐私政策
            </Link>
          </span>
        }
      />

      {submitError && (
        <p className="text-sm text-status-error">{submitError}</p>
      )}

      <Button type="submit" size="lg" loading={loading} className="w-full md:w-auto md:self-start">
        {loading ? '提交中...' : '提交合作申请'}
      </Button>
    </form>
  );
}
