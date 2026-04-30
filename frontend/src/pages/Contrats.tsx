import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Eye, FileText, Plus, Trash2, Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, Pencil, Download } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../components/ui/Modal';
import { SignaturePad } from '../components/SignaturePad';
import { ContratPrint } from '../components/ContratPrint';
import { clientsAPI, contratsAPI, UIContrat } from '../services/api';
import { cn } from '../utils/cn';

const contratVide: Partial<UIContrat> = {
  clientId: '',
  titre: '',
  type: 'Contrat de services',
  dateDebut: '',
  dateFin: '',
  value: 0,
  objet: '',
  obligations: '',
  responsabilites: '',
  conditions: '',
  status: 'actif',
  dateRenouvellement: '',
  needsRenewal: false,
};

const obtenirLibelleStatut = (statut: string) =>
({
  actif: 'Actif',
  expiring: 'Expirant',
  expirant: 'Expirant',
  expired: 'Expiré',
  expiré: 'Expiré',
  termine: 'Terminé',
  terminé: 'Terminé',
  en_attente: 'En attente',
}[statut?.toLowerCase()] ?? statut);

const obtenirCouleurStatut = (statut: string) => {
  const s = statut?.toLowerCase();
  if (s === 'actif') return 'bg-green-100 text-green-700 border-green-200';
  if (s === 'expiring' || s === 'expirant') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (s === 'expired' || s === 'expiré') return 'bg-red-100 text-red-600 border-red-200';
  if (s === 'termine' || s === 'terminé') return 'bg-gray-200 text-gray-600 border-gray-300';
  return 'bg-blue-100 text-blue-600 border-blue-200';
};

