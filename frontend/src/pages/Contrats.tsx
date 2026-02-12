import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Plus, AlertCircle } from 'lucide-react';
import { mockContrats } from '../data/mockData';

export const Contrats: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contrats (Contracts)</h1>
          <p className="text-muted-foreground">Manage client contracts and agreements</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Contract
        </Button>
      </div>

      {mockContrats.some(c => c.needsRenewal) && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-400">Contracts Requiring Renewal</h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-500 mt-1">
                  {mockContrats.filter(c => c.needsRenewal).length} contract(s) are expiring soon and need renewal.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContrats.map((contrat) => (
                <TableRow key={contrat.id}>
                  <TableCell className="font-medium">{contrat.id}</TableCell>
                  <TableCell>{contrat.clientName}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{contrat.title}</span>
                      {contrat.needsRenewal && (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{contrat.type}</TableCell>
                  <TableCell>{contrat.startDate}</TableCell>
                  <TableCell>{contrat.endDate}</TableCell>
                  <TableCell className="font-medium">${contrat.value.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      contrat.status === 'Active' ? 'success' :
                      contrat.status === 'Expiring' ? 'warning' : 'default'
                    }>
                      {contrat.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
