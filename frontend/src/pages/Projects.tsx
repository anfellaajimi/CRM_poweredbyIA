import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, Pin, PinOff, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { clientsAPI, projectsAPI, UIProject } from '../services/api';

const ScoringBadge: React.FC<{ scoring?: string }> = ({ scoring }) => {
  const s = (scoring || 'Moyen').toLowerCase();
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    'hot 🔥': { bg: '#fee2e2', color: '#dc2626', label: 'Haute' },
    'chaud 🔥': { bg: '#fee2e2', color: '#dc2626', label: 'Haute' },
    'hot': { bg: '#fee2e2', color: '#dc2626', label: 'Haute' },
    'haute': { bg: '#fee2e2', color: '#dc2626', label: 'Haute' },
    'moyen': { bg: '#fef3c7', color: '#d97706', label: 'Moyen' },
    'faible': { bg: '#f3f4f6', color: '#6b7280', label: 'Faible' },
  };
  const c = cfg[s] || cfg['moyen'];
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
      {c.label}
    </span>
  );
};

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState<Partial<UIProject>>({
    name: '',
    clientId: '',
    status: 'en_cours',
    priority: 'moyenne',
    budget: 0,
    startDate: '',
    deadline: '',
    description: '',
    progress: 0,
    spent: 0,
    scoring: 'Moyen',
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsAPI.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: projectsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet ajouté');
      setIsAddModalOpen(false);
    },
  });

  const pinMutation = useMutation({
    mutationFn: (project: UIProject) =>
      projectsAPI.update(project.id, { ...project, isPinned: !project.isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet mis à jour');
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.detail ?? err?.message}`),
  });

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
  }, [projects]);

  const projectsByStatus = useMemo(
    () => ({
      Planification: sortedProjects.filter((p) => p.status === 'planification'),
      'En cours': sortedProjects.filter((p) => p.status === 'en_cours' || p.status === 'In Progress'),
      'Terminé': sortedProjects.filter((p) => p.status === 'termine' || p.status === 'Completed'),
      'En attente': sortedProjects.filter((p) => p.status === 'en_attente' || p.status === 'On Hold'),
    }),
    [sortedProjects]
  );

  const handleAddProject = () => {
    createMutation.mutate(newProject);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projets</h1>
          <p className="text-muted-foreground">Gérer et suivre vos projets</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex border border-border rounded-lg">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''} rounded-l-lg`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('kanban')} className={`p-2 ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : ''} rounded-r-lg`}><LayoutGrid className="w-4 h-4" /></button>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Ajouter un projet</Button>
        </div>
      </div>

      {isLoading ? <Card><CardContent className="pt-6">Chargement...</CardContent></Card> : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((project) => (
            <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="cursor-pointer">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.clientName}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          pinMutation.mutate(project);
                        }}
                        className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                        title={project.isPinned ? 'Désépingler' : 'Épingler'}
                      >
                        {project.isPinned ? (
                          <Pin className="w-4 h-4 text-red-600 fill-red-600" />
                        ) : (
                          <Pin className="w-4 h-4" />
                        )}
                      </button>
                      <Badge>{project.status}</Badge>
                      <ScoringBadge scoring={project.scoring} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2"><span className="text-muted-foreground">Avancement</span><span className="font-medium">{project.progress}%</span></div>
                    <div className="w-full bg-secondary rounded-full h-2"><div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all" style={{ width: `${project.progress}%` }} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div><p className="text-xs text-muted-foreground">Budget</p><p className="font-medium">{project.budget.toLocaleString()} {project.devise === 'EUR' ? '€' : project.devise === 'USD' ? '$' : 'DT'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Échéance</p><p className="font-medium">{project.deadline}</p></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(projectsByStatus).map(([status, statusProjects]) => (
            <div key={status}>
              <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">{status}</h3><Badge>{statusProjects.length}</Badge></div>
              <div className="space-y-3">
                {statusProjects.map((project) => (
                  <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="cursor-pointer">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-medium mb-2 truncate">{project.name}</h4>
                            <p className="text-sm text-muted-foreground mb-3 truncate">{project.clientName}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              pinMutation.mutate(project);
                            }}
                            className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors flex-shrink-0"
                            title={project.isPinned ? 'Désépingler' : 'Épingler'}
                          >
                            {project.isPinned ? (
                              <Pin className="w-4 h-4 text-red-600 fill-red-600" />
                            ) : (
                              <Pin className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex gap-2 items-center">
                            <Badge>{project.priority}</Badge>
                            <ScoringBadge scoring={project.scoring} />
                          </div>
                          <span className="text-muted-foreground">{project.progress}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Ajouter un projet">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddProject(); }}>
          <Input label="Nom du projet" value={newProject.name || ''} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} required />

          <div>
            <label className="block text-sm font-medium mb-1">Client</label>
            <select className="w-full border border-input rounded-lg p-2 bg-background" value={newProject.clientId || ''} onChange={(e) => setNewProject({ ...newProject, clientId: e.target.value })} required>
              <option value="">Sélectionner un client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Statut" value={newProject.status || ''} onChange={(e) => setNewProject({ ...newProject, status: e.target.value })} options={[{ value: 'planification', label: 'Planification' }, { value: 'en_cours', label: 'En cours' }, { value: 'en_attente', label: 'En attente' }, { value: 'termine', label: 'Terminé' }]} />
            <Select label="Priorité" value={newProject.priority || ''} onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })} options={[{ value: 'basse', label: 'Basse' }, { value: 'moyenne', label: 'Moyenne' }, { value: 'haute', label: 'Haute' }, { value: 'urgente', label: 'Urgente' }]} />
          </div>
          <Select label="Scoring" value={newProject.scoring || 'Moyen'} onChange={(e) => setNewProject({ ...newProject, scoring: e.target.value })} options={[{ value: 'Haute', label: 'Haute' }, { value: 'Moyen', label: 'Moyen' }, { value: 'Faible', label: 'Faible' }]} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Date de début" type="date" value={newProject.startDate || ''} onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })} />
            <Input label="Échéance" type="date" value={newProject.deadline || ''} onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label={`Budget (${newProject.clientId ? (clients.find(c => c.id === newProject.clientId)?.devise || 'DT') : 'DT/€/$'})`} type="number" value={newProject.budget?.toString() || '0'} onChange={(e) => setNewProject({ ...newProject, budget: Number(e.target.value) })} required />
            <Input label="Description" value={newProject.description || ''} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={createMutation.isPending}>Ajouter</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
