import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, ChevronUp, Eye, Pencil, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../components/ui/Modal';
import { PDFPreview } from '../components/PDFPreview';
import { DevisPrint } from '../components/DevisPrint';
import { aiGenerationAPI, clientsAPI, devisAPI, facturesAPI, UIDevis } from '../services/api';
import { cn } from '../utils/cn';

const articleVide = { description: '', quantity: 1, unitPrice: 0 };

// Sparkline component for dashboard cards
const Sparkline = ({ color = '#6366f1' }: { color?: string }) => (
  <svg width="80" height="32" viewBox="0 0 80 32" fill="none">
    <polyline points="0,24 13,18 26,22 39,10 52,16 65,8 80,14" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const obtenirLibelleStatut = (statut: string) =>
({
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  accepté: 'Accepté',
  rejected: 'Rejeté',
  refused: 'Rejeté',
  converti: 'Converti',
  expired: 'Expiré',
}[statut?.toLowerCase()] ?? statut);

const obtenirCouleurStatut = (statut: string) => {
  const s = statut?.toLowerCase();
  if (s === 'accepted' || s === 'accepté' || s === 'converti') return 'bg-green-100 text-green-700 border-green-200';
  if (s === 'rejected' || s === 'refused' || s === 'rejeté') return 'bg-red-100 text-red-600 border-red-200';
  if (s === 'sent' || s === 'envoyé') return 'bg-blue-100 text-blue-600 border-blue-200';
  if (s === 'expired' || s === 'expiré') return 'bg-gray-200 text-gray-700 border-gray-300';
  return 'bg-gray-100 text-gray-600 border-gray-200';
};

// Custom dropdown for changing status
const MenuStatut = ({
  devis,
  onChanger,
  chargement,
}: {
  devis: UIDevis;
  onChanger: (id: number, statut: string, devis: UIDevis) => void;
  chargement: boolean;
}) => {
  const [ouvert, setOuvert] = useState(false);

  const statuts = [
    { valeur: 'draft', label: 'Brouillon', couleur: 'text-gray-600 hover:bg-gray-50' },
    { valeur: 'sent', label: 'Envoyé', couleur: 'text-blue-600 hover:bg-blue-50' },
    { valeur: 'accepted', label: 'Accepté', couleur: 'text-green-600 hover:bg-green-50' },
    { valeur: 'rejected', label: 'Rejeté', couleur: 'text-red-600 hover:bg-red-50' },
    { valeur: 'expired', label: 'Expiré', couleur: 'text-gray-500 hover:bg-gray-50' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOuvert(!ouvert)}
        disabled={chargement}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${obtenirCouleurStatut(devis.status)} disabled:opacity-50`}
      >
        {obtenirLibelleStatut(devis.status)}
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
                onClick={() => { onChanger(devis.numericId, s.valeur, devis); setOuvert(false); }}
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

export const Devis: React.FC = () => {
  const qc = useQueryClient();
  const [modalOuvert, setModalOuvert] = useState(false);
  const [aperçuOuvert, setAperçuOuvert] = useState(false);
  const [devisSelectionne, setDevisSelectionne] = useState<UIDevis | null>(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [page, setPage] = useState(1);
  const parPage = 10;

  // Edit mode state
  const [modeEdition, setModeEdition] = useState(false);
  const [devisEditionId, setDevisEditionId] = useState<number | null>(null);

  // Delete confirmation state
  const [confirmSuppressionOuvert, setConfirmSuppressionOuvert] = useState(false);
  const [devisASupprimer, setDevisASupprimer] = useState<UIDevis | null>(null);

  const [nouveauDevis, setNouveauDevis] = useState({
    clientId: '',
    titre: '',
    validUntil: '',
    taxRate: 19,
    fiscalStamp: 1.0,
    articles: [{ ...articleVide }],
  });
  const [aiPromptDevis, setAiPromptDevis] = useState('');

  const { data: listDevis = [], isLoading: isLoadingDevis } = useQuery({ queryKey: ['devis'], queryFn: devisAPI.getAll });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsAPI.getAll() });

  const reinitialiserFormulaire = () => {
    setNouveauDevis({ clientId: '', titre: '', validUntil: '', taxRate: 19, fiscalStamp: 1.0, articles: [{ ...articleVide }] });
    setModeEdition(false);
    setDevisEditionId(null);
  };

  const mutationCreer = useMutation({
    mutationFn: devisAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Devis créé avec succès');
      setModalOuvert(false);
      reinitialiserFormulaire();
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationModifier = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UIDevis> }) => devisAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Devis mis à jour avec succès');
      setModalOuvert(false);
      reinitialiserFormulaire();
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationSupprimer = useMutation({
    mutationFn: async (id: string) => devisAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Devis supprimé avec succès');
      setConfirmSuppressionOuvert(false);
      setDevisASupprimer(null);
    },
    onError: (err: any) => toast.error(`Erreur suppression: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationChangerStatut = useMutation({
    mutationFn: async ({ id, statut, devis }: { id: number; statut: string; devis: UIDevis }) => {
      return devisAPI.update(String(id), { ...devis, status: statut });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Statut mis à jour');
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationConvertir = useMutation({
    mutationFn: async (devis: UIDevis) => {
      await facturesAPI.create({
        clientId: devis.clientId,
        status: 'en_attente',
        issuedAt: new Date().toISOString().slice(0, 10),
        dueAt: devis.validUntil,
        items: devis.items,
        taxRate: devis.taxRate || 19,
        fiscalStamp: devis.fiscalStamp || 1.0,
        amount: devis.amount,
      } as any);
      return devisAPI.update(String(devis.numericId), { ...devis, status: 'converti' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devis'] });
      qc.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Devis converti en facture avec succès');
    },
    onError: (err: any) => toast.error(`Erreur conversion: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationGenererDevisIA = useMutation({
    mutationFn: () => {
      const client = clients.find((c) => c.id === nouveauDevis.clientId);
      if (!client) throw new Error('Selectionnez un client avant generation IA');
      return aiGenerationAPI.generateDevis({
        client_name: client.name,
        prompt: aiPromptDevis || nouveauDevis.titre || 'Devis standard',
        devise: client.devise || 'TND',
      });
    },
    onSuccess: (data: any) => {
      const days = Number(data.valid_until_days || 30);
      const validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setNouveauDevis((prev) => ({
        ...prev,
        titre: data.title || prev.titre,
        validUntil,
        taxRate: Number(data.tax_rate ?? prev.taxRate ?? 19),
        fiscalStamp: Number(data.fiscal_stamp ?? prev.fiscalStamp ?? 1.0),
        articles: Array.isArray(data.items) && data.items.length
          ? data.items.map((it: any) => ({
              description: String(it.description || ''),
              quantity: Number(it.quantity || 1),
              unitPrice: Number(it.unitPrice || 0),
            }))
          : prev.articles,
      }));
      toast.success('Devis genere par IA');
    },
    onError: (err: any) => toast.error(err?.message || 'Generation IA devis impossible'),
  });

  const changerStatut = (id: number, statut: string, devis: UIDevis) => {
    mutationChangerStatut.mutate({ id, statut, devis });
  };

  const totalHT = useMemo(
    () => nouveauDevis.articles.reduce((sum, a) => sum + Number(a.quantity || 0) * Number(a.unitPrice || 0), 0),
    [nouveauDevis.articles]
  );

  const montantTVA = useMemo(() => totalHT * (nouveauDevis.taxRate / 100), [totalHT, nouveauDevis.taxRate]);
  const totalTTC = useMemo(() => totalHT + montantTVA + Number(nouveauDevis.fiscalStamp || 0), [totalHT, montantTVA, nouveauDevis.fiscalStamp]); 

  const stats = useMemo(() => {
    const enAttente = listDevis.filter((d) => ['draft', 'sent'].includes(d.status?.toLowerCase())).length;
    const valeurAcceptee = listDevis.filter((d) => ['accepted', 'accepté'].includes(d.status?.toLowerCase())).reduce((s, d) => s + (d.amount ?? 0), 0);
    const total = listDevis.length;
    const convertis = listDevis.filter((d) => d.status?.toLowerCase() === 'converti').length;
    const tauxConversion = total > 0 ? Math.round((convertis / total) * 100) : 0;
    return { enAttente, valeurAcceptee, tauxConversion };
  }, [listDevis]);

  const devisFiltres = useMemo(() => {
    return listDevis.filter((d) => {
      const correspondRecherche =
        !recherche ||
        d.id?.toLowerCase().includes(recherche.toLowerCase()) ||
        d.clientName?.toLowerCase().includes(recherche.toLowerCase()) ||
        d.title?.toLowerCase().includes(recherche.toLowerCase());
      const correspondStatut = filtreStatut === 'Tous' || obtenirLibelleStatut(d.status) === filtreStatut;
      return correspondRecherche && correspondStatut;
    });
  }, [listDevis, recherche, filtreStatut]);

  const totalPages = Math.max(1, Math.ceil(devisFiltres.length / parPage));
  const devisPage = devisFiltres.slice((page - 1) * parPage, page * parPage);

  const telecharger = (devis: UIDevis, viewOnly = false) => {
    devisAPI.exportPDF(devis.numericId, `${devis.id}.pdf`, viewOnly);
  };

  const ouvrirEdition = (devis: UIDevis) => {
    setModeEdition(true);
    setDevisEditionId(devis.numericId);
    setNouveauDevis({
      clientId: devis.clientId,
      titre: devis.title,
      validUntil: devis.validUntil || '',
      taxRate: devis.taxRate || 19,
      fiscalStamp: devis.fiscalStamp || 1.0,
      articles: devis.items.map((it) => ({ description: it.description, quantity: it.quantity, unitPrice: it.unitPrice })),
    });
    setModalOuvert(true);
  };

  const ouvrirCreation = () => {
    reinitialiserFormulaire();
    setModalOuvert(true);
  };

  const confirmerSuppression = (devis: UIDevis) => {
    setDevisASupprimer(devis);
    setConfirmSuppressionOuvert(true);
  };

  const creerOuModifierDevis = () => {
    const client = clients.find((c) => c.id === nouveauDevis.clientId);
    if (!client) return toast.error('Veuillez sélectionner un client');

    const payload = {
      clientId: client.id,
      title: nouveauDevis.titre,
      notes: nouveauDevis.titre,
      amount: totalHT,
      status: 'draft',
      createdAt: new Date().toISOString().slice(0, 10),
      validUntil: nouveauDevis.validUntil,
      taxRate: nouveauDevis.taxRate,
      fiscalStamp: nouveauDevis.fiscalStamp,
      items: nouveauDevis.articles,
    } as any;

    if (modeEdition && devisEditionId) {
      mutationModifier.mutate({ id: String(devisEditionId), data: payload });
    } else {
      mutationCreer.mutate(payload);
    }
  };

  const mettreAJourArticle = (index: number, champ: string, valeur: any) => {
    const articles = [...nouveauDevis.articles];
    (articles[index] as any)[champ] = valeur;
    setNouveauDevis({ ...nouveauDevis, articles });
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devis</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des devis backend</p>
        </div>
        <button
          onClick={ouvrirCreation}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Créer un devis
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 font-medium mb-1">Devis en attente</p>
          <p className="text-3xl font-bold text-gray-900">{stats.enAttente}</p>
          <Sparkline color="#6366f1" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 font-medium mb-1">Valeur Acceptée</p>
          <p className="text-3xl font-bold text-green-600">{stats.valeurAcceptee.toLocaleString('fr-FR')}</p>
          <Sparkline color="#16a34a" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 font-medium mb-1">Taux de Conversion</p>
          <p className="text-3xl font-bold text-blue-600">{stats.tauxConversion}%</p>
          <Sparkline color="#2563eb" />
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
              placeholder="Rechercher par n° ou client..."
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
              <option value="Brouillon">Brouillon</option>
              <option value="Envoyé">Envoyé</option>
              <option value="Accepté">Accepté</option>
              <option value="Rejeté">Rejeté</option>
              <option value="Converti">Converti</option>
              <option value="Expiré">Expiré</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Tableau principal */}
        <div className="overflow-x-auto pb-48">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 font-medium border-b border-gray-100">
                <th className="px-4 py-3">N° Devis</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Créé le</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingDevis ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Chargement...</td></tr>
              ) : devisPage.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucun devis trouvé</td></tr>
              ) : (
                devisPage.map((devis) => (
                  <tr key={devis.numericId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{devis.id}</td>
                    <td className="px-4 py-3 text-gray-700">{devis.clientName}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{devis.title}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      {devis.amount?.toLocaleString('fr-FR')} {devis.devise || 'DT'}
                    </td>
                    <td className="px-4 py-3">
                      <MenuStatut devis={devis} onChanger={changerStatut} chargement={mutationChangerStatut.isPending} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{devis.createdAt}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setDevisSelectionne(devis); setAperçuOuvert(true); }}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                          title="Visualiser"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => telecharger(devis)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => ouvrirEdition(devis)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmerSuppression(devis)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {(devis.status?.toLowerCase() === 'accepted' || devis.status?.toLowerCase() === 'accepté') && (
                          <button
                            onClick={() => mutationConvertir.mutate(devis)}
                            disabled={mutationConvertir.isPending}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                            title="Convertir en facture"
                          >
                            Convertir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 p-4">
            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"><ChevronsLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3 py-1 rounded bg-indigo-600 text-white text-sm font-medium min-w-[32px] text-center">{page}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center"><ChevronsRight className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* Modal création / modification devis */}
      <Modal isOpen={modalOuvert} onClose={() => { setModalOuvert(false); reinitialiserFormulaire(); }} title={modeEdition ? 'Modifier le devis' : 'Créer un devis'} size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); creerOuModifierDevis(); }}>
          <div className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/60">
            <label className="block text-sm font-medium mb-1 text-gray-700">Brief IA (optionnel)</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Devis CRM avec dashboard, auth, API, support 3 mois..."
                value={aiPromptDevis}
                onChange={(e) => setAiPromptDevis(e.target.value)}
              />
              <button
                type="button"
                onClick={() => mutationGenererDevisIA.mutate()}
                disabled={mutationGenererDevisIA.isPending || !nouveauDevis.clientId}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  {mutationGenererDevisIA.isPending ? 'Generation...' : 'Generer avec IA'}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Client</label>
            <select
              className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
              value={nouveauDevis.clientId}
              onChange={(e) => setNouveauDevis({ ...nouveauDevis, clientId: e.target.value })}
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.formattedId} - {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Titre du devis</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Refonte site web"
              value={nouveauDevis.titre}
              onChange={(e) => setNouveauDevis({ ...nouveauDevis, titre: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1 text-gray-700">Valide jusqu'au</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={nouveauDevis.validUntil}
                onChange={(e) => setNouveauDevis({ ...nouveauDevis, validUntil: e.target.value })}
                required
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1 text-gray-700">TVA (%)</label>
              <select
                className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                value={nouveauDevis.taxRate}
                onChange={(e) => setNouveauDevis({ ...nouveauDevis, taxRate: Number(e.target.value) })}
              >
                <option value={0}>0%</option>
                <option value={7}>7%</option>
                <option value={13}>13%</option>
                <option value={19}>19%</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1 text-gray-700">Timbre Fiscal</label>
              <input
                type="number"
                step="0.1"
                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={nouveauDevis.fiscalStamp}
                onChange={(e) => setNouveauDevis({ ...nouveauDevis, fiscalStamp: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Articles</label>
              <button
                type="button"
                className="text-indigo-600 text-sm font-bold hover:text-indigo-700"
                onClick={() => setNouveauDevis({ ...nouveauDevis, articles: [...nouveauDevis.articles, { ...articleVide }] })}
              >
                + Ajouter un article
              </button>
            </div>
            <div className="space-y-2">
              {nouveauDevis.articles.map((article, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 glass p-2 rounded-xl">
                  <input
                    className="col-span-5 border border-gray-100 rounded-lg p-2 text-sm"
                    placeholder="Description"
                    value={article.description}
                    onChange={(e) => mettreAJourArticle(index, 'description', e.target.value)}
                    required
                  />
                  <input
                    className="col-span-2 border border-gray-100 rounded-lg p-2 text-sm text-center"
                    type="number" min="1"
                    placeholder="Qté"
                    value={article.quantity}
                    onChange={(e) => mettreAJourArticle(index, 'quantity', Number(e.target.value))}
                  />
                  <input
                    className="col-span-3 border border-gray-100 rounded-lg p-2 text-sm"
                    type="number" min="0"
                    placeholder="P.U"
                    value={article.unitPrice}
                    onChange={(e) => mettreAJourArticle(index, 'unitPrice', Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="col-span-2 text-red-500 hover:text-red-700 font-bold text-xs"
                    onClick={() => setNouveauDevis({ ...nouveauDevis, articles: nouveauDevis.articles.filter((_, i) => i !== index) })}
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total HT</span>
              <span className="font-bold text-gray-700">{totalHT.toLocaleString('fr-FR')} {nouveauDevis.clientId ? (clients.find(c => c.id === nouveauDevis.clientId)?.devise || 'DT') : ''}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">TVA ({nouveauDevis.taxRate}%)</span>
              <span className="font-bold text-gray-700">{montantTVA.toLocaleString('fr-FR')} {nouveauDevis.clientId ? (clients.find(c => c.id === nouveauDevis.clientId)?.devise || 'DT') : ''}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-dashed border-gray-100 pb-2">
              <span className="text-gray-500">Timbre Fiscal</span>
              <span className="font-bold text-gray-700">{Number(nouveauDevis.fiscalStamp).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} {nouveauDevis.clientId ? (clients.find(c => c.id === nouveauDevis.clientId)?.devise || 'DT') : ''}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-black text-gray-900">TOTAL TTC</span>
              <span className="text-2xl font-black text-indigo-600">
                {totalTTC.toLocaleString('fr-FR')} {nouveauDevis.clientId ? (clients.find(c => c.id === nouveauDevis.clientId)?.devise || 'DT') : ''}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => { setModalOuvert(false); reinitialiserFormulaire(); }} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">
              Annuler
            </button>
            <button type="submit" disabled={mutationCreer.isPending || mutationModifier.isPending} className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
              {(mutationCreer.isPending || mutationModifier.isPending) ? 'Chargement...' : modeEdition ? 'Mettre à jour' : 'Créer le devis'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal aperçu PDF */}
      <Modal isOpen={aperçuOuvert} onClose={() => setAperçuOuvert(false)} title="Aperçu du Devis" size="lg">
        {devisSelectionne && (
          <div className="space-y-4 max-h-[85vh] overflow-y-auto p-4 bg-gray-100 rounded-xl">
            <PDFPreview 
              type="DEVIS"
              number={devisSelectionne.id}
              date={devisSelectionne.createdAt}
              clientName={devisSelectionne.clientName}
              items={devisSelectionne.items}
              amount={devisSelectionne.amount}
              devise={devisSelectionne.devise}
              taxRate={devisSelectionne.taxRate}
              fiscalStamp={devisSelectionne.fiscalStamp}
              validUntil={devisSelectionne.validUntil}
            />
            <div className="flex flex-wrap justify-center gap-3 pt-4 sticky bottom-0 bg-gray-100 py-4 border-t border-gray-200">
              <button onClick={() => window.print()} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all">
                Imprimer
              </button>
              <button onClick={() => telecharger(devisSelectionne)} className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
                Télécharger PDF
              </button>
              <button onClick={() => setAperçuOuvert(false)} className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all">
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal isOpen={confirmSuppressionOuvert} onClose={() => { setConfirmSuppressionOuvert(false); setDevisASupprimer(null); }} title="Confirmer la suppression" size="sm">
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
            Voulez-vous vraiment supprimer le devis <span className="font-bold text-gray-900">{devisASupprimer?.id}</span> ?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setConfirmSuppressionOuvert(false); setDevisASupprimer(null); }}
              className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={() => devisASupprimer && mutationSupprimer.mutate(String(devisASupprimer.numericId))}
              disabled={mutationSupprimer.isPending}
              className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {mutationSupprimer.isPending ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Rendu masqué pour l'impression */}
      {aperçuOuvert && devisSelectionne && <DevisPrint devis={devisSelectionne} />}
    </div>
  );
};
