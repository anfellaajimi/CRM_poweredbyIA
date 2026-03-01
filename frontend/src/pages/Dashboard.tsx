import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase, DollarSign, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { dashboardAPI } from '../services/api';

const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#22c55e'];

export const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardAPI.overview,
  });

  const kpis = data ? [
    { label: 'Nombre total de clients', value: String(data.kpis.totalClients), icon: Users, color: 'text-purple-600' },
    { label: 'Projets actifs', value: String(data.kpis.activeProjects), icon: Briefcase, color: 'text-blue-600' },
    { label: 'Revenus ce mois-ci', value: `$${Number(data.kpis.monthlyRevenue).toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
    { label: 'Factures en attente', value: String(data.kpis.pendingInvoices), icon: FileText, color: 'text-yellow-600' },
  ] : [];

  if (isLoading || !data) {
    return <Card><CardContent className="pt-6">Chargement dashboard...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Données en temps réel depuis le backend.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.label}</p>
                      <h3 className="text-2xl font-bold mt-2">{kpi.value}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100">
                      <Icon className={`w-6 h-6 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Aperçu des revenus</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Répartition des statuts des projets</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.projectStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                  {data.projectStatusData.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Évolution de la clientèle</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.clientGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="clients" stroke="#7c3aed" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Activité récente</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.activities.map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-4 h-4 text-white" /></div>
                  <div className="flex-1"><p className="text-sm">{activity.message}</p><p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Échéances à venir</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.reminders.map((rappel: any) => (
                <div key={rappel.id} className="flex items-start space-x-3 pb-4 border-b border-border last:border-0 last:pb-0">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${String(rappel.priorite).toLowerCase().includes('eleve') ? 'text-red-500' : 'text-yellow-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between"><p className="text-sm font-medium">{rappel.title}</p><Badge>{rappel.priorite}</Badge></div>
                    <p className="text-xs text-muted-foreground mt-1">{rappel.dateLimite}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>AI Monitoring</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg"><p className="font-medium">Healthy: {data.monitoring.healthy}</p><Badge variant="success">OK</Badge></div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg"><p className="font-medium">Warning: {data.monitoring.warning}</p><Badge variant="warning">Warning</Badge></div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg"><p className="font-medium">Critical: {data.monitoring.critical}</p><Badge variant="danger">Critical</Badge></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
