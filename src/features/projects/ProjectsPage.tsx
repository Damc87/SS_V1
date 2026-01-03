import { useMemo, useState } from 'react';
import { FolderPlus, MapPin, Sparkles, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../../store/useData';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { EmptyState } from '../../components/EmptyState';

export function ProjectsPage() {
  const { projects, activeProjectId, setActiveProject, addProject } = useData();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tab, setTab] = useState('overview');

  const stats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.find((p) => p.id === activeProjectId)?.name ?? 'Ni izbran',
      archived: 0,
    };
  }, [projects, activeProjectId]);

  const handleCreate = async () => {
    if (!name) return;
    try {
      const project = await addProject({ name, description });
      await setActiveProject(project.id);
      setName('');
      setDescription('');
    } catch {
      // toast already handled
    }
  };

  if (!projects.length) {
    return (
      <EmptyState
        title="Ni projektov"
        description="Dodajte prvi projekt, da se odklenejo stroški, faze in dokumenti."
        icon={<FolderPlus className="h-5 w-5" />}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Ime projekta" value={name} onChange={(e) => setName(e.target.value)} className="w-64" />
            <Button onClick={handleCreate} disabled={!name} className="shadow-soft">
              Ustvari projekt
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardHeader>
            <CardDescription>Skupaj projektov</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass">
          <CardHeader>
            <CardDescription>Aktivni projekt</CardDescription>
            <CardTitle className="text-xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass">
          <CardHeader>
            <CardDescription>Arhivirani</CardDescription>
            <CardTitle className="text-xl">{stats.archived}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Pregled</TabsTrigger>
          <TabsTrigger value="add">Dodaj</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => {
              const isActive = project.id === activeProjectId;
              return (
                <motion.div key={project.id} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                  <Card className="glass">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardDescription className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Lokacija ni nastavljena
                          </CardDescription>
                          <CardTitle>{project.name}</CardTitle>
                        </div>
                        {isActive && (
                          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-foreground">Aktivni</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <p className="text-sm text-muted-foreground">{project.description || 'Ni opisa projekta.'}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {isActive ? (
                          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-foreground">Aktivni</span>
                        ) : (
                          <Button variant="secondary" size="sm" onClick={() => setActiveProject(project.id)}>
                            Nastavi kot aktivnega
                          </Button>
                        )}
                        <span className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground">ID: {project.id.slice(0, 6)}</span>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(project.id)}>
                          <Trash2 className="h-4 w-4" />
                          Izbriši
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="add">
          <Card className="glass">
            <CardHeader>
              <CardDescription>Dodaj projekt</CardDescription>
              <CardTitle>Hiter vnos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Ime projekta" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Opis (opcijsko)" value={description} onChange={(e) => setDescription(e.target.value)} />
              <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground shadow-inner">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Zaenkrat enostaven obrazec – kasneje dodajte faze in proračune.
                </div>
                <Button onClick={handleCreate} disabled={!name} className="shadow-soft">
                  Shrani
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Želite arhivirati projekt? Podatki bodo ostali v shrambi.');
    if (!confirm) return;
    try {
      await deleteProject(id);
    } catch {
      // toast handled globally
    }
  };
