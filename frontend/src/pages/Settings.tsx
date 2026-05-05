import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Palette, Globe, FileText, Sparkles, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI, UIAppSettings } from '../services/api';
import { toast } from 'sonner';

import { GeneralSettings } from '../components/settings/GeneralSettings';
import { DocumentSettings } from '../components/settings/DocumentSettings';
import { IASettings } from '../components/settings/IASettings';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';

type Tab = 'overview' | 'general' | 'documents' | 'ia' | 'appearance' | 'notifications';

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [localSettings, setLocalSettings] = useState<UIAppSettings>({});
    const qc = useQueryClient();

    const { data: serverSettings, isLoading: isFetching } = useQuery({
        queryKey: ['settings'],
        queryFn: settingsAPI.get,
    });

    React.useEffect(() => {
        if (serverSettings) {
            setLocalSettings(serverSettings);
        }
    }, [serverSettings]);

    const mutationUpdate = useMutation({
        mutationFn: (payload: Partial<UIAppSettings>) => settingsAPI.update(payload),
        onSuccess: (data) => {
            qc.setQueryData(['settings'], data);
            toast.success('Parametres enregistres avec succes');
        },
        onError: () => {
            toast.error('Erreur lors de la sauvegarde des parametres');
        }
    });

    const handleChange = (field: keyof UIAppSettings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        mutationUpdate.mutate(localSettings);
    };

    const renderContent = () => {
        if (isFetching && !serverSettings) {
            return <div className="p-12 text-center text-muted-foreground animate-pulse">Chargement des parametres...</div>;
        }

        switch (activeTab) {
            case 'general':
                return <GeneralSettings settings={localSettings} onChange={handleChange} onSave={handleSave} isLoading={mutationUpdate.isPending} />;
            case 'documents':
                return <DocumentSettings settings={localSettings} onChange={handleChange} onSave={handleSave} isLoading={mutationUpdate.isPending} />;
            case 'ia':
                return <IASettings settings={localSettings} onChange={handleChange} onSave={handleSave} isLoading={mutationUpdate.isPending} />;
            case 'notifications':
                return <NotificationSettings settings={localSettings} onChange={handleChange} onSave={handleSave} isLoading={mutationUpdate.isPending} />;
            case 'appearance':
                return <AppearanceSettings settings={localSettings} onChange={handleChange} onSave={handleSave} isLoading={mutationUpdate.isPending} />;
            case 'overview':
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div onClick={() => setActiveTab('general')} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                            <div className="p-3 bg-accent w-fit rounded-lg mb-4 group-hover:bg-primary/10 transition-colors">
                                <Globe className="w-6 h-6 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">General</h3>
                            <p className="text-sm text-muted-foreground">Nom de l'entreprise, adresse, numeros d'identification et contacts.</p>
                        </div>

                        <div onClick={() => setActiveTab('documents')} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                            <div className="p-3 bg-accent w-fit rounded-lg mb-4 group-hover:bg-primary/10 transition-colors">
                                <FileText className="w-6 h-6 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Devis & Factures</h3>
                            <p className="text-sm text-muted-foreground">Parametrez le logo, le cachet, la validite et les conditions par defaut.</p>
                        </div>

                        <div onClick={() => setActiveTab('ia')} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-indigo-500/50 transition-colors cursor-pointer group">
                            <div className="p-3 bg-accent w-fit rounded-lg mb-4 group-hover:bg-indigo-500/10 transition-colors">
                                <Sparkles className="w-6 h-6 group-hover:text-indigo-500 transition-colors" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Intelligence Artificielle</h3>
                            <p className="text-sm text-muted-foreground">Integration API IA, choix du modele et scoring intelligent.</p>
                        </div>

                        <div onClick={() => setActiveTab('appearance')} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                            <div className="p-3 bg-accent w-fit rounded-lg mb-4 group-hover:bg-primary/10 transition-colors">
                                <Palette className="w-6 h-6 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Apparence</h3>
                            <p className="text-sm text-muted-foreground">Personnalisez les couleurs, le logo et les themes de l'interface.</p>
                        </div>

                        <div onClick={() => setActiveTab('notifications')} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                            <div className="p-3 bg-accent w-fit rounded-lg mb-4 group-hover:bg-primary/10 transition-colors">
                                <Bell className="w-6 h-6 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Notifications</h3>
                            <p className="text-sm text-muted-foreground">Configurez les alertes, emails et notifications push pour l'equipe.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                {activeTab === 'overview' ? (
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <SettingsIcon className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Parametres de l'organisation</h1>
                            <p className="text-muted-foreground mt-1">Configurez les parametres globaux de votre espace de travail.</p>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8 flex items-center">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className="mr-4 p-2 hover:bg-accent rounded-full transition-colors flex-shrink-0"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">Configuration</h1>
                            <p className="text-sm text-muted-foreground">Retour a la vue d'ensemble des parametres</p>
                        </div>
                    </div>
                )}

                <div className={activeTab !== 'overview' ? 'bg-card border border-border rounded-xl p-8 shadow-sm' : ''}>
                    {renderContent()}
                </div>
            </motion.div>
        </div>
    );
};
