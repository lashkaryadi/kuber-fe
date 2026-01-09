import { cn } from '@/lib/utils';

type Status = 'pending' | 'approved' | 'sold';

interface StatusBadgeProps {
  status: Status;
}

const statusStyles: Record<Status, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  sold: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<Status, string> = {
  pending: 'Pending',
  approved: 'In Stock',
  sold: 'Sold',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
