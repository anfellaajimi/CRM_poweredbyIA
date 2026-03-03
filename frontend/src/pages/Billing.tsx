import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, Download, Receipt } from 'lucide-react';

export const Billing: React.FC = () => {
    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <div className="flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <CreditCard className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Facturation</h1>
                        <p className="text-muted-foreground mt-1">Gérez votre abonnement et consultez votre historique de paiement.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-semibold text-lg">Plan Actuel</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wide">
                                        Pro Plan
                                    </span>
                                    <span className="text-sm text-muted-foreground">Facturé annuellement</span>
                                </div>
                            </div>
                            <p className="text-3xl font-bold">€199 <span className="text-lg text-muted-foreground font-normal">/ an</span></p>
                        </div>

                        <p className="text-sm text-muted-foreground mb-6">
                            Votre prochain cycle de facturation débutera le 14 Novembre 2026.
                        </p>

                        <div className="flex gap-4">
                            <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                                Changer de forfait
                            </button>
                            <button className="px-4 py-2 border border-input bg-background text-sm font-medium rounded-lg hover:bg-accent transition-colors">
                                Annuler l'abonnement
                            </button>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="font-semibold text-lg mb-4">Moyen de paiement</h3>
                            <div className="flex items-center space-x-3 p-3 bg-accent rounded-lg border border-border">
                                <div className="bg-white p-1 rounded">
                                    {/* Simulate a card logo */}
                                    <div className="w-8 h-5 bg-blue-600 rounded flex gap-1 justify-center items-center">
                                        <div className="w-3 h-3 rounded-full bg-red-500 opacity-80 mix-blend-multiply"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80 mix-blend-multiply -ml-2"></div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Mastercard se terminant par 4242</p>
                                    <p className="text-xs text-muted-foreground">Expire le 12/2027</p>
                                </div>
                            </div>
                        </div>
                        <button className="text-sm text-primary font-medium mt-4 text-left hover:underline">
                            Mettre à jour la carte
                        </button>
                    </div>
                </div>

                <h3 className="text-xl font-bold mb-4 mt-8">Historique des factures</h3>
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-muted-foreground">Date</th>
                                <th className="px-6 py-3 font-semibold text-muted-foreground">Montant</th>
                                <th className="px-6 py-3 font-semibold text-muted-foreground">Statut</th>
                                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">Reçu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {[
                                { date: '14 Nov 2025', montant: '€199.00', statut: 'Payé' },
                                { date: '14 Nov 2024', montant: '€199.00', statut: 'Payé' },
                                { date: '14 Nov 2023', montant: '€189.00', statut: 'Payé' },
                            ].map((invoice, i) => (
                                <tr key={i} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4">{invoice.date}</td>
                                    <td className="px-6 py-4 font-medium">{invoice.montant}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded uppercase tracking-wider">
                                            {invoice.statut}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors inline-block">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};
