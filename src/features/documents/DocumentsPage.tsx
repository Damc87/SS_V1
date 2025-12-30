import { Card } from '../../components/ui/Card';
import { useData } from '../../store/useData';
import { ipc } from '../../lib/ipc';

export function DocumentsPage() {
  const { documents } = useData();

  const openDoc = async (path: string) => {
    await ipc['documents:open'](path);
  };

  return (
    <div className="space-y-4">
      <Card title="Dokumenti" subtitle="Priloženi PDF">
        <div className="space-y-2">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between border border-border rounded-xl px-3 py-2 bg-white">
              <div>
                <div className="font-medium">{d.original_name}</div>
                <div className="text-xs text-slate-500">{(d.size / 1024).toFixed(1)} kB</div>
              </div>
              <button className="px-3 py-1 rounded-lg bg-muted text-sm" onClick={() => void openDoc(d.stored_path)}>
                Odpri
              </button>
            </div>
          ))}
          {!documents.length && <div className="text-slate-500 text-sm">Ni dokumentov.</div>}
        </div>
      </Card>
    </div>
  );
}
