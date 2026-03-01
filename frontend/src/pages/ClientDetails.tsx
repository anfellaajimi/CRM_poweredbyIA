import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Calendar, Mail, Phone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { clientsAPI, projectsAPI, UIClient } from '../services/api';

export const ClientDetails: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Partial<UIClient>>({});

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsAPI.getById(id),
    enabled: !!id,
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsAPI.getAll,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<UIClient>) => clientsAPI.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client modifié');
      setIsEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client supprimé');
      navigate('/clients');
    },
  });

  const clientProjects = useMemo(() => allProjects.filter((p) => p.clientId === id), [allProjects, id]);

  if (isLoading) return <div>Chargement...</div>;
  if (!client) return <div>Client non trouvé</div>;

  const tabs = [
    {
      id: 'overview',
      label: 'Vue générale',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Informations de contact</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3"><Mail className="w-5 h-5 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{client.email}</p></div></div>
              <div className="flex items-center space-x-3"><Phone className="w-5 h-5 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">Téléphone</p><p className="font-medium">{client.phone}</p></div></div>
              <div className="flex items-center space-x-3"><Building2 className="w-5 h-5 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">Entreprise</p><p className="font-medium">{client.company}</p></div></div>
              <div className="flex items-center space-x-3"><Calendar className="w-5 h-5 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">Client depuis</p><p className="font-medium">{client.createdAt}</p></div></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Statistiques</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Projets</span><span className="font-bold">{clientProjects.length}</span></div>
              <div className="text-sm text-muted-foreground">Contrats, factures et devis: non connectés dans cette vue.</div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'projects',
      label: 'Projets',
      content: (
        <div className="space-y-3">
          {clientProjects.map((project) => (
            <Card key={project.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <h3 className="font-semibold">{project.name}</h3>
                  <Badge>{project.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
              </CardContent>
            </Card>
          ))}
          {!clientProjects.length && <p className="text-muted-foreground">Aucun projet pour ce client.</p>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/clients')}><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <img src={client.avatar || ''} alt={client.name} className="w-20 h-20 rounded-full" />
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">{client.company}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={(client.status || '').toLowerCase() === 'actif' ? 'success' : 'default'}>{client.status}</Badge>
              <Badge>{client.type}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setEditClient(client); setIsEditModalOpen(true); }}>Modifier</Button>
          <Button variant="outline" onClick={() => deleteMutation.mutate()}><Trash2 className="w-4 h-4 mr-2" />Supprimer</Button>
        </div>
      </div>

      <Tabs tabs={tabs} defaultTab="overview" />

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier le Client">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(editClient); }}>
          <Input label="Nom complet" value={editClient.name || ''} onChange={(e) => setEditClient({ ...editClient, name: e.target.value })} required />
          <Input label="Email" value={editClient.email || ''} onChange={(e) => setEditClient({ ...editClient, email: e.target.value })} />
          <Input label="Téléphone" value={editClient.phone || ''} onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })} />
          <Input label="Entreprise" value={editClient.company || ''} onChange={(e) => setEditClient({ ...editClient, company: e.target.value })} />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={updateMutation.isPending}>Sauvegarder</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
