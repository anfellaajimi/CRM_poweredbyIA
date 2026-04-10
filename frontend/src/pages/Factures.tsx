import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Calendar, Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, DollarSign, ChevronUp, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../components/ui/Modal';
import { clientsAPI, facturesAPI, UIFacture } from '../services/api';
import { cn } from '../utils/cn';

const articleVide = { description: '', quantite: 1, prixUnitaire: 0 };

const Sparkline = ({ color = '#6366f1' }: { color?: string }) => (
  <svg width="80" height="32" viewBox="0 0 80 32" fill="none">
    <polyline points="0,24 13,18 26,22 39,10 52,16 65,8 80,14" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const obtenirLibelleStatut = (statut: string) =>
({
  en_attente: 'Non payée',
  payee: 'Payée',
  retard: 'En retard',
  paid: 'Payée',
  overdue: 'En retard',
  draft: 'Brouillon',
}[statut?.toLowerCase()] ?? statut);

const obtenirCouleurStatut = (statut: string) => {
  const s = statut?.toLowerCase();
  if (s === 'payee' || s === 'paid') return 'bg-green-100 text-green-700 border-green-200';
  if (s === 'retard' || s === 'overdue') return 'bg-red-100 text-red-600 border-red-200';
  if (s === 'draft') return 'bg-gray-100 text-gray-600 border-gray-200';
  return 'bg-yellow-100 text-yellow-700 border-yellow-200';
};

const estPaye = (statut: string) => ['payee', 'paid'].includes(statut?.toLowerCase());

// Composant menu statut cliquable
const MenuStatut = ({
  facture,
  onChanger,
  chargement,
}: {
  facture: UIFacture;
  onChanger: (id: number, statut: string, facture: UIFacture) => void;
  chargement: boolean;
}) => {
  const [ouvert, setOuvert] = useState(false);

  const statuts = [
    { valeur: 'payee', label: 'Payée', couleur: 'text-green-600 hover:bg-green-50' },
    { valeur: 'en_attente', label: 'Non payée', couleur: 'text-yellow-600 hover:bg-yellow-50' },
    { valeur: 'retard', label: 'En retard', couleur: 'text-red-600 hover:bg-red-50' },
    { valeur: 'draft', label: 'Brouillon', couleur: 'text-gray-600 hover:bg-gray-50' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOuvert(!ouvert)}
        disabled={chargement}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${obtenirCouleurStatut(facture.status)} disabled:opacity-50`}
      >
        {obtenirLibelleStatut(facture.status)}
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
                onClick={() => {
                  onChanger(facture.numericId, s.valeur, facture);
                  setOuvert(false);
                }}
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

export const Factures: React.FC = () => {
  const qc = useQueryClient();
  const [modalOuvert, setModalOuvert] = useState(false);
  const [aperçuOuvert, setAperçuOuvert] = useState(false);
  const [factureSelectionnee, setFactureSelectionnee] = useState<UIFacture | null>(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [page, setPage] = useState(1);
  const parPage = 10;

  const [nouvelleFacture, setNouvelleFacture] = useState({
    clientId: '',
    echeance: '',
    articles: [articleVide],
    tauxTaxe: 19,
  });

  const { data: factures = [] } = useQuery({
    queryKey: ['factures'],
    queryFn: facturesAPI.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll(),
  });

  const mutationCreer = useMutation({
    mutationFn: facturesAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture créée avec succès');
      setModalOuvert(false);
      setNouvelleFacture({ clientId: '', echeance: '', articles: [articleVide], tauxTaxe: 19 });
    },
    onError: (err: any) => toast.error(`Erreur création: ${err?.response?.data?.message ?? err?.message ?? 'inconnue'}`),
  });

  // ✅ CORRECTION PRINCIPALE : on récupère la facture complète et on envoie tout le payload
  const mutationChangerStatut = useMutation({
    mutationFn: async ({ id, statut, facture }: { id: number; statut: string; facture: UIFacture }) => {
      // On construit le payload complet avec le nouveau statut
      const payload: Partial<UIFacture> = {
        clientId: facture.clientId,
        status: statut,
        issuedAt: facture.issuedAt,
        dueAt: facture.dueAt,
        taxRate: facture.taxRate,
        items: facture.items,
        amount: facture.amount,
        paidAt: statut === 'payee' ? new Date().toISOString().slice(0, 10) : facture.paidAt,
      };
      return facturesAPI.update(String(id), payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Statut mis à jour');
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message ?? 'mise à jour échouée'}`),
  });

  const changerStatut = (id: number, statut: string, facture: UIFacture) => {
    if (!id) return toast.error('ID introuvable');
    mutationChangerStatut.mutate({ id, statut, facture });
  };

  const totalBrouillon = useMemo(
    () => nouvelleFacture.articles.reduce((sum, a) => sum + Number(a.quantite) * Number(a.prixUnitaire), 0),
    [nouvelleFacture.articles]
  );

  const totaux = useMemo(() => {
    const totalRevenu = factures.reduce((s, f) => s + (f.amount ?? 0), 0);
    const totalPaye = factures.filter((f) => estPaye(f.status)).reduce((s, f) => s + (f.amount ?? 0), 0);
    const totalNonPaye = factures.filter((f) => !estPaye(f.status)).reduce((s, f) => s + (f.amount ?? 0), 0);
    return { totalRevenu, totalPaye, totalNonPaye };
  }, [factures]);

  const facturesFiltrees = useMemo(() => {
    return factures.filter((f) => {
      const correspondRecherche =
        !recherche ||
        f.id?.toLowerCase().includes(recherche.toLowerCase()) ||
        f.clientName?.toLowerCase().includes(recherche.toLowerCase());
      const correspondStatut = filtreStatut === 'Tous' || obtenirLibelleStatut(f.status) === filtreStatut;
      const dateFacture = f.issuedAt ?? '';
      const correspondDateDebut = !dateDebut || dateFacture >= dateDebut;
      const correspondDateFin = !dateFin || dateFacture <= dateFin;
      return correspondRecherche && correspondStatut && correspondDateDebut && correspondDateFin;
    });
  }, [factures, recherche, filtreStatut, dateDebut, dateFin]);

  const totalPages = Math.max(1, Math.ceil(facturesFiltrees.length / parPage));
  const facturesPage = facturesFiltrees.slice((page - 1) * parPage, page * parPage);

  const telecharger = (facture: UIFacture, viewOnly = false) => {
    facturesAPI.exportPDF(facture.numericId, `${facture.id}.pdf`, viewOnly);
  };

  const creerFacture = () => {
    const client = clients.find((c) => c.id === nouvelleFacture.clientId);
    if (!client) return toast.error('Veuillez sélectionner un client');
    mutationCreer.mutate({
      clientId: client.id,
      status: 'en_attente',
      issuedAt: new Date().toISOString().slice(0, 10),
      dueAt: nouvelleFacture.echeance,
      taxRate: nouvelleFacture.tauxTaxe,
      items: nouvelleFacture.articles.map((a) => ({
        description: a.description,
        quantity: a.quantite,
        unitPrice: a.prixUnitaire,
      })),
      amount: totalBrouillon,
    } as any);
  };

  const mettreAJourArticle = (index: number, champ: string, valeur: any) => {
    const articles = [...nouvelleFacture.articles];
    (articles[index] as any)[champ] = valeur;
    setNouvelleFacture({ ...nouvelleFacture, articles });
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion backend des factures</p>
        </div>
        <button
          onClick={() => setModalOuvert(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Créer une facture
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 font-medium mb-2">CA total</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900">{totaux.totalRevenu.toLocaleString('fr-FR')}</p>
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <Sparkline color="#7c3aed" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 font-medium mb-2">Payées</p>
          <p className="text-3xl font-bold text-green-600">{totaux.totalPaye.toLocaleString('fr-FR')}</p>
          <Sparkline color="#16a34a" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 font-medium mb-2">Non payées</p>
          <p className="text-3xl font-bold text-red-600">{totaux.totalNonPaye.toLocaleString('fr-FR')}</p>
          <Sparkline color="#dc2626" />
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

          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="date"
              className="text-sm bg-transparent focus:outline-none text-gray-600 w-32 cursor-pointer"
              value={dateDebut}
              onChange={(e) => { setDateDebut(e.target.value); setPage(1); }}
            />
            <span className="text-gray-400">–</span>
            <input
              type="date"
              className="text-sm bg-transparent focus:outline-none text-gray-600 w-32 cursor-pointer"
              value={dateFin}
              onChange={(e) => { setDateFin(e.target.value); setPage(1); }}
            />
            {(dateDebut || dateFin) && (
              <button onClick={() => { setDateDebut(''); setDateFin(''); }} className="text-gray-400 hover:text-red-500 text-xs font-bold">✕</button>
            )}
          </div>

          <div className="relative">
            <select
              className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              value={filtreStatut}
              onChange={(e) => { setFiltreStatut(e.target.value); setPage(1); }}
            >
              <option value="Tous">Statut</option>
              <option value="Payée">Payée</option>
              <option value="Non payée">Non payée</option>
              <option value="En retard">En retard</option>
              <option value="Brouillon">Brouillon</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-48">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 font-medium border-b border-gray-100">
                <th className="px-4 py-3">N°</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Émise le</th>
                <th className="px-4 py-3">Échéance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {facturesPage.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucune facture trouvée</td></tr>
              )}
              {facturesPage.map((facture) => (
                <tr key={facture.numericId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{facture.id}</td>
                  <td className="px-4 py-3 text-gray-700">{facture.clientName}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{facture.amount?.toLocaleString('fr-FR')} {facture.devise === 'EUR' ? '€' : facture.devise === 'USD' ? '$' : 'DT'}</td>
                  <td className="px-4 py-3">
                    <MenuStatut
                      facture={facture}
                      onChanger={changerStatut}
                      chargement={mutationChangerStatut.isPending}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{facture.issuedAt}</td>
                  <td className="px-4 py-3 text-gray-600">{facture.dueAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setFactureSelectionnee(facture); setAperçuOuvert(true); }}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-colors"
                        title="Visualiser"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => telecharger(facture)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {!estPaye(facture.status) && (
                        <button
                          onClick={() => changerStatut(facture.numericId, 'payee', facture)}
                          disabled={mutationChangerStatut.isPending}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                        >
                          {mutationChangerStatut.isPending ? '...' : 'Marquer payée'}
                        </button>
                      )}
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

      {/* Modal création */}
      <Modal isOpen={modalOuvert} onClose={() => setModalOuvert(false)} title="Créer une facture" size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); creerFacture(); }}>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Client</label>
            <select
              className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={nouvelleFacture.clientId}
              onChange={(e) => setNouvelleFacture({ ...nouvelleFacture, clientId: e.target.value })}
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Date d'échéance</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={nouvelleFacture.echeance}
              onChange={(e) => setNouvelleFacture({ ...nouvelleFacture, echeance: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Taux de taxe (%)</label>
            <input
              type="number"
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={nouvelleFacture.tauxTaxe}
              onChange={(e) => setNouvelleFacture({ ...nouvelleFacture, tauxTaxe: Number(e.target.value) })}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Articles</label>
              <button
                type="button"
                className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
                onClick={() => setNouvelleFacture({ ...nouvelleFacture, articles: [...nouvelleFacture.articles, { ...articleVide }] })}
              >
                + Ajouter un article
              </button>
            </div>
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-1 mb-1">
              <span className="col-span-5">Description</span>
              <span className="col-span-2">Qté</span>
              <span className="col-span-3">Prix unitaire</span>
            </div>
            <div className="space-y-2">
              {nouvelleFacture.articles.map((article, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <input
                    className="col-span-5 border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Description"
                    value={article.description}
                    onChange={(e) => mettreAJourArticle(index, 'description', e.target.value)}
                    required
                  />
                  <input
                    className="col-span-2 border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    type="number" min="1"
                    value={article.quantite}
                    onChange={(e) => mettreAJourArticle(index, 'quantite', Number(e.target.value))}
                  />
                  <input
                    className="col-span-3 border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    type="number" min="0"
                    value={article.prixUnitaire}
                    onChange={(e) => mettreAJourArticle(index, 'prixUnitaire', Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="col-span-2 text-red-400 text-sm hover:text-red-600 font-medium"
                    onClick={() => setNouvelleFacture({ ...nouvelleFacture, articles: nouvelleFacture.articles.filter((_, i) => i !== index) })}
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total HT</span>
            <span className="text-xl font-bold text-indigo-600">
              {totalBrouillon.toLocaleString('fr-FR')} {nouvelleFacture.clientId ? (clients.find(c => c.id === nouvelleFacture.clientId)?.devise === 'EUR' ? '€' : clients.find(c => c.id === nouvelleFacture.clientId)?.devise === 'USD' ? '$' : 'DT') : ''}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOuvert(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutationCreer.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {mutationCreer.isPending ? 'Création...' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </Modal>
  
      {/* Modal aperçu facture */}
      <Modal isOpen={aperçuOuvert} onClose={() => setAperçuOuvert(false)} title="Aperçu de la facture" size="lg">
        {factureSelectionnee && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{factureSelectionnee.id}</h2>
                <p className="text-gray-500 text-sm mt-0.5">Émise le {factureSelectionnee.issuedAt}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${obtenirCouleurStatut(factureSelectionnee.status)}`}>
                {obtenirLibelleStatut(factureSelectionnee.status)}
              </span>
            </div>
  
            <div className="grid grid-cols-2 gap-6 text-sm bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-bold">Client</p>
                <p className="font-semibold text-gray-800">{factureSelectionnee.clientName}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-bold">Échéance</p>
                <p className={cn("font-semibold", !factureSelectionnee.dueAt ? "text-gray-400" : "text-gray-800")}>
                  {factureSelectionnee.dueAt || 'Non spécifiée'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-bold">Montant HT</p>
                <p className="font-semibold text-gray-800">{factureSelectionnee.amount?.toLocaleString('fr-FR')} {factureSelectionnee.devise === 'EUR' ? '€' : factureSelectionnee.devise === 'USD' ? '$' : 'DT'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-bold">Taxe (TVA)</p>
                <p className="font-semibold text-gray-800">{factureSelectionnee.taxRate}%</p>
              </div>
            </div>
  
            <div>
              <p className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                 Détail des prestations
              </p>
              <div className="space-y-2">
                {factureSelectionnee.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm group hover:bg-indigo-50/30 transition-colors">
                    <div>
                      <p className="font-medium text-gray-800">{item.description}</p>
                      <p className="text-gray-400 text-xs">Qté: {item.quantity} × {Number(item.unitPrice).toLocaleString('fr-FR')} {factureSelectionnee.devise === 'EUR' ? '€' : factureSelectionnee.devise === 'USD' ? '$' : 'DT'}</p>
                    </div>
                    <p className="font-bold text-gray-900">{(item.lineTotal || item.quantity * item.unitPrice).toLocaleString('fr-FR')} {factureSelectionnee.devise === 'EUR' ? '€' : factureSelectionnee.devise === 'USD' ? '$' : 'DT'}</p>
                  </div>
                ))}
              </div>
            </div>
  
            <div className="flex flex-col items-end pt-4 border-t border-gray-100 space-y-1">
              <div className="flex justify-between w-full max-w-[200px] text-sm text-gray-500">
                <span>Total HT:</span>
                <span>{factureSelectionnee.amount?.toLocaleString('fr-FR')} {factureSelectionnee.devise === 'EUR' ? '€' : factureSelectionnee.devise === 'USD' ? '$' : 'DT'}</span>
              </div>
              <div className="flex justify-between w-full max-w-[200px] text-lg font-bold text-indigo-600 mt-2">
                <span>TOTAL TTC:</span>
                <span>{(factureSelectionnee.amount * (1 + (factureSelectionnee.taxRate || 0) / 100)).toLocaleString('fr-FR')} {factureSelectionnee.devise === 'EUR' ? '€' : factureSelectionnee.devise === 'USD' ? '$' : 'DT'}</span>
              </div>
            </div>
  
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => telecharger(factureSelectionnee)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Télécharger PDF
              </button>
              <button onClick={() => telecharger(factureSelectionnee, true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
                <Eye className="w-4 h-4" />
                Visualiser
              </button>
              <button onClick={() => setAperçuOuvert(false)} className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};