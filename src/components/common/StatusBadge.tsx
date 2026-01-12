import { cn } from '@/lib/utils';

type Status = 'pending' | 'sold' | 'in_stock' | 'partially_sold';

interface StatusBadgeProps {
  status: Status;
}

const statusStyles: Record<Status, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  // approved: 'bg-success/10 text-success border-success/20',
  in_stock: 'bg-success/10 text-success border-success/20', // Same as approved
  sold: 'bg-muted text-muted-foreground border-border',
  // ✅ NEW
  partially_sold: 'bg-blue-100 text-blue-800 border-blue-200',
};

const statusLabels: Record<Status, string> = {
  pending: 'Pending',
  // approved: 'In Stock',
  in_stock: 'In Stock', // Same as approved
  sold: 'Sold',
  // ✅ NEW
  partially_sold: 'Partially Sold',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium leading-none',
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
