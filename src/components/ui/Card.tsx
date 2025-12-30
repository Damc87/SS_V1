import { ReactNode } from 'react';

export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-card space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500">{subtitle}</div>
          <div className="text-base font-semibold text-slate-900">{title}</div>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
