import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Tabs } from '../components/ui/Tabs';
import {
  projectCahierAPI,
  projectFilesAPI,
  projectNotesAPI,
  projectsAPI,
  projectTeamAPI,
  UIProject,
  usersAPI,
} from '../services/api';

const ScoringBadge: React.FC<{ scoring?: string }> = ({ scoring }) => {
  const s = (scoring || 'Moyen').toLowerCase();
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    'hot 🔥': { bg: '#fee2e2', color: '#dc2626', label: 'Hot 🔥' },
    'hot': { bg: '#fee2e2', color: '#dc2626', label: 'Hot 🔥' },
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

const defaultCahier = {
  version: '1.0',
  objectif: '',
  perimetre: '',
  fonctionnalites: '',
  contraintes: '',
  delais: '',
  budgetTexte: '',
};

export const ProjectDetails: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Partial<UIProject>>({});
  const [newNote, setNewNote] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [cahierDraft, setCahierDraft] = useState<any>(defaultCahier);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getById(id),
    enabled: !!id,
  });

  const { data: team = [] } = useQuery({
    queryKey: ['project-team', id],
    queryFn: () => projectTeamAPI.get(id),
    enabled: !!id,
  });

  const { data: usersResp } = useQuery({
    queryKey: ['users'],
    queryFn: usersAPI.getAll,
  });

  const users = usersResp || [];

  const { data: notes = [] } = useQuery({
    queryKey: ['project-notes', id],
    queryFn: () => projectNotesAPI.get(id),
    enabled: !!id,
  });

  const { data: files = [] } = useQuery({
    queryKey: ['project-files', id],
    queryFn: () => projectFilesAPI.get(id),
    enabled: !!id,
  });

  const { data: cahier } = useQuery({
    queryKey: ['project-cahier', id],
    queryFn: () => projectCahierAPI.get(id),
    enabled: !!id,
    retry: false,
  });

  const updateProject = useMutation({
    mutationFn: (payload: Partial<UIProject>) => projectsAPI.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditModalOpen(false);
      toast.success('Projet modifié');
    },
  });

  const deleteProject = useMutation({
    mutationFn: () => projectsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet supprimé');
      navigate('/projects');
    },
  });

  const addTeam = useMutation({
    mutationFn: (userId: number) => projectTeamAPI.add(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setSelectedUserId('');
      toast.success('Membre ajouté');
    },
  });

  const removeTeam = useMutation({
    mutationFn: (userId: number) => projectTeamAPI.remove(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Membre retiré');
    },
  });

  const createNote = useMutation({
    mutationFn: (contenu: string) => projectNotesAPI.create(id, contenu),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-notes', id] });
      setNewNote('');
      toast.success('Note ajoutée');
    },
  });

  const removeNote = useMutation({
    mutationFn: (noteId: number) => projectNotesAPI.delete(id, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-notes', id] });
      toast.success('Note supprimée');
    },
  });

  const uploadFile = useMutation({
    mutationFn: (file: File) => projectFilesAPI.upload(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', id] });
      toast.success('Fichier uploadé');
    },
  });

  const removeFile = useMutation({
    mutationFn: (fileId: number) => projectFilesAPI.delete(id, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', id] });
      toast.success('Fichier supprimé');
    },
  });

  const upsertCahier = useMutation({
    mutationFn: (payload: any) => projectCahierAPI.upsert(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-cahier', id] });
      toast.success('Cahier sauvegardé');
    },
  });

  const readyCahier = useMemo(() => ({ ...defaultCahier, ...(cahier || {}), objet: project?.name || '' }), [cahier, project]);

  if (isLoading || !project) return <div>Chargement...</div>;

  const tabs = [
    {
      id: 'overview',
      label: 'Vue générale',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Détails du projet</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><p className="text-sm text-muted-foreground">Client</p><p className="font-medium">{project.clientName}</p></div>
              <div><p className="text-sm text-muted-foreground">Statut</p><div className="flex gap-2 items-center mt-1"><Badge>{project.status}</Badge><ScoringBadge scoring={project.scoring} /></div></div>
              <div><p className="text-sm text-muted-foreground">Priorité</p><Badge>{project.priority}</Badge></div>
              <div><p className="text-sm text-muted-foreground">Description</p><p className="font-medium">{project.description}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Calendrier & Budget</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><p className="text-sm text-muted-foreground">Date de début</p><p className="font-medium">{project.startDate}</p></div>
              <div><p className="text-sm text-muted-foreground">Échéance</p><p className="font-medium">{project.deadline}</p></div>
              <div><p className="text-sm text-muted-foreground">Budget</p><p className="font-medium">{project.budget.toLocaleString()} {project.devise === 'EUR' ? '€' : project.devise === 'USD' ? '$' : 'DT'}</p></div>
              <div><p className="text-sm text-muted-foreground">Dépensé</p><p className="font-medium">{project.spent.toLocaleString()} {project.devise === 'EUR' ? '€' : project.devise === 'USD' ? '$' : 'DT'}</p></div>
              <div><p className="text-sm text-muted-foreground">Avancement</p><p className="font-medium">{project.progress}%</p></div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'team',
      label: 'Équipe',
      content: (
        <Card>
          <CardHeader><CardTitle>Membres de l'équipe</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <select className="flex-1 border border-input rounded-lg p-2 bg-background" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                <option value="">Sélectionner un membre</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <Button type="button" onClick={() => selectedUserId && addTeam.mutate(Number(selectedUserId))}>Ajouter</Button>
            </div>
            <div className="space-y-3">
              {team.length ? team.map((member: any) => (
                <div key={member.userID} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div><p className="font-medium">{member.nom}</p><p className="text-sm text-muted-foreground">{member.role}</p></div>
                  <button onClick={() => removeTeam.mutate(member.userID)} className="text-red-500 hover:text-red-700 text-sm">Retirer</button>
                </div>
              )) : <p className="text-muted-foreground">Aucun membre assigné</p>}
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'notes',
      label: 'Bloc Notes',
      content: (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Écrire une note..." />
              <Button onClick={() => newNote.trim() && createNote.mutate(newNote.trim())}>Ajouter</Button>
            </div>
            <div className="space-y-3">
              {notes.map((note: any) => (
                <div key={note.noteID} className="flex items-start justify-between p-4 rounded-lg border border-border bg-secondary/30">
                  <div><p className="font-medium">{note.contenu}</p><p className="text-xs text-muted-foreground mt-1">{note.createdAt}</p></div>
                  <button onClick={() => removeNote.mutate(note.noteID)} className="text-red-500 hover:text-red-700 ml-4 text-sm">Retirer</button>
                </div>
              ))}
              {!notes.length && <p className="text-muted-foreground">Aucune note</p>}
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'cahier',
      label: 'Cahier de Charge',
      content: (
        <Card>
          <CardHeader><CardTitle>Cahier de charge</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input label="Version" value={cahierDraft.version || readyCahier.version} onChange={(e) => setCahierDraft({ ...readyCahier, ...cahierDraft, version: e.target.value })} />
            <Input label="Objectif" value={cahierDraft.objectif || readyCahier.objectif || ''} onChange={(e) => setCahierDraft({ ...readyCahier, ...cahierDraft, objectif: e.target.value })} />
            <Input label="Périmètre" value={cahierDraft.perimetre || readyCahier.perimetre || ''} onChange={(e) => setCahierDraft({ ...readyCahier, ...cahierDraft, perimetre: e.target.value })} />
            <Input label="Fonctionnalités" value={cahierDraft.fonctionnalites || readyCahier.fonctionnalites || ''} onChange={(e) => setCahierDraft({ ...readyCahier, ...cahierDraft, fonctionnalites: e.target.value })} />
            <Input label="Contraintes" value={cahierDraft.contraintes || readyCahier.contraintes || ''} onChange={(e) => setCahierDraft({ ...readyCahier, ...cahierDraft, contraintes: e.target.value })} />
            <Input label="Délais" value={cahierDraft.delais || readyCahier.delais || ''} onChange={(e) => setCahierDraft({ ...readyCahier, ...cahierDraft, delais: e.target.value })} />
            <Input label="Budget texte" value={cahierDraft.budgetTexte || readyCahier.budgetTexte || ''} onChange={(e) => setCahierDraft({ ...readyCahier, ...cahierDraft, budgetTexte: e.target.value })} />
            <Button onClick={() => upsertCahier.mutate({ ...readyCahier, ...cahierDraft, objet: project.name })}>Sauvegarder Cahier</Button>
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'files',
      label: 'Fichiers',
      content: (
        <Card>
          <CardHeader><CardTitle>Fichiers du projet</CardTitle></CardHeader>
          <CardContent>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors mb-4">
              <Upload className="w-4 h-4" />Télécharger des fichiers
              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile.mutate(e.target.files[0])} />
            </label>
            <div className="space-y-3">
              {files.map((file: any) => (
                <div key={file.fileID} className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/20">
                  <div><p className="text-sm font-medium">{file.nom}</p><p className="text-xs text-muted-foreground">{file.sizeBytes} bytes</p></div>
                  <div className="flex gap-2">
                    <a href={projectFilesAPI.downloadUrl(id, file.fileID)} className="text-primary text-sm hover:underline">Télécharger</a>
                    <button onClick={() => removeFile.mutate(file.fileID)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {!files.length && <p className="text-muted-foreground">Aucun fichier</p>}
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/projects')}><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>
      </div>
      <div className="flex items-start justify-between">
        <div><h1 className="text-3xl font-bold">{project.name}</h1><p className="text-muted-foreground">{project.clientName}</p></div>
        <div className="flex space-x-3">
          <Button onClick={() => { setEditProject(project); setIsEditModalOpen(true); }}><Edit className="w-4 h-4 mr-2" />Modifier</Button>
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(true)}><Trash2 className="w-4 h-4 mr-2" />Supprimer</Button>
        </div>
      </div>
      <Tabs tabs={tabs} defaultTab="overview" />

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier le projet">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); updateProject.mutate(editProject); }}>
          <Input label="Nom du projet" value={editProject?.name || ''} onChange={(e) => setEditProject({ ...editProject, name: e.target.value })} required />
          <Input label="Description" value={editProject?.description || ''} onChange={(e) => setEditProject({ ...editProject, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Select value={editProject?.status || ''} onChange={(e) => setEditProject({ ...editProject, status: e.target.value })} options={[{ value: 'planification', label: 'Planification' }, { value: 'en_cours', label: 'En cours' }, { value: 'en_attente', label: 'En attente' }, { value: 'termine', label: 'Terminé' }]} />
            <Select value={editProject?.priority || ''} onChange={(e) => setEditProject({ ...editProject, priority: e.target.value })} options={[{ value: 'haute', label: 'Haute' }, { value: 'moyenne', label: 'Moyenne' }, { value: 'basse', label: 'Basse' }]} />
            <Select value={editProject?.scoring || 'Moyen'} onChange={(e) => setEditProject({ ...editProject, scoring: e.target.value })} options={[{ value: 'Hot 🔥', label: 'Hot 🔥' }, { value: 'Moyen', label: 'Moyen' }, { value: 'Faible', label: 'Faible' }]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={`Budget (${project?.devise === 'EUR' ? '€' : project?.devise === 'USD' ? '$' : 'DT'})`} type="number" value={String(editProject?.budget ?? 0)} onChange={(e) => setEditProject({ ...editProject, budget: Number(e.target.value) })} />
            <Input label="Avancement (%)" type="number" value={String(editProject?.progress ?? 0)} onChange={(e) => setEditProject({ ...editProject, progress: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date de début" type="date" value={editProject?.startDate || ''} onChange={(e) => setEditProject({ ...editProject, startDate: e.target.value })} />
            <Input label="Échéance" type="date" value={editProject?.deadline || ''} onChange={(e) => setEditProject({ ...editProject, deadline: e.target.value })} />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
            <Button type="submit">Sauvegarder</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Supprimer le projet">
        <div className="space-y-4">
          <p className="text-muted-foreground">Confirmez la suppression de <strong>{project.name}</strong>.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button onClick={() => deleteProject.mutate()}><Trash2 className="w-4 h-4 mr-2" />Supprimer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
