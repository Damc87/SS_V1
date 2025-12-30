import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useData } from '../../store/useData';

export function ProjectsPanel() {
  const { projects, addProject, setActiveProject } = useData();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!name) return;
    const project = await addProject({ name, description });
    await setActiveProject(project.id);
    setName('');
    setDescription('');
  };

  return (
    <Card>
      <CardHeader>
        <CardDescription>Projekti</CardDescription>
        <CardTitle>Upravljanje aktivnega projekta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Ime projekta" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Opis" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button onClick={handleCreate} disabled={!name} variant="primary">
          Dodaj projekt
        </Button>
        <div className="flex flex-wrap gap-2">
          {projects.map((p) => (
            <span key={p.id} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-slate-700">
              <ClipboardCheck className="h-4 w-4" />
              {p.name}
            </span>
          ))}
          {!projects.length && <span className="text-sm text-slate-500">Ni projektov. Dodajte prvega.</span>}
        </div>
      </CardContent>
    </Card>
  );
}
