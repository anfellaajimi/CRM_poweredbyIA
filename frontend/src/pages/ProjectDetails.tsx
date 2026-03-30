import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Pin, PinOff, Plus, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Tabs } from '../components/ui/Tabs';
import { CahierForm } from '../components/cahier/CahierForm';
import {
  milestonesAPI,
  projectCahierAPI,
  projectFilesAPI,
  projectNotesAPI,
  projectsAPI,
  projectTeamAPI,
  UIProject,
  UICahier,
  UIProjetMilestone,
  UIRappel,
  usersAPI,
  rappelsAPI,
} from '../services/api';

const ScoringBadge: React.FC<{ scoring?: string }> = ({ scoring }) => {
  const s = (scoring || 'Moyen').toLowerCase();
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    'hot ðŸ”¥': { bg: '#fee2e2', color: '#dc2626', label: 'Hot ðŸ”¥' },
    'hot': { bg: '#fee2e2', color: '#dc2626', label: 'Hot ðŸ”¥' },
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

const cahierDefaults: Partial<UICahier> = {
  version: '1.0',
  description: '',
  objectif: '',
  perimetre: '',
  fonctionnalites: '',
  contraintes: '',
  delais: '',
  budgetTexte: '',
  fileUrl: '',
  dateValidation: '',
  userStories: '',
  reglesMetier: '',
  documentsReference: '',
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
  const [cahierDraft, setCahierDraft] = useState<Partial<UICahier>>(cahierDefaults);

  const [isRappelModalOpen, setIsRappelModalOpen] = useState(false);
  const [editingRappel, setEditingRappel] = useState<UIRappel | null>(null);
  const [rappelForm, setRappelForm] = useState<Partial<UIRappel>>({
    clientID: 0,
    projetID: Number(id),
    titre: '',
    description: '',
    dateLimite: '',
    priorite: 'moyenne',
    statut: 'en_attente',
  });

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<UIProjetMilestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState<Partial<UIProjetMilestone>>({
    title: '',
    description: '',
    dueDate: '',
    status: 'open',
  });

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

  const { data: rappels = [] } = useQuery({
    queryKey: ['project-rappels', id],
    queryFn: () => rappelsAPI.getAll({ projetID: Number(id) }),
    enabled: !!id,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['project-milestones', id],
    queryFn: () => milestonesAPI.list(id),
    enabled: !!id,
  });

  const updateProject = useMutation({
    mutationFn: (payload: Partial<UIProject>) => projectsAPI.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditModalOpen(false);
      toast.success('Projet modifiÃ©');
    },
  });

  const deleteProject = useMutation({
    mutationFn: () => projectsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet supprimÃ©');
      navigate('/projects');
    },
  });

  const addTeam = useMutation({
    mutationFn: (userId: number) => projectTeamAPI.add(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setSelectedUserId('');
      toast.success('Membre ajoutÃ©');
    },
  });

  const removeTeam = useMutation({
    mutationFn: (userId: number) => projectTeamAPI.remove(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Membre retirÃ©');
    },
  });

  const createNote = useMutation({
    mutationFn: (contenu: string) => projectNotesAPI.create(id, contenu),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-notes', id] });
      setNewNote('');
      toast.success('Note ajoutÃ©e');
    },
  });

  const removeNote = useMutation({
    mutationFn: (noteId: number) => projectNotesAPI.delete(id, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-notes', id] });
      toast.success('Note supprimÃ©e');
    },
  });

  const uploadFile = useMutation({
    mutationFn: (file: File) => projectFilesAPI.upload(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', id] });
      toast.success('Fichier uploadÃ©');
    },
  });

  const removeFile = useMutation({
    mutationFn: (fileId: number) => projectFilesAPI.delete(id, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', id] });
      toast.success('Fichier supprimÃ©');
    },
  });

  const upsertCahier = useMutation({
    mutationFn: (payload: any) => projectCahierAPI.upsert(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-cahier', id] });
      toast.success('Cahier sauvegardÃ©');
    },
  });

  const createRappel = useMutation({
    mutationFn: (payload: Partial<UIRappel>) => rappelsAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-rappels', id] });
      queryClient.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Rappel créé');
      setIsRappelModalOpen(false);
      setEditingRappel(null);
    },
  });

  const updateRappel = useMutation({
    mutationFn: ({ rappelId, payload }: { rappelId: number; payload: Partial<UIRappel> }) =>
      rappelsAPI.update(rappelId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-rappels', id] });
      queryClient.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Rappel mis à jour');
      setIsRappelModalOpen(false);
      setEditingRappel(null);
    },
  });

  const deleteRappel = useMutation({
    mutationFn: (rappelId: number) => rappelsAPI.delete(rappelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-rappels', id] });
      queryClient.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Rappel supprimé');
    },
  });

  const createMilestone = useMutation({
    mutationFn: (payload: Partial<UIProjetMilestone>) => milestonesAPI.create(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', id] });
      toast.success('Jalon créé');
      setIsMilestoneModalOpen(false);
      setEditingMilestone(null);
    },
  });

  const updateMilestone = useMutation({
    mutationFn: ({ milestoneId, payload }: { milestoneId: number; payload: Partial<UIProjetMilestone> }) =>
      milestonesAPI.update(id, milestoneId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', id] });
      toast.success('Jalon mis à jour');
      setIsMilestoneModalOpen(false);
      setEditingMilestone(null);
    },
  });

  const deleteMilestone = useMutation({
    mutationFn: (milestoneId: number) => milestonesAPI.delete(id, milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', id] });
      toast.success('Jalon supprimé');
    },
  });

  const readyCahier = useMemo(() => {
    const raw: any = cahier || {};
    return {
      ...cahierDefaults,
      ...raw,
      projetID: Number(id),
      objet: raw.objet || project?.name || '',
      dateCreation: typeof raw.dateCreation === 'string' ? String(raw.dateCreation).slice(0, 10) : '',
      dateValidation: typeof raw.dateValidation === 'string' ? String(raw.dateValidation).slice(0, 10) : '',
    } as Partial<UICahier>;
  }, [cahier, project, id]);

  useEffect(() => {
    setCahierDraft(readyCahier);
  }, [readyCahier]);

  useEffect(() => {
    if (!project) return;
    setRappelForm((prev) => ({
      ...prev,
      projetID: Number(id),
      clientID: prev.clientID || Number(project.clientId),
    }));
  }, [project, id]);

  const toDateTimeLocal = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value.length >= 16 ? value.slice(0, 16) : value;
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const toCahierPayload = (item: Partial<UICahier>) => ({
    projetID: Number(id),
    objet: item.objet || project?.name || '',
    description: item.description || null,
    dateCreation: item.dateCreation ? new Date(item.dateCreation).toISOString() : undefined,
    dateValidation: item.dateValidation ? new Date(item.dateValidation).toISOString() : null,
    fileUrl: item.fileUrl || null,
    version: item.version || '1.0',
    objectif: item.objectif || null,
    perimetre: item.perimetre || null,
    fonctionnalites: item.fonctionnalites || null,
    contraintes: item.contraintes || null,
    delais: item.delais || null,
    budgetTexte: item.budgetTexte || null,
    userStories: item.userStories || null,
    reglesMetier: item.reglesMetier || null,
    documentsReference: item.documentsReference || null,
  });

  const ouvrirCreationRappel = () => {
    setEditingRappel(null);
    setRappelForm({
      clientID: Number(project?.clientId || 0),
      projetID: Number(id),
      titre: '',
      description: '',
      dateLimite: '',
      priorite: 'moyenne',
      statut: 'en_attente',
    });
    setIsRappelModalOpen(true);
  };

  const ouvrirEditionRappel = (r: UIRappel) => {
    setEditingRappel(r);
    setRappelForm({ ...r, dateLimite: toDateTimeLocal(r.dateLimite) });
    setIsRappelModalOpen(true);
  };

  const soumettreRappel = () => {
    if (!rappelForm.titre) {
      toast.error('Titre requis');
      return;
    }
    if (editingRappel) {
      updateRappel.mutate({ rappelId: editingRappel.id, payload: rappelForm });
    } else {
      createRappel.mutate(rappelForm);
    }
  };

  const ouvrirCreationMilestone = () => {
    setEditingMilestone(null);
    setMilestoneForm({ title: '', description: '', dueDate: '', status: 'open' });
    setIsMilestoneModalOpen(true);
  };

  const ouvrirEditionMilestone = (m: UIProjetMilestone) => {
    setEditingMilestone(m);
    setMilestoneForm({ ...m, dueDate: m.dueDate ? toDateTimeLocal(m.dueDate) : '' });
    setIsMilestoneModalOpen(true);
  };

  const soumettreMilestone = () => {
    if (!milestoneForm.title) {
      toast.error('Titre requis');
      return;
    }
    if (editingMilestone) {
      updateMilestone.mutate({ milestoneId: editingMilestone.id, payload: milestoneForm });
    } else {
      createMilestone.mutate(milestoneForm);
    }
  };

  if (isLoading || !project) return <div>Chargement...</div>;

  const tabs = [
    {
      id: 'overview',
      label: 'Vue gÃ©nÃ©rale',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>DÃ©tails du projet</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><p className="text-sm text-muted-foreground">Client</p><p className="font-medium">{project.clientName}</p></div>
              <div><p className="text-sm text-muted-foreground">Statut</p><div className="flex gap-2 items-center mt-1"><Badge>{project.status}</Badge><ScoringBadge scoring={project.scoring} /></div></div>
              <div><p className="text-sm text-muted-foreground">PrioritÃ©</p><Badge>{project.priority}</Badge></div>
              <div><p className="text-sm text-muted-foreground">Description</p><p className="font-medium">{project.description}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Calendrier & Budget</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><p className="text-sm text-muted-foreground">Date de dÃ©but</p><p className="font-medium">{project.startDate}</p></div>
              <div><p className="text-sm text-muted-foreground">Ã‰chÃ©ance</p><p className="font-medium">{project.deadline}</p></div>
              <div><p className="text-sm text-muted-foreground">Budget</p><p className="font-medium">{project.budget.toLocaleString()} {project.devise === 'EUR' ? 'â‚¬' : project.devise === 'USD' ? '$' : 'DT'}</p></div>
              <div><p className="text-sm text-muted-foreground">DÃ©pensÃ©</p><p className="font-medium">{project.spent.toLocaleString()} {project.devise === 'EUR' ? 'â‚¬' : project.devise === 'USD' ? '$' : 'DT'}</p></div>
              <div><p className="text-sm text-muted-foreground">Avancement</p><p className="font-medium">{project.progress}%</p></div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'team',
      label: 'Ã‰quipe',
      content: (
        <Card>
          <CardHeader><CardTitle>Membres de l'Ã©quipe</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <select className="flex-1 border border-input rounded-lg p-2 bg-background" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                <option value="">SÃ©lectionner un membre</option>
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
              )) : <p className="text-muted-foreground">Aucun membre assignÃ©</p>}
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
              <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Ã‰crire une note..." />
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
          <CardContent>
            <CahierForm
              valeurs={cahierDraft}
              setValeurs={setCahierDraft}
              showProjectSelect={false}
              lockedProjectName={project.name}
              onSoumettre={() => upsertCahier.mutate(toCahierPayload({ ...cahierDraft, objet: project.name }))}
              onAnnuler={() => setCahierDraft(readyCahier)}
              cancelLabel="RÃ©initialiser"
              chargement={upsertCahier.isPending}
              btnLabel="Sauvegarder"
            />
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'rappels',
      label: 'Rappels',
      content: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Rappels du projet</CardTitle>
              <Button onClick={ouvrirCreationRappel} size="sm"><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rappels.map((r) => (
                <div key={r.id} className="flex items-start justify-between p-3 border border-border rounded-lg bg-secondary/20">
                  <div className="min-w-0 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium truncate">{r.titre}</p>
                      <Badge variant={r.systemKey ? 'info' : 'default'}>{r.systemKey ? 'System' : 'Manual'}</Badge>
                      <Badge variant={r.statut === 'termine' ? 'success' : 'warning'}>{r.statut}</Badge>
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {r.dateLimite && <span className="text-xs text-muted-foreground">Date: {r.dateLimite}</span>}
                      <span className="text-xs text-muted-foreground">Priorité: {r.priorite}</span>
                      {r.emailSentAt && <span className="text-xs text-muted-foreground">Email: {r.emailSentAt}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={r.statut === 'termine'}
                      onClick={() => updateRappel.mutate({ rappelId: r.id, payload: { ...r, statut: 'termine' } })}
                    >
                      Terminer
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => ouvrirEditionRappel(r)}>Modifier</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteRappel.mutate(r.id)}>Supprimer</Button>
                  </div>
                </div>
              ))}
              {!rappels.length && <p className="text-muted-foreground">Aucun rappel pour ce projet.</p>}
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'milestones',
      label: 'Jalons',
      content: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Jalons</CardTitle>
              <Button onClick={ouvrirCreationMilestone} size="sm"><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-start justify-between p-3 border border-border rounded-lg bg-secondary/20">
                  <div className="min-w-0 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <Badge variant={m.status === 'done' ? 'success' : 'warning'}>{m.status}</Badge>
                    </div>
                    {m.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {m.dueDate && <span className="text-xs text-muted-foreground">Échéance: {m.dueDate}</span>}
                      {m.completedAt && <span className="text-xs text-muted-foreground">Terminé: {m.completedAt}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateMilestone.mutate({ milestoneId: m.id, payload: { status: m.status === 'done' ? 'open' : 'done' } })}
                    >
                      {m.status === 'done' ? 'Rouvrir' : 'Terminer'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => ouvrirEditionMilestone(m)}>Modifier</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteMilestone.mutate(m.id)}>Supprimer</Button>
                  </div>
                </div>
              ))}
              {!milestones.length && <p className="text-muted-foreground">Aucun jalon.</p>}
            </div>
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
              <Upload className="w-4 h-4" />TÃ©lÃ©charger des fichiers
              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile.mutate(e.target.files[0])} />
            </label>
            <div className="space-y-3">
              {files.map((file: any) => (
                <div key={file.fileID} className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/20">
                  <div><p className="text-sm font-medium">{file.nom}</p><p className="text-xs text-muted-foreground">{file.sizeBytes} bytes</p></div>
                  <div className="flex gap-2">
                    <a href={projectFilesAPI.downloadUrl(id, file.fileID)} className="text-primary text-sm hover:underline">TÃ©lÃ©charger</a>
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
          <Button
            variant="outline"
            onClick={() => updateProject.mutate({ ...project, isPinned: !project.isPinned })}
            title={project.isPinned ? 'Désépingler' : 'Épingler'}
          >
            {project.isPinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
            {project.isPinned ? 'Désépingler' : 'Épingler'}
          </Button>
          <Button onClick={() => { setEditProject(project); setIsEditModalOpen(true); }}><Edit className="w-4 h-4 mr-2" />Modifier</Button>
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(true)}><Trash2 className="w-4 h-4 mr-2" />Supprimer</Button>
        </div>
      </div>
      <Tabs tabs={tabs} defaultTab="overview" />

      <Modal isOpen={isRappelModalOpen} onClose={() => setIsRappelModalOpen(false)} title={editingRappel ? 'Modifier le rappel' : 'Ajouter un rappel'}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); soumettreRappel(); }}>
          <Input label="Titre" value={rappelForm.titre || ''} onChange={(e) => setRappelForm({ ...rappelForm, titre: e.target.value })} required />
          <div className="w-full">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              rows={4}
              value={rappelForm.description || ''}
              onChange={(e) => setRappelForm({ ...rappelForm, description: e.target.value })}
            />
          </div>
          <Input label="Date limite" type="datetime-local" value={rappelForm.dateLimite || ''} onChange={(e) => setRappelForm({ ...rappelForm, dateLimite: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priorité"
              value={rappelForm.priorite || 'moyenne'}
              onChange={(e) => setRappelForm({ ...rappelForm, priorite: e.target.value })}
              options={[{ value: 'elevee', label: 'Élevée' }, { value: 'moyenne', label: 'Moyenne' }, { value: 'basse', label: 'Basse' }]}
            />
            <Select
              label="Statut"
              value={rappelForm.statut || 'en_attente'}
              onChange={(e) => setRappelForm({ ...rappelForm, statut: e.target.value })}
              options={[{ value: 'en_attente', label: 'En attente' }, { value: 'termine', label: 'Terminé' }]}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsRappelModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={createRappel.isPending || updateRappel.isPending}>{(createRappel.isPending || updateRappel.isPending) ? 'Enregistrement...' : 'Sauvegarder'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isMilestoneModalOpen} onClose={() => setIsMilestoneModalOpen(false)} title={editingMilestone ? 'Modifier le jalon' : 'Ajouter un jalon'}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); soumettreMilestone(); }}>
          <Input label="Titre" value={milestoneForm.title || ''} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} required />
          <div className="w-full">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              rows={4}
              value={milestoneForm.description || ''}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
            />
          </div>
          <Input label="Échéance" type="datetime-local" value={milestoneForm.dueDate || ''} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} />
          <Select
            label="Statut"
            value={milestoneForm.status || 'open'}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
            options={[{ value: 'open', label: 'Ouvert' }, { value: 'done', label: 'Terminé' }]}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsMilestoneModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={createMilestone.isPending || updateMilestone.isPending}>{(createMilestone.isPending || updateMilestone.isPending) ? 'Enregistrement...' : 'Sauvegarder'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier le projet">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); updateProject.mutate(editProject); }}>
          <Input label="Nom du projet" value={editProject?.name || ''} onChange={(e) => setEditProject({ ...editProject, name: e.target.value })} required />
          <Input label="Description" value={editProject?.description || ''} onChange={(e) => setEditProject({ ...editProject, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Select value={editProject?.status || ''} onChange={(e) => setEditProject({ ...editProject, status: e.target.value })} options={[{ value: 'planification', label: 'Planification' }, { value: 'en_cours', label: 'En cours' }, { value: 'en_attente', label: 'En attente' }, { value: 'termine', label: 'TerminÃ©' }]} />
            <Select value={editProject?.priority || ''} onChange={(e) => setEditProject({ ...editProject, priority: e.target.value })} options={[{ value: 'haute', label: 'Haute' }, { value: 'moyenne', label: 'Moyenne' }, { value: 'basse', label: 'Basse' }]} />
            <Select value={editProject?.scoring || 'Moyen'} onChange={(e) => setEditProject({ ...editProject, scoring: e.target.value })} options={[{ value: 'Hot ðŸ”¥', label: 'Hot ðŸ”¥' }, { value: 'Moyen', label: 'Moyen' }, { value: 'Faible', label: 'Faible' }]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={`Budget (${project?.devise === 'EUR' ? 'â‚¬' : project?.devise === 'USD' ? '$' : 'DT'})`} type="number" value={String(editProject?.budget ?? 0)} onChange={(e) => setEditProject({ ...editProject, budget: Number(e.target.value) })} />
            <Input label="Avancement (%)" type="number" value={String(editProject?.progress ?? 0)} onChange={(e) => setEditProject({ ...editProject, progress: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date de dÃ©but" type="date" value={editProject?.startDate || ''} onChange={(e) => setEditProject({ ...editProject, startDate: e.target.value })} />
            <Input label="Ã‰chÃ©ance" type="date" value={editProject?.deadline || ''} onChange={(e) => setEditProject({ ...editProject, deadline: e.target.value })} />
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
