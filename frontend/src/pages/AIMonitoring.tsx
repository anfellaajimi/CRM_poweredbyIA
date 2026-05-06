import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertTriangle, Bot, CheckCircle, Pencil, Settings, Trash2, XCircle, Loader2 } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { aiMonitoringAPI, servicesAPI, UIAIAgentAlert, UIMonitoring } from '../services/api';

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

const severityLabel = (priority?: string) => ((priority || '').toLowerCase() === 'elevee' ? 'Critique' : 'Avertissement');

export const AIMonitoring: React.FC = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<UIMonitoring | null>(null);
  const [form, setForm] = useState<Partial<UIMonitoring>>(defaultForm);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'warning' | 'critical'>('all');
  const [dateFilter, setDateFilter] = useState('');

  const { data: monitoring = [] } = useQuery({ queryKey: ['ai-monitoring'], queryFn: aiMonitoringAPI.getAll });
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: servicesAPI.getAll });
  const { data: agentActivity } = useQuery({ queryKey: ['ai-agent-activity'], queryFn: aiMonitoringAPI.getAgentActivity, refetchInterval: 15000 });
  const { data: historyData } = useQuery({ queryKey: ['ai-agent-history'], queryFn: aiMonitoringAPI.getAgentHistory, refetchInterval: 20000 });
  const { data: diagnostics } = useQuery({ queryKey: ['ai-monitoring-diagnostics'], queryFn: aiMonitoringAPI.getDiagnostics, refetchInterval: 15000 });
  const { data: agentStats = [] } = useQuery({ queryKey: ['ai-agent-stats'], queryFn: aiMonitoringAPI.getAgentStats, refetchInterval: 30000 });
  const { data: healthStatus = [] } = useQuery({ queryKey: ['health-current'], queryFn: aiMonitoringAPI.getCurrentHealth, refetchInterval: 30000 });
  const { data: healthStats = {} } = useQuery({ queryKey: ['health-stats'], queryFn: () => aiMonitoringAPI.getHealthStats(24), refetchInterval: 60000 });
  const { data: incidents = [] } = useQuery({ queryKey: ['health-incidents'], queryFn: aiMonitoringAPI.getIncidents, refetchInterval: 60000 });

  const runAgentMutation = useMutation({
    mutationFn: aiMonitoringAPI.runAgent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-monitoring'] });
      qc.invalidateQueries({ queryKey: ['services'] });
      qc.invalidateQueries({ queryKey: ['ai-agent-activity'] });
      qc.invalidateQueries({ queryKey: ['ai-agent-activity-topbar'] });
      qc.invalidateQueries({ queryKey: ['ai-agent-history'] });
      qc.invalidateQueries({ queryKey: ['ai-monitoring-diagnostics'] });
      qc.invalidateQueries({ queryKey: ['ai-agent-stats'] });
      qc.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Agent exécuté avec succès');
    },
    onError: () => toast.error("Exécution de l'agent impossible."),
  });

  const createMutation = useMutation({
    mutationFn: aiMonitoringAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-monitoring'] });
      qc.invalidateQueries({ queryKey: ['ai-monitoring-diagnostics'] });
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
      qc.invalidateQueries({ queryKey: ['ai-monitoring-diagnostics'] });
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
      qc.invalidateQueries({ queryKey: ['ai-monitoring-diagnostics'] });
      toast.success('Monitoring supprimé');
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (id: number) => aiMonitoringAPI.resolveAlert(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-agent-activity'] });
      qc.invalidateQueries({ queryKey: ['ai-agent-activity-topbar'] });
      qc.invalidateQueries({ queryKey: ['ai-agent-history'] });
      qc.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Alerte résolue avec succès');
    },
    onError: () => toast.error('Résolution impossible.'),
  });

  const activeAlerts = useMemo(() => agentActivity?.alerts || [], [agentActivity]);
  const resolvedAlerts = useMemo(() => historyData?.history || [], [historyData]);

  const filteredActiveAlerts = useMemo(() => {
    return activeAlerts.filter((a: UIAIAgentAlert) => {
      const sev = (a.priority || '').toLowerCase() === 'elevee' ? 'critical' : 'warning';
      if (severityFilter !== 'all' && sev !== severityFilter) return false;
      if (dateFilter) {
        const d = new Date(a.createdAt).toISOString().slice(0, 10);
        if (d !== dateFilter) return false;
      }
      return true;
    });
  }, [activeAlerts, severityFilter, dateFilter]);

  const filteredHistory = useMemo(() => {
    return resolvedAlerts.filter((a: UIAIAgentAlert) => {
      const sev = (a.priority || '').toLowerCase() === 'elevee' ? 'critical' : 'warning';
      if (severityFilter !== 'all' && sev !== severityFilter) return false;
      if (dateFilter && a.resolvedAt) {
        const d = new Date(a.resolvedAt).toISOString().slice(0, 10);
        if (d !== dateFilter) return false;
      }
      return true;
    });
  }, [resolvedAlerts, severityFilter, dateFilter]);

  const stats = useMemo(() => {
    const alerts = agentActivity?.alerts || [];
    const warning = alerts.filter((a: UIAIAgentAlert) => (a.priority || '').toLowerCase() !== 'elevee').length;
    const critical = alerts.filter((a: UIAIAgentAlert) => (a.priority || '').toLowerCase() === 'elevee').length;
    const monitoringList = Array.isArray(monitoring) ? monitoring : [];
    const healthy = monitoringList.filter((m) => toStatusKey(m.status) === 'healthy').length;
    return { healthy, warning, critical };
  }, [agentActivity, monitoring]);

  const checksData = useMemo(() => {
    const list = Array.isArray(monitoring) ? monitoring : [];
    return [...list]
      .sort((a, b) => new Date(a.lastCheck || 0).getTime() - new Date(b.lastCheck || 0).getTime())
      .map((m) => ({
        time: m.lastCheck ? new Date(m.lastCheck).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        uptime: Number(m.uptime || 0),
      }));
  }, [monitoring]);

  const agentActivityData = useMemo(() => {
    const list = Array.isArray(agentStats) ? agentStats : [];
    return list.map((s) => ({
      time: s.time ? new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      value: s.count || 0,
    }));
  }, [agentStats]);

  const usedServiceIds = useMemo(() => new Set(monitoring.map((m) => Number(m.serviceID))), [monitoring]);
  const monitoredServices = useMemo(() => [...monitoring], [monitoring]);
  const availableServices = useMemo(() => services.filter((s) => !usedServiceIds.has(Number(s.id))), [services, usedServiceIds]);

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

  const openPrimaryMonitoringAction = () => {
    if (availableServices.length > 0) {
      openCreate();
      return;
    }
    if (monitoredServices.length > 0) {
      openEdit(monitoredServices[0]);
      return;
    }
    toast.info('Aucun monitoring disponible pour le moment.');
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
          <h1 className="text-3xl font-bold">Monitoring IA</h1>
          <p className="text-muted-foreground">Surveillez l'état de santé des services et le cycle de vie des alertes IA.</p>
        </div>
        <Button onClick={openPrimaryMonitoringAction} title={availableServices.length === 0 ? 'Tous les services sont déjà monitorés. Vous pouvez les modifier.' : undefined} variant={availableServices.length > 0 ? 'default' : 'outline'}>
          {availableServices.length > 0 ? <Settings className="w-4 h-4 mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
          {availableServices.length > 0 ? 'Ajouter un monitoring' : 'Gérer Monitoring'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" /> Alertes IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex gap-2">
              <Button variant={tab === 'active' ? 'default' : 'outline'} onClick={() => setTab('active')}>Alertes actives</Button>
              <Button variant={tab === 'history' ? 'default' : 'outline'} onClick={() => setTab('history')}>Historique</Button>
            </div>
            <Button size="sm" onClick={() => runAgentMutation.mutate()} disabled={runAgentMutation.isPending}>Lancer un check agent</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select
              label="Filtre sévérité"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as 'all' | 'warning' | 'critical')}
              options={[
                { value: 'all', label: 'Toutes' },
                { value: 'warning', label: 'Avertissement' },
                { value: 'critical', label: 'Critique' },
              ]}
            />
            <Input label="Filtre date" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setSeverityFilter('all'); setDateFilter(''); }}>Réinitialiser filtres</Button>
            </div>
          </div>

          {tab === 'active' ? (
            <div className="space-y-2 max-h-72 overflow-auto">
              {filteredActiveAlerts.map((a: UIAIAgentAlert) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">Créée le: {new Date(a.createdAt).toLocaleString()}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant={(a.priority || '').toLowerCase() === 'elevee' ? 'danger' : 'warning'}>{severityLabel(a.priority)}</Badge>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (a.projectId) {
                            navigate(`/projects/${a.projectId}`);
                            return;
                          }
                          toast.info(a.message || 'Aucun détail disponible');
                        }}
                      >
                        Voir détails
                      </Button>
                      <Button size="sm" onClick={() => resolveAlertMutation.mutate(a.id)} disabled={resolveAlertMutation.isPending}>Résoudre</Button>
                    </div>
                  </div>
                </div>
              ))}
              {!filteredActiveAlerts.length ? <p className="text-sm text-muted-foreground">Aucune alerte active.</p> : null}
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-auto">
              {filteredHistory.map((a: UIAIAgentAlert) => (
                <div key={a.id} className="rounded-lg border p-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <Badge variant="success">Résolu</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.message}</p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span>Sévérité: {severityLabel(a.priority)}</span>
                    <span className="mx-2">•</span>
                    <span>Résolu le: {a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : '-'}</span>
                    <span className="mx-2">•</span>
                    <span>{a.resolvedBy || 'Résolu par AI agent / utilisateur'}</span>
                  </div>
                </div>
              ))}
              {!filteredHistory.length ? <p className="text-sm text-muted-foreground">Aucun élément dans l'historique.</p> : null}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Services en bon état</p><p className="text-3xl font-bold mt-2">{stats.healthy}</p></div><div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Avertissement</p><p className="text-3xl font-bold mt-2">{stats.warning}</p></div><div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-yellow-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Critique</p><p className="text-3xl font-bold mt-2">{stats.critical}</p></div><div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><XCircle className="w-6 h-6 text-red-600" /></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['Frontend', 'Backend', 'Agent IA', 'Database'] as const).map((svc) => {
          const status = Array.isArray(healthStatus) ? healthStatus.find(h => h.service_name === svc) : undefined;
          const uptime = healthStats && typeof healthStats === 'object' ? (healthStats[svc] ?? 100) : 100;
          const isOperational = status?.status === '200';
          const isOffline = status?.status === 'offline';
          const isLoading = !status;

          return (
            <Card key={svc} className="relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{svc}</p>
                    <p className="text-2xl font-bold mt-1">{uptime}%</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Uptime (24h)</p>
                  </div>
                  <div className={`p-2 rounded-lg ${isLoading ? 'bg-muted/50' : isOperational ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {isLoading ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /> : isOperational ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-muted' : (isOperational ? 'bg-green-500 animate-pulse' : 'bg-red-500')}`} />
                  <span className="text-xs font-semibold">
                    {isLoading ? 'En attente...' : isOperational ? 'Opérationnel' : isOffline ? 'Offline' : `Erreur ${status.status}`}
                  </span>
                  {status?.response_time_ms && <span className="text-[10px] text-muted-foreground ml-auto">{status.response_time_ms}ms</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historique des Incidents</CardTitle>
          <Badge variant="outline">{incidents.length} incidents enregistrés</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/30">
                <tr>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Début</th>
                  <th className="px-4 py-3 font-medium">Fin</th>
                  <th className="px-4 py-3 font-medium">Durée</th>
                  <th className="px-4 py-3 font-medium text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(Array.isArray(incidents) ? incidents : []).slice(0, 5).map((inc) => (
                  <tr key={inc.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 font-medium">{inc.service_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(inc.started_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inc.resolved_at ? new Date(inc.resolved_at).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 font-medium">
                      {inc.resolved_at ? (() => {
                        const start = new Date(inc.started_at).getTime();
                        const end = new Date(inc.resolved_at).getTime();
                        const diff = Math.max(0, Math.floor((end - start) / 1000));
                        const m = Math.floor(diff / 60);
                        const s = diff % 60;
                        return `${m} min ${s} sec`;
                      })() : (
                        <span className="flex items-center gap-1.5 text-red-500">
                          <Loader2 className="w-3 h-3 animate-spin" /> En cours
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={inc.resolved_at ? 'success' : 'danger'}>
                        {inc.resolved_at ? 'Résolu' : 'En cours'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!incidents.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Aucun incident détecté sur la période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Activité Agent IA</CardTitle></CardHeader>
        <CardContent>
          {agentActivityData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={agentActivityData}>
                <XAxis dataKey="time" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun événement agent disponible pour le moment.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Array.isArray(monitoring) ? monitoring : []).map((service) => (
          <Card key={service.monitoringID}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">{getStatusIcon(service.status)}<div><h3 className="font-semibold text-lg">{service.serviceName}</h3><p className="text-sm text-muted-foreground">{service.endpoint || '-'}</p></div></div>
                <Badge variant={getBadgeVariant(service.status)}>{statusLabel(service.status)}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-xs text-muted-foreground">Disponibilité</p><p className="font-medium">{Number(service.uptime).toFixed(2)}%</p></div>
                <div><p className="text-xs text-muted-foreground">Temps réponse</p><p className="font-medium">{Number(service.responseTime || 0).toFixed(0)}ms</p></div>
                <div><p className="text-xs text-muted-foreground">Dernière vérif</p><p className="font-medium text-xs">{service.lastCheck ? new Date(service.lastCheck).toLocaleString() : '-'}</p></div>
              </div>
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                {service.alerts ? <p className="text-xs text-red-600">Alertes: {service.alerts}</p> : null}
                {service.checks ? <p className="text-xs text-muted-foreground">Checks: {service.checks}</p> : null}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="w-full" onClick={() => openEdit(service)}><Pencil className="w-4 h-4 mr-2" />Modifier</Button>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => deleteMutation.mutate(service.monitoringID)}><Trash2 className="w-4 h-4 mr-2" />Supprimer</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Modifier Monitoring' : 'Nouveau Monitoring'}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <Select label="Service" value={String(form.serviceID || 0)} onChange={(e) => setForm({ ...form, serviceID: Number(e.target.value) })} disabled={Boolean(editing)} options={[{ value: '0', label: 'Sélectionner un service' }, ...(editing ? services.filter((s) => s.id === Number(form.serviceID)).map((s) => ({ value: String(s.id), label: s.nom })) : availableServices.map((s) => ({ value: String(s.id), label: s.nom })))]} />
          <Select label="Statut" value={String(form.status || 'healthy')} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'healthy', label: 'En bon état' }, { value: 'warning', label: 'Avertissement' }, { value: 'critical', label: 'Critique' }, { value: 'unknown', label: 'Inconnu' }]} />
          <Input label="Disponibilité (%)" type="number" min={0} max={100} step={0.01} value={String(form.uptime ?? 0)} onChange={(e) => setForm({ ...form, uptime: Number(e.target.value) })} />
          <Input label="Temps de réponse (ms)" type="number" min={0} step={1} value={String(form.responseTime ?? 0)} onChange={(e) => setForm({ ...form, responseTime: Number(e.target.value) })} />
          <Input label="Dernière vérification" type="datetime-local" value={form.lastCheck || ''} onChange={(e) => setForm({ ...form, lastCheck: e.target.value })} />
          <div><label className="block text-sm font-medium mb-2">Checks</label><textarea className="w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm" rows={3} value={form.checks || ''} onChange={(e) => setForm({ ...form, checks: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-2">Alertes</label><textarea className="w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm" rows={3} value={form.alerts || ''} onChange={(e) => setForm({ ...form, alerts: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Annuler</Button><Button type="submit">{editing ? 'Sauvegarder' : 'Créer'}</Button></div>
        </form>
      </Modal>
    </div>
  );
};

