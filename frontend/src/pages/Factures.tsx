import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Calendar, Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, DollarSign, ChevronUp, Eye, Pencil, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../components/ui/Modal';
import { PDFPreview } from '../components/PDFPreview';
import { FacturePrint } from '../components/FacturePrint';
import { clientsAPI, devisAPI, facturesAPI, UIDevis, UIFacture } from '../services/api';
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

  // Edit mode state
  const [modeEdition, setModeEdition] = useState(false);
  const [factureEditionId, setFactureEditionId] = useState<number | null>(null);

  // Delete confirmation state
  const [confirmSuppressionOuvert, setConfirmSuppressionOuvert] = useState(false);
  const [factureASupprimer, setFactureASupprimer] = useState<UIFacture | null>(null);

  const [nouvelleFacture, setNouvelleFacture] = useState({
    clientId: '',
    echeance: '',
    articles: [articleVide],
    tauxTaxe: 19,
    fiscalStamp: 1.0,
    devisId: '' as string,
  });

  const { data: factures = [] } = useQuery({
    queryKey: ['factures'],
    queryFn: facturesAPI.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll(),
  });

  const { data: listDevis = [] } = useQuery({
    queryKey: ['devis'],
    queryFn: devisAPI.getAll,
  });

  // Devis: if a client is selected, filter by client. Otherwise, show all non-converted devis.
  const devisClient = useMemo(() => {
    return listDevis.filter((d) => {
      const isNotConverted = !['converti'].includes(d.status?.toLowerCase());
      if (nouvelleFacture.clientId) {
        return d.clientId === nouvelleFacture.clientId && isNotConverted;
      }
      return isNotConverted;
    });
  }, [listDevis, nouvelleFacture.clientId]);

  const reinitialiserFormulaire = () => {
    setNouvelleFacture({ clientId: '', echeance: '', articles: [articleVide], tauxTaxe: 19, fiscalStamp: 1.0, devisId: '' });
    setModeEdition(false);
    setFactureEditionId(null);
  };

  const appliquerDevis = (devisId: string) => {
    const devis = listDevis.find((d) => String(d.numericId) === devisId);
    if (!devis) {
      setNouvelleFacture((prev) => ({
        ...prev,
        devisId: '',
        articles: [articleVide],
        tauxTaxe: 19,
        fiscalStamp: 1.0,
        echeance: '',
      }));
      return;
    }
    setNouvelleFacture((prev) => ({
      ...prev,
      devisId,
      clientId: devis.clientId || prev.clientId, // Auto-select client!
      echeance: devis.validUntil || prev.echeance,
      tauxTaxe: devis.taxRate || 19,
      fiscalStamp: devis.fiscalStamp || 1.0,
      articles: devis.items.map((it) => ({
        description: it.description,
        quantite: it.quantity,
        prixUnitaire: it.unitPrice,
      })),
    }));
  };

  const mutationCreer = useMutation({
    mutationFn: async (payload: Partial<UIFacture>) => {
      const fact = await facturesAPI.create(payload);
      if (payload.devisId) {
        const devis = listDevis.find((d) => String(d.numericId) === payload.devisId);
        if (devis) {
          await devisAPI.update(String(devis.numericId), { ...devis, status: 'converti' });
        }
      }
      return fact;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      qc.invalidateQueries({ queryKey: ['devis'] }); // Refresh devis list as well
      toast.success('Facture créée avec succès');
      setModalOuvert(false);
      reinitialiserFormulaire();
    },
    onError: (err: any) => toast.error(`Erreur création: ${err?.response?.data?.message ?? err?.message ?? 'inconnue'}`),
  });

  const mutationModifier = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UIFacture> }) => facturesAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture mise à jour avec succès');
      setModalOuvert(false);
      reinitialiserFormulaire();
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationSupprimer = useMutation({
    mutationFn: async (id: string) => facturesAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture supprimée avec succès');
      setConfirmSuppressionOuvert(false);
      setFactureASupprimer(null);
    },
    onError: (err: any) => toast.error(`Erreur suppression: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationChangerStatut = useMutation({
    mutationFn: async ({ id, statut, facture }: { id: number; statut: string; facture: UIFacture }) => {
      const payload: Partial<UIFacture> = {
        clientId: facture.clientId,
        status: statut,
        issuedAt: facture.issuedAt,
        dueAt: facture.dueAt,
        taxRate: facture.taxRate,
        fiscalStamp: facture.fiscalStamp,
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

  const ouvrirEdition = (facture: UIFacture) => {
    setModeEdition(true);
    setFactureEditionId(facture.numericId);
    setNouvelleFacture({
      clientId: facture.clientId,
      devisId: facture.devisId || '',
      echeance: facture.dueAt || '',
      tauxTaxe: facture.taxRate || 19,
      fiscalStamp: facture.fiscalStamp || 1.0,
      articles: facture.items.map((it) => ({ description: it.description, quantite: it.quantity, prixUnitaire: it.unitPrice })),
    });
    setModalOuvert(true);
  };

  const ouvrirCreation = () => {
    reinitialiserFormulaire();
    setModalOuvert(true);
  };

  const confirmerSuppression = (facture: UIFacture) => {
    setFactureASupprimer(facture);
    setConfirmSuppressionOuvert(true);
  };

  const creerOuModifierFacture = () => {
    const client = clients.find((c) => c.id === nouvelleFacture.clientId);
    if (!client) return toast.error('Veuillez sélectionner un client');

    const payload = {
      clientId: client.id,
      devisId: nouvelleFacture.devisId,
      status: 'en_attente',
      issuedAt: new Date().toISOString().slice(0, 10),
      dueAt: nouvelleFacture.echeance,
      taxRate: nouvelleFacture.tauxTaxe,
      fiscalStamp: nouvelleFacture.fiscalStamp,
      items: nouvelleFacture.articles.map((a) => ({
        description: a.description,
        quantity: a.quantite,
        unitPrice: a.prixUnitaire,
      })),
      amount: totalBrouillon,
    } as any;

    if (modeEdition && factureEditionId) {
      mutationModifier.mutate({ id: String(factureEditionId), data: payload });
    } else {
      mutationCreer.mutate(payload);
    }
  };

  const mettreAJourArticle = (index: number, champ: string, valeur: any) => {
    const articles = [...nouvelleFacture.articles];
    (articles[index] as any)[champ] = valeur;
    setNouvelleFacture({ ...nouvelleFacture, articles });
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion backend des factures</p>
        </div>
        <button
          onClick={ouvrirCreation}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Créer une facture
        </button>
      </div>

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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
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
                      <button
                        onClick={() => ouvrirEdition(facture)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmerSuppression(facture)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
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

      {/* Modal création / modification facture */}
      <Modal isOpen={modalOuvert} onClose={() => { setModalOuvert(false); reinitialiserFormulaire(); }} title={modeEdition ? 'Modifier la facture' : 'Créer une facture'} size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); creerOuModifierFacture(); }}>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Client</label>
            <select
              className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={nouvelleFacture.clientId}
              onChange={(e) => setNouvelleFacture({ ...nouvelleFacture, clientId: e.target.value, devisId: '' })}
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.formattedId} - {c.name}</option>)}
            </select>
          </div>

          {/* Devis selector */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Importer depuis un devis</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="w-full pl-9 pr-3 border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={nouvelleFacture.devisId}
                onChange={(e) => appliquerDevis(e.target.value)}
              >
                <option value="">Sélectionner un devis (optionnel)</option>
                {devisClient.map((d) => (
                  <option key={d.numericId} value={String(d.numericId)}>
                    {d.id} — {d.clientName} — {d.title} — {d.amount?.toLocaleString('fr-FR')} {d.devise || 'DT'}
                  </option>
                ))}
              </select>
            </div>
            {nouvelleFacture.clientId && devisClient.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Aucun devis disponible pour ce client.</p>
            )}
            {nouvelleFacture.devisId && (
              <p className="text-xs text-green-600 mt-1 font-medium">✓ Devis sélectionné ! Le client et les données ont été pré-remplis.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">TVA (%)</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={nouvelleFacture.tauxTaxe}
                  onChange={(e) => setNouvelleFacture({ ...nouvelleFacture, tauxTaxe: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Timbre</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={nouvelleFacture.fiscalStamp}
                  onChange={(e) => setNouvelleFacture({ ...nouvelleFacture, fiscalStamp: Number(e.target.value) })}
                />
              </div>
            </div>
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
            <div className="space-y-2">
              {nouvelleFacture.articles.map((article, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <input
                    className="col-span-5 border border-gray-200 rounded-lg p-2 text-sm"
                    placeholder="Description"
                    value={article.description}
                    onChange={(e) => mettreAJourArticle(index, 'description', e.target.value)}
                    required
                  />
                  <input
                    className="col-span-2 border border-gray-200 rounded-lg p-2 text-sm"
                    type="number" min="1"
                    value={article.quantite}
                    onChange={(e) => mettreAJourArticle(index, 'quantite', Number(e.target.value))}
                  />
                  <input
                    className="col-span-3 border border-gray-200 rounded-lg p-2 text-sm"
                    type="number" min="0"
                    value={article.prixUnitaire}
                    onChange={(e) => mettreAJourArticle(index, 'prixUnitaire', Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="col-span-2 text-red-500 text-sm"
                    onClick={() => setNouvelleFacture({ ...nouvelleFacture, articles: nouvelleFacture.articles.filter((_, i) => i !== index) })}
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setModalOuvert(false); reinitialiserFormulaire(); }} className="px-4 py-2 border rounded-lg">Annuler</button>
            <button type="submit" disabled={mutationCreer.isPending || mutationModifier.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
              {(mutationCreer.isPending || mutationModifier.isPending) ? 'Chargement...' : modeEdition ? 'Mettre à jour' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={aperçuOuvert} onClose={() => setAperçuOuvert(false)} title="Aperçu de la facture" size="lg">
        {factureSelectionnee && (
          <div className="space-y-4 max-h-[85vh] overflow-y-auto p-4 bg-gray-100 rounded-lg">
            <PDFPreview 
              type="FACTURE"
              number={factureSelectionnee.id}
              date={factureSelectionnee.issuedAt}
              clientName={factureSelectionnee.clientName}
              items={factureSelectionnee.items}
              amount={factureSelectionnee.amount}
              devise={factureSelectionnee.devise}
              dueAt={factureSelectionnee.dueAt}
              taxRate={factureSelectionnee.taxRate}
              fiscalStamp={factureSelectionnee.fiscalStamp}
            />
            <div className="flex justify-center gap-3 py-4 sticky bottom-0 bg-gray-100">
               <button onClick={() => window.print()} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold">
                 Imprimer
               </button>
               <button onClick={() => setAperçuOuvert(false)} className="px-5 py-2 bg-gray-900 text-white rounded-xl">Fermer</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal isOpen={confirmSuppressionOuvert} onClose={() => { setConfirmSuppressionOuvert(false); setFactureASupprimer(null); }} title="Confirmer la suppression" size="sm">
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
            Voulez-vous vraiment supprimer la facture <span className="font-bold text-gray-900">{factureASupprimer?.id}</span> ?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setConfirmSuppressionOuvert(false); setFactureASupprimer(null); }}
              className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={() => factureASupprimer && mutationSupprimer.mutate(String(factureASupprimer.numericId))}
              disabled={mutationSupprimer.isPending}
              className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {mutationSupprimer.isPending ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Rendu masqué pour l'impression */}
      {aperçuOuvert && factureSelectionnee && <FacturePrint facture={factureSelectionnee} />}
    </div>
  );
};