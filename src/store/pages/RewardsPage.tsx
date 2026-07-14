// ============================================================
// Store RewardsPage — 门店积分商城
// ============================================================

import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../shared/components/PageHeader';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';

interface Reward { id: string; category: string; name: string; points_required: number; stock_quantity: number | null; stock_status: string; description: string; }
interface Address { id: string; recipient_name: string; phone: string; province: string; city: string; detail_address: string; is_default: number; }

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [r, a] = await Promise.all([
          apiRequest<{ items: Reward[] }>('/store/rewards'),
          apiRequest<{ items: Address[] }>('/store/addresses'),
        ]);
        setRewards(r.items); setAddresses(a.items);
        const dft = a.items.find((addr) => addr.is_default);
        if (dft) setSelectedAddress(dft.id);
      } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); }
      finally { setLoading(false); }
    }
    init();
  }, []);

  const handleExchange = async () => {
    const reward = rewards.find((r) => r.id === selectedId);
    if (!reward || !selectedAddress) return;
    setSubmitting(true);
    try {
      await apiRequest('/store/redemptions', {
        method: 'POST',
        body: JSON.stringify({ address_id: selectedAddress, items: [{ reward_id: reward.id, quantity: 1 }] }),
      });
      setSuccessMsg(`"${reward.name}" 兑换申请已提交，等待审核`);
      setSelectedId(null);
    } catch (err) { alert(err instanceof Error ? err.message : '兑换失败'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>;
  if (error) return <div className="text-center py-16 text-gray-500"><p>{error}</p></div>;

  return (
    <div>
      <PageHeader title="积分商城" description="使用积分兑换商品" />
      {successMsg && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{successMsg}<button onClick={() => setSuccessMsg('')} className="ml-3 text-green-500 hover:text-green-700">✕</button></div>}
      {addresses.length === 0 && (
        <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">请先在「收货地址」中添加地址后再兑换</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
            <div className="h-32 bg-gray-50 rounded-lg mb-3 flex items-center justify-center text-gray-300 text-sm">暂无图片</div>
            <h3 className="text-sm font-medium text-gray-900">{r.name}</h3>
            {r.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</p>}
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm font-bold text-orange-600">{r.points_required} 积分</span>
              <button
                onClick={() => setSelectedId(r.id)}
                disabled={r.stock_status === 'out_of_stock' || addresses.length === 0}
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-[#7A2828] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {r.stock_status === 'out_of_stock' ? '售罄' : '兑换'}
              </button>
            </div>
          </div>
        ))}
        {rewards.length === 0 && <p className="col-span-full text-center py-12 text-gray-400 text-sm">暂无商品</p>}
      </div>

      {selectedId && (
        <ConfirmDialog
          open={!!selectedId}
          onOpenChange={(open) => { if (!open) setSelectedId(null); }}
          title="确认兑换"
          confirmText={submitting ? '提交中...' : '确认兑换'}
          loading={submitting}
          onConfirm={handleExchange}
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-600">确认兑换「{rewards.find((r) => r.id === selectedId)?.name}」？</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">收货地址</label>
              <select value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                {addresses.map((a) => <option key={a.id} value={a.id}>{a.recipient_name} {a.phone} {a.province}{a.city}{a.detail_address}</option>)}
              </select>
            </div>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
