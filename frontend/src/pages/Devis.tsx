import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, ChevronUp, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../components/ui/Modal';
import { clientsAPI, devisAPI, facturesAPI, UIDevis } from '../services/api';

const articleVide = { description: '', quantity: 1, unitPrice: 0 };

// Sparkline
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

// Menu statut cliquable
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

  const [nouveauDevis, setNouveauDevis] = useState({
    clientId: '',
    titre: '',
    validUntil: '',
    articles: [articleVide],
  });

  const { data: listDevis = [] } = useQuery({ queryKey: ['devis'], queryFn: devisAPI.getAll });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientsAPI.getAll });

  const mutationCreer = useMutation({
    mutationFn: devisAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devis'] });
      toast.success('Devis créé avec succès');
      setModalOuvert(false);
      setNouveauDevis({ clientId: '', titre: '', validUntil: '', articles: [articleVide] });
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
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
        taxRate: 19,
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

  const changerStatut = (id: number, statut: string, devis: UIDevis) => {
    mutationChangerStatut.mutate({ id, statut, devis });
  };

  const totalBrouillon = useMemo(
    () => nouveauDevis.articles.reduce((sum, a) => sum + Number(a.quantity) * Number(a.unitPrice), 0),
    [nouveauDevis.articles]
  );

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

  const creerDevis = () => {
    const client = clients.find((c) => c.id === nouveauDevis.clientId);
    if (!client) return toast.error('Veuillez sélectionner un client');
    mutationCreer.mutate({
      clientId: client.id,
      title: nouveauDevis.titre,
      notes: nouveauDevis.titre,
      amount: totalBrouillon,
      status: 'draft',
      createdAt: new Date().toISOString().slice(0, 10),
      validUntil: nouveauDevis.validUntil,
      items: nouveauDevis.articles,
    } as any);
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
          onClick={() => setModalOuvert(true)}
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

        {/* Table */}
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
                <th className="px-4 py-3">Expiration</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {devisPage.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Aucun devis trouvé</td></tr>
              )}
              {devisPage.map((devis) => (
                <tr key={devis.numericId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{devis.id}</td>
                  <td className="px-4 py-3 text-gray-700">{devis.clientName}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{devis.title}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{devis.amount?.toLocaleString('fr-FR')} {devis.devise === 'EUR' ? '€' : devis.devise === 'USD' ? '$' : 'DT'}</td>
                  <td className="px-4 py-3">
                    <MenuStatut devis={devis} onChanger={changerStatut} chargement={mutationChangerStatut.isPending} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{devis.createdAt}</td>
                  <td className="px-4 py-3 text-gray-600">{devis.validUntil || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Aperçu */}
                      <button
                        onClick={() => { setDevisSelectionne(devis); setAperçuOuvert(true); }}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-colors"
                        title="Visualiser"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* Télécharger */}
                      <button
                        onClick={() => telecharger(devis)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {/* Convertir en facture */}
                      {(devis.status?.toLowerCase() === 'accepted' || devis.status?.toLowerCase() === 'accepté') && (
                        <button
                          onClick={() => mutationConvertir.mutate(devis)}
                          disabled={mutationConvertir.isPending}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                          title="Convertir en facture"
                        >
                          {mutationConvertir.isPending ? '...' : 'Convertir'}
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

      {/* Modal création devis */}
      <Modal isOpen={modalOuvert} onClose={() => setModalOuvert(false)} title="Créer un devis" size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); creerDevis(); }}>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Client</label>
            <select
              className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={nouveauDevis.clientId}
              onChange={(e) => setNouveauDevis({ ...nouveauDevis, clientId: e.target.value })}
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Titre du devis</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Ex: Développement application web"
              value={nouveauDevis.titre}
              onChange={(e) => setNouveauDevis({ ...nouveauDevis, titre: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Valide jusqu'au</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={nouveauDevis.validUntil}
              onChange={(e) => setNouveauDevis({ ...nouveauDevis, validUntil: e.target.value })}
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Articles</label>
              <button
                type="button"
                className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
                onClick={() => setNouveauDevis({ ...nouveauDevis, articles: [...nouveauDevis.articles, { ...articleVide }] })}
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
              {nouveauDevis.articles.map((article, index) => (
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
                    value={article.quantity}
                    onChange={(e) => mettreAJourArticle(index, 'quantity', Number(e.target.value))}
                  />
                  <input
                    className="col-span-3 border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    type="number" min="0"
                    value={article.unitPrice}
                    onChange={(e) => mettreAJourArticle(index, 'unitPrice', Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="col-span-2 text-red-400 text-sm hover:text-red-600 font-medium"
                    onClick={() => setNouveauDevis({ ...nouveauDevis, articles: nouveauDevis.articles.filter((_, i) => i !== index) })}
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
              {totalBrouillon.toLocaleString('fr-FR')} {nouveauDevis.clientId ? (clients.find(c => c.id === nouveauDevis.clientId)?.devise === 'EUR' ? '€' : clients.find(c => c.id === nouveauDevis.clientId)?.devise === 'USD' ? '$' : 'DT') : ''}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOuvert(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={mutationCreer.isPending} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {mutationCreer.isPending ? 'Création...' : 'Créer le devis'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal aperçu devis */}
      <Modal isOpen={aperçuOuvert} onClose={() => setAperçuOuvert(false)} title="Aperçu du devis" size="lg">
        {devisSelectionne && (
          <div className="space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{devisSelectionne.id}</h2>
                <p className="text-gray-500 text-sm mt-0.5">{devisSelectionne.title}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${obtenirCouleurStatut(devisSelectionne.status)}`}>
                {obtenirLibelleStatut(devisSelectionne.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Client</p>
                <p className="font-semibold text-gray-800">{devisSelectionne.clientName}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Montant total</p>
                <p className="font-semibold text-gray-800">{devisSelectionne.amount?.toLocaleString('fr-FR')} {devisSelectionne.devise === 'EUR' ? '€' : devisSelectionne.devise === 'USD' ? '$' : 'DT'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Créé le</p>
                <p className="font-semibold text-gray-800">{devisSelectionne.createdAt}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Valide jusqu'au</p>
                <p className="font-semibold text-gray-800">{devisSelectionne.validUntil || '—'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Articles</p>
              <div className="space-y-2">
                {devisSelectionne.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{item.description}</p>
                      <p className="text-gray-400 text-xs">Qté: {item.quantity} × {Number(item.unitPrice).toLocaleString('fr-FR')} {devisSelectionne.devise === 'EUR' ? '€' : devisSelectionne.devise === 'USD' ? '$' : 'DT'}</p>
                    </div>
                    <p className="font-semibold text-gray-800">{(item.lineTotal || item.quantity * item.unitPrice).toLocaleString('fr-FR')} {devisSelectionne.devise === 'EUR' ? '€' : devisSelectionne.devise === 'USD' ? '$' : 'DT'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="text-xl font-bold text-indigo-600">{devisSelectionne.amount?.toLocaleString('fr-FR')} {devisSelectionne.devise === 'EUR' ? '€' : devisSelectionne.devise === 'USD' ? '$' : 'DT'}</span>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => telecharger(devisSelectionne)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Télécharger PDF
              </button>
              <button onClick={() => telecharger(devisSelectionne, true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
                <Eye className="w-4 h-4" />
                Visualiser
              </button>
              <button onClick={() => setAperçuOuvert(false)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};