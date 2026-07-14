// ============================================================
// usePagination — 分页状态 Hook
// ============================================================

import { useState, useCallback } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  total: number;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  setTotal: (t: number) => void;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  goNext: () => void;
  goPrev: () => void;
  reset: () => void;
}

export function usePagination(
  initialPage: number = 1,
  initialPageSize: number = 20,
): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const goNext = useCallback(() => {
    if (hasNext) setPage((p) => p + 1);
  }, [hasNext]);

  const goPrev = useCallback(() => {
    if (hasPrev) setPage((p) => p - 1);
  }, [hasPrev]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setTotal(0);
  }, [initialPage]);

  return {
    page,
    pageSize,
    total,
    setPage,
    setPageSize,
    setTotal,
    totalPages,
    hasNext,
    hasPrev,
    goNext,
    goPrev,
    reset,
  };
}
