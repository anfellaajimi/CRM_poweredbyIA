import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import { toast } from 'sonner';

export const Profile: React.FC = () => {
    const { user, updateUser } = useAuthStore();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            const parts = user.name.split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const fullName = `${firstName} ${lastName}`.trim();
            await authAPI.updateMe({ nom: fullName, email, avatar: user?.avatar });
            
            if (user) {
                updateUser({
                    ...user,
                    name: fullName,
                    email: email,
                });
            }
            toast.success("Profil mis à jour avec succès");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = async () => {
        const url = window.prompt("Saisissez l'URL de votre nouvel avatar (laissez vide pour générer un avatar avec vos initiales) :");
        if (url === null) return;

        let newAvatarPath = url.trim();
        if (newAvatarPath === '') {
            newAvatarPath = `https://ui-avatars.com/api/?name=${encodeURIComponent(`${firstName} ${lastName}`.trim() || user?.name || 'User')}&background=random`;
        }

        try {
            const fullName = `${firstName} ${lastName}`.trim();
            await authAPI.updateMe({ nom: fullName, email, avatar: newAvatarPath });
            if (user) {
                updateUser({ ...user, avatar: newAvatarPath });
            }
            toast.success("Avatar mis à jour !");
        } catch (e) {
            toast.error("Erreur de mise à jour de l'avatar.");
        }
    };

    const handleAvatarDelete = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre avatar ?")) return;
        try {
            const fullName = `${firstName} ${lastName}`.trim();
            await authAPI.updateMe({ nom: fullName, email, avatar: '' }); 
            if (user) {
                updateUser({ ...user, avatar: undefined });
            }
            toast.success("Avatar supprimé !");
        } catch (e) {
            toast.error("Erreur lors de la suppression de l'avatar.");
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
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-md"
                        />
                        <div>
                            <h2 className="text-xl font-semibold">{user?.name || 'Administrateur'}</h2>
                            <p className="text-muted-foreground">{user?.email || 'admin@workspace.pro'}</p>
                            <div className="mt-3 flex gap-2">
                                <button onClick={handleAvatarChange} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                                    Changer l'avatar
                                </button>
                                <button onClick={handleAvatarDelete} className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors">
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>

                    <form className="space-y-6 max-w-2xl" onSubmit={handleSave}>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Prénom</label>
                                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full p-2.5 rounded-lg border border-input bg-background" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nom</label>
                                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full p-2.5 rounded-lg border border-input bg-background" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email professionnel</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2.5 rounded-lg border border-input bg-background" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Titre / Rôle</label>
                            <input type="text" value={user?.role || 'Developpeur'} disabled className="w-full p-2.5 rounded-lg border border-input bg-muted text-muted-foreground cursor-not-allowed" />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                                {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
