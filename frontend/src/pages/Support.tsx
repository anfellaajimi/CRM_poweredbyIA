import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, MessageSquare, Mail, BookOpen } from 'lucide-react';

export const Support: React.FC = () => {
    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <div className="flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <HelpCircle className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Centre de support</h1>
                        <p className="text-muted-foreground mt-1">Nous sommes là pour vous aider avec toutes vos questions.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Chat en direct</h3>
                        <p className="text-sm text-muted-foreground mb-4">Discutez avec notre équipe de support en temps réel.</p>
                        <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors w-full">
                            Démarrer le chat
                        </button>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Support par email</h3>
                        <p className="text-sm text-muted-foreground mb-4">Envoyez-nous un email et nous vous répondrons sous 24h.</p>
                        <button className="px-4 py-2 border border-input bg-background text-sm font-medium rounded-lg hover:bg-accent transition-colors w-full">
                            support@workspace.pro
                        </button>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Base de connaissances</h3>
                        <p className="text-sm text-muted-foreground mb-4">Consultez nos articles et guides complets.</p>
                        <button className="px-4 py-2 border border-input bg-background text-sm font-medium rounded-lg hover:bg-accent transition-colors w-full">
                            Parcourir les articles
                        </button>
                    </div>
                </div>

                <h3 className="text-2xl font-bold mb-6">Questions Fréquentes (FAQ)</h3>
                <div className="space-y-4">
                    {[
                        { q: "Comment puis-je réinitialiser mon mot de passe ?", a: "Vous pouvez le faire en allant sur la page Sécurité depuis votre profil, ou en utilisant le lien 'Mot de passe oublié' sur la page de connexion." },
                        { q: "Où puis-je trouver mes factures ?", a: "Toutes vos factures sont disponibles sur la page 'Facturation' accessible via le menu utilisateur en haut à droite." },
                        { q: "Comment ajouter un nouveau membre à l'équipe ?", a: "Allez dans les Paramètres de l'organisation > Membres, et cliquez sur le bouton 'Inviter'. Un rôle peut être assigné lors de l'invitation." }
                    ].map((faq, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                            <h4 className="font-semibold text-foreground mb-2">{faq.q}</h4>
                            <p className="text-sm text-muted-foreground">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};
