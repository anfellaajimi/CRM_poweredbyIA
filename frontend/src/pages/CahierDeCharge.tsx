import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Trash2, Search, Pencil, Share2, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../components/ui/Modal';
import { cahierAPI, projectsAPI, UICahier } from '../services/api';

const cahierVide: Partial<UICahier> = {
  projetID: 0,
  objet: '',
  description: '',
  version: '1.0',
  objectif: '',
  perimetre: '',
  fonctionnalites: '',
  contraintes: '',
  delais: '',
  budgetTexte: '',
  fileUrl: '',
  dateValidation: '',
};

// Formulaire réutilisable
const FormulaireCahier = ({
  valeurs,
  setValeurs,
  projets,
  onSoumettre,
  onAnnuler,
  chargement,
  btnLabel,
}: {
  valeurs: Partial<UICahier>;
  setValeurs: (v: Partial<UICahier>) => void;
  projets: any[];
  onSoumettre: () => void;
  onAnnuler: () => void;
  chargement: boolean;
  btnLabel: string;
}) => (
  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSoumettre(); }}>
    <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Projet *</label>
        <select
          className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={valeurs.projetID || 0}
          onChange={(e) => setValeurs({ ...valeurs, projetID: Number(e.target.value) })}
          required
        >
          <option value={0}>Sélectionner un projet</option>
          {projets.map((p) => <option key={p.id} value={Number(p.id)}>{p.name}</option>)}
        </select>
      </div>

      {[
        { champ: 'objet', label: 'Objet *', requis: true },
        { champ: 'version', label: 'Version', requis: false },
        { champ: 'description', label: 'Description', requis: false },
        { champ: 'objectif', label: 'Objectif', requis: false },
        { champ: 'perimetre', label: 'Périmètre', requis: false },
        { champ: 'fonctionnalites', label: 'Fonctionnalités', requis: false },
        { champ: 'contraintes', label: 'Contraintes', requis: false },
        { champ: 'delais', label: 'Délais', requis: false },
        { champ: 'budgetTexte', label: 'Budget', requis: false },
        { champ: 'fileUrl', label: 'URL du fichier', requis: false },
      ].map(({ champ, label, requis }) => (
        <div key={champ}>
          <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
          {['description', 'objectif', 'perimetre', 'fonctionnalites', 'contraintes'].includes(champ) ? (
            <textarea
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              rows={2}
              value={(valeurs as any)[champ] || ''}
              onChange={(e) => setValeurs({ ...valeurs, [champ]: e.target.value })}
              required={requis}
            />
          ) : (
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={(valeurs as any)[champ] || ''}
              onChange={(e) => setValeurs({ ...valeurs, [champ]: e.target.value })}
              required={requis}
            />
          )}
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Date de validation</label>
        <input
          type="date"
          className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={valeurs.dateValidation || ''}
          onChange={(e) => setValeurs({ ...valeurs, dateValidation: e.target.value })}
        />
      </div>
    </div>

    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
      <button type="button" onClick={onAnnuler} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        Annuler
      </button>
      <button type="submit" disabled={chargement} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
        {chargement ? 'Enregistrement...' : btnLabel}
      </button>
    </div>
  </form>
);

export const CahierDeCharge: React.FC = () => {
  const qc = useQueryClient();
  const [modalCreerOuvert, setModalCreerOuvert] = useState(false);
  const [modalModifierOuvert, setModalModifierOuvert] = useState(false);
  const [modalVoirOuvert, setModalVoirOuvert] = useState(false);
  const [cahierSelectionne, setCahierSelectionne] = useState<UICahier | null>(null);
  const [brouillon, setBrouillon] = useState<Partial<UICahier>>(cahierVide);
  const [brouillonModif, setBrouillonModif] = useState<Partial<UICahier>>(cahierVide);
  const [recherche, setRecherche] = useState('');

  const { data: cahiers = [] } = useQuery({ queryKey: ['cahiers'], queryFn: cahierAPI.getAll });
  const { data: projets = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsAPI.getAll });

  const nomProjet = (projetId: number) =>
    projets.find((p) => Number(p.id) === projetId)?.name || `Projet ${projetId}`;

  const mutationCreer = useMutation({
    mutationFn: cahierAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cahiers'] });
      toast.success('Cahier créé avec succès');
      setModalCreerOuvert(false);
      setBrouillon(cahierVide);
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationModifier = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<UICahier> }) =>
      cahierAPI.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cahiers'] });
      toast.success('Cahier modifié avec succès');
      setModalModifierOuvert(false);
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationSupprimer = useMutation({
    mutationFn: (id: number) => cahierAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cahiers'] });
      toast.success('Cahier supprimé');
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const confirmerSuppression = (cahier: UICahier) => {
    if (window.confirm(`Supprimer le cahier "${cahier.objet}" ?`)) {
      mutationSupprimer.mutate(cahier.cahierID);
    }
  };

  const ouvrirModification = (cahier: UICahier) => {
    setCahierSelectionne(cahier);
    setBrouillonModif({ ...cahier });
    setModalModifierOuvert(true);
  };

  const exporter = (cahier: UICahier) => {
    const contenu = [
      `CAHIER DE CHARGE — ${cahier.cahierID}`,
      `Projet: ${nomProjet(cahier.projetID)}`,
      `Objet: ${cahier.objet}`,
      `Version: ${cahier.version}`,
      cahier.description ? `\nDescription:\n${cahier.description}` : '',
      cahier.objectif ? `\nObjectif:\n${cahier.objectif}` : '',
      cahier.perimetre ? `\nPérimètre:\n${cahier.perimetre}` : '',
      cahier.fonctionnalites ? `\nFonctionnalités:\n${cahier.fonctionnalites}` : '',
      cahier.contraintes ? `\nContraintes:\n${cahier.contraintes}` : '',
      cahier.delais ? `\nDélais: ${cahier.delais}` : '',
      cahier.budgetTexte ? `\nBudget: ${cahier.budgetTexte}` : '',
    ].filter(Boolean).join('\n');
    const blob = new Blob([contenu], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cahier_${cahier.cahierID}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Cahier exporté');
  };

  const partager = (cahier: UICahier) => {
    const texte = `Cahier de charge: ${cahier.objet} (v${cahier.version}) - Projet: ${nomProjet(cahier.projetID)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texte);
      toast.success('Lien copié dans le presse-papier');
    }
  };

  const cahiersFiltres = useMemo(() => {
    if (!recherche) return cahiers;
    return cahiers.filter((c) =>
      c.objet?.toLowerCase().includes(recherche.toLowerCase()) ||
      nomProjet(c.projetID)?.toLowerCase().includes(recherche.toLowerCase())
    );
  }, [cahiers, recherche, projets]);

  // Couleur de progression aléatoire par ID
  const couleurBarre = (id: number) => {
    const couleurs = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-pink-500'];
    return couleurs[id % couleurs.length];
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Cahier de Charge</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion globale des cahiers par projet</p>
        </div>
        <button
          onClick={() => setModalCreerOuvert(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau Document
        </button>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Rechercher une spécification..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <p className="text-xs text-gray-400 ml-auto">{cahiersFiltres.length} document(s)</p>
      </div>

      {/* Grille de cartes */}
      {cahiersFiltres.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center text-gray-400">
          Aucun cahier trouvé. Créez votre premier document.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cahiersFiltres.map((cahier) => (
            <div
              key={cahier.cahierID}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              {/* Header carte */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-sm">{cahier.objet || nomProjet(cahier.projetID)}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{nomProjet(cahier.projetID)}</p>
                </div>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 whitespace-nowrap">
                  v{cahier.version}
                </span>
              </div>

              {/* Description courte */}
              {cahier.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{cahier.description}</p>
              )}

              {/* Barre de progression décorative */}
              <div className="w-full bg-gray-100 rounded-full h-1">
                <div className={`h-1 rounded-full ${couleurBarre(cahier.cahierID)}`} style={{ width: `${Math.min(100, 40 + (cahier.cahierID % 6) * 10)}%` }} />
              </div>

              {/* Date */}
              {cahier.dateCreation && (
                <p className="text-xs text-gray-400">Modifié le {cahier.dateCreation}</p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                <div className="flex items-center gap-1">
                  {/* Voir */}
                  <button
                    onClick={() => { setCahierSelectionne(cahier); setModalVoirOuvert(true); }}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Voir"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {/* Modifier */}
                  <button
                    onClick={() => ouvrirModification(cahier)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {/* Partager */}
                  <button
                    onClick={() => partager(cahier)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    title="Copier le résumé"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {/* Supprimer */}
                  <button
                    onClick={() => confirmerSuppression(cahier)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {/* Exporter */}
                <button
                  onClick={() => exporter(cahier)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  title="Exporter"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Créer */}
      <Modal isOpen={modalCreerOuvert} onClose={() => setModalCreerOuvert(false)} title="Nouveau Cahier de Charge" size="xl">
        <FormulaireCahier
          valeurs={brouillon}
          setValeurs={setBrouillon}
          projets={projets}
          onSoumettre={() => mutationCreer.mutate(brouillon as any)}
          onAnnuler={() => setModalCreerOuvert(false)}
          chargement={mutationCreer.isPending}
          btnLabel="Créer le document"
        />
      </Modal>

      {/* Modal Modifier */}
      <Modal isOpen={modalModifierOuvert} onClose={() => setModalModifierOuvert(false)} title={`Modifier — ${cahierSelectionne?.objet}`} size="xl">
        <FormulaireCahier
          valeurs={brouillonModif}
          setValeurs={setBrouillonModif}
          projets={projets}
          onSoumettre={() => {
            if (!cahierSelectionne) return;
            mutationModifier.mutate({ id: cahierSelectionne.cahierID, payload: brouillonModif });
          }}
          onAnnuler={() => setModalModifierOuvert(false)}
          chargement={mutationModifier.isPending}
          btnLabel="Enregistrer les modifications"
        />
      </Modal>

      {/* Modal Voir */}
      {cahierSelectionne && (
        <Modal isOpen={modalVoirOuvert} onClose={() => setModalVoirOuvert(false)} title={`Cahier — ${cahierSelectionne.objet}`} size="lg">
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{cahierSelectionne.objet}</h2>
                <p className="text-sm text-gray-500">{nomProjet(cahierSelectionne.projetID)}</p>
              </div>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                v{cahierSelectionne.version}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 text-sm">
              {cahierSelectionne.dateCreation && (
                <div><p className="text-gray-400 text-xs mb-0.5">Créé le</p><p className="font-medium text-gray-800">{cahierSelectionne.dateCreation}</p></div>
              )}
              {cahierSelectionne.dateValidation && (
                <div><p className="text-gray-400 text-xs mb-0.5">Validé le</p><p className="font-medium text-gray-800">{cahierSelectionne.dateValidation}</p></div>
              )}
              {cahierSelectionne.delais && (
                <div><p className="text-gray-400 text-xs mb-0.5">Délais</p><p className="font-medium text-gray-800">{cahierSelectionne.delais}</p></div>
              )}
              {cahierSelectionne.budgetTexte && (
                <div><p className="text-gray-400 text-xs mb-0.5">Budget</p><p className="font-medium text-gray-800">{cahierSelectionne.budgetTexte}</p></div>
              )}
            </div>

            {[
              { champ: 'description', label: 'Description' },
              { champ: 'objectif', label: 'Objectif' },
              { champ: 'perimetre', label: 'Périmètre' },
              { champ: 'fonctionnalites', label: 'Fonctionnalités' },
              { champ: 'contraintes', label: 'Contraintes' },
            ].map(({ champ, label }) =>
              (cahierSelectionne as any)[champ] ? (
                <div key={champ}>
                  <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
                    {(cahierSelectionne as any)[champ]}
                  </p>
                </div>
              ) : null
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
            <button
              onClick={() => exporter(cahierSelectionne)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <button
              onClick={() => { setModalVoirOuvert(false); ouvrirModification(cahierSelectionne); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={() => setModalVoirOuvert(false)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};