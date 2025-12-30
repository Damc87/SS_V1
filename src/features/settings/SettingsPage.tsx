import { Card } from '../../components/ui/Card';

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <Card title="Nastavitve" subtitle="Valuta, DDV, backup">
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-center gap-3">
            <label className="w-32 text-slate-500">Valuta</label>
            <input className="border border-border rounded-xl px-3 py-2" defaultValue="EUR" />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-32 text-slate-500">Privzeti DDV</label>
            <input className="border border-border rounded-xl px-3 py-2" defaultValue="22" type="number" />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl bg-primary text-white shadow-soft">Izvozi backup</button>
            <button className="px-4 py-2 rounded-xl border border-border">Uvozi backup</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
