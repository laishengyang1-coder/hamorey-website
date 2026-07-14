// ============================================================
// useConfirm — 确认弹窗 Hook
// 适用于删除、划拨、审核等危险操作的二次确认
// ============================================================

import { useState, useCallback, useRef } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolveRef: React.MutableRefObject<((value: boolean) => void) | null>;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    confirmLabel: '确认',
    cancelLabel: '取消',
    variant: 'default',
    resolveRef: { current: null },
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setState({
          open: true,
          title: options.title || '',
          message: options.message,
          confirmLabel: options.confirmLabel || '确认',
          cancelLabel: options.cancelLabel || '取消',
          variant: options.variant || 'default',
          resolveRef,
        });
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState((s) => ({ ...s, open: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState((s) => ({ ...s, open: false }));
  }, []);

  return {
    confirm,
    confirmState: {
      open: state.open,
      title: state.title,
      message: state.message,
      confirmLabel: state.confirmLabel,
      cancelLabel: state.cancelLabel,
      variant: state.variant,
    },
    handleConfirm,
    handleCancel,
  };
}

export type { ConfirmOptions };
