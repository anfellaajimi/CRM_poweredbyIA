import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, DollarSign, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { clientsAPI, facturesAPI } from '../services/api';

const emptyItem = { description: '', quantity: 1, unitPrice: 0 };

export const Factures: React.FC = () => {
  const qc = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFacture, setNewFacture] = useState({
    clientId: '',
    dueAt: '',
    items: [emptyItem],
    taxRate: 19,
  });

  const { data: factures = [] } = useQuery({ queryKey: ['factures'], queryFn: facturesAPI.getAll });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientsAPI.getAll });

  const createMutation = useMutation({
    mutationFn: facturesAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture créée');
      setIsAddModalOpen(false);
      setNewFacture({ clientId: '', dueAt: '', items: [emptyItem], taxRate: 19 });
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: number) => facturesAPI.update(String(id), { status: 'payee', paidAt: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture marquée payée');
    },
  });

  const getStatusLabel = (status: string) =>
    ({
      en_attente: 'Non payée',
      payee: 'Payée',
      retard: 'En retard',
      paid: 'Payée',
      overdue: 'En retard',
    }[status.toLowerCase()] || status);

  const getStatusVariant = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'payee' || s === 'paid') return 'success';
    if (s === 'retard' || s === 'overdue') return 'danger';
    return 'warning';
  };

  const totalDraft = useMemo(
    () => newFacture.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0),
    [newFacture.items]
  );

  const totals = useMemo(() => {
    const totalRevenue = factures.reduce((sum, inv) => sum + inv.amount, 0);
    const paidRevenue = factures.filter((inv) => ['payee', 'paid'].includes(inv.status.toLowerCase())).reduce((sum, inv) => sum + inv.amount, 0);
    const unpaidRevenue = factures.filter((inv) => !['payee', 'paid'].includes(inv.status.toLowerCase())).reduce((sum, inv) => sum + inv.amount, 0);
    return { totalRevenue, paidRevenue, unpaidRevenue };
  }, [factures]);

  const handleDownload = (facture: any) => {
    const content = `FACTURE ${facture.id}\nClient: ${facture.clientName}\nMontant: ${facture.amount}\nStatut: ${getStatusLabel(facture.status)}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${facture.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreate = () => {
    const client = clients.find((c) => c.id === newFacture.clientId);
    if (!client) return toast.error('Client invalide');
    createMutation.mutate({
      clientId: client.id,
      status: 'en_attente',
      issuedAt: new Date().toISOString().slice(0, 10),
      dueAt: newFacture.dueAt,
      taxRate: newFacture.taxRate,
      items: newFacture.items,
      amount: totalDraft,
    } as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Factures</h1><p className="text-muted-foreground">Gestion backend des factures</p></div>
        <Button onClick={() => setIsAddModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Créer une facture</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">CA total</CardTitle></CardHeader><CardContent><div className="flex justify-between"><p className="text-3xl font-bold">{totals.totalRevenue.toLocaleString()} €</p><DollarSign className="w-6 h-6 text-purple-600" /></div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Payées</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{totals.paidRevenue.toLocaleString()} €</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Non payées</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{totals.unpaidRevenue.toLocaleString()} €</p></CardContent></Card>
      </div>

      <Card>
        <div className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Client</TableHead><TableHead>Montant</TableHead><TableHead>Statut</TableHead><TableHead>Émise le</TableHead><TableHead>Échéance</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {factures.map((facture) => (
                <TableRow key={facture.numericId}>
                  <TableCell className="font-medium">{facture.id}</TableCell>
                  <TableCell>{facture.clientName}</TableCell>
                  <TableCell>{facture.amount.toLocaleString()} €</TableCell>
                  <TableCell><Badge variant={getStatusVariant(facture.status)}>{getStatusLabel(facture.status)}</Badge></TableCell>
                  <TableCell>{facture.issuedAt}</TableCell>
                  <TableCell>{facture.dueAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(facture)}><Download className="w-4 h-4" /></Button>
                      {!['payee', 'paid'].includes(facture.status.toLowerCase()) && <Button size="sm" onClick={() => payMutation.mutate(facture.numericId)}>Marquer payée</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Créer une facture" size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div>
            <label className="block text-sm font-medium mb-1">Client</label>
            <select className="w-full border border-input rounded-lg p-2 bg-background" value={newFacture.clientId} onChange={(e) => setNewFacture({ ...newFacture, clientId: e.target.value })} required>
              <option value="">Sélectionner un client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="Date d'échéance" type="date" value={newFacture.dueAt} onChange={(e) => setNewFacture({ ...newFacture, dueAt: e.target.value })} required />
          <Input label="Taux de taxe (%)" type="number" value={String(newFacture.taxRate)} onChange={(e) => setNewFacture({ ...newFacture, taxRate: Number(e.target.value) })} />
          <div>
            <div className="flex justify-between mb-2"><label className="text-sm font-medium">Articles</label><button type="button" className="text-primary text-sm" onClick={() => setNewFacture({ ...newFacture, items: [...newFacture.items, { ...emptyItem }] })}>+ Ajouter</button></div>
            <div className="space-y-2">
              {newFacture.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <input className="col-span-5 border border-input rounded-lg p-2 bg-background text-sm" placeholder="Description" value={item.description} onChange={(e) => { const items = [...newFacture.items]; items[index].description = e.target.value; setNewFacture({ ...newFacture, items }); }} required />
                  <input className="col-span-2 border border-input rounded-lg p-2 bg-background text-sm" type="number" value={item.quantity} onChange={(e) => { const items = [...newFacture.items]; items[index].quantity = Number(e.target.value); setNewFacture({ ...newFacture, items }); }} />
                  <input className="col-span-3 border border-input rounded-lg p-2 bg-background text-sm" type="number" value={item.unitPrice} onChange={(e) => { const items = [...newFacture.items]; items[index].unitPrice = Number(e.target.value); setNewFacture({ ...newFacture, items }); }} />
                  <button type="button" className="col-span-2 text-red-500 text-sm" onClick={() => setNewFacture({ ...newFacture, items: newFacture.items.filter((_, i) => i !== index) })}>Retirer</button>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-3 flex justify-between"><span className="font-semibold">Total HT</span><span className="text-xl font-bold">{totalDraft.toLocaleString()} €</span></div>
          <div className="flex justify-end gap-3 pt-2"><Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Annuler</Button><Button type="submit">Créer</Button></div>
        </form>
      </Modal>
    </div>
  );
};
