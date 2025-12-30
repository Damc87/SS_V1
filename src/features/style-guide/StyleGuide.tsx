import { Card } from '../../components/ui/Card';

export function StyleGuide() {
  return (
    <div className="space-y-4">
      <Card title="Gumbi" subtitle="Glavni in sekundarni">
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-xl bg-primary text-white shadow-soft font-semibold">Primarni</button>
          <button className="px-4 py-2 rounded-xl border border-border bg-white text-slate-700">Sekundarni</button>
        </div>
      </Card>
    </div>
  );
}
