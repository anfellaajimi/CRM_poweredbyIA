import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Calendar,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { clientPortalAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const StatCard: React.FC<{ icon: any, label: string, value: string | number, color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-inner`}>
      <Icon className="w-7 h-7" />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  </div>
);

export const ClientDashboard: React.FC = () => {
  const { data: profile } = useQuery({ queryKey: ['client-profile'], queryFn: clientPortalAPI.getProfile });
  const { data: projects } = useQuery({ queryKey: ['client-projects'], queryFn: clientPortalAPI.getProjects });
  const { data: factures } = useQuery({ queryKey: ['client-factures'], queryFn: clientPortalAPI.getFactures });

  const activeProjects = projects?.filter((p: any) => p.status === 'en_cours') || [];
  const pendingFactures = factures?.filter((f: any) => f.statut === 'en_attente') || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            Bonjour, <span className="text-indigo-600">{profile?.user?.name}</span> 👋
          </h2>
          <p className="text-gray-500 font-medium mt-1">Voici un aperçu de vos projets et documents récents.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 pr-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <Calendar className="text-green-600 w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-gray-900">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Briefcase} 
          label="Projets Actifs" 
          value={activeProjects.length} 
          color="bg-indigo-50 text-indigo-600" 
        />
        <StatCard 
          icon={Clock} 
          label="Milestones Prochains" 
          value="4" 
          color="bg-amber-50 text-amber-600" 
        />
        <StatCard 
          icon={AlertCircle} 
          label="Factures en attente" 
          value={pendingFactures.length} 
          color="bg-rose-50 text-rose-600" 
        />
        <StatCard 
          icon={TrendingUp} 
          label="Avancement Global" 
          value="75%" 
          color="bg-emerald-50 text-emerald-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900">Projets Récents</h3>
            <Link to="/client-portal/projects" className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:underline">
              Tout voir <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid gap-4">
            {activeProjects.length > 0 ? activeProjects.slice(0, 3).map((project: any) => (
              <div key={project.projetID} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-black text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">{project.nomProjet}</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{project.categorie}</p>
                  </div>
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase">
                    {project.status.replace('_', ' ')}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-400">Progression</span>
                    <span className="text-indigo-600">{project.progression}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progression}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-white p-12 rounded-[40px] border border-dashed border-gray-200 text-center">
                <p className="text-gray-400 font-bold">Aucun projet actif pour le moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Support Team */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <h4 className="font-black text-gray-900 mb-6">Équipe support</h4>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center font-black text-indigo-700">
                AM
              </div>
              <div>
                <p className="font-bold text-gray-900">Anfel Laajimi</p>
                <p className="text-xs text-gray-500">Project Manager</p>
              </div>
              <Link to="/client-portal/chat" className="ml-auto w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-indigo-600 hover:shadow-md transition-shadow">
                <MessageSquare size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
