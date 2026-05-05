import React from 'react';
import { motion } from 'motion/react';
import { Shield, Key, Smartphone, X, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import { toast } from 'sonner';


export const Security: React.FC = () => {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
    const [is2FAModalOpen, setIs2FAModalOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const [passwordData, setPasswordData] = React.useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [showPasswords, setShowPasswords] = React.useState({
        current: false,
        new: false,
        confirm: false
    });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        setIsSubmitting(true);
        try {
            await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success("Mot de passe mis à jour avec succès !");
            setIsPasswordModalOpen(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Une erreur est survenue lors de la mise à jour du mot de passe.");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        <button 
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium rounded-lg transition-colors text-sm"
                        >
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
                        <button 
                            onClick={() => setIs2FAModalOpen(true)}
                            className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium rounded-lg transition-colors text-sm"
                        >
                            Gérer
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Modal Modification Mot de Passe */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Lock className="w-5 h-5 text-primary" />
                                Modifier le mot de passe
                            </h2>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 hover:bg-accent rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mot de passe actuel</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? "text" : "password"}
                                        required
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nouveau mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        required
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirmer le nouveau mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        required
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-input hover:bg-accent rounded-lg font-medium transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? "Enregistrement..." : "Mettre à jour"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Modal Mock 2FA */}
            {is2FAModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-primary" />
                                Authentification à deux facteurs
                            </h2>
                            <button onClick={() => setIs2FAModalOpen(false)} className="p-2 hover:bg-accent rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-accent/50 rounded-xl">
                                <div>
                                    <p className="font-medium">Google Authenticator</p>
                                    <p className="text-xs text-muted-foreground">Activé le 12 Janv 2026</p>
                                </div>
                                <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full uppercase tracking-wider">
                                    Actif
                                </span>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire en exigeant un code de votre application d'authentification en plus de votre mot de passe.
                                </p>
                                
                                <div className="pt-4 flex flex-col gap-3">
                                    <button
                                        onClick={() => toast.info("Cette fonctionnalité de démonstration ne permet pas la désactivation réelle.")}
                                        className="w-full px-4 py-2 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg font-medium transition-colors"
                                    >
                                        Désactiver la 2FA
                                    </button>
                                    <button
                                        onClick={() => setIs2FAModalOpen(false)}
                                        className="w-full px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg font-medium transition-colors"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    );
};
