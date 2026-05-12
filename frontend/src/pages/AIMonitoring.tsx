import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Network, ArrowRight, CheckCircle, Zap, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { aiPredictionsAPI, projectTeamAPI } from '../services/api';
import { cn } from '../utils/cn';
import { useThemeStore } from '../store/themeStore';

export const AIMonitoring: React.FC = () => {
  const qc = useQueryClient();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { data, isLoading, isError, error } = useQuery({ 
    queryKey: ['resource-optimization'], 
    queryFn: aiPredictionsAPI.getResourceOptimization,
    refetchInterval: 30000 
  });

  const transferMutation = useMutation({
    mutationFn: async ({ projectId, fromUserId, toUserId }: { projectId: number, fromUserId: number, toUserId: number }) => {
      await projectTeamAPI.remove(projectId.toString(), fromUserId);
      await projectTeamAPI.add(projectId.toString(), toUserId);
    },
    onSuccess: () => {
      toast.success('Transfert appliqué avec succès en base de données !');
      qc.invalidateQueries({ queryKey: ['resource-optimization'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Erreur lors du transfert du projet.");
    }
  });

  const developers = data?.developers || [];
  const recommendations = data?.recommendations || [];

  const handleApply = (rec: any) => {
    if (!rec.project_id || !rec.from_user_id || !rec.to_user_id) {
      toast.error("Données de transfert manquantes.");
      return;
    }
    transferMutation.mutate({
      projectId: rec.project_id,
      fromUserId: rec.from_user_id,
      toUserId: rec.to_user_id
    });
  };

  const getBarColor = (workload: number) => {
    if (workload >= 80) return '#ef4444'; // red-500
    if (workload >= 60) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Allocation IA des Ressources
          </h1>
          <p className="text-muted-foreground mt-1">
            Analytique prescriptive : Équilibrage intelligent de la charge de travail de vos équipes.
          </p>
        </div>
      </div>
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 flex gap-4 items-start">
        <div className="bg-indigo-500/20 p-2 rounded-full mt-1">
          <Zap className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-indigo-400 mb-1">Comment fonctionne l'Allocation IA ?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Notre Intelligence Artificielle analyse en temps réel les projets assignés à chaque membre de votre équipe. 
            Elle identifie automatiquement les développeurs en situation de <strong>surcharge critique {'>'} 80%</strong> (zone rouge) 
            et recherche les profils disponibles <strong>{'<'} 50%</strong> (zone verte). L'IA vous prescrira alors des actions directes de réassignation pour équilibrer la charge.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5 text-indigo-500" /> 
                Charge de travail actuelle (Workload %)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[450px] flex items-center justify-center text-muted-foreground">Analyse IA en cours...</div>
              ) : isError ? (
                <div className="h-[450px] flex flex-col items-center justify-center text-center p-6 border-2 border-red-500/50 border-dashed rounded-lg mt-4 bg-red-500/5">
                  <p className="text-red-500 font-bold mb-2">Erreur lors du chargement des données</p>
                  <p className="text-sm text-red-400">{error instanceof Error ? error.message : "Erreur inconnue"}</p>
                </div>
              ) : developers.length === 0 ? (
                <div className="h-[450px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg mt-4">
                  <Network className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Aucun développeur actif trouvé</p>
                  <p className="text-xs text-muted-foreground mt-1">Assignez des projets à vos utilisateurs pour que l'IA puisse analyser leur charge.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart data={developers} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke={isDark ? "#9ca3af" : "#64748b"} fontSize={10} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={180} 
                      fontSize={12}
                      stroke={isDark ? "#9ca3af" : "#64748b"}
                      tick={(props) => {
                        const { x, y, payload } = props;
                        const dev = developers.find((d: any) => d.name === payload.value);
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text x={-10} y={-4} textAnchor="end" fill={isDark ? "#f8fafc" : "#1e293b"} className="font-medium text-[11px]">
                              {payload.value}
                            </text>
                            <text x={-10} y={8} textAnchor="end" fill={isDark ? "#9ca3af" : "#64748b"} className="text-[9px]">
                              {dev?.avg_completion_days} j/proj • {dev?.status}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => {
                        const dev = props.payload;
                        return [
                          <div className="space-y-1.5 min-w-[140px]">
                            <div className="flex justify-between gap-4 items-center">
                              <span className={isDark ? "text-gray-400" : "text-slate-500"} style={{ fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workload</span>
                              <span className="font-bold text-indigo-500">{value.toFixed(1)}%</span>
                            </div>
                            <div className={`flex justify-between gap-4 items-center border-t ${isDark ? "border-white/5" : "border-slate-100"} pt-1.5`}>
                              <span className={isDark ? "text-gray-400" : "text-slate-500"} style={{ fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vitesse</span>
                              <span className={isDark ? "text-gray-200" : "text-slate-700"} style={{ fontWeight: '600' }}>{dev.avg_completion_days} j/projet</span>
                            </div>
                            <div className={`flex justify-between gap-4 items-center border-t ${isDark ? "border-white/5" : "border-slate-100"} pt-1.5`}>
                              <span className={isDark ? "text-gray-400" : "text-slate-500"} style={{ fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</span>
                              <span className={cn(
                                "font-bold text-[11px] px-2 py-0.5 rounded-full",
                                dev.workload >= 80 
                                  ? (isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600")
                                  : dev.workload >= 50 
                                    ? (isDark ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-600") 
                                    : (isDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-600")
                              )}>{dev.status}</span>
                            </div>
                          </div>,
                          ''
                        ];
                      }}
                      contentStyle={{ 
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : '#ffffff', 
                        borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#e2e8f0', 
                        borderRadius: '12px', 
                        padding: '14px',
                        boxShadow: isDark 
                          ? '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5)'
                          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                      }}
                      labelStyle={{ 
                        color: isDark ? '#f8fafc' : '#1e293b', 
                        fontWeight: '800', 
                        fontSize: '13px', 
                        marginBottom: '10px', 
                        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`, 
                        paddingBottom: '6px' 
                      }}
                    />
                    <Bar dataKey="workload" radius={[0, 4, 4, 0]} barSize={32}>
                      {developers.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.workload)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Actions Prescriptives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[470px] overflow-auto">
              {isLoading && <p className="text-sm text-muted-foreground">Recherche d'optimisations...</p>}
              {!isLoading && recommendations.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">La charge de travail est parfaitement équilibrée. Aucune recommandation.</p>
                </div>
              )}
              {recommendations.map((rec: any) => (
                <div key={rec.id} className="bg-background rounded-lg border p-4 shadow-sm relative">
                  <Badge variant="danger" className="absolute -top-2 -right-2">URGENT</Badge>
                  <h4 className="font-semibold text-sm mb-2">{rec.title}</h4>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded mb-3">
                    <span className="font-medium text-foreground truncate max-w-[90px]" title={rec.from_user}>{rec.from_user}</span>
                    <ArrowRight className="w-4 h-4 text-indigo-400 mx-1 flex-shrink-0" />
                    <span className="font-medium text-foreground truncate max-w-[90px]" title={rec.to_user}>{rec.to_user}</span>
                  </div>

                  <p className="text-xs mb-3">
                    Projet ciblé : <span className="font-semibold text-indigo-400">{rec.project}</span>
                  </p>

                  <Button 
                    size="sm" 
                    className="w-full" 
                    onClick={() => handleApply(rec)}
                    disabled={transferMutation.isPending}
                  >
                    {transferMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {transferMutation.isPending ? "Transfert en cours..." : "Approuver le transfert"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
