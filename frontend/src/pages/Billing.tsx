import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Download, Receipt, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { facturesAPI, settingsAPI, UIFacture } from '../services/api';
import { cn } from '../utils/cn';



const formatAmount = (amount: number, currency: string = 'DT') => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency === 'DT' ? 'TND' : currency,
    }).format(amount);
};

export const Billing: React.FC = () => {



    const { data: factures = [], isLoading: loadingFactures } = useQuery({
        queryKey: ['factures'],
        queryFn: facturesAPI.getAll,
    });

    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: settingsAPI.get,
    });



    const stats = React.useMemo(() => {
        const total = factures.reduce((acc, f) => acc + (f.amount || 0), 0);
        const paid = factures
            .filter(f => ['payee', 'paid'].includes(f.status?.toLowerCase()))
            .reduce((acc, f) => acc + (f.amount || 0), 0);
        const pending = factures
            .filter(f => !['payee', 'paid'].includes(f.status?.toLowerCase()))
            .reduce((acc, f) => acc + (f.amount || 0), 0);
        
        return { total, paid, pending };
    }, [factures]);

    const handleDownload = (facture: UIFacture) => {
        facturesAPI.exportPDF(facture.numericId, `facture_${facture.id}.pdf`);
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-8"
            >
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">Facturation & Finances</h1>
                        <p className="text-gray-500 mt-1 font-medium">Suivez vos revenus et gérez les factures de {settings?.companyName || 'votre entreprise'}.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                         <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Système de Paiement Actif</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <TrendingUp className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Chiffre d'Affaires Total</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">{formatAmount(stats.total)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                            <CheckCircle2 className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Encaissé</p>
                            <h3 className="text-2xl font-black text-green-600 mt-1">{formatAmount(stats.paid)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Clock className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">En attente de paiement</p>
                            <h3 className="text-2xl font-black text-amber-600 mt-1">{formatAmount(stats.pending)}</h3>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Historique des factures</h3>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{factures.length} Factures au total</div>
                    </div>
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Facture</th>
                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Client</th>
                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Date</th>
                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Montant</th>
                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Statut</th>
                                            <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase tracking-wider text-[10px]">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loadingFactures ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">Chargement des données...</td>
                                            </tr>
                                        ) : factures.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">Aucune facture enregistrée.</td>
                                            </tr>
                                        ) : factures.map((invoice) => (
                                            <tr key={invoice.numericId} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-gray-900">#{invoice.id}</td>
                                                <td className="px-6 py-4 text-gray-600 font-medium">{invoice.clientName}</td>
                                                <td className="px-6 py-4 text-gray-500">{invoice.issuedAt}</td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{formatAmount(invoice.amount, invoice.devise)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                                        ['payee', 'paid'].includes(invoice.status?.toLowerCase())
                                                            ? "bg-green-50 text-green-700 border-green-100"
                                                            : invoice.status?.toLowerCase() === 'retard'
                                                                ? "bg-red-50 text-red-700 border-red-100"
                                                                : "bg-amber-50 text-amber-700 border-amber-100"
                                                    )}>
                                                        {invoice.status === 'payee' ? 'Payée' : invoice.status === 'en_attente' ? 'En attente' : invoice.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => handleDownload(invoice)}
                                                        className="p-2 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-all active:scale-90"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                </div>
            </motion.div>


        </div>
    );
};

const Sparkles = ({ className, size }: any) => (
    <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
);

