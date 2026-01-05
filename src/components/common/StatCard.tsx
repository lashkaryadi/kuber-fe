import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

const variantStyles = {
  default: 'border-border',
  primary: 'border-l-4 border-l-primary',
  success: 'border-l-4 border-l-success',
  warning: 'border-l-4 border-l-warning',
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn('stat-card', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-serif font-semibold text-foreground">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                'mt-1 text-sm',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="rounded-lg bg-muted p-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
