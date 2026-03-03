import React from 'react';
import { motion } from 'motion/react';
import { Shield, Key, Smartphone } from 'lucide-react';

export const Security: React.FC = () => {
    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <div className="flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Sécurité du compte</h1>
                        <p className="text-muted-foreground mt-1">Gérez votre mot de passe et vos paramètres de sécurité.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-accent rounded-lg mt-1">
                                <Key className="w-5 h-5 text-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Mot de passe</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                    Il est recommandé d'utiliser un mot de passe fort que vous n'utilisez nulle part ailleurs.
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">Dernière modification : Il y a 3 mois</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium rounded-lg transition-colors text-sm">
                            Modifier
                        </button>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-primary/10 rounded-lg mt-1">
                                <Smartphone className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Authentification à deux facteurs (2FA)</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                    Ajoutez une couche de sécurité supplémentaire à votre compte en utilisant une application d'authentification.
                                </p>
                                <div className="mt-3 flex items-center space-x-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Activé via Google Authenticator</span>
                                </div>
                            </div>
                        </div>
                        <button className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium rounded-lg transition-colors text-sm">
                            Gérer
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
