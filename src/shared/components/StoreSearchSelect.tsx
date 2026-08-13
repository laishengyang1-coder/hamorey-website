// ============================================================
// StoreSearchSelect — 门店搜索选择器（关键字联想）
// 输入关键字实时搜索门店，下拉选中；替代静态下拉，门店多时也易选。
// 父组件通过 fetchStores(keyword) 注入搜索逻辑（省代/总部接口不同）。
// ============================================================

import React, { useEffect, useRef, useState } from 'react';

interface StoreOption {
  id: string;
  name: string;
}

interface StoreSearchSelectProps {
  value: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  fetchStores: (keyword: string) => Promise<StoreOption[]>;
  onSelect: (id: string, name: string) => void;
}

export function StoreSearchSelect({ value, placeholder = '输入关键字搜索门店', label, required, fetchStores, onSelect }: StoreSearchSelectProps) {
  const [keyword, setKeyword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [options, setOptions] = useState<StoreOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);

  // 点击组件外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (kw: string) => {
    setLoading(true);
    fetchStores(kw)
      .then((list) => { setOptions(list || []); setLoading(false); })
      .catch(() => { setOptions([]); setLoading(false); });
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const kw = e.target.value;
    setKeyword(kw);
    setDisplayName(kw);
    setOpen(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => search(kw), 300);
  };

  const handleFocus = () => {
    setOpen(true);
    search(keyword || '');
  };

  const pick = (opt: StoreOption) => {
    setDisplayName(opt.name);
    setKeyword('');
    setOptions([]);
    setOpen(false);
    onSelect(opt.id, opt.name);
  };

  return (
    <div ref={boxRef} className="relative">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>}
      <input
        value={keyword || displayName}
        onChange={handleInput}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-100 bg-white shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-xs text-gray-400">搜索中...</div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">无匹配门店</div>
          ) : (
            options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => pick(o)}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-[#5C1A1A]/5 ${o.id === value ? 'text-[#5C1A1A] font-medium' : 'text-gray-700'}`}
              >
                {o.name}
                {o.id === value && <span className="float-right text-xs text-[#5C1A1A]">✓</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
