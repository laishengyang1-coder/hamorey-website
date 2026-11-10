// ============================================================
// BannersPage — 小程序首页轮播图管理
// ------------------------------------------------------------
// 上传图片（走 COS banners/ 前缀）、排序（上移/下移）、启用停用、删除。
// 小程序端读 /api/public/banners，改完即时生效，不用重新发版。
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest, getToken } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { DataTable, type Column } from '../../shared/components/DataTable';
import { DetailDrawer } from '../../shared/components/DetailDrawer';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';

interface BannerItem {
  id: string;
  title: string | null;
  image_file_key: string;
  image_url: string | null;
  link_page: string | null;
  sort_order: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

const EMPTY_FORM = { title: '', link_page: '', status: 'active' as 'active' | 'inactive', image_file_key: '' };

export default function BannersPage() {
  const [items, setItems] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<BannerItem | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [deleting, setDeleting] = useState<BannerItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ items: BannerItem[] }>('/admin/banners');
      setItems(res.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setPreviewUrl('');
    setDrawerOpen(true);
  };

  const openEdit = (item: BannerItem) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      link_page: item.link_page || '',
      status: item.status,
      image_file_key: item.image_file_key,
    });
    setPreviewUrl(item.image_url || '');
    setDrawerOpen(true);
  };

  /** 选图 → 取上传地址（banners/ 前缀）→ 直传 COS → 存 key */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const target = await apiRequest<{ uploadUrl: string; fileKey: string }>('/admin/upload-url', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, prefix: 'banners' }),
      });
      const fd = new FormData();
      fd.append('file', file);
      const token = getToken();
      const res = await fetch(target.uploadUrl, {
        method: 'POST',
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('图片上传失败');
      setForm((prev) => ({ ...prev, image_file_key: target.fileKey }));
      // 本地预览（新文件还没有签名 URL）
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err) {
      alert(err instanceof Error ? err.message : '图片上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.image_file_key) {
      alert('请先上传图片');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiRequest(`/admin/banners/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: form.title,
            link_page: form.link_page,
            status: form.status,
            image_file_key: form.image_file_key,
          }),
        });
      } else {
        await apiRequest('/admin/banners', {
          method: 'POST',
          body: JSON.stringify({
            title: form.title,
            link_page: form.link_page,
            status: form.status,
            image_file_key: form.image_file_key,
          }),
        });
      }
      setDrawerOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  /** 上移/下移：本地交换后一次性提交顺序 */
  const move = async (index: number, delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= items.length) return;
    const ordered = [...items];
    [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
    setItems(ordered);
    try {
      await apiRequest('/admin/banners', {
        method: 'PUT',
        body: JSON.stringify({ ids: ordered.map((x) => x.id) }),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : '排序保存失败');
      fetchData();
    }
  };

  const toggleStatus = async (item: BannerItem) => {
    try {
      await apiRequest(`/admin/banners/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: item.status === 'active' ? 'inactive' : 'active' }),
      });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiRequest(`/admin/banners/${deleting.id}`, { method: 'DELETE' });
      setDeleting(null);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleteBusy(false);
    }
  };

  const columns: Column[] = [
    {
      key: 'preview',
      title: '预览',
      width: '110px',
      render: (_, r: BannerItem) =>
        r.image_url ? (
          <img src={r.image_url} alt={r.title || ''} className="h-14 w-11 rounded border border-gray-200 object-cover" />
        ) : (
          <span className="text-xs text-gray-400">无图</span>
        ),
    },
    {
      key: 'title',
      title: '标题',
      dataIndex: 'title',
      render: (v) => (v ? String(v) : <span className="text-gray-400">—</span>),
    },
    {
      key: 'link_page',
      title: '点击跳转',
      dataIndex: 'link_page',
      render: (v) =>
        v ? (
          <span className="font-mono text-xs text-gray-600">{String(v)}</span>
        ) : (
          <span className="text-gray-400">不跳转</span>
        ),
    },
    { key: 'sort_order', title: '排序', dataIndex: 'sort_order', width: '70px' },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (_, r: BannerItem) => (
        <button
          onClick={() => toggleStatus(r)}
          title="点击切换启用/停用"
          className={
            r.status === 'active'
              ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-100'
              : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-200'
          }
        >
          {r.status === 'active' ? '启用中' : '已停用'}
        </button>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '190px',
      render: (_, r: BannerItem) => {
        const index = items.findIndex((x) => x.id === r.id);
        return (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => move(index, -1)}
              disabled={index <= 0}
              className="text-gray-500 hover:text-gray-900 disabled:opacity-30"
            >
              上移
            </button>
            <button
              onClick={() => move(index, 1)}
              disabled={index < 0 || index >= items.length - 1}
              className="text-gray-500 hover:text-gray-900 disabled:opacity-30"
            >
              下移
            </button>
            <button onClick={() => openEdit(r)} className="text-[#5C1A1A] hover:underline">
              编辑
            </button>
            <button onClick={() => setDeleting(r)} className="text-red-600 hover:underline">
              删除
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="轮播图管理"
        description="小程序首页的轮播图。改完即时生效，不需要重新发布小程序"
        actions={
          <button
            onClick={openCreate}
            className="rounded-lg bg-[#5C1A1A] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#7A2828]"
          >
            + 新增轮播图
          </button>
        }
      />

      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        建议尺寸 <strong>960×1280</strong>（竖版 3:4）。小程序轮播框约为 686×920rpx，比例接近 3:4，
        用这个尺寸基本不会被裁切。图片会自动走 COS 存储，1 年强缓存。
      </div>

      <DataTable
        columns={columns}
        data={items as unknown as Record<string, unknown>[]}
        loading={loading}
        error={error}
        emptyText="还没有轮播图，点右上角新增"
      />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? '编辑轮播图' : '新增轮播图'}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">图片</label>
            <div className="flex items-start gap-3">
              {previewUrl ? (
                <img src={previewUrl} alt="预览" className="h-40 w-28 rounded-lg border border-gray-200 object-cover" />
              ) : (
                <div className="flex h-40 w-28 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
                  未选择
                </div>
              )}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploading ? '上传中...' : previewUrl ? '更换图片' : '选择图片'}
                </button>
                <p className="text-xs text-gray-400">支持 JPG / PNG / WebP，≤10MB</p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">标题（仅后台识别用）</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="例如：2027 年度经销商大会"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">点击跳转（可留空）</label>
            <input
              type="text"
              value={form.link_page}
              onChange={(e) => setForm({ ...form, link_page: e.target.value })}
              placeholder="/pages/owner/warranty/index"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">
              留空则点击无反应。常用：质保查询 <code>/pages/owner/warranty/index</code>
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.status === 'active'}
              onChange={(e) => setForm({ ...form, status: e.target.checked ? 'active' : 'inactive' })}
              className="rounded border-gray-300"
            />
            启用（取消勾选后小程序不显示）
          </label>

          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="w-full rounded-lg bg-[#5C1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#7A2828] disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </DetailDrawer>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="删除这张轮播图？"
        description={`删除后小程序首页不再显示${deleting?.title ? `「${deleting.title}」` : '这张图'}。图片文件仍保留在存储里，不会影响其它内容。`}
        confirmText="删除"
        variant="danger"
        loading={deleteBusy}
        onConfirm={handleDelete}
      />
    </div>
  );
}
