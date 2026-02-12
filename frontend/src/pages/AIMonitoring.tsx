import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Settings, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { mockAIServices } from '../data/mockData';

export const AIMonitoring: React.FC = () => {
  const uptimeData = [
    { time: '00:00', uptime: 99.9 },
    { time: '04:00', uptime: 99.8 },
    { time: '08:00', uptime: 98.5 },
    { time: '12:00', uptime: 99.2 },
    { time: '16:00', uptime: 99.9 },
    { time: '20:00', uptime: 99.7 },
    { time: '23:59', uptime: 99.8 }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'Critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Monitoring</h1>
          <p className="text-muted-foreground">Monitor system health and performance</p>
        </div>
        <Button>
          <Settings className="w-4 h-4 mr-2" />
          Configure Alerts
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Healthy Services</p>
                <p className="text-3xl font-bold mt-2">
                  {mockAIServices.filter(s => s.status === 'Healthy').length}
                </p>
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
                <p className="text-sm text-muted-foreground">Warning</p>
                <p className="text-3xl font-bold mt-2">
                  {mockAIServices.filter(s => s.status === 'Warning').length}
                </p>
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
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-3xl font-bold mt-2">
                  {mockAIServices.filter(s => s.status === 'Critical').length}
                </p>
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
          <CardTitle>System Uptime (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={uptimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[95, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="uptime" stroke="#7c3aed" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockAIServices.map((service) => (
          <Card key={service.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.endpoint}</p>
                  </div>
                </div>
                <Badge variant={
                  service.status === 'Healthy' ? 'success' :
                  service.status === 'Warning' ? 'warning' : 'danger'
                }>
                  {service.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                  <p className="font-medium">{service.uptime}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Response Time</p>
                  <p className="font-medium">{service.responseTime}ms</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Check</p>
                  <p className="font-medium text-xs">{service.lastCheck.split(' ')[1]}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <Button size="sm" variant="outline" className="w-full">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
