import { useRef } from 'react';
import { Inbox, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useData } from '../../store/useData';
import { toast } from 'sonner';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/ui/button';

export function DocumentsPage() {
  const { documents, activeProjectId, refreshDocuments } = useData();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openDoc = async (path: string) => {
    await window.api.documents.open(path);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !activeProjectId) return;
    const file = files[0] as File & { path?: string };
    try {
      const filePath = file.path;
      if (!filePath) {
        toast.error('Pot do datoteke ni na voljo.');
        return;
      }
      await window.api.documents.attach({
        projectId: activeProjectId,
        filePath,
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
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardDescription>Dokumenti</CardDescription>
          <CardTitle>Priloženi PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col items-start justify-between gap-2 pb-2 sm:flex-row sm:items-center">
            <div className="text-sm text-muted-foreground">Shranjeno v: userData/uploads</div>
            <div className="flex items-center gap-2">
              <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => void handleUpload(e.target.files)} />
              <Button
                variant="primary"
                size="md"
                className="gap-2 shadow-soft"
                onClick={() => inputRef.current?.click()}
                disabled={!activeProjectId}
              >
                <Upload className="h-4 w-4" />
                Naloži PDF
              </Button>
            </div>
          </div>
          {!documents.length ? (
            <EmptyState title="Ni dokumentov" description="Pripnite PDF k aktivnemu projektu." icon={<Inbox className="h-5 w-5" />} />
          ) : (
            <div className="space-y-2">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-elevated/80 px-3 py-2 shadow-inner">
                  <div className="space-y-0.5">
                    <div className="font-medium">{d.original_name}</div>
                    <div className="text-xs text-muted-foreground">{(d.size / 1024).toFixed(1)} kB</div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => void openDoc(d.stored_path)}>
                    Odpri
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
