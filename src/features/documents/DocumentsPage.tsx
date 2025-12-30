import { useRef } from 'react';
import { Inbox } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useData } from '../../store/useData';
import { toast } from 'sonner';
import { EmptyState } from '../../components/EmptyState';

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
      <Card>
        <CardHeader>
          <CardDescription>Dokumenti</CardDescription>
          <CardTitle>Priloženi PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col items-start justify-between gap-2 pb-2 sm:flex-row sm:items-center">
            <div className="text-sm text-slate-600">Shranjeno v: userData/uploads</div>
            <div className="flex items-center gap-2">
              <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => void handleUpload(e.target.files)} />
              <button className="px-4 py-2 rounded-xl bg-primary text-white shadow-soft text-sm" onClick={() => inputRef.current?.click()} disabled={!activeProjectId}>
                Naloži PDF
              </button>
            </div>
          </div>
          {!documents.length ? (
            <EmptyState title="Ni dokumentov" description="Pripnite PDF k aktivnemu projektu." icon={<Inbox className="h-5 w-5" />} />
          ) : (
            <div className="space-y-2">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2">
                  <div>
                    <div className="font-medium">{d.original_name}</div>
                    <div className="text-xs text-slate-500">{(d.size / 1024).toFixed(1)} kB</div>
                  </div>
                  <button className="px-3 py-1 rounded-lg bg-muted text-sm" onClick={() => void openDoc(d.stored_path)}>
                    Odpri
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
