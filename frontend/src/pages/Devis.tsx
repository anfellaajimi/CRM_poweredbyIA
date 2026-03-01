import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { clientsAPI, devisAPI, facturesAPI, UIDevis } from '../services/api';

const emptyItem = { description: '', quantity: 1, unitPrice: 0 };

export const Devis: React.FC = () => {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<UIDevis | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDevis, setNewDevis] = useState({
    clientId: '',
    title: '',
    validUntil: '',
    items: [emptyItem],
  });

  const { data: devisList = [] } = useQuery({ queryKey: ['devis'], queryFn: devisAPI.getAll });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientsAPI.getAll });

  const createMutation = useMutation({
    mutationFn: devisAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Devis créé');
      setIsAddModalOpen(false);
      setNewDevis({ clientId: '', title: '', validUntil: '', items: [emptyItem] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (devis: UIDevis) => {
      await facturesAPI.create({
        clientId: devis.clientId,
        status: 'en_attente',
        issuedAt: new Date().toISOString().slice(0, 10),
        dueAt: devis.validUntil,
        items: devis.items,
        taxRate: 19,
      });
      return devisAPI.update(String(devis.numericId), { ...devis, status: 'converti' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devis'] });
      qc.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Devis converti en facture');
    },
  });

  const getStatusLabel = (status: string) =>
    ({
      draft: 'Brouillon',
      sent: 'Envoyé',
      accepted: 'Accepté',
      rejected: 'Rejeté',
      converti: 'Converti',
    }[status.toLowerCase()] || status);

  const getStatusVariant = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'accepted' || s === 'converti') return 'success';
    if (s === 'rejected') return 'danger';
    if (s === 'sent') return 'info';
    return 'default';
  };

  const total = useMemo(
    () => newDevis.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0),
    [newDevis.items]
  );

  const handleCreate = () => {
    const client = clients.find((c) => c.id === newDevis.clientId);
    if (!client) return toast.error('Client invalide');
    createMutation.mutate({
      clientId: client.id,
      title: newDevis.title,
      notes: newDevis.title,
      amount: total,
      status: 'draft',
      createdAt: new Date().toISOString().slice(0, 10),
      validUntil: newDevis.validUntil,
      items: newDevis.items,
    } as any);
  };

  const handleDownload = (devis: UIDevis) => {
    const content = `DEVIS ${devis.id}\nClient: ${devis.clientName}\nMontant: ${devis.amount}\nStatut: ${getStatusLabel(devis.status)}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${devis.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devis</h1>
          <p className="text-muted-foreground">Gestion des devis backend</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Créer un devis</Button>
      </div>

      <Card>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Devis</TableHead><TableHead>Client</TableHead><TableHead>Titre</TableHead><TableHead>Montant</TableHead><TableHead>Statut</TableHead><TableHead>Créé le</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devisList.map((devis) => (
                <TableRow key={devis.numericId}>
                  <TableCell className="font-medium">{devis.id}</TableCell>
                  <TableCell>{devis.clientName}</TableCell>
                  <TableCell>{devis.title}</TableCell>
                  <TableCell>{devis.amount.toLocaleString()} €</TableCell>
                  <TableCell><Badge variant={getStatusVariant(devis.status)}>{getStatusLabel(devis.status)}</Badge></TableCell>
                  <TableCell>{devis.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelected(devis); setIsPreviewOpen(true); }}><FileText className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(devis)}><Download className="w-4 h-4" /></Button>
                      {(devis.status.toLowerCase() === 'accepted' || devis.status.toLowerCase() === 'accepté') && (
                        <Button size="sm" onClick={() => convertMutation.mutate(devis)}>Convertir</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Créer un devis" size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div>
            <label className="block text-sm font-medium mb-1">Client</label>
            <select className="w-full border border-input rounded-lg p-2 bg-background" value={newDevis.clientId} onChange={(e) => setNewDevis({ ...newDevis, clientId: e.target.value })} required>
              <option value="">Sélectionner un client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </div>
          <Input label="Titre du devis" value={newDevis.title} onChange={(e) => setNewDevis({ ...newDevis, title: e.target.value })} required />
          <Input label="Valide jusqu'au" type="date" value={newDevis.validUntil} onChange={(e) => setNewDevis({ ...newDevis, validUntil: e.target.value })} required />
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Articles</label>
              <button type="button" className="text-primary text-sm" onClick={() => setNewDevis({ ...newDevis, items: [...newDevis.items, { ...emptyItem }] })}>+ Ajouter</button>
            </div>
            <div className="space-y-2">
              {newDevis.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <input className="col-span-5 border border-input rounded-lg p-2 bg-background text-sm" placeholder="Description" value={item.description} onChange={(e) => { const items = [...newDevis.items]; items[index].description = e.target.value; setNewDevis({ ...newDevis, items }); }} required />
                  <input className="col-span-2 border border-input rounded-lg p-2 bg-background text-sm" type="number" value={item.quantity} onChange={(e) => { const items = [...newDevis.items]; items[index].quantity = Number(e.target.value); setNewDevis({ ...newDevis, items }); }} />
                  <input className="col-span-3 border border-input rounded-lg p-2 bg-background text-sm" type="number" value={item.unitPrice} onChange={(e) => { const items = [...newDevis.items]; items[index].unitPrice = Number(e.target.value); setNewDevis({ ...newDevis, items }); }} />
                  <button type="button" className="col-span-2 text-red-500 text-sm" onClick={() => setNewDevis({ ...newDevis, items: newDevis.items.filter((_, i) => i !== index) })}>Retirer</button>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="text-xl font-bold">{total.toLocaleString()} €</span></div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Annuler</Button>
            <Button type="submit">Créer</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Aperçu du devis" size="lg">
        {selected && (
          <div className="space-y-4">
            <div><h2 className="text-xl font-semibold">{selected.id}</h2><p className="text-muted-foreground">{selected.title}</p></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground">Client</p><p className="font-medium">{selected.clientName}</p></div>
              <div><p className="text-muted-foreground">Statut</p><Badge variant={getStatusVariant(selected.status)}>{getStatusLabel(selected.status)}</Badge></div>
              <div><p className="text-muted-foreground">Créé le</p><p className="font-medium">{selected.createdAt}</p></div>
              <div><p className="text-muted-foreground">Valide jusqu'au</p><p className="font-medium">{selected.validUntil}</p></div>
            </div>
            <div className="space-y-2">
              {selected.items.map((item, i) => <div key={i} className="p-3 bg-secondary/40 rounded-lg flex justify-between"><span>{item.description} (x{item.quantity})</span><span>{(item.lineTotal || 0).toLocaleString()} €</span></div>)}
            </div>
            <div className="flex justify-end"><Button onClick={() => setIsPreviewOpen(false)}>Fermer</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
};