// Menu statut cliquable
const MenuStatut = ({
  contrat,
  onChanger,
  chargement,
}: {
  contrat: UIContrat;
  onChanger: (id: number, statut: string, contrat: UIContrat) => void;
  chargement: boolean;
}) => {
  const [ouvert, setOuvert] = useState(false);
  const statuts = [
    { valeur: 'expiré', label: 'Expiré', couleur: 'text-red-600 hover:bg-red-50' },
    { valeur: 'terminé', label: 'Terminé', couleur: 'text-gray-600 hover:bg-gray-50' },
    { valeur: 'en_attente', label: 'En attente', couleur: 'text-blue-600 hover:bg-blue-50' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOuvert(!ouvert)}
        disabled={chargement}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${obtenirCouleurStatut(contrat.status)} disabled:opacity-50`}
      >
        {obtenirLibelleStatut(contrat.status)}
        {ouvert ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {ouvert && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOuvert(false)} />
          <div className="absolute z-20 mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[130px]">
            {statuts.map((s) => (
              <button
                key={s.valeur}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${s.couleur}`}
                onClick={() => { onChanger(contrat.numericId, s.valeur, contrat); setOuvert(false); }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Formulaire réutilisable création/modification
const FormulaireContrat = ({
  valeurs,
  setValeurs,
  clients,
  onSoumettre,
  onAnnuler,
  chargement,
  titre,
}: {
  valeurs: Partial<UIContrat>;
  setValeurs: (v: Partial<UIContrat>) => void;
  clients: any[];
  onSoumettre: () => void;
  onAnnuler: () => void;
  chargement: boolean;
  titre: string;
}) => (
  <form
    className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
    onSubmit={(e) => { e.preventDefault(); onSoumettre(); }}
  >
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700">Client *</label>
      <select
        className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        value={valeurs.clientId || ''}
        onChange={(e) => setValeurs({ ...valeurs, clientId: e.target.value, clientName: clients.find((c) => c.id === e.target.value)?.name })}
        required
      >
        <option value="">Sélectionner un client</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.formattedId} - {c.name}</option>)}
      </select>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Titre du contrat *</label>
        <input
          type="text"
          className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={valeurs.titre || ''}
          onChange={(e) => setValeurs({ ...valeurs, titre: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Type de contrat</label>
        <select
          className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={valeurs.type || ''}
          onChange={(e) => setValeurs({ ...valeurs, type: e.target.value })}
        >
          <option value="Contrat de services">Contrat de services</option>
          <option value="Contrat de projet">Contrat de projet</option>
          <option value="Contrat de maintenance">Contrat de maintenance</option>
          <option value="Contrat-cadre">Contrat-cadre</option>
          <option value="Contrat de licence">Contrat de licence</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Date de début *</label>
        <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={valeurs.dateDebut || ''} onChange={(e) => setValeurs({ ...valeurs, dateDebut: e.target.value })} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Date de fin *</label>
        <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={valeurs.dateFin || ''} onChange={(e) => setValeurs({ ...valeurs, dateFin: e.target.value })} required />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Valeur contractuelle ({valeurs.clientId ? (clients.find(c => c.id === valeurs.clientId)?.devise === 'EUR' ? '€' : clients.find(c => c.id === valeurs.clientId)?.devise === 'USD' ? '$' : 'DT') : 'DT/€/$'}) *</label>
        <input type="number" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={valeurs.value || 0} onChange={(e) => setValeurs({ ...valeurs, value: Number(e.target.value) })} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Date de renouvellement</label>
        <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={valeurs.dateRenouvellement || ''} onChange={(e) => setValeurs({ ...valeurs, dateRenouvellement: e.target.value })} />
      </div>
    </div>

    {[
      { champ: 'objet', label: 'Objet' },
      { champ: 'obligations', label: 'Obligations' },
      { champ: 'responsabilites', label: 'Responsabilités' },
      { champ: 'conditions', label: 'Conditions' },
    ].map(({ champ, label }) => (
      <div key={champ}>
        <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          rows={2}
          value={(valeurs as any)[champ] || ''}
          onChange={(e) => setValeurs({ ...valeurs, [champ]: e.target.value })}
        />
      </div>
    ))}

    <div className="sticky bottom-0 bg-white pt-4 pb-1 border-t border-gray-100 flex justify-end gap-3">
      <button type="button" onClick={onAnnuler} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        Annuler
      </button>
      <button type="submit" disabled={chargement} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
        {chargement ? 'Enregistrement...' : titre}
      </button>
    </div>
  </form>
);

export const Contrats: React.FC = () => {
  const qc = useQueryClient();
  const [modalCreerOuvert, setModalCreerOuvert] = useState(false);
  const [modalModifierOuvert, setModalModifierOuvert] = useState(false);
  const [modalVoirOuvert, setModalVoirOuvert] = useState(false);
  const [contratSelectionne, setContratSelectionne] = useState<UIContrat | null>(null);
  const [nouveauContrat, setNouveauContrat] = useState<Partial<UIContrat>>(contratVide);
  const [contratModifie, setContratModifie] = useState<Partial<UIContrat>>(contratVide);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [page, setPage] = useState(1);
  const [signatureOuverte, setSignatureOuverte] = useState<'client' | 'provider' | null>(null);
  const parPage = 10;

  // Delete confirmation state
  const [confirmSuppressionOuvert, setConfirmSuppressionOuvert] = useState(false);
  const [contratASupprimer, setContratASupprimer] = useState<UIContrat | null>(null);

  const { data: contrats = [] } = useQuery({ queryKey: ['contrats'], queryFn: contratsAPI.getAll });

  const contratSelectionneDetail = useMemo(() => {
    if (!contratSelectionne) return null;
    // Find the latest version from the query data
    return contrats.find(c => c.numericId === contratSelectionne.numericId) || contratSelectionne;
  }, [contratSelectionne, contrats]);
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsAPI.getAll() });

  const mutationCreer = useMutation({
    mutationFn: contratsAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contrats'] });
      toast.success('Contrat créé avec succès');
      setModalCreerOuvert(false);
      setNouveauContrat(contratVide);
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationModifier = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UIContrat> }) =>
      contratsAPI.update(String(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contrats'] });
      toast.success('Contrat modifié avec succès');
      setModalModifierOuvert(false);
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationChangerStatut = useMutation({
    mutationFn: ({ id, statut, contrat }: { id: number; statut: string; contrat: UIContrat }) =>
      contratsAPI.update(String(id), { ...contrat, status: statut }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contrats'] });
      toast.success('Statut mis à jour');
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationSupprimer = useMutation({
    mutationFn: (id: number) => contratsAPI.delete(String(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contrats'] });
      toast.success('Contrat supprimé avec succès');
      setConfirmSuppressionOuvert(false);
      setContratASupprimer(null);
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const changerStatut = (id: number, statut: string, contrat: UIContrat) => {
    mutationChangerStatut.mutate({ id, statut, contrat });
  };

  const ouvrirModification = (contrat: UIContrat) => {
    setContratSelectionne(contrat);
    setContratModifie({ ...contrat });
    setModalModifierOuvert(true);
  };

  const confirmerSuppression = (contrat: UIContrat) => {
    setContratASupprimer(contrat);
    setConfirmSuppressionOuvert(true);
  };

  const telecharger = (contrat: UIContrat, viewOnly = false) => {
    contratsAPI.exportPDF(contrat.numericId, `${contrat.id}.pdf`, viewOnly);
  };

  const expirantCount = useMemo(
    () => contrats.filter((c) => c.needsRenewal || ['expiring', 'expirant'].includes(c.status?.toLowerCase())).length,
    [contrats]
  );

  const stats = useMemo(() => {
    const actifs = contrats.filter((c) => c.status?.toLowerCase() === 'actif').length;
    const valeurTotale = contrats.reduce((s, c) => s + (c.value ?? 0), 0);
    const expirantBientot = contrats.filter((c) => ['expiring', 'expirant'].includes(c.status?.toLowerCase())).length;
    return { actifs, valeurTotale, expirantBientot };
  }, [contrats]);

  const contratsFiltres = useMemo(() => {
    return contrats.filter((c) => {
      const correspondRecherche =
        !recherche ||
        c.id?.toLowerCase().includes(recherche.toLowerCase()) ||
        c.clientName?.toLowerCase().includes(recherche.toLowerCase()) ||
        c.titre?.toLowerCase().includes(recherche.toLowerCase());
      const correspondStatut = filtreStatut === 'Tous' || obtenirLibelleStatut(c.status) === filtreStatut;
      return correspondRecherche && correspondStatut;
    });
  }, [contrats, recherche, filtreStatut]);

  const totalPages = Math.max(1, Math.ceil(contratsFiltres.length / parPage));
  const contratsPage = contratsFiltres.slice((page - 1) * parPage, page * parPage);

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contrats</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion backend des contrats</p>
        </div>
        <button
          onClick={() => setModalCreerOuvert(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Créer un Contrat
        </button>
      </div>


      {/* Carte statistique */}
      <div className="flex">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 min-w-[200px]">
          <p className="text-sm text-gray-500 font-medium mb-1">Valeur Totale</p>
          <p className="text-3xl font-bold text-gray-900">{stats.valeurTotale.toLocaleString('fr-FR')}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Rechercher..."
              value={recherche}
              onChange={(e) => { setRecherche(e.target.value); setPage(1); }}
            />
          </div>
          <div className="relative">
            <select
              className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              value={filtreStatut}
              onChange={(e) => { setFiltreStatut(e.target.value); setPage(1); }}
            >
              <option value="Tous">Tous les statuts</option>
              <option value="Expiré">Expiré</option>
              <option value="Terminé">Terminé</option>
              <option value="En attente">En attente</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p className="ml-auto text-xs text-gray-400">Total : {contratsFiltres.length} contrat(s)</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-48">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 font-medium border-b border-gray-100">
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Période</th>
                <th className="px-4 py-3">Valeur</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contratsPage.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Aucun contrat trouvé</td></tr>
              )}
              {contratsPage.map((contrat) => (
                <tr key={contrat.numericId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{contrat.id}</td>
                  <td className="px-4 py-3 text-gray-700">{contrat.clientName}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{contrat.titre}</td>
                  <td className="px-4 py-3 text-gray-600">{contrat.type}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {contrat.dateDebut} – {contrat.dateFin}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
                    {Number(contrat.value).toLocaleString('fr-FR')} {contrat.devise === 'EUR' ? '€' : contrat.devise === 'USD' ? '$' : 'DT'}
                  </td>
                  <td className="px-4 py-3">
                    <MenuStatut contrat={contrat} onChanger={changerStatut} chargement={mutationChangerStatut.isPending} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Visualiser */}
                      <button
                        onClick={() => { setContratSelectionne(contrat); setModalVoirOuvert(true); }}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-colors"
                        title="Visualiser"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => telecharger(contrat)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Télécharger PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {/* Modifier */}
                      <button
                        onClick={() => ouvrirModification(contrat)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {/* Supprimer */}
                      <button
                        onClick={() => confirmerSuppression(contrat)}
                        disabled={mutationSupprimer.isPending}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 p-4">
            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronsLeft className="w-4 h-4 text-gray-500" /></button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
            <span className="px-3 py-1 rounded bg-indigo-600 text-white text-sm font-medium min-w-[32px] text-center">{page}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronsRight className="w-4 h-4 text-gray-500" /></button>
          </div>
        )}
      </div>

      {/* Modal Créer */}
      <Modal isOpen={modalCreerOuvert} onClose={() => setModalCreerOuvert(false)} title="Créer un nouveau contrat" size="xl">
        <FormulaireContrat
          valeurs={nouveauContrat}
          setValeurs={setNouveauContrat}
          clients={clients}
          onSoumettre={() => mutationCreer.mutate(nouveauContrat as any)}
          onAnnuler={() => setModalCreerOuvert(false)}
          chargement={mutationCreer.isPending}
          titre="Créer le contrat"
        />
      </Modal>

      {/* Modal Modifier */}
      <Modal isOpen={modalModifierOuvert} onClose={() => setModalModifierOuvert(false)} title={`Modifier — ${contratSelectionne?.id}`} size="xl">
        <FormulaireContrat
          valeurs={contratModifie}
          setValeurs={setContratModifie}
          clients={clients}
          onSoumettre={() => {
            if (!contratSelectionne) return;
            mutationModifier.mutate({ id: contratSelectionne.numericId, data: contratModifie });
          }}
          onAnnuler={() => setModalModifierOuvert(false)}
          chargement={mutationModifier.isPending}
          titre="Enregistrer les modifications"
        />
      </Modal>

      {/* Modal Voir */}
      {contratSelectionne && (
        <Modal isOpen={modalVoirOuvert} onClose={() => setModalVoirOuvert(false)} title={`Contrat — ${contratSelectionne.id}`} size="lg">
          <div className="bg-white p-8 rounded-lg shadow-inner border border-gray-100 space-y-8 max-h-[70vh] overflow-y-auto">

    {/* Signature Overlay (Global) */}
    {signatureOuverte && contratSelectionneDetail && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-xl">
          <SignaturePad 
            title={signatureOuverte === 'client' ? `Signature du Client — ${contratSelectionneDetail.clientName}` : "Signature du Prestataire — QUETRATECH"}
            onCancel={() => setSignatureOuverte(null)}
            onSave={(data) => {
              mutationModifier.mutate({ 
                id: contratSelectionneDetail.numericId, 
                data: { 
                  ...contratSelectionneDetail,
                  [signatureOuverte === 'client' ? 'isSignedByClient' : 'isSignedByProvider']: true,
                  [signatureOuverte === 'client' ? 'signatureClient' : 'signatureProvider']: data 
                } 
              });
              setSignatureOuverte(null);
            }}
          />
        </div>
      </div>
    )}

            <div className="flex justify-between items-start border-b border-gray-100 pb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{contratSelectionneDetail.titre}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {contratSelectionneDetail.type}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${obtenirCouleurStatut(contratSelectionneDetail.status)}`}>
                    {obtenirLibelleStatut(contratSelectionneDetail.status)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Référence</p>
                <p className="text-lg font-mono font-bold text-indigo-600">{contratSelectionneDetail.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-b border-gray-50">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client</p>
                <p className="font-semibold text-gray-800">{contratSelectionneDetail.clientName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valeur Contractuelle</p>
                <p className="font-bold text-gray-900 text-lg">
                  {Number(contratSelectionneDetail.value).toLocaleString('fr-FR')} 
                  <span className="text-indigo-600 ml-1">{contratSelectionneDetail.devise === 'EUR' ? '€' : contratSelectionneDetail.devise === 'USD' ? '$' : 'DT'}</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Période du Contrat</p>
                <p className="font-semibold text-gray-800">{contratSelectionneDetail.dateDebut || '—'} au {contratSelectionneDetail.dateFin || '—'}</p>
              </div>
              {contratSelectionneDetail.dateRenouvellement && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Renouvellement</p>
                  <p className="font-semibold text-yellow-600">{contratSelectionneDetail.dateRenouvellement}</p>
                </div>
              )}
            </div>

            <div className="space-y-10">
              {[
                { champ: 'objet', label: 'Objet du Contrat' },
                { champ: 'obligations', label: 'Obligations des Parties' },
                { champ: 'responsabilites', label: 'Responsabilités et Assurances' },
                { champ: 'conditions', label: 'Conditions Générales' },
              ].map(({ champ, label }) =>
                (contratSelectionneDetail as any)[champ] ? (
                  <div key={champ} className="group">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                       {label}
                    </h3>
                    <div className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                      {(contratSelectionneDetail as any)[champ]}
                    </div>
                  </div>
                ) : null
              )}
            </div>

            <div className="pt-12 mt-12 border-t-2 border-dashed border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-8 text-center bg-gray-50 py-2 rounded-lg">Signatures et Approbation</h3>
              <div className="grid grid-cols-2 gap-16">
                {/* Client Signature */}
                <div className="space-y-12">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Le Client</p>
                    <p className="text-sm font-bold text-gray-800">{contratSelectionneDetail.clientName}</p>
                  </div>
                  
                  <button 
                    disabled={contratSelectionneDetail.isSignedByClient || mutationModifier.isPending}
                    onClick={() => setSignatureOuverte('client')}
                    className={cn(
                      "h-48 w-full border-2 rounded-2xl flex flex-col items-center justify-center transition-all group/sig relative overflow-hidden cursor-pointer",
                      contratSelectionneDetail.isSignedByClient 
                        ? "border-green-100 bg-green-50/20" 
                        : "border-dashed border-gray-200 bg-gray-50/30 hover:border-indigo-300 hover:bg-indigo-50/50"
                    )}
                  >
                    {contratSelectionneDetail.isSignedByClient && contratSelectionneDetail.signatureClient ? (
                      <div className="p-4 w-full h-full flex flex-col items-center justify-center">
                        <img src={contratSelectionneDetail.signatureClient} alt="Signature Client" className="max-h-24 object-contain mb-2 mix-blend-multiply opacity-90" />
                        <div className="text-center">
                           <p className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Signé électroniquement</p>
                           <p className="text-[9px] text-green-400 font-mono mt-0.5 tracking-tight group-hover/sig:hidden">ID: {contratSelectionneDetail.id}-C</p>
                           <p className="text-[9px] text-green-500 font-bold hidden group-hover/sig:block">✓ Validé le {new Date().toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover/sig:scale-110 transition-transform cursor-pointer border border-indigo-100">
                          <Pencil className="w-6 h-6 text-indigo-400" />
                        </div>
                        <p className="text-xs font-bold text-gray-400 group-hover/sig:text-indigo-600">Signer ici (Client)</p>
                        <p className="text-[9px] text-gray-300 mt-1">Cliquer pour capturer la signature</p>
                      </>
                    )}
                  </button>

                  <div className="border-t border-gray-100 pt-2">
                    <p className="text-[10px] text-gray-400">Mention "Lu et approuvé"</p>
                  </div>
                </div>

                {/* Provider Signature */}
                <div className="space-y-12">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Le Prestataire</p>
                    <p className="text-sm font-bold text-gray-800">QUETRATECH S.A.R.L</p>
                  </div>

                  <button 
                    disabled={contratSelectionneDetail.isSignedByProvider || mutationModifier.isPending}
                    onClick={() => setSignatureOuverte('provider')}
                    className={cn(
                      "h-48 w-full border-2 rounded-2xl flex flex-col items-center justify-center transition-all group/sig relative overflow-hidden cursor-pointer",
                      contratSelectionneDetail.isSignedByProvider 
                        ? "border-indigo-100 bg-indigo-50/20" 
                        : "border-dashed border-gray-200 bg-gray-50/30 hover:border-indigo-300 hover:bg-indigo-50/50"
                    )}
                  >
                    {contratSelectionneDetail.isSignedByProvider && contratSelectionneDetail.signatureProvider ? (
                      <div className="p-4 w-full h-full flex flex-col items-center justify-center relative">
                        {/* Cachet Prestataire */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 transform -rotate-12 z-0">
                          <div className="w-40 h-40 border-4 border-indigo-600/30 rounded-full flex flex-col items-center justify-center p-2 text-center text-indigo-600/60">
                             <span className="text-[11px] font-black uppercase tracking-widest">QUETRATECH</span>
                             <div className="w-8 h-8 bg-indigo-600/40 rotate-45 flex items-center justify-center my-1.5 shadow-sm">
                                <div className="w-3 h-3 bg-white/80"></div>
                             </div>
                             <span className="text-[8px] font-black leading-tight uppercase">
                               MF: 1694357/R<br/>
                               MAHDIA, TUNISIE
                             </span>
                          </div>
                        </div>

                        <img src={contratSelectionneDetail.signatureProvider} alt="Signature Prestataire" className="max-h-24 object-contain mb-2 mix-blend-multiply opacity-90 relative z-10" />
                        <div className="text-center relative z-10">
                           <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">Signé électroniquement</p>
                           <p className="text-[9px] text-indigo-400 font-mono mt-0.5 tracking-tight group-hover/sig:hidden">ID: {contratSelectionneDetail.id}-P</p>
                           <p className="text-[9px] text-indigo-500 font-bold hidden group-hover/sig:block">✓ Validé par la plateforme</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover/sig:scale-110 transition-transform cursor-pointer border border-indigo-100">
                          <Pencil className="w-6 h-6 text-indigo-400" />
                        </div>
                        <p className="text-xs font-bold text-gray-400 group-hover/sig:text-indigo-600">Signer ici (SaaS)</p>
                        <p className="text-[9px] text-gray-300 mt-1">Cliquer pour capturer la signature</p>
                      </>
                    )}
                  </button>

                  <div className="border-t border-gray-100 pt-2">
                    <p className="text-[10px] text-gray-400">Date et Cachet de l'entreprise</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
             <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">
              <Eye className="w-4 h-4" />
              Imprimer / PDF
            </button>
            <button onClick={() => { setModalVoirOuvert(false); ouvrirModification(contratSelectionneDetail); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95">
              <Pencil className="w-4 h-4" />
              Modifier
            </button>
            <button onClick={() => setModalVoirOuvert(false)} className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all active:scale-95">
              Fermer
            </button>
          </div>
        </Modal>
      )}

      {/* Modal confirmation suppression */}
      <Modal isOpen={confirmSuppressionOuvert} onClose={() => { setConfirmSuppressionOuvert(false); setContratASupprimer(null); }} title="Confirmer la suppression" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">Suppression irréversible</p>
              <p className="text-xs text-red-600 mt-0.5">Cette action ne peut pas être annulée.</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Voulez-vous vraiment supprimer le contrat <span className="font-bold text-gray-900">{contratASupprimer?.id}</span> ?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setConfirmSuppressionOuvert(false); setContratASupprimer(null); }}
              className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={() => contratASupprimer && mutationSupprimer.mutate(contratASupprimer.numericId)}
              disabled={mutationSupprimer.isPending}
              className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {mutationSupprimer.isPending ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Rendu masqué pour l'impression */}
      {contratSelectionneDetail && <ContratPrint contrat={contratSelectionneDetail} />}
    </div>
  );
};