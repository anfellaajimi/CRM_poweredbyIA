import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Loader2 } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { aiMonitoringAPI, UIAIAgentAlert } from '../services/api';

const severityLabel = (priority?: string) => ((priority || '').toLowerCase() === 'elevee' ? 'Critique' : 'Avertissement');

export const AlertAutomaton: React.FC = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'warning' | 'critical'>('all');
  const [dateFilter, setDateFilter] = useState('');

  const { data: agentActivity } = useQuery({ queryKey: ['ai-agent-activity'], queryFn: aiMonitoringAPI.getAgentActivity, refetchInterval: 15000 });
  const { data: historyData } = useQuery({ queryKey: ['ai-agent-history'], queryFn: aiMonitoringAPI.getAgentHistory, refetchInterval: 20000 });
  const { data: agentStats = [] } = useQuery({ queryKey: ['ai-agent-stats'], queryFn: aiMonitoringAPI.getAgentStats, refetchInterval: 30000 });

  const runAgentMutation = useMutation({
    mutationFn: aiMonitoringAPI.runAgent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-agent-activity'] });
      qc.invalidateQueries({ queryKey: ['ai-agent-activity-topbar'] });
      qc.invalidateQueries({ queryKey: ['ai-agent-history'] });
      qc.invalidateQueries({ queryKey: ['ai-agent-stats'] });
      qc.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Agent exécuté avec succès');
    },
    onError: () => toast.error("Exécution de l'agent impossible."),
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

  const agentActivityData = useMemo(() => {
    const list = Array.isArray(agentStats) ? agentStats : [];
    return list.map((s) => ({
      time: s.time ? new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      value: s.count || 0,
    }));
  }, [agentStats]);

  const summary = agentActivity?.summary || { total: 0, warning: 0, critical: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assistant IA - Alertes Business</h1>
          <p className="text-muted-foreground">Surveillez l'activité de l'Agent IA et gérez les anomalies métier détectées automatiquement.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Alertes Actives</p><p className="text-3xl font-bold mt-2">{summary.total}</p></div><div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Bot className="w-6 h-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Avertissements (P2)</p><p className="text-3xl font-bold mt-2">{summary.warning}</p></div><div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center"><Bot className="w-6 h-6 text-yellow-600" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Alertes Critiques (P1)</p><p className="text-3xl font-bold mt-2">{summary.critical}</p></div><div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><Bot className="w-6 h-6 text-red-600" /></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" /> Gestion des Alertes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex gap-2">
              <Button variant={tab === 'active' ? 'default' : 'outline'} onClick={() => setTab('active')}>Alertes actives</Button>
              <Button variant={tab === 'history' ? 'default' : 'outline'} onClick={() => setTab('history')}>Historique</Button>
            </div>
            <Button size="sm" onClick={() => runAgentMutation.mutate()} disabled={runAgentMutation.isPending}>
              {runAgentMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
              Lancer un scan complet
            </Button>
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
            <div className="space-y-2 max-h-[500px] overflow-auto">
              {filteredActiveAlerts.map((a: UIAIAgentAlert) => (
                <div key={a.id} className="rounded-lg border p-4 hover:border-blue-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold">{a.title}</p>
                    <Badge variant={(a.priority || '').toLowerCase() === 'elevee' ? 'danger' : 'warning'}>{severityLabel(a.priority)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">Créée le: {new Date(a.createdAt).toLocaleString()}</p>
                  <div className="mt-3 flex items-center justify-end gap-2">
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
                      Voir le projet
                    </Button>
                    <Button size="sm" onClick={() => resolveAlertMutation.mutate(a.id)} disabled={resolveAlertMutation.isPending}>Marquer comme résolu</Button>
                  </div>
                </div>
              ))}
              {!filteredActiveAlerts.length ? <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">Aucune anomalie métier détectée.</p> : null}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-auto">
              {filteredHistory.map((a: UIAIAgentAlert) => (
                <div key={a.id} className="rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <Badge variant="success">Résolu</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.message}</p>
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                    <Badge variant="outline">{severityLabel(a.priority)}</Badge>
                    <span>•</span>
                    <span>Résolu le: {a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : '-'}</span>
                    <span>•</span>
                    <span className="italic">{a.resolvedBy || 'Résolu par AI Agent ou Utilisateur'}</span>
                  </div>
                </div>
              ))}
              {!filteredHistory.length ? <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">Aucun élément dans l'historique.</p> : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Activité de Scan (Agent IA)</CardTitle></CardHeader>
        <CardContent>
          {agentActivityData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={agentActivityData}>
                <XAxis dataKey="time" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Aucun événement de scan disponible pour le moment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
