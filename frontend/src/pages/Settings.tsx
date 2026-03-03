import React from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Bell, Palette, Globe } from 'lucide-react';

export const Settings: React.FC = () => {
    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <div className="flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <SettingsIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Paramètres de l'organisation</h1>
                        <p className="text-muted-foreground mt-1">Configurez les paramètres globaux de votre espace de travail.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="p-3 bg-accent w-fit rounded-lg mb-4">
                            <Globe className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Général</h3>
                        <p className="text-sm text-muted-foreground">Nom de l'entreprise, domaine, fuseau horaire et paramètres régionaux.</p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="p-3 bg-accent w-fit rounded-lg mb-4">
                            <Palette className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Apparence</h3>
                        <p className="text-sm text-muted-foreground">Personnalisez les couleurs, le logo et les thèmes de l'interface.</p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="p-3 bg-accent w-fit rounded-lg mb-4">
                            <Bell className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Notifications</h3>
                        <p className="text-sm text-muted-foreground">Configurez les alertes, emails et notifications push pour l'équipe.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
