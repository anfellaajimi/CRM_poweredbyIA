import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Power, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { useAuthStore } from '../store/authStore';
import { usersAPI, UIUser } from '../services/api';

export const Users: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const qc = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UIUser | null>(null);
  const [password, setPassword] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Developer' as UIUser['role'], status: 'Actif' as UIUser['status'], password: '' });

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: usersAPI.getAll });

  const createMutation = useMutation({
    mutationFn: usersAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur créé');
      setIsCreateModalOpen(false);
      setNewUser({ name: '', email: '', role: 'Developer', status: 'Actif', password: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => usersAPI.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur mis à jour');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setPassword('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé');
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Suppression impossible'),
  });

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="space-y-6">
        <Card><div className="p-12 text-center"><h3 className="text-xl font-semibold mb-2">Accès refusé</h3><p className="text-muted-foreground">Seul un administrateur peut gérer les utilisateurs.</p></div></Card>
      </div>
    );
  }

  const handleToggleStatus = (user: UIUser) => {
    const nextStatus: UIUser['status'] = user.status === 'Actif' ? 'Inactif' : 'Actif';
    updateMutation.mutate({ id: user.id, payload: { status: nextStatus } });
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;
    const payload: any = {
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
      status: selectedUser.status,
    };
    if (password.trim()) payload.password = password;
    updateMutation.mutate({ id: selectedUser.id, payload });
  };

  const sortedUsers = useMemo(() => [...users].sort((a, b) => Number(b.id) - Number(a.id)), [users]);
  const firstUserId = useMemo(() => {
    if (!users.length) return null;
    return users.reduce((minId, u) => (Number(u.id) < Number(minId) ? u.id : minId), users[0].id);
  }, [users]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Gestion des utilisateurs</h1><p className="text-muted-foreground">Gérer les membres et permissions</p></div>
        <Button onClick={() => setIsCreateModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Ajouter un utilisateur</Button>
      </div>

      <Card>
        <div className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell><div className="flex items-center space-x-3"><img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" /><p className="font-medium">{user.name}</p></div></TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant={user.role === 'Admin' ? 'danger' : user.role === 'Manager' ? 'warning' : 'info'}>{user.role}</Badge></TableCell>
                  <TableCell><Badge variant={user.status === 'Actif' ? 'success' : 'default'}>{user.status}</Badge></TableCell>
                  <TableCell>{user.joinedAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant={user.status === 'Actif' ? 'destructive' : 'outline'} onClick={() => handleToggleStatus(user)}><Power className="w-4 h-4" /></Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={user.id === firstUserId}
                        title={user.id === firstUserId ? 'Le premier utilisateur ne peut pas être supprimé' : ''}
                        onClick={() => deleteMutation.mutate(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Ajouter un utilisateur">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newUser); }}>
          <Input label="Nom" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
          <Input label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
          <Input label="Mot de passe" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
          <Select label="Role" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UIUser['role'] })} options={[{ value: 'Admin', label: 'Admin' }, { value: 'Manager', label: 'Manager' }, { value: 'Developer', label: 'Developer' }]} />
          <Select label="Status" value={newUser.status} onChange={(e) => setNewUser({ ...newUser, status: e.target.value as UIUser['status'] })} options={[{ value: 'Actif', label: 'Actif' }, { value: 'Inactif', label: 'Inactif' }]} />
          <div className="flex justify-end gap-3 pt-4"><Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Annuler</Button><Button type="submit">Créer</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier l'utilisateur">
        {selectedUser && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }}>
            <Input label="Nom" value={selectedUser.name} onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} required />
            <Input label="Email" type="email" value={selectedUser.email} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} required />
            <Input label="Nouveau mot de passe (optionnel)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Select label="Role" value={selectedUser.role} onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as UIUser['role'] })} options={[{ value: 'Admin', label: 'Admin' }, { value: 'Manager', label: 'Manager' }, { value: 'Developer', label: 'Developer' }]} />
            <Select label="Status" value={selectedUser.status} onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value as UIUser['status'] })} options={[{ value: 'Actif', label: 'Actif' }, { value: 'Inactif', label: 'Inactif' }]} />
            <div className="flex justify-end space-x-3 pt-4"><Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Annuler</Button><Button type="submit">Sauvegarder</Button></div>
          </form>
        )}
      </Modal>
    </div>
  );
};
