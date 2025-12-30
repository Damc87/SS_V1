import { useState } from 'react';
import { Card } from '../../components/ui/Card';
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
    <Card title="Projekti" subtitle="Upravljanje aktivnega projekta">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="border border-border rounded-xl px-3 py-2" placeholder="Ime projekta" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="border border-border rounded-xl px-3 py-2" placeholder="Opis" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button className="px-4 py-2 bg-primary text-white rounded-xl shadow-soft" onClick={handleCreate} disabled={!name}>
          Dodaj projekt
        </button>
        <div className="flex gap-2 flex-wrap">
          {projects.map((p) => (
            <span key={p.id} className="px-3 py-1 rounded-full bg-muted text-sm">
              {p.name}
            </span>
          ))}
          {!projects.length && <span className="text-sm text-slate-500">Ni projektov. Dodajte prvega.</span>}
        </div>
      </div>
    </Card>
  );
}
