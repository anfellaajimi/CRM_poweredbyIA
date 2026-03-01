import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { cahierAPI, projectsAPI, UICahier } from '../services/api';

const emptyCahier: Partial<UICahier> = {
  projetID: 0,
  objet: '',
  description: '',
  version: '1.0',
  objectif: '',
  perimetre: '',
  fonctionnalites: '',
  contraintes: '',
  delais: '',
  budgetTexte: '',
  fileUrl: '',
  dateValidation: '',
};

export const CahierDeCharge: React.FC = () => {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<UICahier>>(emptyCahier);

  const { data: cahiers = [] } = useQuery({ queryKey: ['cahiers'], queryFn: cahierAPI.getAll });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsAPI.getAll });

  const selected = useMemo(() => cahiers.find((c) => c.cahierID === selectedId) || null, [cahiers, selectedId]);

  const patchSelected = (field: keyof UICahier, value: any) => {
    if (!selected) return;
    qc.setQueryData(['cahiers'], (old: UICahier[] = []) =>
      old.map((x) => (x.cahierID === selected.cahierID ? { ...x, [field]: value } : x))
    );
  };

  const createMutation = useMutation({
    mutationFn: cahierAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cahiers'] });
      toast.success('Cahier créé');
      setIsModalOpen(false);
      setDraft(emptyCahier);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<UICahier> }) => cahierAPI.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cahiers'] });
      toast.success('Cahier mis à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => cahierAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cahiers'] });
      setSelectedId(null);
      toast.success('Cahier supprimé');
    },
  });

  const projectName = (projectId: number) => projects.find((p) => Number(p.id) === projectId)?.name || `Projet ${projectId}`;

  const openCreate = () => {
    setDraft(emptyCahier);
    setIsModalOpen(true);
  };

  const saveSelected = () => {
    if (!selected) return;
    updateMutation.mutate({ id: selected.cahierID, payload: selected });
  };

  const handleExport = (item: UICahier) => {
    const content = `CAHIER ${item.cahierID}\nProjet: ${projectName(item.projetID)}\nObjet: ${item.objet}\nVersion: ${item.version}\n\n${item.description || ''}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cahier_${item.cahierID}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cahier de Charge</h1>
          <p className="text-muted-foreground">Gestion globale des cahiers par projet</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nouveau Document</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Liste des cahiers</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
            {cahiers.map((c) => (
              <button
                key={c.cahierID}
                onClick={() => setSelectedId(c.cahierID)}
                className={`w-full text-left p-3 rounded-lg border ${selectedId === c.cahierID ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium truncate">{c.objet || projectName(c.projetID)}</p>
                  <Badge>v{c.version}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{projectName(c.projetID)}</p>
              </button>
            ))}
            {!cahiers.length && <p className="text-sm text-muted-foreground">Aucun cahier trouvé.</p>}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {selected ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Éditeur de document</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge>v{selected.version}</Badge>
                      <Button size="sm" variant="outline" onClick={() => handleExport(selected)}><Download className="w-4 h-4 mr-2" />Exporter</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input label="Projet" value={projectName(selected.projetID)} readOnly />
                  <Input label="Objet" value={selected.objet} onChange={(e) => patchSelected('objet', e.target.value)} />
                  <Input label="Version" value={selected.version} onChange={(e) => patchSelected('version', e.target.value)} />
                  <Input label="Description" value={selected.description || ''} onChange={(e) => patchSelected('description', e.target.value)} />
                  <Input label="Objectif" value={selected.objectif || ''} onChange={(e) => patchSelected('objectif', e.target.value)} />
                  <Input label="Périmètre" value={selected.perimetre || ''} onChange={(e) => patchSelected('perimetre', e.target.value)} />
                  <Input label="Fonctionnalités" value={selected.fonctionnalites || ''} onChange={(e) => patchSelected('fonctionnalites', e.target.value)} />
                  <Input label="Contraintes" value={selected.contraintes || ''} onChange={(e) => patchSelected('contraintes', e.target.value)} />
                  <Input label="Délais" value={selected.delais || ''} onChange={(e) => patchSelected('delais', e.target.value)} />
                  <Input label="Budget texte" value={selected.budgetTexte || ''} onChange={(e) => patchSelected('budgetTexte', e.target.value)} />
                  <Input label="File URL" value={selected.fileUrl || ''} onChange={(e) => patchSelected('fileUrl', e.target.value)} />
                  <Input label="Date validation" type="date" value={selected.dateValidation || ''} onChange={(e) => patchSelected('dateValidation', e.target.value)} />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => deleteMutation.mutate(selected.cahierID)}><Trash2 className="w-4 h-4 mr-2" />Supprimer</Button>
                    <Button onClick={saveSelected}>Enregistrer le document</Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card><CardContent className="py-16 text-center text-muted-foreground">Sélectionnez un cahier dans la liste ou créez-en un nouveau.</CardContent></Card>
          )}
        </div>
      </div>      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Cahier de Charge" size="xl">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(draft); }}>
          <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Projet</label>
              <select className="w-full border border-input rounded-lg p-2 bg-background" value={draft.projetID || 0} onChange={(e) => setDraft({ ...draft, projetID: Number(e.target.value), objet: projects.find((p) => Number(p.id) === Number(e.target.value))?.name || draft.objet })} required>
                <option value={0}>Sélectionner un projet</option>
                {projects.map((p) => <option key={p.id} value={Number(p.id)}>{p.name}</option>)}
              </select>
            </div>
            <Input label="Objet" value={draft.objet || ''} onChange={(e) => setDraft({ ...draft, objet: e.target.value })} required />
            <Input label="Version" value={draft.version || '1.0'} onChange={(e) => setDraft({ ...draft, version: e.target.value })} />
            <Input label="Description" value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <Input label="Objectif" value={draft.objectif || ''} onChange={(e) => setDraft({ ...draft, objectif: e.target.value })} />
            <Input label="Périmètre" value={draft.perimetre || ''} onChange={(e) => setDraft({ ...draft, perimetre: e.target.value })} />
            <Input label="Fonctionnalités" value={draft.fonctionnalites || ''} onChange={(e) => setDraft({ ...draft, fonctionnalites: e.target.value })} />
            <Input label="Contraintes" value={draft.contraintes || ''} onChange={(e) => setDraft({ ...draft, contraintes: e.target.value })} />
            <Input label="Délais" value={draft.delais || ''} onChange={(e) => setDraft({ ...draft, delais: e.target.value })} />
            <Input label="Budget texte" value={draft.budgetTexte || ''} onChange={(e) => setDraft({ ...draft, budgetTexte: e.target.value })} />
            <Input label="File URL" value={draft.fileUrl || ''} onChange={(e) => setDraft({ ...draft, fileUrl: e.target.value })} />
            <Input label="Date validation" type="date" value={draft.dateValidation || ''} onChange={(e) => setDraft({ ...draft, dateValidation: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit">Créer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

