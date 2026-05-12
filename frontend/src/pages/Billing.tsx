import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Download, Receipt, TrendingUp, Wallet, Clock, CheckCircle2, Pencil, ShieldCheck, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facturesAPI, settingsAPI, UIFacture, UIAppSettings } from '../services/api';
import { cn } from '../utils/cn';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';

const formatAmount = (amount: number, currency: string = 'DT') => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency === 'DT' ? 'TND' : currency,
    }).format(amount);
};

export const Billing: React.FC = () => {
    const qc = useQueryClient();
    const [isSubscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

    const { data: factures = [], isLoading: loadingFactures } = useQuery({
        queryKey: ['factures'],
        queryFn: facturesAPI.getAll,
    });

    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: settingsAPI.get,
    });

    const updateSettingsMutation = useMutation({
        mutationFn: (payload: Partial<UIAppSettings>) => settingsAPI.update(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['settings'] });
            toast.success('Paramètres mis à jour avec succès');
            setSubscriptionModalOpen(false);
            setPaymentModalOpen(false);
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
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

                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-900">Abonnement & Plan</h3>
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 shadow-xl shadow-indigo-500/20 text-white space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Plan Actuel</span>
                                    <h4 className="text-2xl font-black mt-1">{settings?.subscriptionPlan || 'Enterprise AI'}</h4>
                                </div>
                                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                    <Sparkles className="w-6 h-6 text-indigo-200" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-indigo-100/70 font-medium">Statut</span>
                                    <span className="font-bold">{settings?.subscriptionStatus || 'Actif'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-indigo-100/70 font-medium">Utilisateurs</span>
                                    <span className="font-bold">Illimité</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-indigo-100/70 font-medium">Prochain paiement</span>
                                    <span className="font-bold">14 Nov 2026</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSubscriptionModalOpen(true)}
                                className="w-full py-3 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
                            >
                                Gérer l'abonnement
                            </button>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                <Wallet className="text-gray-400" size={18} />
                                Méthode de paiement
                            </h4>
                            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-10 h-7 bg-indigo-600 rounded flex gap-1 justify-center items-center">
                                    <div className="w-3 h-3 rounded-full bg-red-400/80 mix-blend-screen"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-400/80 mix-blend-screen -ml-2"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-900 italic">Mastercard •••• {settings?.paymentMethodLast4 || '4242'}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Exp: {settings?.paymentMethodExpiry || '12/2027'}</p>
                                </div>
                                <button 
                                    onClick={() => setPaymentModalOpen(true)}
                                    className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                                >
                                    Éditer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Modal Gérer l'abonnement */}
            <Modal isOpen={isSubscriptionModalOpen} onClose={() => setSubscriptionModalOpen(false)} title="Modifier l'abonnement">
                <div className="space-y-4 p-2">
                    <p className="text-sm text-gray-500">Choisissez votre nouveau forfait Enterprise.</p>
                    <div className="grid grid-cols-1 gap-3">
                        {['Basic Pro', 'Enterprise AI', 'SaaS Ultimate'].map((plan) => (
                            <button
                                key={plan}
                                onClick={() => updateSettingsMutation.mutate({ subscriptionPlan: plan })}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                                    settings?.subscriptionPlan === plan 
                                        ? "border-indigo-600 bg-indigo-50/50" 
                                        : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50"
                                )}
                            >
                                <span className="font-bold text-gray-900">{plan}</span>
                                {settings?.subscriptionPlan === plan && <ShieldCheck className="text-indigo-600" size={20} />}
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Modal Éditer Paiement */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Modifier le mode de paiement">
                <form 
                    className="space-y-4 p-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        updateSettingsMutation.mutate({
                            paymentMethodLast4: (formData.get('last4') as string) || settings?.paymentMethodLast4,
                            paymentMethodExpiry: (formData.get('expiry') as string) || settings?.paymentMethodExpiry,
                        });
                    }}
                >
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">4 derniers chiffres</label>
                        <input 
                            name="last4"
                            type="text" 
                            maxLength={4}
                            defaultValue={settings?.paymentMethodLast4}
                            placeholder="4242"
                            className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Date d'expiration (MM/AAAA)</label>
                        <input 
                            name="expiry"
                            type="text" 
                            defaultValue={settings?.paymentMethodExpiry}
                            placeholder="12/2027"
                            className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors mt-4"
                    >
                        Mettre à jour
                    </button>
                </form>
            </Modal>
        </div>
    );
};

const Sparkles = ({ className, size }: any) => (
    <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
);

