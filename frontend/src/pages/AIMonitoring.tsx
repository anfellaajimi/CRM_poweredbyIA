import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle, Pencil, Plus, Settings, Trash2, XCircle } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { aiMonitoringAPI, servicesAPI, UIMonitoring } from '../services/api';

const defaultForm: Partial<UIMonitoring> = {
  serviceID: 0,
  status: 'healthy',
  uptime: 99.9,
  responseTime: 100,
  lastCheck: '',
  checks: '',
  alerts: '',
};

const toDateTimeLocal = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.length >= 16 ? value.slice(0, 16) : value;
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toStatusKey = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (['healthy', 'en bon état', 'en bon etat'].includes(s)) return 'healthy';
  if (['warning', 'avertissement'].includes(s)) return 'warning';
  if (['critical', 'critique'].includes(s)) return 'critical';
  return 'unknown';
};

const statusLabel = (status?: string) => {
  const key = toStatusKey(status);
  if (key === 'healthy') return 'En bon état';
  if (key === 'warning') return 'Avertissement';
  if (key === 'critical') return 'Critique';
  return 'Inconnu';
};

export const AIMonitoring: React.FC = () => {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<UIMonitoring | null>(null);
  const [form, setForm] = useState<Partial<UIMonitoring>>(defaultForm);

  const { data: monitoring = [] } = useQuery({ queryKey: ['ai-monitoring'], queryFn: aiMonitoringAPI.getAll });
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: servicesAPI.getAll });

  const createMutation = useMutation({
    mutationFn: aiMonitoringAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-monitoring'] });
      toast.success('Monitoring créé');
      setForm(defaultForm);
      setIsModalOpen(false);
    },
    onError: () => toast.error('Création impossible (service déjà monitoré ?).'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<UIMonitoring> }) => aiMonitoringAPI.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-monitoring'] });
      toast.success('Monitoring mis à jour');
      setEditing(null);
      setForm(defaultForm);
      setIsModalOpen(false);
    },
    onError: () => toast.error('Mise à jour impossible.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => aiMonitoringAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-monitoring'] });
      toast.success('Monitoring supprimé');
    },
  });

  const stats = useMemo(() => {
    const healthy = monitoring.filter((m) => toStatusKey(m.status) === 'healthy').length;
    const warning = monitoring.filter((m) => toStatusKey(m.status) === 'warning').length;
    const critical = monitoring.filter((m) => toStatusKey(m.status) === 'critical').length;
    return { healthy, warning, critical };
  }, [monitoring]);

  const uptimeData = useMemo(() => {
    return [...monitoring]
      .sort((a, b) => new Date(a.lastCheck || 0).getTime() - new Date(b.lastCheck || 0).getTime())
      .map((m) => ({
        time: m.lastCheck ? new Date(m.lastCheck).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        uptime: Number(m.uptime || 0),
      }));
  }, [monitoring]);

  const usedServiceIds = useMemo(() => new Set(monitoring.map((m) => Number(m.serviceID))), [monitoring]);
  const availableServices = useMemo(
    () => services.filter((s) => !usedServiceIds.has(Number(s.id))),
    [services, usedServiceIds]
  );

  const getStatusIcon = (status: string) => {
    const key = toStatusKey(status);
    if (key === 'healthy') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (key === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    if (key === 'critical') return <XCircle className="w-5 h-5 text-red-500" />;
    return <Activity className="w-5 h-5 text-gray-500" />;
  };

  const getBadgeVariant = (status: string) => {
    const key = toStatusKey(status);
    if (key === 'healthy') return 'success';
    if (key === 'warning') return 'warning';
    if (key === 'critical') return 'danger';
    return 'default';
  };

  const openCreate = () => {
    const firstAvailable = availableServices[0];
    setEditing(null);
    setForm({
      ...defaultForm,
      serviceID: firstAvailable ? Number(firstAvailable.id) : 0,
      lastCheck: toDateTimeLocal(new Date().toISOString()),
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: UIMonitoring) => {
    setEditing(item);
    setForm({
      ...item,
      lastCheck: toDateTimeLocal(item.lastCheck),
      status: toStatusKey(item.status),
    });
    setIsModalOpen(true);
  };

  const submit = () => {
    if (!form.serviceID) {
      toast.error('Service obligatoire');
      return;
    }
    const payload = {
      ...form,
      lastCheck: form.lastCheck || toDateTimeLocal(new Date().toISOString()),
    };
    if (editing) {
      updateMutation.mutate({ id: editing.monitoringID, payload });
      return;
    }
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Monitoring</h1>
          <p className="text-muted-foreground">Surveiller l'état de santé et les performances des services.</p>
        </div>
        <Button onClick={openCreate} disabled={!availableServices.length}>
          <Settings className="w-4 h-4 mr-2" />
          {availableServices.length ? 'Configurer Monitoring' : 'Tous les services sont monitorés'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Services en bon état</p>
                <p className="text-3xl font-bold mt-2">{stats.healthy}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avertissement</p>
                <p className="text-3xl font-bold mt-2">{stats.warning}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critique</p>
                <p className="text-3xl font-bold mt-2">{stats.critical}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disponibilité des checks</CardTitle>
        </CardHeader>
        <CardContent>
          {uptimeData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={uptimeData}>
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="uptime" stroke="#7c3aed" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune donnée de monitoring disponible.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {monitoring.map((service) => (
          <Card key={service.monitoringID}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <h3 className="font-semibold text-lg">{service.serviceName}</h3>
                    <p className="text-sm text-muted-foreground">{service.endpoint || '-'}</p>
                  </div>
                </div>
                <Badge variant={getBadgeVariant(service.status)}>{statusLabel(service.status)}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Disponibilité</p>
                  <p className="font-medium">{Number(service.uptime).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Temps réponse</p>
                  <p className="font-medium">{Number(service.responseTime || 0).toFixed(0)}ms</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dernière vérif</p>
                  <p className="font-medium text-xs">{service.lastCheck ? new Date(service.lastCheck).toLocaleString() : '-'}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border space-y-2">
                {service.alerts ? <p className="text-xs text-red-600">Alertes: {service.alerts}</p> : null}
                {service.checks ? <p className="text-xs text-muted-foreground">Checks: {service.checks}</p> : null}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="w-full" onClick={() => openEdit(service)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => deleteMutation.mutate(service.monitoringID)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Modifier Monitoring' : 'Nouveau Monitoring'}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Select
            label="Service"
            value={String(form.serviceID || 0)}
            onChange={(e) => setForm({ ...form, serviceID: Number(e.target.value) })}
            disabled={Boolean(editing)}
            options={[
              { value: '0', label: 'Sélectionner un service' },
              ...(editing
                ? services.filter((s) => s.id === Number(form.serviceID)).map((s) => ({ value: String(s.id), label: s.nom }))
                : availableServices.map((s) => ({ value: String(s.id), label: s.nom }))),
            ]}
          />
          <Select
            label="Statut"
            value={String(form.status || 'healthy')}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: 'healthy', label: 'En bon état' },
              { value: 'warning', label: 'Avertissement' },
              { value: 'critical', label: 'Critique' },
              { value: 'unknown', label: 'Inconnu' },
            ]}
          />
          <Input
            label="Disponibilité (%)"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={String(form.uptime ?? 0)}
            onChange={(e) => setForm({ ...form, uptime: Number(e.target.value) })}
          />
          <Input
            label="Temps de réponse (ms)"
            type="number"
            min={0}
            step={1}
            value={String(form.responseTime ?? 0)}
            onChange={(e) => setForm({ ...form, responseTime: Number(e.target.value) })}
          />
          <Input
            label="Dernière vérification"
            type="datetime-local"
            value={form.lastCheck || ''}
            onChange={(e) => setForm({ ...form, lastCheck: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium mb-2">Checks</label>
            <textarea
              className="w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm"
              rows={3}
              value={form.checks || ''}
              onChange={(e) => setForm({ ...form, checks: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Alertes</label>
            <textarea
              className="w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm"
              rows={3}
              value={form.alerts || ''}
              onChange={(e) => setForm({ ...form, alerts: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit">{editing ? 'Sauvegarder' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
