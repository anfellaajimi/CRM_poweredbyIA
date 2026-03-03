import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Eye, FileText, Plus, Trash2, Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../components/ui/Modal';
import { clientsAPI, contratsAPI, UIContrat } from '../services/api';

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
    { valeur: 'actif', label: 'Actif', couleur: 'text-green-600 hover:bg-green-50' },
    { valeur: 'expirant', label: 'Expirant', couleur: 'text-yellow-600 hover:bg-yellow-50' },
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
        {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
  const parPage = 10;

  const { data: contrats = [] } = useQuery({ queryKey: ['contrats'], queryFn: contratsAPI.getAll });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientsAPI.getAll });

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
      toast.success('Contrat supprimé');
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
    if (window.confirm(`Supprimer le contrat ${contrat.id} ?`)) {
      mutationSupprimer.mutate(contrat.numericId);
    }
  };

  const imprimerContrat = (contrat: UIContrat) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${contrat.id}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#111} h1{color:#4f46e5} .row{display:flex;gap:40px;margin:12px 0} .label{color:#666;font-size:13px} .value{font-weight:600}</style>
      </head><body>
      <h1>Contrat — ${contrat.id}</h1>
      <div class="row"><div><div class="label">Client</div><div class="value">${contrat.clientName}</div></div><div><div class="label">Titre</div><div class="value">${contrat.titre}</div></div></div>
      <div class="row"><div><div class="label">Type</div><div class="value">${contrat.type}</div></div><div><div class="label">Valeur</div><div class="value">${Number(contrat.value).toLocaleString('fr-FR')} ${contrat.devise === 'EUR' ? '€' : contrat.devise === 'USD' ? '$' : 'DT'}</div></div></div>
      <div class="row"><div><div class="label">Date début</div><div class="value">${contrat.dateDebut}</div></div><div><div class="label">Date fin</div><div class="value">${contrat.dateFin}</div></div></div>
      ${contrat.objet ? `<p><span class="label">Objet:</span> ${contrat.objet}</p>` : ''}
      ${contrat.obligations ? `<p><span class="label">Obligations:</span> ${contrat.obligations}</p>` : ''}
      ${contrat.conditions ? `<p><span class="label">Conditions:</span> ${contrat.conditions}</p>` : ''}
      </body></html>
    `);
    win.document.close();
    win.onload = () => win.print();
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

      {/* Alerte renouvellement */}
      {expirantCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-yellow-900 text-sm">Renouvellement requis</p>
            <p className="text-sm text-yellow-700">{expirantCount} contrat(s) arrivent à expiration bientôt.</p>
          </div>
        </div>
      )}

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 font-medium mb-1">Contrats Actifs</p>
          <p className="text-3xl font-bold text-green-600">{stats.actifs}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 font-medium mb-1">Valeur Totale</p>
          <p className="text-3xl font-bold text-gray-900">{stats.valeurTotale.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 font-medium mb-1">Expirant Bientôt</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.expirantBientot}</p>
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
              <option value="Actif">Actif</option>
              <option value="Expirant">Expirant</option>
              <option value="Expiré">Expiré</option>
              <option value="Terminé">Terminé</option>
              <option value="En attente">En attente</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p className="ml-auto text-xs text-gray-400">Total : {contratsFiltres.length} contrat(s)</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
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
                      {/* Voir */}
                      <button
                        onClick={() => { setContratSelectionne(contrat); setModalVoirOuvert(true); }}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700 transition-colors"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* Modifier */}
                      <button
                        onClick={() => ouvrirModification(contrat)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {/* Imprimer */}
                      <button
                        onClick={() => imprimerContrat(contrat)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Imprimer"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {/* Supprimer */}
                      <button
                        onClick={() => confirmerSuppression(contrat)}
                        disabled={mutationSupprimer.isPending}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
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
          <div className="space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{contratSelectionne.titre}</h2>
                <p className="text-gray-500 text-sm mt-0.5">{contratSelectionne.type}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${obtenirCouleurStatut(contratSelectionne.status)}`}>
                {obtenirLibelleStatut(contratSelectionne.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 text-sm">
              <div><p className="text-gray-400 text-xs mb-1">Client</p><p className="font-semibold text-gray-800">{contratSelectionne.clientName}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">Valeur</p><p className="font-semibold text-gray-800">{Number(contratSelectionne.value).toLocaleString('fr-FR')} {contratSelectionne.devise === 'EUR' ? '€' : contratSelectionne.devise === 'USD' ? '$' : 'DT'}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">Date début</p><p className="font-semibold text-gray-800">{contratSelectionne.dateDebut || '—'}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">Date fin</p><p className="font-semibold text-gray-800">{contratSelectionne.dateFin || '—'}</p></div>
              {contratSelectionne.dateRenouvellement && (
                <div><p className="text-gray-400 text-xs mb-1">Renouvellement</p><p className="font-semibold text-gray-800">{contratSelectionne.dateRenouvellement}</p></div>
              )}
            </div>

            {[
              { champ: 'objet', label: 'Objet' },
              { champ: 'obligations', label: 'Obligations' },
              { champ: 'responsabilites', label: 'Responsabilités' },
              { champ: 'conditions', label: 'Conditions' },
            ].map(({ champ, label }) =>
              (contratSelectionne as any)[champ] ? (
                <div key={champ}>
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{(contratSelectionne as any)[champ]}</p>
                </div>
              ) : null
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => imprimerContrat(contratSelectionne)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <FileText className="w-4 h-4" />
                Imprimer
              </button>
              <button onClick={() => { setModalVoirOuvert(false); ouvrirModification(contratSelectionne); }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
                <Pencil className="w-4 h-4" />
                Modifier
              </button>
              <button onClick={() => setModalVoirOuvert(false)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};