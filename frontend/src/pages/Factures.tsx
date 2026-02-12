import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Plus, Download, DollarSign } from 'lucide-react';
import { mockFactures } from '../data/mockData';
import { toast } from 'sonner';

export const Factures: React.FC = () => {
  const totalRevenue = mockFactures.reduce((sum, inv) => sum + inv.amount, 0);
  const paidRevenue = mockFactures.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
  const unpaidRevenue = mockFactures.filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);

  const handleMarkAsPaid = (invoiceId: string) => {
    toast.success('Invoice marked as paid!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Factures (Invoices)</h1>
          <p className="text-muted-foreground">Manage your invoices and payments</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">{mockFactures.length} invoices</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-600">${paidRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {mockFactures.filter(inv => inv.status === 'Paid').length} invoices
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Unpaid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-red-600">${unpaidRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {mockFactures.filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue').length} invoices
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockFactures.map((facture) => (
                <TableRow key={facture.id}>
                  <TableCell className="font-medium">{facture.id}</TableCell>
                  <TableCell>{facture.clientName}</TableCell>
                  <TableCell>{facture.projectName}</TableCell>
                  <TableCell className="font-medium">${facture.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      facture.status === 'Paid' ? 'success' :
                      facture.status === 'Overdue' ? 'danger' : 'warning'
                    }>
                      {facture.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{facture.issuedAt}</TableCell>
                  <TableCell>{facture.dueAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                      {facture.status !== 'Paid' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(facture.id)}
                        >
                          Mark as Paid
                        </Button>
                      )}
                    </div>
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
