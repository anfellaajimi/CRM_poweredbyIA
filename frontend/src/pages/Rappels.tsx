import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  Pencil, 
  Plus, 
  Trash2, 
  X, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Info,
  AlertCircle,
  Bell,
  Layers,
  Tag,
  ArrowRight
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO,
  isToday
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

import { Modal } from '../components/ui/Modal';
import { clientsAPI, projectsAPI, rappelsAPI, UIRappel } from '../services/api';

const rappelVide: Partial<UIRappel> = {
  clientID: 0,
  projetID: undefined,
  titre: '',
  typeRappel: '',
  description: '',
  dateLimite: '',
  priorite: 'moyenne',
  statut: 'en_attente',
};

const toDateTimeLocal = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.length >= 16 ? value.slice(0, 16) : value;
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const formaterHeure = (value?: string) => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const formaterDate = (value?: string) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return value; }
};

const obtenirCouleurPriorite = (p: string) => {
  const s = p?.toLowerCase();
  if (s === 'elevee' || s === 'élevée' || s === 'haute') return 'bg-red-100 text-red-700 border-red-200';
  if (s === 'moyenne') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-blue-100 text-blue-600 border-blue-200';
};

const obtenirLibellePriorite = (p: string) => {
  const s = p?.toLowerCase();
  if (s === 'elevee' || s === 'élevée' || s === 'haute') return 'Urgent';
  if (s === 'moyenne') return 'Moyenne';
  return 'Basse';
};

const getPrioriteConfig = (p: string) => {
  const s = p?.toLowerCase();
  if (s === 'elevee' || s === 'élevée' || s === 'haute') return {
    badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Urgent'
  };
  if (s === 'moyenne') return {
    badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'Moyenne'
  };
  return {
    badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400', label: 'Basse'
  };
};

const estTermine = (statut: string) =>
  ['termine', 'completed', 'complété', 'terminé'].includes((statut || '').toLowerCase());

