import { Card } from '../../components/ui/Card';
import { useData } from '../../store/useData';
import { useRef } from 'react';
import { toast } from 'sonner';

export function DocumentsPage() {
  const { documents, activeProjectId, refreshDocuments } = useData();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openDoc = async (path: string) => {
    await window.api.documents.open(path);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !activeProjectId) return;
    const file = files[0];
    try {
      await window.api.documents.attach({
        projectId: activeProjectId,
        filePath: (file as any).path,
      });
      await refreshDocuments(activeProjectId);
      toast.success('Dokument shranjen v lokalno mapo.');
    } catch (error) {
      console.error(error);
      toast.error('Nalaganje dokumenta ni uspelo.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Dokumenti" subtitle="Priloženi PDF">
        <div className="flex items-center justify-between pb-3">
          <div className="text-sm text-slate-600">Shranjeno v: userData/uploads</div>
          <div className="flex items-center gap-2">
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => void handleUpload(e.target.files)} />
            <button className="px-4 py-2 rounded-xl bg-primary text-white shadow-soft text-sm" onClick={() => inputRef.current?.click()} disabled={!activeProjectId}>
              Naloži PDF
            </button>
          </div>
        </div>
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
