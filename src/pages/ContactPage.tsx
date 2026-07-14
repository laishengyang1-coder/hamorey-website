// ============================================================
// 和膜 HAMOREY — 合作咨询页 /contact/
// ============================================================

import { useState, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../lib/seo';
import { PageLayout } from '../layouts/PageLayout';
import { ScrollReveal } from '../components/ScrollReveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FormField } from '../components/ui/FormField';
import { Checkbox } from '../components/ui/Checkbox';
import { submitContact } from '../lib/api';
import { contactFormSchema } from '../lib/validation';
import { siteConfig } from '../config/site';

interface FormState {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  privacy_agreed: boolean;
}

const initialState: FormState = {
  name: '',
  phone: '',
  email: '',
  subject: '',
  message: '',
  privacy_agreed: false,
};

export default function ContactPage() {
  useSEO('contact');

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

      const result = contactFormSchema.safeParse(form);
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          if (!newErrors[field]) newErrors[field] = issue.message;
        });
        setErrors(newErrors);
        return;
      }

      setLoading(true);
      try {
        await submitContact({
          name: result.data.name,
          phone: result.data.phone,
          email: result.data.email || undefined,
          subject: result.data.subject,
          message: result.data.message,
          privacy_agreed: result.data.privacy_agreed,
        });
        setSuccess(true);
        setForm(initialState);
      } catch (err) {
        const message = err instanceof Error ? err.message : '提交失败，请稍后重试';
        setSubmitError(message);
      } finally {
        setLoading(false);
      }
    },
    [form],
  );

  return (
    <PageLayout
      hero
      subtitle="Contact"
      title="合作咨询"
      description="和膜招商与业务合作咨询入口，提交您的合作意向，我们将尽快与您联系。"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 联系方式 */}
        <ScrollReveal>
          <div className="flex flex-col gap-6">
            <Card padding="lg">
              <h3 className="text-base font-semibold text-content-primary mb-4">
                联系方式
              </h3>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs text-content-muted mb-1">客服电话</p>
                  <p className="text-lg font-medium text-content-brand">
                    {siteConfig.contact.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-content-muted mb-1">邮箱</p>
                  <p className="text-sm text-content-primary">
                    {siteConfig.contact.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-content-muted mb-1">地址</p>
                  <p className="text-sm text-content-secondary">
                    {siteConfig.contact.address}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-content-muted mb-1">营业时间</p>
                  <p className="text-sm text-content-secondary">
                    {siteConfig.contact.businessHours}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-base font-semibold text-content-primary mb-3">
                其他入口
              </h3>
              <div className="flex flex-col gap-2">
                <Link
                  to="/partner"
                  className="text-sm text-content-brand hover:text-brand-light transition-fast"
                >
                  → 百店计划合作申请
                </Link>
                <Link
                  to="/stores"
                  className="text-sm text-content-brand hover:text-brand-light transition-fast"
                >
                  → 查找授权门店
                </Link>
                <Link
                  to="/warranty"
                  className="text-sm text-content-brand hover:text-brand-light transition-fast"
                >
                  → 质保查询
                </Link>
              </div>
            </Card>
          </div>
        </ScrollReveal>

        {/* 咨询表单 */}
        <ScrollReveal delay={200} className="lg:col-span-2">
          <Card padding="lg">
            {success ? (
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
                  咨询提交成功
                </h3>
                <p className="text-sm text-content-secondary max-w-md">
                  感谢您的咨询！和膜团队将在 1-3 个工作日内与您联系。
                </p>
                <Button onClick={() => setSuccess(false)} variant="outline">
                  再次提交
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-content-primary mb-6">
                  咨询表单
                </h3>
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
                    <FormField label="邮箱" error={errors.email}>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="请输入邮箱（选填）"
                        error={errors.email}
                      />
                    </FormField>
                    <FormField label="咨询主题" required error={errors.subject}>
                      <Input
                        value={form.subject}
                        onChange={(e) => handleChange('subject', e.target.value)}
                        placeholder="如：产品合作咨询"
                        error={errors.subject}
                      />
                    </FormField>
                  </div>

                  <FormField label="咨询内容" required error={errors.message}>
                    <textarea
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      placeholder="请详细描述您的咨询内容"
                      maxLength={1000}
                      rows={5}
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

                  <Button
                    type="submit"
                    size="lg"
                    loading={loading}
                    className="w-full md:w-auto md:self-start"
                  >
                    {loading ? '提交中...' : '提交咨询'}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </ScrollReveal>
      </div>
    </PageLayout>
  );
}