export const Rappels: React.FC = () => {
  const qc = useQueryClient();
  const [vueMode, setVueMode] = useState<'list' | 'calendar'>('list');
  const [modalOuvert, setModalOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<UIRappel | null>(null);
  const [rappelSelectionne, setRappelSelectionne] = useState<UIRappel | null>(null);
  const [formulaire, setFormulaire] = useState<Partial<UIRappel>>(rappelVide);
  const [filtreProjet, setFiltreProjet] = useState<string>('');
  const [filtreSource, setFiltreSource] = useState<'all' | 'system' | 'manual'>('all');

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsAPI.getAll() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsAPI.getAll });

  const rappelFilters = useMemo(() => {
    const f: any = {};
    if (filtreProjet) f.projetID = Number(filtreProjet);
    if (filtreSource !== 'all') f.source = filtreSource;
    return f;
  }, [filtreProjet, filtreSource]);

  const { data: rappels = [] } = useQuery({
    queryKey: ['rappels', rappelFilters],
    queryFn: () => rappelsAPI.getAll(rappelFilters),
  });

  const mutationCreer = useMutation({
    mutationFn: rappelsAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Rappel créé avec succès');
      setModalOuvert(false);
      setFormulaire(rappelVide);
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationModifier = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<UIRappel> }) =>
      rappelsAPI.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Rappel mis à jour');
      setModalOuvert(false);
      setEnEdition(null);
      setFormulaire(rappelVide);
      if (rappelSelectionne) setRappelSelectionne(null);
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationSupprimer = useMutation({
    mutationFn: (id: number) => rappelsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Rappel supprimé');
      if (rappelSelectionne) setRappelSelectionne(null);
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationGenerer = useMutation({
    mutationFn: () => rappelsAPI.generate(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rappels'] });
      toast.success('Rappels actualisés');
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.detail ?? err?.message}`),
  });

  const marquerTermine = (r: UIRappel) => {
    mutationModifier.mutate({ id: r.id, payload: { ...r, statut: 'termine' } });
  };

  const ouvrirCreation = (date?: Date) => {
    setEnEdition(null);
    setFormulaire({ 
      ...rappelVide, 
      dateLimite: date ? format(date, "yyyy-MM-dd'T'HH:mm") : '' 
    });
    setModalOuvert(true);
  };

  const ouvrirEdition = (r: UIRappel) => {
    setEnEdition(r);
    setFormulaire({ ...r, dateLimite: toDateTimeLocal(r.dateLimite) });
    setModalOuvert(true);
  };

  const soumettre = () => {
    if ((!formulaire.clientID && !formulaire.projetID) || !formulaire.titre) {
      toast.error('Client (ou projet) et titre sont obligatoires');
      return;
    }
    if (enEdition) {
      mutationModifier.mutate({ id: enEdition.id, payload: formulaire });
    } else {
      mutationCreer.mutate(formulaire);
    }
  };

  const confirmerSuppression = (r: UIRappel) => {
    if (window.confirm(`Supprimer le rappel "${r.titre}" ?`)) {
      mutationSupprimer.mutate(r.id);
    }
  };

  const nomClient = (clientID: number) =>
    clients.find((c) => Number(c.id) === clientID)?.name || `Client ${clientID}`;

  const nomProjet = (projetID?: number) => {
    if (!projetID) return '';
    return projects.find((p: any) => Number(p.id) === Number(projetID))?.name || `Projet ${projetID}`;
  };

  const rappelsByDay = useMemo(() => {
    const map = new Map<string, UIRappel[]>();
    rappels.forEach((r) => {
      if (!r.dateLimite) return;
      const key = r.dateLimite.split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [rappels]);

  const rappelsDuJour = useMemo(() => {
    if (!selectedDate) return [];
    const dayStr = format(selectedDate, 'yyyy-MM-dd');
    const list = rappelsByDay.get(dayStr) || [];
    return [...list].sort((a, b) => {
      const order = (p: string) => ['elevee','élevée','haute'].includes(p?.toLowerCase()) ? 0 : p?.toLowerCase() === 'moyenne' ? 1 : 2;
      const po = order(a.priorite) - order(b.priorite);
      if (po !== 0) return po;
      return (a.dateLimite || '').localeCompare(b.dateLimite || '');
    });
  }, [rappelsByDay, selectedDate]);

  const rappelsDuMois = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return rappels
      .filter(r => {
        if (!r.dateLimite) return false;
        const d = parseISO(r.dateLimite);
        return d >= monthStart && d <= monthEnd;
      })
      .sort((a, b) => (a.dateLimite || '').localeCompare(b.dateLimite || ''));
  }, [rappels, currentMonth]);

  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const CarteRappel = ({ r, estFait = false }: { r: UIRappel; estFait?: boolean }) => (
    <div
      onClick={() => setRappelSelectionne(r)}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        rappelSelectionne?.id === r.id
          ? 'border-indigo-400 bg-indigo-50 shadow-sm'
          : estFait
          ? 'border-gray-100 bg-gray-50 opacity-60 hover:opacity-80'
          : 'border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`font-semibold text-sm text-gray-800 ${estFait ? 'line-through' : ''}`}>{r.titre}</p>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${obtenirCouleurPriorite(r.priorite)}`}>
          {obtenirLibellePriorite(r.priorite)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
          {nomClient(r.clientID)}
        </span>
        {r.projetID && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
            {nomProjet(r.projetID)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{formaterDate(r.dateLimite)}</span>
        </div>
        {estFait && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rappels & Tâches</h1>
          <p className="text-sm text-gray-500 mt-0.5">Suivi de votre activité et des échéances</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => setVueMode('list')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${vueMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Liste
            </button>
            <button
              onClick={() => setVueMode('calendar')}
              className={`px-4 py-2 transition-colors ${vueMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => ouvrirCreation()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nouveau
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Projet</label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            value={filtreProjet}
            onChange={(e) => setFiltreProjet(e.target.value)}
          >
            <option value="">Tous les projets</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Source</label>
          <select
            className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
            value={filtreSource}
            onChange={(e) => setFiltreSource(e.target.value as any)}
          >
            <option value="all">Toutes les sources</option>
            <option value="system">Automatique (Système)</option>
            <option value="manual">Manuelle</option>
          </select>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => mutationGenerer.mutate()}
          disabled={mutationGenerer.isPending}
          className="px-4 py-1.5 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all disabled:opacity-50"
        >
          {mutationGenerer.isPending ? 'Mise à jour...' : 'Actualiser'}
        </button>
      </div>

      {vueMode === 'list' ? (
        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            {rappels.filter(r => !estTermine(r.statut) && ['elevee', 'élevée', 'haute'].includes(r.priorite?.toLowerCase())).length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-tight">Urgents</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rappels.filter(r => !estTermine(r.statut) && ['elevee', 'élevée', 'haute'].includes(r.priorite?.toLowerCase())).map(r => (
                    <CarteRappel key={r.id} r={r} />
                  ))}
                </div>
              </section>
            )}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-yellow-500" />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-tight">À venir / En attente</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rappels.filter(r => !estTermine(r.statut) && !['elevee', 'élevée', 'haute'].includes(r.priorite?.toLowerCase())).map(r => (
                  <CarteRappel key={r.id} r={r} />
                ))}
              </div>
            </section>
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-tight text-gray-400">Historique des terminés</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rappels.filter(r => estTermine(r.statut)).map(r => (
                  <CarteRappel key={r.id} r={r} estFait />
                ))}
              </div>
            </section>
          </div>
          {rappelSelectionne && (
            <div className="w-96 flex-shrink-0 animate-in slide-in-from-right duration-300">
               <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sticky top-6 space-y-5">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-900 leading-snug">{rappelSelectionne.titre}</h3>
                    <button onClick={() => setRappelSelectionne(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border uppercase ${obtenirCouleurPriorite(rappelSelectionne.priorite)}`}>
                      {obtenirLibellePriorite(rappelSelectionne.priorite)}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border uppercase ${estTermine(rappelSelectionne.statut) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                      {estTermine(rappelSelectionne.statut) ? 'Terminé' : 'En cours'}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 font-bold uppercase">Échéance</p>
                        <p className="font-semibold text-gray-700">{formaterDate(rappelSelectionne.dateLimite)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 font-bold uppercase">Client / Projet</p>
                        <p className="font-semibold text-gray-700">{nomClient(rappelSelectionne.clientID)}</p>
                        {rappelSelectionne.projetID && <p className="text-[11px] text-indigo-500">{nomProjet(rappelSelectionne.projetID)}</p>}
                      </div>
                    </div>
                  </div>
                  {rappelSelectionne.description && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[11px] text-gray-400 font-bold uppercase mb-2">Description</p>
                      <p className="text-sm text-gray-600 leading-relaxed italic">"{rappelSelectionne.description}"</p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                    {!estTermine(rappelSelectionne.statut) && (
                      <button
                        onClick={() => marquerTermine(rappelSelectionne)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98]"
                      >
                        Marquer comme terminé
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => ouvrirEdition(rappelSelectionne)} className="py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition-all flex items-center justify-center gap-2">
                        <Pencil className="w-3.5 h-3.5" /> Modifier
                      </button>
                      <button onClick={() => confirmerSuppression(rappelSelectionne)} className="py-2 border border-red-50 hover:bg-red-50 rounded-xl text-xs font-bold text-red-500 transition-all flex items-center justify-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      ) : (
        /* VUE CALENDRIER AVEC LISTE D'ÉVÉNEMENTS */
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">

          {/* ── CALENDRIER + LISTE (3/4) ── */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Navigation */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><CalendarIcon className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 capitalize">{format(currentMonth, 'MMMM yyyy', { locale: fr })}</h2>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                      {rappelsDuMois.filter(r => !estTermine(r.statut)).length} en attente
                      {rappelsDuMois.filter(r => !estTermine(r.statut) && ['elevee','élevée','haute'].includes(r.priorite?.toLowerCase())).length > 0 && (
                        ` · ${rappelsDuMois.filter(r => !estTermine(r.statut) && ['elevee','élevée','haute'].includes(r.priorite?.toLowerCase())).length} urgent(s)`
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-all active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-all">Aujourd'hui</button>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-all active:scale-90"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Grid */}
              <div className="p-4">
                <div className="grid grid-cols-7 gap-px mb-1">
                  {dayLabels.map((l) => (
                    <div key={l} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">{l}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((day, idx) => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const dayEvents = rappelsByDay.get(dayStr) || [];
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isTodayDay = isToday(day);
                    const hasUrgent = dayEvents.some(r => !estTermine(r.statut) && ['elevee','élevée','haute'].includes(r.priorite?.toLowerCase()));
                    const visible = dayEvents.slice(0, 2);
                    const hidden = dayEvents.length - visible.length;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(day)}
                        className={`relative min-h-[90px] p-1.5 border rounded-xl transition-all flex flex-col items-start gap-0.5 text-left
                          ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/30 opacity-40'}
                          ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-md z-10' : 'border-gray-100 hover:border-indigo-200 hover:shadow-sm'}
                        `}
                      >
                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all flex-shrink-0
                          ${isTodayDay ? 'bg-indigo-600 text-white shadow-md' : isSelected ? 'bg-indigo-100 text-indigo-700 font-black' : 'text-gray-600'}
                        `}>{format(day, 'd')}</span>
                        <div className="w-full flex flex-col gap-0.5 flex-1">
                          {visible.map(r => {
                            const p = r.priorite?.toLowerCase();
                            const chipColor = ['elevee','élevée','haute'].includes(p) ? 'bg-red-500' : p === 'moyenne' ? 'bg-amber-400' : 'bg-blue-400';
                            const fini = estTermine(r.statut);
                            return (
                              <div key={r.id} className={`w-full px-1 py-0.5 rounded text-[9px] font-bold truncate ${fini ? 'bg-gray-100 text-gray-400 line-through' : `${chipColor} text-white`}`}>
                                {r.titre}
                              </div>
                            );
                          })}
                          {hidden > 0 && <div className="text-[9px] font-black text-gray-400 px-1">+{hidden} autre{hidden > 1 ? 's' : ''}</div>}
                        </div>
                        {hasUrgent && !isSelected && <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-sm" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── LISTE D'ÉVÉNEMENTS DU JOUR ── */}
            {selectedDate && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isToday(selectedDate) ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                      <span className="text-sm font-black">{format(selectedDate, 'd')}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 capitalize">{format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</h3>
                      <p className="text-xs text-gray-400">
                        {rappelsDuJour.length === 0 ? 'Aucun événement ce jour' : `${rappelsDuJour.length} événement${rappelsDuJour.length > 1 ? 's' : ''} · ${rappelsDuJour.filter(r => estTermine(r.statut)).length} terminé${rappelsDuJour.filter(r => estTermine(r.statut)).length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => ouvrirCreation(selectedDate)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95">
                    <Plus className="w-4 h-4" />Ajouter
                  </button>
                </div>

                {rappelsDuJour.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4"><CalendarIcon className="w-8 h-8 text-gray-200" /></div>
                    <p className="text-sm font-bold text-gray-400">Journée libre</p>
                    <p className="text-xs text-gray-300 mt-1">Cliquez sur "Ajouter" pour planifier un rappel</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {(['elevee', 'moyenne', 'basse'] as const).map(prio => {
                      const groupe = rappelsDuJour.filter(r => {
                        const p = r.priorite?.toLowerCase();
                        if (prio === 'elevee') return ['elevee','élevée','haute'].includes(p);
                        if (prio === 'moyenne') return p === 'moyenne';
                        return !['elevee','élevée','haute','moyenne'].includes(p);
                      });
                      if (groupe.length === 0) return null;
                      const dotColor = prio === 'elevee' ? 'bg-red-500' : prio === 'moyenne' ? 'bg-amber-400' : 'bg-blue-400';
                      const barColor = prio === 'elevee' ? 'bg-red-400' : prio === 'moyenne' ? 'bg-amber-400' : 'bg-blue-400';
                      const groupLabel = prio === 'elevee' ? 'Urgent' : prio === 'moyenne' ? 'Moyenne' : 'Basse';
                      return (
                        <div key={prio}>
                          <div className="px-6 py-2 flex items-center gap-2 bg-gray-50/50">
                            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{groupLabel}</span>
                            <span className="text-[10px] text-gray-400">— {groupe.length} événement{groupe.length > 1 ? 's' : ''}</span>
                          </div>
                          {groupe.map(r => {
                            const fini = estTermine(r.statut);
                            const isEvtSelected = rappelSelectionne?.id === r.id;
                            return (
                              <div
                                key={r.id}
                                onClick={() => setRappelSelectionne(isEvtSelected ? null : r)}
                                className={`px-6 py-4 flex items-center gap-4 cursor-pointer transition-all
                                  ${isEvtSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}
                                `}
                              >
                                <div className="w-14 flex-shrink-0 text-center">
                                  {formaterHeure(r.dateLimite) ? (
                                    <span className="text-xs font-black text-indigo-600">{formaterHeure(r.dateLimite)}</span>
                                  ) : <span className="text-[10px] text-gray-300">—</span>}
                                </div>
                                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${fini ? 'bg-gray-200' : barColor}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold ${fini ? 'line-through text-gray-400' : 'text-gray-800'}`}>{r.titre}</p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-xs text-gray-400">{nomClient(r.clientID)}</span>
                                    {r.projetID && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-bold">{nomProjet(r.projetID)}</span>}
                                    {r.typeRappel && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold">{r.typeRappel}</span>}
                                  </div>
                                  {r.description && <p className="text-xs text-gray-400 mt-1 truncate italic">"{r.description}"</p>}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {fini ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                  ) : (
                                    <button onClick={(e) => { e.stopPropagation(); marquerTermine(r); }} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-300 hover:text-green-500 transition-all" title="Marquer terminé">
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); ouvrirEdition(r); }} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-300 hover:text-indigo-500 transition-all" title="Modifier">
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); confirmerSuppression(r); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all" title="Supprimer">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── SIDEBAR (1/4) ── */}
          <div className="xl:col-span-1 space-y-4">

            {/* Stats du mois */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Ce mois-ci</p>
              <div className="space-y-3">
                {[
                  { label: 'Total', value: rappelsDuMois.length, color: 'bg-indigo-500' },
                  { label: 'En attente', value: rappelsDuMois.filter(r => !estTermine(r.statut)).length, color: 'bg-amber-400' },
                  { label: 'Terminés', value: rappelsDuMois.filter(r => estTermine(r.statut)).length, color: 'bg-green-400' },
                  { label: 'Urgents', value: rappelsDuMois.filter(r => !estTermine(r.statut) && ['elevee','élevée','haute'].includes(r.priorite?.toLowerCase())).length, color: 'bg-red-500' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="text-xs text-gray-600">{s.label}</span>
                    </div>
                    <span className="text-sm font-black text-gray-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Événement sélectionné — detail panel */}
            {rappelSelectionne && (
              <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg p-5 space-y-4 animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Détail</p>
                  <button onClick={() => setRappelSelectionne(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-4 h-4" /></button>
                </div>
                <h4 className="font-bold text-gray-900 text-sm leading-snug">{rappelSelectionne.titre}</h4>
                <div className="flex gap-1.5 flex-wrap">
                  {(() => {
                    const cfg = getPrioriteConfig(rappelSelectionne.priorite);
                    return <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${cfg.badge}`}>{cfg.label}</span>;
                  })()}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${estTermine(rappelSelectionne.statut) ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                    {estTermine(rappelSelectionne.statut) ? 'Terminé' : 'En cours'}
                  </span>
                </div>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" /><span>{formaterDate(rappelSelectionne.dateLimite)}</span></div>
                  <div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span>{nomClient(rappelSelectionne.clientID)}</span></div>
                  {rappelSelectionne.projetID && (
                    <div className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span className="text-indigo-600 font-bold">{nomProjet(rappelSelectionne.projetID)}</span></div>
                  )}
                </div>
                {rappelSelectionne.description && (
                  <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg p-3 leading-relaxed">"{rappelSelectionne.description}"</p>
                )}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {!estTermine(rappelSelectionne.statut) && (
                    <button onClick={() => marquerTermine(rappelSelectionne)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />Marquer terminé
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => ouvrirEdition(rappelSelectionne)} className="py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition-all flex items-center justify-center gap-1">
                      <Pencil className="w-3 h-3" />Modifier
                    </button>
                    <button onClick={() => confirmerSuppression(rappelSelectionne)} className="py-2 border border-red-100 hover:bg-red-50 rounded-xl text-xs font-bold text-red-500 transition-all flex items-center justify-center gap-1">
                      <Trash2 className="w-3 h-3" />Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Prochains événements du mois */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Bell className="w-3 h-3" />Prochains événements
              </p>
              {rappelsDuMois.filter(r => !estTermine(r.statut)).length === 0 ? (
                <p className="text-xs text-gray-300 italic text-center py-4">Aucun événement ce mois</p>
              ) : (
                <div className="space-y-1">
                  {rappelsDuMois.filter(r => !estTermine(r.statut)).slice(0, 8).map(r => {
                    const p = r.priorite?.toLowerCase();
                    const barColor = ['elevee','élevée','haute'].includes(p) ? 'bg-red-400' : p === 'moyenne' ? 'bg-amber-400' : 'bg-blue-400';
                    const d = r.dateLimite ? parseISO(r.dateLimite) : null;
                    return (
                      <button
                        key={r.id}
                        onClick={() => { if (d) setSelectedDate(d); setRappelSelectionne(r); }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-all text-left group"
                      >
                        <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${barColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 truncate">{r.titre}</p>
                          <p className="text-[10px] text-gray-400">{d ? format(d, 'd MMM', { locale: fr }) : '—'} · {nomClient(r.clientID)}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick add */}
            <button
              onClick={() => ouvrirCreation(selectedDate || undefined)}
              className="w-full py-4 bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl flex items-center justify-center gap-3 transition-all group hover:scale-[1.02]"
            >
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-black text-indigo-600">
                {selectedDate ? `Ajouter le ${format(selectedDate, 'd MMM', { locale: fr })}` : 'Nouveau rappel'}
              </span>
            </button>
          </div>
        </div>
      )}
      <Modal 
        isOpen={modalOuvert} 
        onClose={() => setModalOuvert(false)} 
        title={enEdition ? 'Édition de tâche' : 'Nouvelle tâche planifiée'}
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); soumettre(); }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Projet Lier</label>
              <select
                className="w-full border border-gray-100 rounded-xl p-3 bg-gray-50 text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                value={formulaire.projetID || 0}
                onChange={(e) => {
                  const pid = Number(e.target.value) || undefined;
                  const proj: any = pid ? projects.find((p: any) => Number(p.id) === pid) : undefined;
                  setFormulaire((prev) => ({
                    ...prev,
                    projetID: pid,
                    clientID: pid && proj?.clientId ? Number(proj.clientId) : prev.clientID,
                  }));
                }}
              >
                <option value={0}>Indépendant</option>
                {projects.map((p: any) => <option key={p.id} value={Number(p.id)}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Client Cible *</label>
              <select
                className="w-full border border-gray-100 rounded-xl p-3 bg-gray-50 text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                value={formulaire.clientID || 0}
                onChange={(e) => setFormulaire({ ...formulaire, clientID: Number(e.target.value) })}
                required
              >
                <option value={0}>Sélectionner</option>
                {clients.map((c) => <option key={c.id} value={Number(c.id)}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Objet du rappel *</label>
            <input 
              type="text" 
              placeholder="Ex: Appeler pour la signature..."
              className="w-full border border-gray-100 rounded-xl p-3 bg-gray-50 text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
              value={formulaire.titre || ''} 
              onChange={(e) => setFormulaire({ ...formulaire, titre: e.target.value })} 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Échéance</label>
              <input type="datetime-local" className="w-full border border-gray-100 rounded-xl p-3 bg-gray-50 text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all" value={formulaire.dateLimite || ''} onChange={(e) => setFormulaire({ ...formulaire, dateLimite: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Priorité</label>
              <select className="w-full border border-gray-100 rounded-xl p-3 bg-gray-50 text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all" value={formulaire.priorite || 'moyenne'} onChange={(e) => setFormulaire({ ...formulaire, priorite: e.target.value })}>
                <option value="elevee">🔴 Haute / Urgent</option>
                <option value="moyenne">🟠 Moyenne</option>
                <option value="basse">🔵 Basse</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setModalOuvert(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-gray-600 transition-all">
              Annuler
            </button>
            <button type="submit" className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
              {enEdition ? 'Sauvegarder les modifications' : 'Programmer le rappel'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
