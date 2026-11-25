import type { Column } from './DataTable';

interface LedgerChange {
  change_type: string;
  points_change: number;
  frozen_change: number;
}

function availableDelta(row: LedgerChange) {
  switch (row.change_type) {
    case 'award':
    case 'adjust':
    case 'release':
      return row.points_change;
    case 'deduct':
    case 'revoke':
    case 'freeze':
      return -row.points_change;
    default:
      return 0;
  }
}

function frozenDelta(row: LedgerChange) {
  if (row.change_type === 'freeze') return row.frozen_change;
  if (row.change_type === 'release' || row.change_type === 'deduct') return -row.frozen_change;
  return 0;
}

function SignedPoints({ value }: { value: number }) {
  const color = value > 0 ? 'text-emerald-700' : value < 0 ? 'text-red-600' : 'text-gray-500';
  return <span className={color}>{value > 0 ? '+' : ''}{value}</span>;
}

export const pointsChangeColumns: Column[] = [
  { key: 'available_delta', title: '可用积分变动', render: (_, row) => <SignedPoints value={availableDelta(row)} /> },
  { key: 'frozen_delta', title: '冻结积分变动', render: (_, row) => <SignedPoints value={frozenDelta(row)} /> },
];

export function LedgerChangeSummary({ row }: { row: LedgerChange }) {
  const frozen = frozenDelta(row);
  return (
    <span className="text-xs font-semibold">
      可用 <SignedPoints value={availableDelta(row)} />
      {frozen !== 0 && <> · 冻结 <SignedPoints value={frozen} /></>}
    </span>
  );
}
