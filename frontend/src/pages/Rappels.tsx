import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, CheckCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { clientsAPI, rappelsAPI, UIRappel } from '../services/api';

const defaultRappel: Partial<UIRappel> = {
  clientID: 0,
  titre: '',
  typeRappel: '',
  description: '',
  dateLimite: '',
  priorite: 'moyenne',
  statut: 'en_attente',
};

const toDateTimeLocal = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.length >= 16 ? value.slice(0, 16) : value;
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export const Rappels: React.FC = () => {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<UIRappel | null>(null);
  const [form, setForm] = useState<Partial<UIRappel>>(defaultRappel);

  const { data: rappels = [] } = useQuery({ queryKey: ['rappels'], queryFn: rappelsAPI.getAll });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientsAPI.getAll });

  const createMutation = useMutation({
    mutationFn: rappelsAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Rappel créé');
      setIsModalOpen(false);
      setForm(defaultRappel);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<UIRappel> }) => rappelsAPI.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Rappel mis à jour');
      setIsModalOpen(false);
      setEditing(null);
      setForm(defaultRappel);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rappelsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Rappel supprimé');
    },
  });

  const pending = useMemo(
    () => rappels.filter((r) => !['termine', 'completed', 'complété'].includes((r.statut || '').toLowerCase())),
    [rappels]
  );
  const done = useMemo(
    () => rappels.filter((r) => ['termine', 'completed', 'complété'].includes((r.statut || '').toLowerCase())),
    [rappels]
  );

  const dayMap = useMemo(() => {
    const map = new Map<number, number>();
    rappels.forEach((r) => {
      if (!r.dateLimite) return;
      const d = new Date(r.dateLimite);
      const day = d.getDate();
      map.set(day, (map.get(day) || 0) + 1);
    });
    return map;
  }, [rappels]);

  const getPriorityVariant = (p: string) => {
    const s = p.toLowerCase();
    if (s === 'elevee' || s === 'élevé' || s === 'élevée' || s === 'haute') return 'danger';
    if (s === 'moyenne' || s === 'moyen') return 'warning';
    return 'info';
  };

  const markDone = (r: UIRappel) => {
    updateMutation.mutate({ id: r.id, payload: { ...r, statut: 'termine' } });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(defaultRappel);
    setIsModalOpen(true);
  };

  const openEdit = (r: UIRappel) => {
    setEditing(r);
    setForm({ ...r, dateLimite: toDateTimeLocal(r.dateLimite) });
    setIsModalOpen(true);
  };

  const submit = () => {
    if (!form.clientID || !form.titre) {
      toast.error('Client et titre sont obligatoires');
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rappels</h1>
          <p className="text-muted-foreground">Gérer vos tâches et rappels</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex border border-border rounded-lg">
            <button onClick={() => setViewMode('list')} className={`px-4 py-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''} rounded-l-lg`}>List</button>
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 ${viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : ''} rounded-r-lg`}><CalendarIcon className="w-4 h-4" /></button>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Rappel</Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">En attente</h2>
            <div className="space-y-4">
              {pending.map((r) => (
                <Card key={r.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{r.titre}</h3>
                          <Badge variant={getPriorityVariant(r.priorite)}>{r.priorite}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{r.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{r.dateLimite || '-'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="w-4 h-4" /></Button>
                        <Button size="sm" onClick={() => markDone(r)}><CheckCircle className="w-4 h-4 mr-2" />Terminé</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Complété</h2>
            <div className="space-y-4">
              {done.map((r) => (
                <Card key={r.id} className="opacity-60">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold line-through">{r.titre}</h3>
                          <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Terminé</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{r.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{r.dateLimite || '-'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <div className="p-6">
            <div className="text-center py-6">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-xl font-semibold mb-2">Vue calendrier</h3>
              <p className="text-muted-foreground mb-6">Calendrier data-driven des rappels.</p>
              <div className="grid grid-cols-7 gap-2 max-w-2xl mx-auto">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="text-center font-medium text-sm p-2">{day}</div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i + 1;
                  const count = dayMap.get(day) || 0;
                  return (
                    <div key={i} className="aspect-square border border-border rounded-lg p-2 text-sm hover:bg-accent">
                      <div className="flex justify-between">
                        <span>{day}</span>
                        {count > 0 ? <Badge>{count}</Badge> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Modifier rappel' : 'Créer rappel'}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div>
            <label className="block text-sm font-medium mb-1">Client</label>
            <select
              className="w-full border border-input rounded-lg p-2 bg-background"
              value={form.clientID || 0}
              onChange={(e) => setForm({ ...form, clientID: Number(e.target.value) })}
              required
            >
              <option value={0}>Sélectionner un client</option>
              {clients.map((c) => <option key={c.id} value={Number(c.id)}>{c.name}</option>)}
            </select>
          </div>
          <Input label="Titre" value={form.titre || ''} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
          <Input label="Type rappel" value={form.typeRappel || ''} onChange={(e) => setForm({ ...form, typeRappel: e.target.value })} />
          <Input label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Date limite" type="datetime-local" value={form.dateLimite || ''} onChange={(e) => setForm({ ...form, dateLimite: e.target.value })} />
          <Select
            label="Priorité"
            value={form.priorite || 'moyenne'}
            onChange={(e) => setForm({ ...form, priorite: e.target.value })}
            options={[
              { value: 'elevee', label: 'Élevée' },
              { value: 'moyenne', label: 'Moyenne' },
              { value: 'basse', label: 'Basse' },
            ]}
          />
          <Select
            label="Statut"
            value={form.statut || 'en_attente'}
            onChange={(e) => setForm({ ...form, statut: e.target.value })}
            options={[
              { value: 'en_attente', label: 'En attente' },
              { value: 'termine', label: 'Terminé' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit">{editing ? 'Sauvegarder' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
