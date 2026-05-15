import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  Briefcase,
  Eye,
  MessageSquare,
  FileText,
  X
} from 'lucide-react';
import { clientPortalAPI } from '../../services/api';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';

// ─── Dropdown Menu ───────────────────────────────────────────────────────────
const ProjectMenu: React.FC<{ project: any; onClose: () => void }> = ({ project, onClose }) => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const actions = [
    { icon: Eye, label: 'Voir les détails', action: () => navigate(`/client-portal/projects/${project.projetID}`) },
    { icon: MessageSquare, label: 'Contacter l\'équipe', action: () => navigate('/client-portal/chat') },
    { icon: FileText, label: 'Documents liés', action: () => navigate('/client-portal/documents') },
  ];

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.92, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute right-2 top-12 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 w-52 overflow-hidden"
    >
      {actions.map(({ icon: Icon, label, action }) => (
        <button
          key={label}
          onClick={() => { action(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left"
        >
          <Icon size={16} className="flex-shrink-0" />
          {label}
        </button>
      ))}
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ClientProjects: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useQuery({ 
    queryKey: ['client-projects'], 
    queryFn: clientPortalAPI.getProjects 
  });

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'termine': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'en_cours': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'en_attente': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'termine': return CheckCircle2;
      case 'en_cours': return Clock;
      case 'en_attente': return AlertCircle;
      default: return Clock;
    }
  };

  const filterOptions = [
    { key: 'all', label: 'Tous' },
    { key: 'en_cours', label: 'En cours' },
    { key: 'en_attente', label: 'En attente' },
    { key: 'termine', label: 'Terminés' },
  ];

  const filtered = (projects || []).filter((p: any) => {
    const matchSearch = p.nomProjet?.toLowerCase().includes(search.toLowerCase()) ||
                        p.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'all' || p.status === activeFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Mes Projets</h2>
          <p className="text-gray-500 font-medium mt-1">
            Suivez l'avancement de vos collaborations avec Quatratech.
            {!isLoading && <span className="ml-2 text-indigo-600 font-black">{filtered.length} projet{filtered.length !== 1 ? 's' : ''}</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('p-2 rounded-xl transition-colors', viewMode === 'grid' ? 'bg-gray-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:bg-gray-50')}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-2 rounded-xl transition-colors', viewMode === 'list' ? 'bg-gray-50 text-indigo-600 shadow-sm' : 'text-gray-400 hover:bg-gray-50')}
          >
            <ListIcon size={20} />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher un projet..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-4 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {filterOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={cn(
                'px-4 py-4 rounded-2xl font-bold text-sm transition-all whitespace-nowrap',
                activeFilter === key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid / List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'flex flex-col gap-4'}>
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 h-64 animate-pulse" />
          ))
        ) : filtered.length > 0 ? (
          filtered.map((project: any, i: number) => {
            const StatusIcon = getStatusIcon(project.status);
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                key={project.projetID}
                className={cn(
                  'bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden',
                  viewMode === 'grid' ? 'p-8 rounded-[40px]' : 'p-6 rounded-[28px] flex items-center gap-6'
                )}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[80px] -z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className={cn('relative z-10', viewMode === 'list' ? 'flex items-center gap-6 w-full' : '')}>
                  {/* Top: Status badge + 3-dot menu */}
                  <div className={cn('flex items-start justify-between mb-6', viewMode === 'list' && 'mb-0 flex-1')}>
                    <div className={viewMode === 'list' ? 'flex items-center gap-4' : ''}>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase border inline-flex items-center gap-1",
                        viewMode === 'grid' ? 'mb-3' : '',
                        getStatusColor(project.status)
                      )}>
                        <StatusIcon size={10} />
                        {project.status.replace('_', ' ')}
                      </div>
                      <h3 className={cn(
                        'font-black text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight',
                        viewMode === 'grid' ? 'text-2xl' : 'text-lg ml-3'
                      )}>
                        {project.nomProjet}
                      </h3>
                    </div>

                    {/* 3-dot menu */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === project.projetID ? null : project.projetID); }}
                        className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl hover:text-indigo-600 transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>
                      <AnimatePresence>
                        {openMenuId === project.projetID && (
                          <ProjectMenu project={project} onClose={() => setOpenMenuId(null)} />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {viewMode === 'grid' && (
                    <>
                      <p className="text-gray-500 text-sm font-medium mb-8 line-clamp-2">
                        {project.description || "Aucune description fournie pour ce projet."}
                      </p>

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Progression</span>
                          <span className="text-lg font-black text-indigo-600">{project.progression}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progression}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <div className="flex -space-x-3">
                          {[1, 2].map(u => (
                            <div key={u} className="w-10 h-10 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700">
                              {u === 1 ? 'AL' : 'JD'}
                            </div>
                          ))}
                          <div className="w-10 h-10 rounded-full border-4 border-white bg-gray-50 flex items-center justify-center font-bold text-xs text-gray-400">
                            +2
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/client-portal/projects/${project.projetID}`)}
                          className="flex items-center gap-2 text-indigo-600 font-black text-sm hover:underline"
                        >
                          Détails du projet
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </>
                  )}

                  {viewMode === 'list' && (
                    <div className="flex items-center gap-6 ml-auto flex-shrink-0">
                      <div className="text-right hidden md:block">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Progression</p>
                        <p className="text-lg font-black text-indigo-600">{project.progression}%</p>
                      </div>
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden hidden md:block">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progression}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-indigo-600 to-purple-500"
                        />
                      </div>
                      <button
                        onClick={() => navigate(`/client-portal/projects/${project.projetID}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors whitespace-nowrap"
                      >
                        Voir <ExternalLink size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
             <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-4" />
             <h3 className="text-xl font-black text-gray-400">Aucun projet trouvé</h3>
             <p className="text-gray-400 font-medium">
               {search ? 'Aucun résultat pour votre recherche.' : 'Vous n\'avez pas encore de projet actif avec nous.'}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};
