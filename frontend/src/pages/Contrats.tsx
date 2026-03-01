import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Eye, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { clientsAPI, contratsAPI, UIContrat } from '../services/api';

export const Contrats: React.FC = () => {
  const qc = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedContrat, setSelectedContrat] = useState<UIContrat | null>(null);
  const [newContrat, setNewContrat] = useState<Partial<UIContrat>>({
    clientId: '',
    titre: '',
    type: 'Contrat de services',
    dateDebut: '',
    dateFin: '',
    value: 0,
    objet: '',
    obligations: '',
    responsabilites: '',
    conditions: '',
    status: 'actif',
  });

  const { data: contrats = [] } = useQuery({ queryKey: ['contrats'], queryFn: contratsAPI.getAll });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientsAPI.getAll });

  const createMutation = useMutation({
    mutationFn: contratsAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contrats'] });
      toast.success('Contrat créé');
      setIsCreateModalOpen(false);
      setNewContrat({ clientId: '', titre: '', type: 'Contrat de services', dateDebut: '', dateFin: '', value: 0, objet: '', obligations: '', responsabilites: '', conditions: '', status: 'actif' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contratsAPI.delete(String(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contrats'] });
      toast.success('Contrat supprimé');
    },
  });

  const getStatusLabel = (status: string) =>
    ({
      actif: 'Actif',
      expiring: 'Expirant',
      expirant: 'Expirant',
      expired: 'Expiré',
      termine: 'Terminé',
    }[status.toLowerCase()] || status);

  const getStatusVariant = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'actif') return 'success';
    if (s === 'expiring' || s === 'expirant') return 'warning';
    if (s === 'expired' || s === 'expiré') return 'danger';
    return 'default';
  };

  const expiringCount = useMemo(
    () => contrats.filter((c) => c.needsRenewal || ['expiring', 'expirant'].includes(c.status.toLowerCase())).length,
    [contrats]
  );

  const handleCreate = () => {
    if (!newContrat.clientId || !newContrat.titre || !newContrat.dateDebut || !newContrat.dateFin) {
      toast.error('Champs obligatoires manquants');
      return;
    }
    createMutation.mutate(newContrat as any);
  };

  const handlePrint = (contrat: UIContrat) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><body><h1>${contrat.titre}</h1><p>${contrat.id}</p><p>Client: ${contrat.clientName}</p><p>Valeur: ${contrat.value}</p></body></html>`);
    win.document.close();
    win.onload = () => win.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Contrats</h1><p className="text-muted-foreground">Gestion backend des contrats</p></div>
        <Button onClick={() => setIsCreateModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Créer un Contrat</Button>
      </div>

      {expiringCount > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div><h3 className="font-semibold text-yellow-900">Renouvellement requis</h3><p className="text-sm text-yellow-800">{expiringCount} contrat(s) en renouvellement.</p></div>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Référence</TableHead><TableHead>Client</TableHead><TableHead>Titre</TableHead><TableHead>Type</TableHead><TableHead>Date Début</TableHead><TableHead>Date Fin</TableHead><TableHead>Valeur</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {contrats.map((contrat) => (
                <TableRow key={contrat.numericId}>
                  <TableCell className="font-medium">{contrat.id}</TableCell>
                  <TableCell>{contrat.clientName}</TableCell>
                  <TableCell>{contrat.titre}</TableCell>
                  <TableCell>{contrat.type}</TableCell>
                  <TableCell>{contrat.dateDebut}</TableCell>
                  <TableCell>{contrat.dateFin}</TableCell>
                  <TableCell>{Number(contrat.value).toLocaleString('fr-FR')} €</TableCell>
                  <TableCell><Badge variant={getStatusVariant(contrat.status)}>{getStatusLabel(contrat.status)}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedContrat(contrat); setIsViewModalOpen(true); }} className="text-primary"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handlePrint(contrat)} className="text-muted-foreground"><FileText className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(contrat.numericId)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Créer un Nouveau Contrat" size="xl">
        <form className="space-y-4 max-h-[70vh] overflow-y-auto pr-2" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div>
            <label className="block text-sm font-medium mb-1">Client</label>
            <select className="w-full border border-input rounded-lg p-2 bg-background" value={newContrat.clientId || ''} onChange={(e) => setNewContrat({ ...newContrat, clientId: e.target.value, clientName: clients.find((c) => c.id === e.target.value)?.name })} required>
              <option value="">Sélectionner un client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Titre du contrat *" value={newContrat.titre || ''} onChange={(e) => setNewContrat({ ...newContrat, titre: e.target.value })} required />
            <Select label="Type de contrat" value={newContrat.type || ''} onChange={(e) => setNewContrat({ ...newContrat, type: e.target.value })} options={[{ value: 'Contrat de services', label: 'Contrat de services' }, { value: 'Contrat de projet', label: 'Contrat de projet' }, { value: 'Contrat de maintenance', label: 'Contrat de maintenance' }, { value: 'Contrat-cadre', label: 'Contrat-cadre' }]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date de début *" type="date" value={newContrat.dateDebut || ''} onChange={(e) => setNewContrat({ ...newContrat, dateDebut: e.target.value })} required />
            <Input label="Date de fin *" type="date" value={newContrat.dateFin || ''} onChange={(e) => setNewContrat({ ...newContrat, dateFin: e.target.value })} required />
          </div>
          <Input label="Valeur contractuelle (€) *" type="number" value={String(newContrat.value || 0)} onChange={(e) => setNewContrat({ ...newContrat, value: Number(e.target.value) })} required />
          <Input label="Date de renouvellement" type="date" value={newContrat.dateRenouvellement || ''} onChange={(e) => setNewContrat({ ...newContrat, dateRenouvellement: e.target.value })} />
          <Input label="Objet" value={newContrat.objet || ''} onChange={(e) => setNewContrat({ ...newContrat, objet: e.target.value })} />
          <Input label="Obligations" value={newContrat.obligations || ''} onChange={(e) => setNewContrat({ ...newContrat, obligations: e.target.value })} />
          <Input label="Responsabilités" value={newContrat.responsabilites || ''} onChange={(e) => setNewContrat({ ...newContrat, responsabilites: e.target.value })} />
          <Input label="Conditions" value={newContrat.conditions || ''} onChange={(e) => setNewContrat({ ...newContrat, conditions: e.target.value })} />
          <div className="sticky bottom-0 bg-card pt-4 pb-1 border-t border-border flex justify-end gap-3 mt-2">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Annuler</Button>
            <Button type="submit">Créer le Contrat</Button>
          </div>
        </form>
      </Modal>

      {selectedContrat && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Contrat — ${selectedContrat.id}`}>
          <div className="space-y-3">
            <p><strong>Client:</strong> {selectedContrat.clientName}</p>
            <p><strong>Titre:</strong> {selectedContrat.titre}</p>
            <p><strong>Type:</strong> {selectedContrat.type}</p>
            <p><strong>Période:</strong> {selectedContrat.dateDebut} - {selectedContrat.dateFin}</p>
            <p><strong>Valeur:</strong> {selectedContrat.value.toLocaleString('fr-FR')} €</p>
            {selectedContrat.objet ? <p><strong>Objet:</strong> {selectedContrat.objet}</p> : null}
            {selectedContrat.obligations ? <p><strong>Obligations:</strong> {selectedContrat.obligations}</p> : null}
            {selectedContrat.responsabilites ? <p><strong>Responsabilités:</strong> {selectedContrat.responsabilites}</p> : null}
            {selectedContrat.conditions ? <p><strong>Conditions:</strong> {selectedContrat.conditions}</p> : null}
            <div className="flex justify-end"><Button onClick={() => setIsViewModalOpen(false)}>Fermer</Button></div>
          </div>
        </Modal>
      )}
    </div>
  );
};
