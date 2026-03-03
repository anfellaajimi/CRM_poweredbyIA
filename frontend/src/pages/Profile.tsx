import React from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';

export const Profile: React.FC = () => {
    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <div className="flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Mon Profil</h1>
                        <p className="text-muted-foreground mt-1">Gérez vos informations personnelles et vos préférences.</p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    <div className="flex items-center space-x-6 mb-8">
                        <img
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                            alt="Avatar"
                            className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-md"
                        />
                        <div>
                            <h2 className="text-xl font-semibold">Anfel Ajimil</h2>
                            <p className="text-muted-foreground">anfel.ajimil@workspace.pro</p>
                            <div className="mt-3 flex gap-2">
                                <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                                    Changer l'avatar
                                </button>
                                <button className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors">
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>

                    <form className="space-y-6 max-w-2xl">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Prénom</label>
                                <input type="text" defaultValue="Anfel" className="w-full p-2.5 rounded-lg border border-input bg-background" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nom</label>
                                <input type="text" defaultValue="Ajimil" className="w-full p-2.5 rounded-lg border border-input bg-background" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email professionnel</label>
                            <input type="email" defaultValue="anfel.ajimil@workspace.pro" className="w-full p-2.5 rounded-lg border border-input bg-background" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Titre / Rôle</label>
                            <input type="text" defaultValue="Administrateur Système" className="w-full p-2.5 rounded-lg border border-input bg-background" />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="button" className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
                                Enregistrer les modifications
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
