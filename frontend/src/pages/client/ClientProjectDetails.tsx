import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Download,
} from 'lucide-react';
import { clientPortalAPI } from '../../services/api';
import { cn } from '../../utils/cn';

const TABS = ['Aperçu', 'Jalons', 'Équipe', 'Documents'] as const;
type Tab = typeof TABS[number];

export const ClientProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('Aperçu');

  const { data: project, isLoading } = useQuery({
    queryKey: ['client-project-details', id],
    queryFn: () => clientPortalAPI.getProjectDetails(Number(id)),
    enabled: !!id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'termine': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'en_cours': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'en_attente': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'termine': return CheckCircle2;
      case 'en_cours': return TrendingUp;
      case 'en_attente': return Clock;
      default: return AlertCircle;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-white rounded-[40px] border border-gray-100 animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-[32px] border border-gray-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Briefcase className="w-16 h-16 text-gray-200 mb-4" />
        <h3 className="text-xl font-black text-gray-400">Projet introuvable</h3>
        <button
          onClick={() => navigate('/client-portal/projects')}
          className="mt-6 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft size={18} /> Retour aux projets
        </button>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(project.status);

  return (
    <div className="space-y-8 pb-12">
      {/* Back */}
      <button
        onClick={() => navigate('/client-portal/projects')}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold transition-colors group"
      >
        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
          <ArrowLeft size={16} />
        </div>
        Retour aux projets
      </button>

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[40px] p-10 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full translate-y-16 -translate-x-8" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div>
              <div className={cn(
                'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase border mb-4',
                'bg-white/10 text-white border-white/20'
              )}>
                <StatusIcon size={12} />
                {project.status?.replace('_', ' ')}
              </div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight mb-2">
                {project.nomProjet}
              </h1>
              <p className="text-indigo-200 font-medium">{project.categorie}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-5xl font-black text-white">{project.progression ?? 0}%</div>
              <p className="text-indigo-300 text-sm font-bold">Progression</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-indigo-300 mb-2">
              <span>Avancement du projet</span>
              <span>{project.progression ?? 0}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progression ?? 0}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Date de début', value: project.dateDebut ? new Date(project.dateDebut).toLocaleDateString('fr-FR') : '—', icon: Calendar, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Date de fin', value: project.dateFin ? new Date(project.dateFin).toLocaleDateString('fr-FR') : '—', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
          { label: 'Budget', value: project.budget ? `${Number(project.budget).toLocaleString('fr-FR')} TND` : '—', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Membres', value: project.membres?.length ?? project.team?.length ?? '—', icon: Users, color: 'text-amber-600 bg-amber-50' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', stat.color)}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-base font-black text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 px-6 pt-4 gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-5 py-3 rounded-t-xl font-bold text-sm transition-all',
                activeTab === tab
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-400 hover:text-gray-700'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* Aperçu Tab */}
          {activeTab === 'Aperçu' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Description</h4>
                <p className="text-gray-600 font-medium leading-relaxed">
                  {project.description || 'Aucune description disponible pour ce projet.'}
                </p>
              </div>
              {project.objectifs && (
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Objectifs</h4>
                  <p className="text-gray-600 font-medium leading-relaxed">{project.objectifs}</p>
                </div>
              )}
              {project.technologies && (
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {String(project.technologies).split(',').map((tech: string) => (
                      <span key={tech} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Jalons Tab */}
          {activeTab === 'Jalons' && (
            <div className="space-y-4">
              {project.milestones?.length > 0 ? (
                project.milestones.map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      m.statut === 'termine' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    )}>
                      {m.statut === 'termine' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">{m.titre || m.title || `Jalon ${i + 1}`}</p>
                      {m.dateEcheance && (
                        <p className="text-xs text-gray-400 font-bold">
                          {new Date(m.dateEcheance).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-black uppercase',
                      m.statut === 'termine' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    )}>
                      {m.statut?.replace('_', ' ') || 'En cours'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-bold">Aucun jalon enregistré pour ce projet.</p>
                </div>
              )}
            </div>
          )}

          {/* Équipe Tab */}
          {activeTab === 'Équipe' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(project.membres || project.team || []).length > 0 ? (
                (project.membres || project.team || []).map((member: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-700 text-sm flex-shrink-0">
                      {(member.nom || member.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{member.nom || member.name || `Membre ${i + 1}`}</p>
                      <p className="text-xs text-gray-400 font-bold capitalize">{member.role || 'Développeur'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-bold">Aucun membre d'équipe visible.</p>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'Documents' && (
            <div className="space-y-4">
              {(project.documents || []).length > 0 ? (
                (project.documents || []).map((doc: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">{doc.nom || doc.name || `Document ${i + 1}`}</p>
                      <p className="text-xs text-gray-400 font-bold">{doc.type || 'Fichier'}</p>
                    </div>
                    {doc.url && (
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                        >
                          <ExternalLink size={15} />
                        </a>
                        <a
                          href={doc.url}
                          download
                          className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                        >
                          <Download size={15} />
                        </a>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-bold">Aucun document lié à ce projet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
