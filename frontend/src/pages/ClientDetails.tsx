import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { ArrowLeft, Mail, Phone, Building2, Calendar } from 'lucide-react';
import { mockClients, mockProjects, mockContrats, mockFactures, mockDevis } from '../data/mockData';

export const ClientDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = mockClients.find(c => c.id === id);

  if (!client) {
    return <div>Client not found</div>;
  }

  const clientProjects = mockProjects.filter(p => p.clientId === id);
  const clientContracts = mockContrats.filter(c => c.clientId === id);
  const clientInvoices = mockFactures.filter(f => f.clientId === id);
  const clientQuotes = mockDevis.filter(d => d.clientId === id);

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{client.company}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Client Since</p>
                  <p className="font-medium">{client.createdAt}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Projects</span>
                <span className="font-bold text-xl">{clientProjects.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Contracts</span>
                <span className="font-bold text-xl">{clientContracts.filter(c => c.status === 'Active').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Invoices</span>
                <span className="font-bold text-xl">{clientInvoices.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-bold text-xl text-green-600">
                  ${clientInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'projects',
      label: 'Projects',
      content: (
        <div className="space-y-4">
          {clientProjects.map(project => (
            <Card key={project.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <Badge variant={
                    project.status === 'Completed' ? 'success' :
                    project.status === 'In Progress' ? 'info' : 'warning'
                  }>
                    {project.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">${project.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="font-medium">{project.progress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'contracts',
      label: 'Contracts',
      content: (
        <div className="space-y-4">
          {clientContracts.map(contract => (
            <Card key={contract.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{contract.title}</h3>
                  <Badge variant={
                    contract.status === 'Active' ? 'success' :
                    contract.status === 'Expiring' ? 'warning' : 'default'
                  }>
                    {contract.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{contract.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{contract.endDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Value</p>
                    <p className="font-medium">${contract.value.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'invoices',
      label: 'Invoices',
      content: (
        <div className="space-y-4">
          {clientInvoices.map(invoice => (
            <Card key={invoice.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{invoice.id}</h3>
                  <Badge variant={
                    invoice.status === 'Paid' ? 'success' :
                    invoice.status === 'Overdue' ? 'danger' : 'warning'
                  }>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">${invoice.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Issued</p>
                    <p className="font-medium">{invoice.issuedAt}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due</p>
                    <p className="font-medium">{invoice.dueAt}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'quotes',
      label: 'Quotes',
      content: (
        <div className="space-y-4">
          {clientQuotes.map(quote => (
            <Card key={quote.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{quote.id}</h3>
                  <Badge variant={
                    quote.status === 'Accepted' ? 'success' :
                    quote.status === 'Rejected' ? 'danger' : 'info'
                  }>
                    {quote.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{quote.title}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">${quote.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Until</p>
                    <p className="font-medium">{quote.validUntil}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'notes',
      label: 'Notes',
      content: (
        <Card>
          <CardContent className="pt-6">
            <textarea
              className="w-full h-64 p-4 rounded-lg border border-input bg-input-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Add notes about this client..."
            />
            <div className="flex justify-end mt-4">
              <Button>Save Notes</Button>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: 'activity',
      label: 'Activity Log',
      content: (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 pb-4 border-b border-border">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Client created</p>
                  <p className="text-xs text-muted-foreground">{client.createdAt}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/clients')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={client.avatar}
            alt={client.name}
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">{client.company}</p>
            <Badge variant={client.status === 'Active' ? 'success' : 'default'} className="mt-2">
              {client.status}
            </Badge>
          </div>
        </div>
        <Button>Edit Client</Button>
      </div>

      <Tabs tabs={tabs} defaultTab="overview" />
    </div>
  );
};
