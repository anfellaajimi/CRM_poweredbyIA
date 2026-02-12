import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Plus, FileText, Download } from 'lucide-react';
import { mockDevis } from '../data/mockData';
import { toast } from 'sonner';

export const Devis: React.FC = () => {
  const [selectedDevis, setSelectedDevis] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleConvertToInvoice = (devisId: string) => {
    toast.success('Quote converted to invoice successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devis (Quotes)</h1>
          <p className="text-muted-foreground">Manage your quotes and proposals</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Quote
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDevis.map((devis) => (
                <TableRow key={devis.id}>
                  <TableCell className="font-medium">{devis.id}</TableCell>
                  <TableCell>{devis.clientName}</TableCell>
                  <TableCell>{devis.title}</TableCell>
                  <TableCell className="font-medium">${devis.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      devis.status === 'Accepted' ? 'success' :
                      devis.status === 'Rejected' ? 'danger' :
                      devis.status === 'Sent' ? 'info' : 'default'
                    }>
                      {devis.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{devis.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDevis(devis);
                          setIsPreviewOpen(true);
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      {devis.status === 'Accepted' && (
                        <Button
                          size="sm"
                          onClick={() => handleConvertToInvoice(devis.id)}
                        >
                          Convert to Invoice
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

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Quote Preview"
        size="lg"
      >
        {selectedDevis && (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-2xl font-bold">{selectedDevis.id}</h2>
              <p className="text-muted-foreground">{selectedDevis.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{selectedDevis.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={
                  selectedDevis.status === 'Accepted' ? 'success' :
                  selectedDevis.status === 'Rejected' ? 'danger' : 'info'
                }>
                  {selectedDevis.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{selectedDevis.createdAt}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valid Until</p>
                <p className="font-medium">{selectedDevis.validUntil}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="space-y-2">
                {selectedDevis.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${item.unitPrice.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold">${selectedDevis.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
