import { type ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed border-slate-200 bg-white/80', className)}>
      <CardContent className="flex flex-col items-center justify-center gap-3 text-center text-slate-600">
        {icon && <div className="rounded-2xl bg-muted/80 p-3 text-slate-700 shadow-inner">{icon}</div>}
        <div className="text-lg font-semibold text-slate-900">{title}</div>
        {description && <p className="text-sm text-slate-500 max-w-md">{description}</p>}
        {action}
      </CardContent>
    </Card>
  );
}
