import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Receipt, 
  FileSignature, 
  Download, 
  Eye, 
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { clientPortalAPI } from '../../services/api';
import { cn } from '../../utils/cn';

type DocType = 'devis' | 'facture' | 'contrat';

export const ClientDocuments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DocType>('devis');
  
  const { data: devis } = useQuery({ queryKey: ['client-devis'], queryFn: clientPortalAPI.getDevis });
  const { data: factures } = useQuery({ queryKey: ['client-factures'], queryFn: clientPortalAPI.getFactures });
  const { data: contracts } = useQuery({ queryKey: ['client-contracts'], queryFn: clientPortalAPI.getContracts });

  const tabs = [
    { id: 'devis', label: 'Mes Devis', icon: FileText, count: devis?.length || 0 },
    { id: 'facture', label: 'Mes Factures', icon: Receipt, count: factures?.length || 0 },
    { id: 'contrat', label: 'Mes Contrats', icon: FileSignature, count: contracts?.length || 0 },
  ];

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pay') || s.includes('sign') || s.includes('accept')) {
      return <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase border border-emerald-100"><CheckCircle2 size={12} /> {status}</span>;
    }
    if (s.includes('attente') || s.includes('envoi')) {
      return <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase border border-amber-100"><Clock size={12} /> {status}</span>;
    }
    return <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-[10px] font-black uppercase border border-gray-100">{status}</span>;
  };

  const renderContent = () => {
    const data = activeTab === 'devis' ? devis : activeTab === 'facture' ? factures : contracts;
    
    if (!data || data.length === 0) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-[40px] border border-dashed border-gray-200 p-20 text-center"
        >
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-black text-gray-400">Aucun document trouvé</h3>
          <p className="text-gray-400 font-medium max-w-xs mx-auto mt-2">
            Il n'y a pas encore de {activeTab} disponible dans votre espace.
          </p>
        </motion.div>
      );
    }

    const handleExport = (doc: any, viewOnly: boolean = false) => {
      const id = doc.devisID || doc.factureID || doc.contratID || doc.id;
      if (!id) return;
      const name = doc.numero || doc.numSequence || `document_${id}`;
      
      if (activeTab === 'devis') {
        clientPortalAPI.exportDevisPDF(id, `${name}.pdf`, viewOnly);
      } else if (activeTab === 'facture') {
        clientPortalAPI.exportFacturePDF(id, `${name}.pdf`, viewOnly);
      } else if (activeTab === 'contrat') {
        clientPortalAPI.exportContractPDF(id, `${name}.pdf`, viewOnly);
      }
    };

    return (
      <div className="grid grid-cols-1 gap-4">
        {data.map((doc: any, i: number) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={doc.id || doc.devisID || doc.factureID || doc.contratID}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6 group"
          >
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              {activeTab === 'devis' ? <FileText className="text-indigo-600" /> : activeTab === 'facture' ? <Receipt className="text-indigo-600" /> : <FileSignature className="text-indigo-600" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-black text-gray-900 truncate">
                  {doc.numero || doc.numSequence || doc.objet || doc.titre || `Document #${doc.devisID || doc.factureID || doc.contratID || doc.id}`}
                </h4>
                {getStatusBadge(doc.statut || doc.status || 'Actif')}
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-medium text-gray-500">
                <p>Date : <span className="text-gray-900">{new Date(doc.dateDevis || doc.dateFacture || doc.dateDebut || doc.dateCreation || doc.createdAt).toLocaleDateString()}</span></p>
                {(doc.totalAmount || doc.amountTTC || doc.montant) && (
                  <p>Montant : <span className="text-indigo-600 font-bold">{doc.totalAmount || doc.amountTTC || doc.montant} TND</span></p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleExport(doc, true)}
                className="p-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors" 
                title="Aperçu"
              >
                <Eye size={20} />
              </button>
              <button 
                onClick={() => handleExport(doc, false)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                <Download size={18} />
                <span>Télécharger PDF</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Mes Documents</h2>
          <p className="text-gray-500 font-medium mt-1">Gérez vos devis, factures et contrats en toute sécurité.</p>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
          <ShieldCheck size={20} />
          <span className="text-xs font-black uppercase tracking-tight">Documents Certifiés</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-[24px] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DocType)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all",
              activeTab === tab.id 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
            <span className={cn(
              "ml-1 px-2 py-0.5 rounded-full text-[10px]",
              activeTab === tab.id ? "bg-indigo-50 text-indigo-600" : "bg-gray-200 text-gray-500"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder={`Rechercher dans ${activeTab === 'devis' ? 'les devis' : activeTab === 'facture' ? 'les factures' : 'les contrats'}...`}
          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
        />
      </div>

      {/* Documents List */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  );
};
