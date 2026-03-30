import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, CheckCircle, Pencil, Plus, Trash2, X, Clock, ChevronDown } from 'lucide-react';
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

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientsAPI.getAll });
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
      // Mettre à jour le rappel sélectionné
      if (rappelSelectionne) {
        setRappelSelectionne(null);
      }
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
      toast.success('Rappels générés');
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.detail ?? err?.message}`),
  });

  const marquerTermine = (r: UIRappel) => {
    mutationModifier.mutate({ id: r.id, payload: { ...r, statut: 'termine' } });
    if (rappelSelectionne?.id === r.id) {
      setRappelSelectionne({ ...r, statut: 'termine' });
    }
  };

  const ouvrirCreation = () => {
    setEnEdition(null);
    setFormulaire(rappelVide);
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

  // Groupement par urgence
  const urgents = useMemo(() =>
    rappels.filter((r) => !estTermine(r.statut) && ['elevee', 'élevée', 'haute'].includes(r.priorite?.toLowerCase())),
    [rappels]
  );
  const enAttente = useMemo(() =>
    rappels.filter((r) => !estTermine(r.statut) && !['elevee', 'élevée', 'haute'].includes(r.priorite?.toLowerCase())),
    [rappels]
  );
  const termines = useMemo(() =>
    rappels.filter((r) => estTermine(r.statut)),
    [rappels]
  );

  // Carte rappel
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
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${r.systemKey ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-600 border-gray-200'}`}>
          {r.systemKey ? 'System' : 'Manual'}
        </span>
      </div>
      {r.description && <p className="text-xs text-gray-500 mb-2 line-clamp-1">{r.description}</p>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>{formaterDate(r.dateLimite)}</span>
        </div>
        {estFait && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Terminé
          </span>
        )}
      </div>
    </div>
  );

  // Calendrier
  const mapJours = useMemo(() => {
    const map = new Map<number, number>();
    rappels.forEach((r) => {
      if (!r.dateLimite) return;
      const d = new Date(r.dateLimite);
      const day = d.getDate();
      map.set(day, (map.get(day) || 0) + 1);
    });
    return map;
  }, [rappels]);

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rappels</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérer vos tâches et rappels</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle vue */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
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
            onClick={ouvrirCreation}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un Rappel
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Projet</span>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={filtreProjet || ''}
            onChange={(e) => setFiltreProjet(e.target.value)}
          >
            <option value="">Tous</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Source</span>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={filtreSource}
            onChange={(e) => setFiltreSource(e.target.value as any)}
          >
            <option value="all">Toutes</option>
            <option value="system">System</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => mutationGenerer.mutate()}
          disabled={mutationGenerer.isPending}
          className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {mutationGenerer.isPending ? 'Génération...' : 'Générer rappels'}
        </button>
      </div>

      {vueMode === 'list' ? (
        <div className="flex gap-6">
          {/* Colonne gauche — liste */}
          <div className="flex-1 space-y-5 min-w-0">

            {/* Urgents */}
            {urgents.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Urgent
                  <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">{urgents.length}</span>
                </h2>
                <div className="space-y-2">
                  {urgents.map((r) => <CarteRappel key={r.id} r={r} />)}
                </div>
              </div>
            )}

            {/* En attente */}
            {enAttente.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                  En attente
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">{enAttente.length}</span>
                </h2>
                <div className="space-y-2">
                  {enAttente.map((r) => <CarteRappel key={r.id} r={r} />)}
                </div>
              </div>
            )}

            {/* Terminés */}
            {termines.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Complété
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">{termines.length}</span>
                </h2>
                <div className="space-y-2">
                  {termines.map((r) => <CarteRappel key={r.id} r={r} estFait />)}
                </div>
              </div>
            )}

            {rappels.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400 text-sm">
                Aucun rappel. Créez votre premier rappel.
              </div>
            )}
          </div>

          {/* Panneau détail droite */}
          {rappelSelectionne ? (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4 sticky top-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-900 text-base leading-tight pr-2">{rappelSelectionne.titre}</h3>
                  <button onClick={() => setRappelSelectionne(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${obtenirCouleurPriorite(rappelSelectionne.priorite)}`}>
                    {obtenirLibellePriorite(rappelSelectionne.priorite)}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${estTermine(rappelSelectionne.statut) ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {estTermine(rappelSelectionne.statut) ? 'Terminé' : 'En attente'}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Échéance</p>
                      <p className="font-medium text-gray-800 text-xs">{formaterDate(rappelSelectionne.dateLimite)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Client</p>
                      <p className="font-medium text-gray-800 text-xs">{nomClient(rappelSelectionne.clientID)}</p>
                    </div>
                  </div>

                  {rappelSelectionne.typeRappel && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Type</p>
                      <p className="text-xs text-gray-700">{rappelSelectionne.typeRappel}</p>
                    </div>
                  )}

                  {rappelSelectionne.description && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Description</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{rappelSelectionne.description}</p>
                    </div>
                  )}
                </div>

                {/* Historique simulé */}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Historique & Activité</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      <p className="text-xs text-gray-500">Rappel créé</p>
                    </div>
                    {estTermine(rappelSelectionne.statut) && (
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-gray-500">Marqué comme terminé</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Boutons actions */}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  {!estTermine(rappelSelectionne.statut) && (
                    <button
                      onClick={() => marquerTermine(rappelSelectionne)}
                      disabled={mutationModifier.isPending}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Terminé
                    </button>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => ouvrirEdition(rappelSelectionne)}
                      className="flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Modifier
                    </button>
                    <button
                      onClick={() => ouvrirEdition({ ...rappelSelectionne, dateLimite: '' } as UIRappel)}
                      className="flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      title="Reprogrammer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Reporter
                    </button>
                    <button
                      onClick={() => confirmerSuppression(rappelSelectionne)}
                      className="flex items-center justify-center gap-1 py-2 rounded-lg border border-red-100 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Sup.
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 text-center text-gray-400 text-sm">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                Cliquez sur un rappel pour voir les détails
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Vue Calendrier */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Calendrier des Rappels</h2>
          <div className="grid grid-cols-7 gap-2 max-w-3xl">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((j) => (
              <div key={j} className="text-center text-xs font-semibold text-gray-500 py-2">{j}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i + 1;
              const count = mapJours.get(day) || 0;
              return (
                <div key={i} className={`aspect-square border rounded-lg p-2 text-sm hover:bg-indigo-50 transition-colors ${count > 0 ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100'}`}>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-600">{day}</span>
                    {count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">{count}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal créer/modifier */}
      <Modal isOpen={modalOuvert} onClose={() => setModalOuvert(false)} title={enEdition ? 'Modifier le rappel' : 'Créer un rappel'}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); soumettre(); }}>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Projet (optionnel)</label>
            <select
              className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
              <option value={0}>Aucun</option>
              {projects.map((p: any) => <option key={p.id} value={Number(p.id)}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Client *</label>
            <select
              className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={formulaire.clientID || 0}
              onChange={(e) => setFormulaire({ ...formulaire, clientID: Number(e.target.value) })}
            >
              <option value={0}>Sélectionner un client</option>
              {clients.map((c) => <option key={c.id} value={Number(c.id)}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Titre *</label>
            <input type="text" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={formulaire.titre || ''} onChange={(e) => setFormulaire({ ...formulaire, titre: e.target.value })} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Type de rappel</label>
            <input type="text" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={formulaire.typeRappel || ''} onChange={(e) => setFormulaire({ ...formulaire, typeRappel: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
            <textarea className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" rows={3} value={formulaire.description || ''} onChange={(e) => setFormulaire({ ...formulaire, description: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Date limite</label>
            <input type="datetime-local" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={formulaire.dateLimite || ''} onChange={(e) => setFormulaire({ ...formulaire, dateLimite: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Priorité</label>
              <select className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={formulaire.priorite || 'moyenne'} onChange={(e) => setFormulaire({ ...formulaire, priorite: e.target.value })}>
                <option value="elevee">Urgente</option>
                <option value="moyenne">Moyenne</option>
                <option value="basse">Basse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Statut</label>
              <select className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={formulaire.statut || 'en_attente'} onChange={(e) => setFormulaire({ ...formulaire, statut: e.target.value })}>
                <option value="en_attente">En attente</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOuvert(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={mutationCreer.isPending || mutationModifier.isPending} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {(mutationCreer.isPending || mutationModifier.isPending) ? 'Enregistrement...' : enEdition ? 'Sauvegarder' : 'Créer le rappel'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
