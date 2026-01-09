import { cn } from '@/lib/utils';

type Status = 'pending' | 'approved' | 'sold' | 'in_stock';

interface StatusBadgeProps {
  status: Status;
}

const statusStyles: Record<Status, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  in_stock: 'bg-success/10 text-success border-success/20', // Same as approved
  sold: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<Status, string> = {
  pending: 'Pending',
  approved: 'In Stock',
  in_stock: 'In Stock', // Same as approved
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
