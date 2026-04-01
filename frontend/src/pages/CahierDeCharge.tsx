import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Trash2, Search, Pencil, Share2, Eye, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../components/ui/Modal';
import { CahierForm } from '../components/cahier/CahierForm';
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
  userStories: '',
  reglesMetier: '',
  documentsReference: '',
};

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

  const exporter = async (cahier: UICahier) => {
    try {
      toast.loading('Génération du PDF...', { id: 'pdf-export' });
      await cahierAPI.exportPDF(cahier.cahierID);
      toast.success('Cahier exporté en PDF', { id: 'pdf-export' });
    } catch (error) {
      toast.error('Erreur lors de lâ€™export PDF', { id: 'pdf-export' });
    }
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

  const couleurBarre = (id: number) => {
    const couleurs = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-pink-500'];
    return couleurs[id % couleurs.length];
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
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
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-sm">{cahier.objet || nomProjet(cahier.projetID)}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{nomProjet(cahier.projetID)}</p>
                </div>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 whitespace-nowrap">
                  v{cahier.version}
                </span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-1">
                <div className={`h-1 rounded-full ${couleurBarre(cahier.cahierID)}`} style={{ width: `${Math.min(100, 40 + (cahier.cahierID % 6) * 10)}%` }} />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setCahierSelectionne(cahier); setModalVoirOuvert(true); }}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Voir"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => ouvrirModification(cahier)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirmerSuppression(cahier)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => exporter(cahier)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  title="Exporter PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalCreerOuvert} onClose={() => setModalCreerOuvert(false)} title="Nouveau Cahier de Charge" size="xl">
        <CahierForm
          valeurs={brouillon}
          setValeurs={setBrouillon}
          projets={projets}
          onSoumettre={() => mutationCreer.mutate(brouillon as any)}
          onAnnuler={() => setModalCreerOuvert(false)}
          chargement={mutationCreer.isPending}
          btnLabel="Créer le document"
        />
      </Modal>

      <Modal isOpen={modalModifierOuvert} onClose={() => setModalModifierOuvert(false)} title={`Modifier — ${cahierSelectionne?.objet}`} size="xl">
        <CahierForm
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

      {cahierSelectionne && (
        <Modal isOpen={modalVoirOuvert} onClose={() => setModalVoirOuvert(false)} title={`Cahier — ${cahierSelectionne.objet}`} size="xl">
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{cahierSelectionne.objet}</h2>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <FileText className="w-4 h-4" />
                  {nomProjet(cahierSelectionne.projetID)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Version {cahierSelectionne.version}
                </span>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Document Officiel</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div><p className="text-gray-400 text-xs mb-1 uppercase font-semibold">Créé le</p><p className="font-medium text-gray-800">{cahierSelectionne.dateCreation || '-'}</p></div>
              <div><p className="text-gray-400 text-xs mb-1 uppercase font-semibold">Validé le</p><p className="font-medium text-gray-800">{cahierSelectionne.dateValidation || '-'}</p></div>
              <div><p className="text-gray-400 text-xs mb-1 uppercase font-semibold">Délais</p><p className="font-medium text-gray-800">{cahierSelectionne.delais || '-'}</p></div>
              <div><p className="text-gray-400 text-xs mb-1 uppercase font-semibold">Budget</p><p className="font-medium text-gray-800">{cahierSelectionne.budgetTexte || '-'}</p></div>
            </div>

            <div className="space-y-8">
              {[
                { champ: 'description', label: 'Description' },
                { champ: 'objectif', label: 'Objectif' },
                { champ: 'perimetre', label: 'Périmètre' },
                { champ: 'fonctionnalites', label: 'Fonctionnalités' },
                { champ: 'contraintes', label: 'Contraintes' },
                { champ: 'userStories', label: 'User Stories' },
                { champ: 'reglesMetier', label: 'Règles Métier' },
                { champ: 'documentsReference', label: 'Documents de Référence' },
              ].map(({ champ, label }) => {
                const content = (cahierSelectionne as any)[champ];
                if (!content || content === '<p><br></p>') return null;
                return (
                  <div key={champ} className="group">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-1 bg-indigo-500 rounded-full"></div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{label}</h3>
                    </div>
                    <div 
                      className="text-sm text-gray-700 bg-white border border-gray-100 rounded-xl p-5 shadow-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
            <button
              onClick={() => exporter(cahierSelectionne)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Exporter PDF
            </button>
            <button
              onClick={() => { setModalVoirOuvert(false); ouvrirModification(cahierSelectionne); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600 hover:bg-indigo-100 transition-all active:scale-95"
            >
              <Pencil className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={() => setModalVoirOuvert(false)}
              className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all active:scale-95"
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
