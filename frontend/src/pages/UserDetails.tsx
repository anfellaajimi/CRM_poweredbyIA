import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, FilePlus2, Pencil, ShieldCheck, Upload, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../components/ui/Modal';
import { UIUserContract, UIDeclarationCNSS, userContractsAPI, usersAPI, declarationCNSSAPI } from '../services/api';

type CNSSFormState = {
  frontId: string;
  name: string;
  description: string;
  declarationDate: string;
  file: File | null;
};

const emptyCNSSForm: CNSSFormState = {
  frontId: '',
  name: '',
  description: '',
  declarationDate: '',
  file: null,
};

type ContractFormState = {
  frontId: string;
  name: string;
  type: string;
  description: string;
  status: 'active' | 'inactive';
  startDate: string;
  endDate: string;
  file: File | null;
};

const emptyForm: ContractFormState = {
  frontId: '',
  name: '',
  type: '',
  description: '',
  status: 'active',
  startDate: '',
  endDate: '',
  file: null,
};

export const UserDetails: React.FC = () => {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'contrats' | 'cnss'>('contrats');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [declCreateOpen, setDeclCreateOpen] = useState(false);
  const [current, setCurrent] = useState<UIUserContract | null>(null);
  const [createForm, setCreateForm] = useState<ContractFormState>(emptyForm);
  const [editForm, setEditForm] = useState<ContractFormState>(emptyForm);
  const [declForm, setDeclForm] = useState<CNSSFormState>(emptyCNSSForm);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.getById(id),
    enabled: Boolean(id),
  });

  const { data: grouped, isLoading: contractsLoading } = useQuery({
    queryKey: ['user-contracts', id],
    queryFn: () => userContractsAPI.list(id),
    enabled: Boolean(id),
  });

  const { data: declarations, isLoading: declLoading } = useQuery({
    queryKey: ['user-cnss', id],
    queryFn: () => declarationCNSSAPI.list(id),
    enabled: Boolean(id),
  });

  const createMutation = useMutation<any, any, void>({
    mutationFn: () => {
      if (!createForm.file) throw new Error('PDF file is required');
      return userContractsAPI.create(id, {
        frontId: createForm.frontId,
        name: createForm.name,
        type: createForm.type,
        description: createForm.description,
        status: createForm.status,
        startDate: createForm.startDate || undefined,
        endDate: createForm.endDate || undefined,
        file: createForm.file,
      });
    },
    onSuccess: () => {
      toast.success('Contrat créé');
      qc.invalidateQueries({ queryKey: ['user-contracts', id] });
      setCreateOpen(false);
      setCreateForm(emptyForm);
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || error?.message || 'Échec de la création'),
  });

  const updateMutation = useMutation<any, any, void>({
    mutationFn: () => {
      if (!current) throw new Error('Aucun contrat sélectionné');
      return userContractsAPI.update(id, current.id, {
        frontId: editForm.frontId,
        name: editForm.name,
        type: editForm.type,
        description: editForm.description,
        status: editForm.status,
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
        file: editForm.file || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Contrat mis à jour');
      qc.invalidateQueries({ queryKey: ['user-contracts', id] });
      setEditOpen(false);
      setCurrent(null);
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || error?.message || 'Échec de la mise à jour'),
  });

  const createDeclMutation = useMutation<any, any, void>({
    mutationFn: () => {
      if (!declForm.file) throw new Error('Fichier PDF requis');
      return declarationCNSSAPI.create(id, {
        frontId: declForm.frontId,
        name: declForm.name,
        description: declForm.description,
        declarationDate: declForm.declarationDate,
        file: declForm.file,
      });
    },
    onSuccess: () => {
      toast.success('Déclaration CNSS ajoutée');
      qc.invalidateQueries({ queryKey: ['user-cnss', id] });
      setDeclCreateOpen(false);
      setDeclForm(emptyCNSSForm);
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || error?.message || 'Échec de l\'ajout'),
  });

  const deleteDeclMutation = useMutation<any, any, number>({
    mutationFn: (declId: number) => declarationCNSSAPI.delete(id, declId),
    onSuccess: () => {
      toast.success('Déclaration supprimée');
      qc.invalidateQueries({ queryKey: ['user-cnss', id] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || error?.message || 'Échec de la suppression'),
  });
  
  const deleteContractMutation = useMutation<any, any, number>({
    mutationFn: (contractId: number) => userContractsAPI.delete(id, contractId),
    onSuccess: () => {
      toast.success('Contrat supprimé');
      qc.invalidateQueries({ queryKey: ['user-contracts', id] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || error?.message || 'Échec de la suppression'),
  });

  const allContracts = (grouped?.all as UIUserContract[]) || [];
  const active = grouped?.active as UIUserContract | null;

  const stats = useMemo(() => {
    return {
      total: allContracts.length,
      hasActive: Boolean(active),
    };
  }, [allContracts.length, active]);


  const openEdit = (contract: UIUserContract) => {
    setCurrent(contract);
    setEditForm({
      frontId: contract.frontId,
      name: contract.name,
      type: contract.type,
      description: contract.description || '',
      status: contract.status,
      startDate: contract.startDate ? contract.startDate.slice(0, 10) : '',
      endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
      file: null,
    });
    setEditOpen(true);
  };

  const renderContractCard = (contract: UIUserContract, isActive = false) => (
    <div key={contract.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Identifiant</p>
          <p className="font-mono text-sm font-semibold text-indigo-600">{contract.frontId}</p>
          <h3 className="mt-2 text-lg font-bold text-gray-900">{contract.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-bold uppercase text-indigo-700">
              {contract.type}
            </span>
            {(contract.startDate || contract.endDate) && (
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
                {contract.startDate ? new Date(contract.startDate).toLocaleDateString('fr-FR') : '...'} 
                {' ➔ '} 
                {contract.endDate ? new Date(contract.endDate).toLocaleDateString('fr-FR') : '...'}
              </span>
            )}
          </div>
          {contract.description && <p className="mt-3 text-sm leading-relaxed text-gray-600 border-l-2 border-gray-100 pl-3 italic">{contract.description}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-tight ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {contract.status === 'active' ? 'ACTIF' : 'INACTIF'}
          </span>
          <button
            onClick={() => {
              if (confirm('Supprimer définitivement ce contrat ?')) deleteContractMutation.mutate(contract.id);
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-gray-50">
        <button
          onClick={() => window.open(contract.pdfUrl, '_blank')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
        >
          <Eye className="h-3.5 w-3.5" />
          Visualiser le PDF
        </button>
        <button
          onClick={() => openEdit(contract)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </button>
      </div>
    </div>
  );

  const renderCNSSCard = (decl: UIDeclarationCNSS) => (
    <div key={decl.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Déclaration</p>
          <p className="font-mono text-xs font-semibold text-green-600">{decl.frontId}</p>
          <h3 className="mt-1 text-base font-bold text-gray-900">{decl.name}</h3>
          <p className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded inline-block mt-1">
            {new Date(decl.declarationDate).toLocaleDateString('fr-FR')}
          </p>
          {decl.description && <p className="mt-2 text-xs text-gray-600 border-l-2 border-gray-100 pl-2 italic">{decl.description}</p>}
        </div>
        <button
          onClick={() => {
            if (confirm('Supprimer cette déclaration ?')) deleteDeclMutation.mutate(decl.id);
          }}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-50">
        <button
          onClick={() => window.open(decl.pdfUrl, '_blank')}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
        >
          <Eye className="h-3.5 w-3.5" />
          Voir la déclaration
        </button>
      </div>
    </div>
  );

  if (userLoading) return <div className="flex h-screen items-center justify-center bg-gray-50 font-medium text-gray-500 italic">Chargement de l'utilisateur...</div>;
  if (!user) return <div className="flex h-screen items-center justify-center bg-gray-50 font-medium text-gray-500 italic">Utilisateur non trouvé.</div>;

  return (
    <div className="space-y-8 bg-gray-50/50 p-6 min-h-screen font-inter">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/users" className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-700 group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Retour aux utilisateurs
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">{user.name}</h1>
          <p className="text-sm font-medium text-gray-500">
            {user.email} 
            {user.cnssId && <span className="ml-2 border-l pl-2 text-green-600 font-bold">CNSS: {user.cnssId}</span>}
          </p>
        </div>
      </div>

      {/* Barre d'onglets */}
      <div className="flex items-center gap-1 self-start rounded-2xl bg-gray-200/50 p-1 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('contrats')}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'contrats'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
          }`}
        >
          <ShieldCheck className={`h-4 w-4 ${activeTab === 'contrats' ? 'text-indigo-600' : 'text-gray-400'}`} />
          Contrats
        </button>
        <button
          onClick={() => setActiveTab('cnss')}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'cnss'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
          }`}
        >
          <FileText className={`h-4 w-4 ${activeTab === 'cnss' ? 'text-green-600' : 'text-gray-400'}`} />
          Déclarations CNSS
        </button>
      </div>

      {activeTab === 'contrats' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border border-white bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-indigo-50 opacity-50" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Total des contrats</p>
              <p className="mt-1 text-4xl font-black text-gray-900">{stats.total}</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-green-50 opacity-50" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Contrat Actif</p>
              <p className={`mt-1 text-4xl font-black ${stats.hasActive ? 'text-green-600' : 'text-gray-300'}`}>
                {stats.hasActive ? 1 : 0}
              </p>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-gray-900">Contrat Actif</h2>
              </div>
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]"
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                Nouveau Contrat
              </button>
            </div>
            {contractsLoading ? (
              <p className="text-sm font-medium text-gray-400 italic">Chargement des contrats...</p>
            ) : active ? (
              <div className="max-w-xl">{renderContractCard(active, true)}</div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 py-12 px-6 text-center shadow-sm transition-colors hover:border-indigo-200 group">
                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-indigo-50 transition-colors">
                  <FilePlus2 className="h-6 w-6 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Aucun contrat actif</p>
                <p className="text-xs text-gray-400 mt-1">Créez un contrat pour l'utilisateur pour qu'il apparaisse ici.</p>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                    <ArrowLeft className="h-4 w-4 text-indigo-600 rotate-180" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-gray-900">Tous les contrats</h2>
            </div>
            {contractsLoading ? (
              <p className="text-sm font-medium text-gray-400 italic">Chargement des contrats...</p>
            ) : allContracts.length ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {allContracts.map((item) => renderContractCard(item, item.status === 'active'))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 py-10 px-6 text-center shadow-sm">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest italic">Aucun contrat disponible.</p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                      <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-gray-900">Déclarations CNSS</h2>
                </div>
                <button
                  onClick={() => setDeclCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-green-100 transition-all hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Nouvelle Déclaration
                </button>
            </div>
            {declLoading ? (
              <p className="text-sm font-medium text-gray-400 italic">Chargement des déclarations...</p>
            ) : declarations && declarations.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {declarations.map((item) => renderCNSSCard(item))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-gray-100 bg-white/50 py-12 px-6 text-center shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Aucune déclaration CNSS trouvée</p>
                <p className="text-xs text-gray-400 mt-1">Ajoutez une déclaration CNSS pour cet utilisateur.</p>
              </div>
            )}
          </section>
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Créer un contrat utilisateur" size="lg">
        <form
          className="space-y-5 p-1"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Identifiant</label>
                    <input
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                        placeholder="Ex: CONTRAT-2024-001"
                        value={createForm.frontId}
                        onChange={(event) => setCreateForm((prev: ContractFormState) => ({ ...prev, frontId: event.target.value }))}
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Type de contrat</label>
                    <input
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                        placeholder="Ex: Prestataire, CDI..."
                        value={createForm.type}
                        onChange={(event) => setCreateForm((prev: ContractFormState) => ({ ...prev, type: event.target.value }))}
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Date de début</label>
                    <input
                        type="date"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                        value={createForm.startDate}
                        onChange={(event) => setCreateForm((prev: ContractFormState) => ({ ...prev, startDate: event.target.value }))}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Date de fin</label>
                    <input
                        type="date"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                        value={createForm.endDate}
                        onChange={(event) => setCreateForm((prev: ContractFormState) => ({ ...prev, endDate: event.target.value }))}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nom du contrat</label>
                <input
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                    placeholder="Nom descriptif du document"
                    value={createForm.name}
                    onChange={(event) => setCreateForm((prev: ContractFormState) => ({ ...prev, name: event.target.value }))}
                    required
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description (optionnel)</label>
                <textarea
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                    placeholder="Détails supplémentaires..."
                    value={createForm.description}
                    onChange={(event) => setCreateForm((prev: ContractFormState) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Statut initial</label>
                    <select
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none appearance-none"
                        value={createForm.status}
                        onChange={(event) => setCreateForm((prev: ContractFormState) => ({ ...prev, status: event.target.value as 'active' | 'inactive' }))}
                    >
                        <option value="inactive">INACTIF</option>
                        <option value="active">ACTIF</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fichier PDF</label>
                    <div className="relative group overflow-hidden">
                        <input
                            type="file"
                            accept="application/pdf"
                            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                            onChange={(event) => setCreateForm((prev: ContractFormState) => ({ ...prev, file: event.target.files?.[0] || null }))}
                            required
                        />
                        <div className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-2.5 text-xs font-bold transition-all ${
                            createForm.file 
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700' 
                            : 'border-gray-200 bg-gray-50 text-gray-500 group-hover:border-indigo-300 group-hover:bg-indigo-50/30'
                        }`}>
                            <Upload className={`h-4 w-4 ${createForm.file ? 'text-indigo-600' : 'text-gray-400'}`} />
                            {createForm.file ? createForm.file.name : 'Choisir le PDF'}
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <button 
                type="button" 
                onClick={() => setCreateOpen(false)} 
                className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100"
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={`Modifier: ${current?.frontId || ''}`} size="lg">
        <form
          className="space-y-5 p-1"
          onSubmit={(event) => {
            event.preventDefault();
            updateMutation.mutate();
          }}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Identifiant</label>
                    <input
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                        placeholder="Identifiant"
                        value={editForm.frontId}
                        onChange={(event) => setEditForm((prev: ContractFormState) => ({ ...prev, frontId: event.target.value }))}
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Type</label>
                    <input
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                        placeholder="Type"
                        value={editForm.type}
                        onChange={(event) => setEditForm((prev: ContractFormState) => ({ ...prev, type: event.target.value }))}
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Date de début</label>
                    <input
                        type="date"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                        value={editForm.startDate}
                        onChange={(event) => setEditForm((prev: ContractFormState) => ({ ...prev, startDate: event.target.value }))}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Date de fin</label>
                    <input
                        type="date"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                        value={editForm.endDate}
                        onChange={(event) => setEditForm((prev: ContractFormState) => ({ ...prev, endDate: event.target.value }))}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nom du contrat</label>
                <input
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                    placeholder="Nom du contrat"
                    value={editForm.name}
                    onChange={(event) => setEditForm((prev: ContractFormState) => ({ ...prev, name: event.target.value }))}
                    required
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description</label>
                <textarea
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                    placeholder="Description"
                    value={editForm.description}
                    onChange={(event) => setEditForm((prev: ContractFormState) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Statut</label>
                    <select
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none appearance-none"
                        value={editForm.status}
                        onChange={(event) => setEditForm((prev: ContractFormState) => ({ ...prev, status: event.target.value as 'active' | 'inactive' }))}
                    >
                        <option value="inactive">INACTIF</option>
                        <option value="active">ACTIF</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nouveau fichier (optionnel)</label>
                    <div className="relative group overflow-hidden">
                        <input
                            type="file"
                            accept="application/pdf"
                            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                            onChange={(event) => setEditForm((prev: ContractFormState) => ({ ...prev, file: event.target.files?.[0] || null }))}
                        />
                        <div className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-2.5 text-xs font-bold transition-all ${
                            editForm.file 
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700' 
                            : 'border-gray-200 bg-gray-50 text-gray-500 group-hover:border-indigo-300 group-hover:bg-indigo-50/30'
                        }`}>
                            <Upload className={`h-4 w-4 ${editForm.file ? 'text-indigo-600' : 'text-gray-400'}`} />
                            {editForm.file ? editForm.file.name : 'Remplacer le PDF'}
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <button 
                type="button" 
                onClick={() => setEditOpen(false)} 
                className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100"
            >
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={declCreateOpen} onClose={() => setDeclCreateOpen(false)} title="Ajouter une déclaration CNSS" size="lg">
        <form
          className="space-y-5 p-1"
          onSubmit={(event) => {
            event.preventDefault();
            createDeclMutation.mutate();
          }}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Identifiant</label>
                    <input
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                        placeholder="Ex: CNSS-2024-Q1"
                        value={declForm.frontId}
                        onChange={(event) => setDeclForm((prev: CNSSFormState) => ({ ...prev, frontId: event.target.value }))}
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Date de déclaration</label>
                    <input
                        type="date"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                        value={declForm.declarationDate}
                        onChange={(event) => setDeclForm((prev: CNSSFormState) => ({ ...prev, declarationDate: event.target.value }))}
                        required
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nom de la déclaration</label>
                <input
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                    placeholder="Ex: Cotisations T1 2024"
                    value={declForm.name}
                    onChange={(event) => setDeclForm((prev: CNSSFormState) => ({ ...prev, name: event.target.value }))}
                    required
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description (optionnel)</label>
                <textarea
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                    placeholder="Détails supplémentaires..."
                    value={declForm.description}
                    onChange={(event) => setDeclForm((prev: CNSSFormState) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fichier PDF</label>
                <div className="relative group overflow-hidden">
                    <input
                        type="file"
                        accept="application/pdf"
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        onChange={(event) => setDeclForm((prev: CNSSFormState) => ({ ...prev, file: event.target.files?.[0] || null }))}
                        required
                    />
                    <div className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-2.5 text-xs font-bold transition-all ${
                        declForm.file 
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-200 bg-gray-50 text-gray-500 group-hover:border-indigo-300 group-hover:bg-indigo-50/30'
                    }`}>
                        <Upload className={`h-4 w-4 ${declForm.file ? 'text-indigo-600' : 'text-gray-400'}`} />
                        {declForm.file ? declForm.file.name : 'Choisir le PDF de déclaration'}
                    </div>
                </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <button 
                type="button" 
                onClick={() => setDeclCreateOpen(false)} 
                className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createDeclMutation.isPending}
              className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:scale-100"
            >
              {createDeclMutation.isPending ? 'Envoi...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
