import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { clientsAPI, UIClient } from '../services/api';

const initialClient: Partial<UIClient> = {
  type: 'Physique',
  name: '',
  prenom: '',
  email: '',
  phone: '',
  company: '',
  dateNaissance: '',
  cin: '',
  raisonSociale: '',
  matriculeFiscale: '',
  secteurActivite: '',
  status: 'actif',
};

export const Clients: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<UIClient>>(initialClient);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsAPI.getAll,
  });

  const createMutation = useMutation({
    mutationFn: clientsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client ajouté');
      setIsAddModalOpen(false);
      setNewClient(initialClient);
    },
    onError: () => toast.error("Impossible d'ajouter le client"),
  });

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = client.name.toLowerCase().includes(s) || (client.email || '').toLowerCase().includes(s);
      const matchesStatus = statusFilter === 'all' || (client.status || '').toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const handleAddClient = () => {
    const type = newClient.type || 'Physique';
    const fullName = type === 'Physique' ? `${newClient.name || ''} ${newClient.prenom || ''}`.trim() : newClient.raisonSociale || '';
    createMutation.mutate({
      ...newClient,
      name: fullName,
      company: type === 'Moral' ? newClient.raisonSociale : fullName,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
      status: 'actif',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Gérez vos relations clients</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Client
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tous' },
                { value: 'actif', label: 'Actif' },
                { value: 'inactif', label: 'Inactif' },
              ]}
              className="w-full sm:w-40"
            />
          </div>

          {isLoading ? <div className="text-sm text-muted-foreground pb-4">Chargement...</div> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} onClick={() => navigate(`/clients/${client.id}`)} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img src={client.avatar || ''} alt={client.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.company}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.type === 'Moral' ? 'default' : 'success'}>
                        {client.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>
                      <Badge variant={(client.status || '').toLowerCase() === 'actif' ? 'success' : 'default'}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.createdAt}</TableCell>
                  </TableRow>
                ))
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Ajouter un Client">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddClient(); }}>
          <div className="grid grid-cols-2 gap-4">
            <Button type="button" variant={newClient.type === 'Physique' ? 'primary' : 'outline'} onClick={() => setNewClient({ ...newClient, type: 'Physique' })}>Physique</Button>
            <Button type="button" variant={newClient.type === 'Moral' ? 'primary' : 'outline'} onClick={() => setNewClient({ ...newClient, type: 'Moral' })}>Moral</Button>
          </div>

          <Input label="Email" type="email" value={newClient.email || ''} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} required />
          <Input label="Téléphone" value={newClient.phone || ''} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} required />

          {newClient.type === 'Physique' ? (
            <>
              <Input label="Nom" value={newClient.name || ''} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} required />
              <Input label="Prénom" value={newClient.prenom || ''} onChange={(e) => setNewClient({ ...newClient, prenom: e.target.value })} required />
              <Input label="Date de naissance" type="date" value={newClient.dateNaissance || ''} onChange={(e) => setNewClient({ ...newClient, dateNaissance: e.target.value })} required />
              <Input label="CIN" value={newClient.cin || ''} onChange={(e) => setNewClient({ ...newClient, cin: e.target.value })} required />
            </>
          ) : (
            <>
              <Input label="Raison Sociale" value={newClient.raisonSociale || ''} onChange={(e) => setNewClient({ ...newClient, raisonSociale: e.target.value })} required />
              <Input label="Matricule Fiscale" value={newClient.matriculeFiscale || ''} onChange={(e) => setNewClient({ ...newClient, matriculeFiscale: e.target.value })} />
              <Input label="Secteur d'activité" value={newClient.secteurActivite || ''} onChange={(e) => setNewClient({ ...newClient, secteurActivite: e.target.value })} />
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={createMutation.isPending}>Ajouter</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
