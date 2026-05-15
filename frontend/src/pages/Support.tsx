import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    HelpCircle, 
    MessageSquare, 
    Mail, 
    Search, 
    ChevronDown, 
    ExternalLink, 
    Send,
    LifeBuoy,
    ShieldCheck,
    Cpu
} from 'lucide-react';
import { cn } from '../utils/cn';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-sm transition-all hover:shadow-md">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gray-50/50"
            >
                <span className="font-bold text-gray-900 pr-8">{question}</span>
                <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform duration-300", isOpen && "rotate-180 text-indigo-600")} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="px-5 pb-5 pt-1">
                            <p className="text-gray-500 leading-relaxed text-sm font-medium">
                                {answer}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const Support: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    const faqs = [
        { 
            q: "Comment puis-je réinitialiser mon mot de passe ?", 
            a: "Pour réinitialiser votre mot de passe, rendez-vous dans Mon Profil > Sécurité. Vous y trouverez une option pour changer votre mot de passe actuel. Si vous avez oublié votre mot de passe, utilisez le lien 'Mot de passe oublié' sur la page de connexion pour recevoir un email de réinitialisation." 
        },
        { 
            q: "Où puis-je trouver mes factures ?", 
            a: "Toutes vos factures Enterprise sont centralisées dans la section 'Facturation', accessible via le menu de votre profil en haut à droite. Vous pouvez y consulter l'historique complet, les statuts de paiement et télécharger vos reçus au format PDF." 
        },
        { 
            q: "Comment ajouter un nouveau membre à l'équipe ?", 
            a: "La gestion des membres se fait dans les Paramètres de l'Organisation. Cliquez sur l'onglet 'Membres', puis sur 'Inviter'. Entrez l'adresse email de votre collaborateur et assignez-lui un rôle (Admin, Manager ou Developer). Il recevra une invitation par email." 
        },
        {
            q: "Puis-je exporter mes données CRM ?",
            a: "Oui, vous pouvez exporter vos listes de clients, projets et factures. Sur chaque page respective, vous trouverez un bouton d'exportation (généralement en haut à droite ou dans les menus d'action) permettant de télécharger les données au format CSV ou PDF."
        },
        {
            q: "L'intelligence artificielle est-elle sécurisée ?",
            a: "Absolument. Nous utilisons des protocoles de chiffrement de bout en bout et vos données ne sont jamais utilisées pour entraîner des modèles publics. Chaque instance de CRM est isolée pour garantir une confidentialité totale de vos insights business."
        }
    ];

    const filteredFaqs = faqs.filter(faq => 
        faq.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
        faq.a.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmitTicket = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Votre demande a été envoyée. Notre équipe vous répondra sous 24h.");
        setIsTicketModalOpen(false);
    };

    return (
        <div className="p-8 space-y-12 bg-gray-50/30 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-5xl mx-auto space-y-12"
            >
                {/* Header with Search */}
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                        <LifeBuoy size={14} className="animate-spin-slow" />
                        Centre d'Assistance Pro
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
                        Comment pouvons-nous <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">vous aider aujourd'hui ?</span>
                    </h1>
                    
                    <div className="relative max-w-2xl mx-auto group">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full transition-opacity group-focus-within:opacity-100 opacity-0" />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher une solution ou un article..."
                            className="w-full h-16 pl-14 pr-6 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-lg font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Quick Help Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { 
                            icon: MessageSquare, 
                            title: "Chat en direct", 
                            desc: "Discutez instantanément avec nos experts support.",
                            action: "Démarrer le chat",
                            color: "bg-indigo-50",
                            iconColor: "text-indigo-600",
                            primary: true
                        },
                        { 
                            icon: Mail, 
                            title: "Support par email", 
                            desc: "Réponse garantie sous 24 heures ouvrées.",
                            action: "Ouvrir un ticket",
                            color: "bg-purple-50",
                            iconColor: "text-purple-600"
                        },
                    ].map((card, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", card.color)}>
                                <card.icon className={cn("w-7 h-7", card.iconColor)} />
                            </div>
                            <h3 className="font-black text-xl text-gray-900 mb-2">{card.title}</h3>
                            <p className="text-gray-500 text-sm font-medium mb-6 leading-relaxed">{card.desc}</p>
                            <button 
                                onClick={() => {
                                    if (card.title.includes('email')) {
                                        setIsTicketModalOpen(true);
                                    } else if (card.title.includes('Chat')) {
                                        navigate('/chat');
                                    }
                                }}
                                className={cn(
                                    "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                                    card.primary 
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95" 
                                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100"
                                )}
                            >
                                {card.action}
                                <ExternalLink size={14} />
                            </button>
                        </div>
                    ))}
                </div>


                {/* FAQ Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8 border-t border-gray-100">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-24">
                            <h2 className="text-3xl font-black text-gray-900">Questions <br />Fréquentes (FAQ)</h2>
                            <p className="text-gray-500 mt-4 font-medium leading-relaxed">
                                Vous ne trouvez pas la réponse à votre question ? 
                                Parcourez nos réponses rapides ou contactez-nous directement.
                            </p>
                            
                            <div className="mt-8 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="text-green-500" size={20} />
                                    <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">Support Prioritaire</span>
                                </div>
                                <p className="text-xs text-gray-400 font-bold leading-relaxed">
                                    En tant que client <span className="text-indigo-600">Enterprise AI</span>, vous bénéficiez d'un support 24/7.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-8 space-y-4">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, i) => (
                                <FAQItem key={i} question={faq.q} answer={faq.a} />
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-3xl">
                                <Cpu className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-bold">Aucun résultat trouvé pour "{searchTerm}"</p>
                                <button onClick={() => setSearchTerm('')} className="text-indigo-600 text-sm font-black mt-2 uppercase hover:underline">Réinitialiser la recherche</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Banner */}
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[40px] p-12 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl font-black tracking-tight">Toujours bloqué ?</h2>
                        <p className="text-indigo-200 max-w-xl mx-auto font-medium">
                            Nos techniciens sont disponibles 24h/24 pour résoudre vos problèmes les plus complexes.
                        </p>
                        <button 
                            onClick={() => setIsTicketModalOpen(true)}
                            className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all active:scale-95 shadow-xl"
                        >
                            Soumettre un ticket d'urgence
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Support Ticket Modal */}
            <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title="Ouvrir un ticket de support">
                <form onSubmit={handleSubmitTicket} className="space-y-6 p-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Sujet</label>
                            <select className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm">
                                <option>Problème Technique</option>
                                <option>Question Facturation</option>
                                <option>Aide IA & Algorithmes</option>
                                <option>Gestion de l'équipe</option>
                                <option>Autre</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Priorité</label>
                            <select className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm">
                                <option>Basse</option>
                                <option>Moyenne</option>
                                <option>Critique (Urgent)</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description du problème</label>
                        <textarea 
                            required
                            placeholder="Décrivez votre problème en détail..."
                            className="w-full h-40 p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm resize-none"
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                    >
                        <Send size={18} />
                        Envoyer le ticket
                    </button>
                </form>
            </Modal>
        </div>
    );
};
